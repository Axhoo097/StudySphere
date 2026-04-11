/**
 * ============================================================
 * FILE: models.js
 * TYPE: Database Layer — Mongoose Models
 * JOB: Defines the shape/structure of data stored in MongoDB
 * INTERACTS WITH: controllers.js (uses these models to query/save data)
 * ============================================================
 */

// Import mongoose to create schemas and models
// A Schema defines the structure; a Model is the interface to the DB collection
const mongoose = require("mongoose");

// ─────────────────────────────────────────────
// SECTION 1: USER SCHEMA
// WHY: We need to store student accounts (name, email, hashed password, college, branch)
// ─────────────────────────────────────────────

/**
 * User Schema
 * WHAT: Defines what a User document looks like in MongoDB
 * REAL-WORLD: Like a student ID card with name, email, college, branch, and a password
 */
const userSchema = new mongoose.Schema(
  {
    // Student's full name
    name: {
      type: String,
      required: [true, "Name is required"], // validation: cannot be empty
      trim: true, // removes leading/trailing spaces automatically
    },

    // Unique email used for login — two students cannot have the same email
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // MongoDB will reject duplicate emails
      lowercase: true, // always stored in lowercase to prevent case mismatches
      trim: true,
    },

    // Hashed password — NEVER store plain text passwords
    // WHY: If the database is hacked, passwords remain safe (bcrypt makes them unreadable)
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6, // basic length validation
    },

    // Name of the student's college
    college: {
      type: String,
      trim: true,
      default: "Not specified",
    },

    // Branch like "Computer Science", "Mechanical", etc.
    branch: {
      type: String,
      trim: true,
      default: "Not specified",
    },
  },
  {
    // timestamps: true automatically adds `createdAt` and `updatedAt` fields
    // WHY: Useful for knowing when an account was created without manual code
    timestamps: true,
  }
);

// ─────────────────────────────────────────────
// SECTION 2: RESOURCE SCHEMA
// WHY: Every uploaded file (notes, books, papers) needs structured metadata
// ─────────────────────────────────────────────

/**
 * Resource Schema
 * WHAT: Defines what a Resource document (uploaded file) looks like in MongoDB
 * REAL-WORLD: Like a card in a library catalogue — title, type, who uploaded it, etc.
 */
const resourceSchema = new mongoose.Schema(
  {
    // Title of the resource (e.g., "Data Structures Notes - Sem 3")
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },

    // Subject it belongs to (e.g., "Data Structures", "Physics")
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },

    // Semester number: 1 to 8 for most engineering courses
    semester: {
      type: Number,
      required: [true, "Semester is required"],
      min: 1,
      max: 8,
    },

    // Type of resource — restricts to known categories
    type: {
      type: String,
      // enum means only these specific values are allowed
      // WHY: Prevents junk values like "idk" or "xyz" being stored
      enum: ["notes", "book", "paper", "assignment", "other"],
      default: "notes",
    },

    // Path to the uploaded file on the server (e.g., "/uploads/file123.pdf")
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },

    // Reference to the User who uploaded this resource
    // ObjectId is MongoDB's unique ID type; 'ref' enables .populate() to get full user data
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // links to the User model
      required: true,
    },

    // Tags for smart search and recommendations (e.g., ["arrays", "sorting", "DSA"])
    tags: {
      type: [String], // array of strings
      default: [],
    },

    // Array of rating objects: { user: ObjectId, rating: Number }
    // WHY: Storing who rated prevents a user from rating the same resource twice
    ratings: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: {
          type: Number,
          min: 1, // minimum star rating
          max: 5, // maximum star rating
        },
      },
    ],

    // Pre-calculated average rating stored here for fast queries
    // WHY: Re-calculating average on every fetch is slow; we update it on every new rating
    avgRating: {
      type: Number,
      default: 0,
    },

    // How many times this resource has been downloaded
    // WHY: Used for "Resource Score" = avgRating * 2 + downloads
    downloads: {
      type: Number,
      default: 0,
    },

    // Optional description for the resource
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// ─────────────────────────────────────────────
// SECTION 3: REQUEST SCHEMA
// WHY: Students can ask for resources they need but can't find
// ─────────────────────────────────────────────

/**
 * Request Schema
 * WHAT: Defines what a resource request looks like in MongoDB
 * REAL-WORLD: Like posting a "Need textbook for Thermo Sem 5" notice on a notice board
 */
const requestSchema = new mongoose.Schema(
  {
    // What the student is asking for (e.g., "Need OS notes for Sem 4")
    title: {
      type: String,
      required: [true, "Request title is required"],
      trim: true,
    },

    // Detailed explanation of what they need
    description: {
      type: String,
      default: "",
    },

    // Which subject the request is for
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },

    // Which semester
    semester: {
      type: Number,
      min: 1,
      max: 8,
    },

    // The user who made this request
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Status of the request — open: still waiting; fulfilled: someone responded
    status: {
      type: String,
      enum: ["open", "fulfilled"],
      default: "open", // all new requests start as open
    },

    // Array of responses from other users
    // Each response has a user reference and a link to the resource they're sharing
    responses: [
      {
        // Who responded
        respondedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        // Optional link to an uploaded resource
        resourceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Resource",
          default: null,
        },
        // Text message (e.g., "Here's a link to the notes I uploaded!")
        message: {
          type: String,
          default: "",
        },
        // When was this response added
        createdAt: {
          type: Date,
          default: Date.now, // auto-set to current timestamp
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────
// SECTION 4: COMPILE AND EXPORT MODELS
// WHY: mongoose.model() compiles the schema into a usable class
// ─────────────────────────────────────────────

// "User" → MongoDB collection will be named "users" (Mongoose auto-lowercases + pluralizes)
const User = mongoose.model("User", userSchema);

// "Resource" → MongoDB collection will be "resources"
const Resource = mongoose.model("Resource", resourceSchema);

// "Request" → MongoDB collection will be "requests"
const Request = mongoose.model("Request", requestSchema);

// Export all three models so controllers.js can import and use them
module.exports = { User, Resource, Request };

/*
 * ============================================================
 * END-OF-FILE SUMMARY:
 * This file defines the data structure (schema) for Users, Resources, and Requests.
 * It runs when first imported by controllers.js and creates the MongoDB collections.
 * Each model exports a class that can perform .find(), .save(), .findById(), etc.
 * It is the foundation of the database layer — every DB read/write uses these models.
 * ============================================================
 */
