/**
 * ============================================================
 * FILE: controllers.js
 * TYPE: Backend — Business Logic Layer
 * JOB: Contains all the actual logic for what happens when each API route is called
 * INTERACTS WITH: models.js (DB queries), middleware.js (req.user), routes.js (called from routes)
 * ============================================================
 */

// Load environment variables (for JWT_SECRET)
require("dotenv").config();

// bcryptjs is used to hash passwords before saving and to compare passwords on login
// WHY: Storing raw passwords is a huge security risk — bcrypt makes them one-way encrypted
const bcrypt = require("bcryptjs");

// jsonwebtoken creates a signed token we send to the client after login
const jwt = require("jsonwebtoken");

// path module helps us work with file paths in a cross-platform way
const path = require("path");

// Import all three models from models.js
const { User, Resource, Request } = require("./models");

// ─────────────────────────────────────────────
// HELPER: Generate JWT Token
// WHY: We use this same logic in both registerUser and loginUser
// ─────────────────────────────────────────────

/**
 * FUNCTION: generateToken
 * WHAT: Creates a signed JWT token with the user's ID embedded inside
 * INPUT: id (MongoDB ObjectId of the user)
 * OUTPUT: A JWT string (e.g., "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
 * REAL-WORLD MEANING: "Create a signed pass/badge for the logged-in student"
 */
const generateToken = (id) => {
  return jwt.sign(
    { id }, // payload — we embed the user's ID so we can retrieve them later
    process.env.JWT_SECRET, // secret key — used to sign and later verify the token
    { expiresIn: "7d" } // token expires in 7 days — user must re-login after that
  );
};

// ─────────────────────────────────────────────
// SECTION 1: AUTH CONTROLLERS
// ─────────────────────────────────────────────

/**
 * FUNCTION: registerUser
 * WHAT: Creates a new student account in the database
 * INPUT: req.body → { name, email, password, college, branch }
 * OUTPUT: JSON with user info + JWT token (201 Created) or error (400/500)
 * REAL-WORLD MEANING: "Fill out a registration form and get a student ID card"
 */
const registerUser = async (req, res) => {
  // Destructure the request body to extract registration fields
  const { name, email, password, college, branch } = req.body;

  // Basic validation — make sure required fields are not empty
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  try {
    // Check if a user with this email already exists
    // WHY: Emails must be unique to prevent duplicate accounts
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    // Hash the password using bcrypt before saving it
    // 10 = salt rounds — higher means more secure but slower. 10 is the industry standard.
    // WHY: Even if someone hacks the DB, they can't read the original password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user document in MongoDB
    const user = await User.create({
      name,
      email: email.toLowerCase(), // normalize to lowercase
      password: hashedPassword, // NEVER save the raw password
      college: college || "Not specified",
      branch: branch || "Not specified",
    });

    // Respond with user data + a fresh JWT token (so they're instantly logged in)
    res.status(201).json({
      message: "Registration successful!",
      token: generateToken(user._id), // generate a signed JWT
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        branch: user.branch,
      },
    });
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ message: "Server error during registration." });
  }
};

/**
 * FUNCTION: loginUser
 * WHAT: Authenticates an existing user and issues a JWT token
 * INPUT: req.body → { email, password }
 * OUTPUT: JSON with user info + JWT token (200 OK) or error (400/401/500)
 * REAL-WORLD MEANING: "Show your ID and password at the college gate to get an entry pass"
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Validate that both fields are provided
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    // Find the user by email (case-insensitive by storing in lowercase)
    const user = await User.findOne({ email: email.toLowerCase() });

    // If no user found OR password doesn't match — return a generic error
    // WHY: Don't say "email not found" or "wrong password" separately — security risk
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // bcrypt.compare() checks if the plain text password matches the stored hash
    // WHY: bcrypt hashes are one-way, so we can't "decrypt" — we must compare
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Login success — send back user info and a fresh JWT
    res.status(200).json({
      message: "Login successful!",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        branch: user.branch,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error during login." });
  }
};

// ─────────────────────────────────────────────
// SECTION 2: RESOURCE CONTROLLERS
// ─────────────────────────────────────────────

/**
 * FUNCTION: uploadResource
 * WHAT: Saves a new file upload + metadata to the database
 * INPUT: req.file (from Multer), req.body → { title, subject, semester, type, description, tags }
 * OUTPUT: JSON with the created resource (201) or error (400/500)
 * REAL-WORLD MEANING: "A student drops off their notes at the library counter"
 */
const uploadResource = async (req, res) => {
  // Multer puts the uploaded file info in req.file
  // If no file was attached, reject the request
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded. Please attach a file." });
  }

  const { title, subject, semester, type, description, tags } = req.body;

  // Validate required fields
  if (!title || !subject || !semester) {
    return res.status(400).json({ message: "Title, subject, and semester are required." });
  }

  try {
    // DUPLICATE UPLOAD CHECK
    // WHY: Prevents the same notes from being uploaded multiple times
    // We check for matching title + subject combination (case-insensitive)
    const duplicate = await Resource.findOne({
      title: { $regex: new RegExp(`^${title}$`, "i") }, // case-insensitive exact match
      subject: { $regex: new RegExp(`^${subject}$`, "i") },
    });

    if (duplicate) {
      return res.status(400).json({
        message: "A resource with the same title and subject already exists.",
      });
    }

    // Parse tags: the frontend sends them as a comma-separated string, we split into array
    const parsedTags = tags
      ? tags.split(",").map((tag) => tag.trim().toLowerCase())
      : [];

    // Build the file URL path — Multer saves file to /uploads/ on the server
    // req.file.filename is the unique filename Multer generated to avoid conflicts
    const fileUrl = `/uploads/${req.file.filename}`;

    // Create the resource document in MongoDB
    const resource = await Resource.create({
      title,
      subject,
      semester: parseInt(semester), // convert string to number
      type: type || "notes",
      description: description || "",
      fileUrl,
      tags: parsedTags,
      uploadedBy: req.user._id, // req.user is set by the protect middleware
    });

    // Populate the uploadedBy field to include the user's name in the response
    await resource.populate("uploadedBy", "name email college");

    res.status(201).json({
      message: "Resource uploaded successfully!",
      resource,
    });
  } catch (error) {
    console.error("Upload Error:", error.message);
    res.status(500).json({ message: "Server error during upload." });
  }
};

/**
 * FUNCTION: getResources
 * WHAT: Fetches all resources with optional search and filter capabilities
 * INPUT: req.query → { search, subject, semester, type, sort }
 * OUTPUT: JSON array of matching resources sorted by relevance or date
 * REAL-WORLD MEANING: "Browse the library catalogue with filters"
 */
const getResources = async (req, res) => {
  try {
    // Extract filter/search params from query string (e.g., /api/resources?subject=DSA&semester=3)
    const { search, subject, semester, type, sort } = req.query;

    // Build a query filter object dynamically
    // WHY: We only add filters that were actually provided
    const filter = {};

    // Text search: matches title, subject, or description (case-insensitive)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } }, // i = case-insensitive
        { subject: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }, // search in tags array too
      ];
    }

    // Filter by subject if provided
    if (subject) filter.subject = { $regex: subject, $options: "i" };

    // Filter by semester — parseInt to ensure it's a number
    if (semester) filter.semester = parseInt(semester);

    // Filter by type (notes, book, paper, etc.)
    if (type) filter.type = type;

    // Determine sort order
    // "score" sorts by our custom Resource Score: (avgRating * 2) + downloads
    // Default: sort by newest first
    let sortOption = { createdAt: -1 }; // -1 = descending (newest first)
    if (sort === "score") {
      // We'll calculate score for each resource after fetching
      sortOption = { avgRating: -1, downloads: -1 };
    } else if (sort === "downloads") {
      sortOption = { downloads: -1 };
    } else if (sort === "rating") {
      sortOption = { avgRating: -1 };
    }

    // Fetch matching resources from DB
    // .populate() replaces ObjectId with actual user data (name, email, college)
    // WHY: Without populate, we'd just see an ID like "60f7c..." — not useful on frontend
    const resources = await Resource.find(filter)
      .populate("uploadedBy", "name email college branch")
      .sort(sortOption)
      .lean(); // .lean() returns plain JS objects instead of Mongoose documents (faster)

    // Calculate Resource Score for each resource and add it to the response
    // Score formula: (avgRating * 2) + downloads
    const resourcesWithScore = resources.map((r) => ({
      ...r,
      score: r.avgRating * 2 + r.downloads,
    }));

    res.status(200).json({
      count: resourcesWithScore.length,
      resources: resourcesWithScore,
    });
  } catch (error) {
    console.error("Get Resources Error:", error.message);
    res.status(500).json({ message: "Server error while fetching resources." });
  }
};

/**
 * FUNCTION: downloadResource
 * WHAT: Increments the download count and returns the file URL
 * INPUT: req.params.id (resource MongoDB _id)
 * OUTPUT: JSON with the file URL for the frontend to download
 * REAL-WORLD MEANING: "Student checks out a book — we log that one more person took it"
 */
const downloadResource = async (req, res) => {
  try {
    // Find the resource by its MongoDB _id from the URL param
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    // Increment the downloads counter by 1 and save to DB
    // $inc is a MongoDB atomic operator — safe for concurrent requests
    await Resource.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });

    // Return the file URL so the frontend can trigger the download
    res.status(200).json({
      message: "Download initiated.",
      fileUrl: resource.fileUrl,
      title: resource.title,
    });
  } catch (error) {
    console.error("Download Error:", error.message);
    res.status(500).json({ message: "Server error during download." });
  }
};

/**
 * FUNCTION: rateResource
 * WHAT: Allows a user to rate a resource (1–5). Prevents double-rating.
 * INPUT: req.params.id (resource id), req.body.rating (1-5), req.user._id
 * OUTPUT: Updated resource with new average rating
 * REAL-WORLD MEANING: "Student reviews a book they borrowed from the library"
 */
const rateResource = async (req, res) => {
  const { rating } = req.body;

  // Validate rating value
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5." });
  }

  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    // Check if this user has already rated this resource
    // WHY: We don't want the same person rating multiple times to skew the average
    const alreadyRated = resource.ratings.find(
      (r) => r.user.toString() === req.user._id.toString()
      // .toString() converts ObjectId to string for comparison
    );

    if (alreadyRated) {
      // Update existing rating instead of adding a new one
      alreadyRated.rating = rating;
    } else {
      // Add a new rating entry
      resource.ratings.push({ user: req.user._id, rating });
    }

    // Recalculate the average rating across all ratings
    // WHY: We store avgRating separately for fast queries (avoid recalculating on every fetch)
    const totalRating = resource.ratings.reduce((sum, r) => sum + r.rating, 0);
    resource.avgRating = (totalRating / resource.ratings.length).toFixed(1);
    // toFixed(1) rounds to 1 decimal place (e.g., 4.333... → 4.3)

    // Save the updated resource back to the database
    await resource.save();

    res.status(200).json({
      message: "Rating submitted successfully!",
      avgRating: resource.avgRating,
      totalRatings: resource.ratings.length,
    });
  } catch (error) {
    console.error("Rating Error:", error.message);
    res.status(500).json({ message: "Server error while rating." });
  }
};

/**
 * FUNCTION: getRecommendations
 * WHAT: Returns similar resources based on subject and tags of a given resource
 * INPUT: req.params.id (current resource id)
 * OUTPUT: Array of up to 4 similar resources
 * REAL-WORLD MEANING: "If you liked this book, you might also like these..."
 */
const getRecommendations = async (req, res) => {
  try {
    // Get the source resource
    const resource = await Resource.findById(req.params.id).lean();
    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    // Find resources that share the same subject OR any of the same tags
    // excluding the current resource itself using { $ne: resource._id }
    const similar = await Resource.find({
      _id: { $ne: resource._id }, // $ne = "not equal" — exclude current resource
      $or: [
        { subject: resource.subject },
        { tags: { $in: resource.tags } }, // $in = any tags that overlap
      ],
    })
      .populate("uploadedBy", "name")
      .limit(4) // only return top 4 recommendations
      .lean();

    res.status(200).json({ recommendations: similar });
  } catch (error) {
    console.error("Recommendations Error:", error.message);
    res.status(500).json({ message: "Server error fetching recommendations." });
  }
};

// ─────────────────────────────────────────────
// SECTION 3: REQUEST CONTROLLERS
// ─────────────────────────────────────────────

/**
 * FUNCTION: createRequest
 * WHAT: Creates a new resource request posted by a student
 * INPUT: req.body → { title, description, subject, semester }, req.user._id
 * OUTPUT: JSON with the created request (201) or error
 * REAL-WORLD MEANING: "Student puts up a 'Looking for...' notice on the bulletin board"
 */
const createRequest = async (req, res) => {
  const { title, description, subject, semester } = req.body;

  if (!title || !subject) {
    return res.status(400).json({ message: "Title and subject are required." });
  }

  try {
    // Create a new request document in the DB
    const request = await Request.create({
      title,
      description: description || "",
      subject,
      semester: semester ? parseInt(semester) : undefined,
      requestedBy: req.user._id, // who posted the request (from JWT via protect middleware)
    });

    // Populate user info for immediate display
    await request.populate("requestedBy", "name college branch");

    res.status(201).json({
      message: "Request created successfully!",
      request,
    });
  } catch (error) {
    console.error("Create Request Error:", error.message);
    res.status(500).json({ message: "Server error creating request." });
  }
};

/**
 * FUNCTION: getRequests
 * WHAT: Returns all resource requests, newest first
 * INPUT: None (optional filter can be added later)
 * OUTPUT: JSON array of all requests with user details
 * REAL-WORLD MEANING: "View all notice board postings"
 */
const getRequests = async (req, res) => {
  try {
    // Fetch all requests and populate the requestedBy user info
    // Also populate respondedBy inside each response sub-document
    const requests = await Request.find()
      .populate("requestedBy", "name college branch")
      .populate("responses.respondedBy", "name")
      .populate("responses.resourceId", "title fileUrl") // populate the linked resource
      .sort({ createdAt: -1 }) // newest first
      .lean();

    res.status(200).json({ count: requests.length, requests });
  } catch (error) {
    console.error("Get Requests Error:", error.message);
    res.status(500).json({ message: "Server error fetching requests." });
  }
};

/**
 * FUNCTION: respondToRequest
 * WHAT: Adds a response to an existing request and optionally marks it fulfilled
 * INPUT: req.params.id (request _id), req.body → { message, resourceId, markFulfilled }
 * OUTPUT: Updated request with the new response added
 * REAL-WORLD MEANING: "A student replies to a notice board posting with a link to their notes"
 */
const respondToRequest = async (req, res) => {
  const { message, resourceId, markFulfilled } = req.body;

  try {
    // Find the request by ID — if not found, return 404
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    // Build the response object to push into the responses array
    const newResponse = {
      respondedBy: req.user._id,
      message: message || "",
      resourceId: resourceId || null, // optional — can link to an uploaded resource
      createdAt: new Date(),
    };

    // Push the response into the request's responses array
    request.responses.push(newResponse);

    // If the responder or original poster wants to mark it as fulfilled, update status
    if (markFulfilled === true || markFulfilled === "true") {
      request.status = "fulfilled";
    }

    // Save the updated request document
    await request.save();

    // Repopulate to return full user/resource data in the response
    await request.populate([
      { path: "requestedBy", select: "name college" },
      { path: "responses.respondedBy", select: "name" },
      { path: "responses.resourceId", select: "title fileUrl" },
    ]);

    res.status(200).json({
      message: "Response added successfully!",
      request,
    });
  } catch (error) {
    console.error("Respond Error:", error.message);
    res.status(500).json({ message: "Server error while responding." });
  }
};

// ─────────────────────────────────────────────
// SECTION 4: EXPORT ALL CONTROLLERS
// WHY: routes.js imports these and maps them to specific HTTP endpoints
// ─────────────────────────────────────────────
module.exports = {
  registerUser,
  loginUser,
  uploadResource,
  getResources,
  downloadResource,
  rateResource,
  getRecommendations,
  createRequest,
  getRequests,
  respondToRequest,
};

/*
 * ============================================================
 * END-OF-FILE SUMMARY:
 * This file contains all the business logic for the platform — auth, resources, and requests.
 * Each function handles a specific API action: register, login, upload, search, rate, etc.
 * It runs when a matching HTTP request hits a route defined in routes.js.
 * It queries the MongoDB database using models from models.js and responds with JSON.
 * ============================================================
 */
