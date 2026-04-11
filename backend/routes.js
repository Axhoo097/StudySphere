/**
 * ============================================================
 * FILE: routes.js
 * TYPE: Backend — API Routes Layer
 * JOB: Maps HTTP methods + URL paths to the correct controller function
 * INTERACTS WITH: controllers.js (functions to call), middleware.js (protect), server.js (mounted here)
 * ============================================================
 */

// Express Router lets us define route groups separately from server.js
// WHY: Keeps server.js clean — all route logic lives here, not mixed with app setup
const express = require("express");
const router = express.Router();

// Import multer for handling file uploads (multipart/form-data)
// WHY: Regular express.json() cannot parse file uploads — multer is required
const multer = require("multer");

// Import path to build file storage paths properly
const path = require("path");

// Import all controller functions from controllers.js
const {
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
} = require("./controllers");

// Import the JWT protection middleware — used on routes requiring login
const { protect } = require("./middleware");

// ─────────────────────────────────────────────
// SECTION 1: MULTER CONFIGURATION
// WHY: We need to control where uploaded files are saved and how they're named
// ─────────────────────────────────────────────

// diskStorage tells multer to save files to disk (not memory)
// WHY: Memory storage is fine for small apps but risky for large files
const storage = multer.diskStorage({
  /**
   * destination: Tells multer which folder to save uploaded files into
   * We use the /uploads folder at the root of the backend directory
   */
  destination: (req, file, cb) => {
    // cb(error, folderPath) — null means no error
    cb(null, path.join(__dirname, "uploads"));
  },

  /**
   * filename: Sets a unique name for each uploaded file
   * WHY: If two students upload "notes.pdf", we must not overwrite each other's file
   * Solution: prefix with current timestamp + random number
   */
  filename: (req, file, cb) => {
    // Date.now() gives milliseconds since epoch (unique timestamp)
    // Math.round(Math.random() * 1e9) adds extra randomness
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    // path.extname extracts extension (e.g., ".pdf", ".docx") from original filename
    cb(null, uniqueName);
  },
});

// File filter: only allow specific file types for safety
// WHY: Without this, someone could upload an .exe or malicious script
const fileFilter = (req, file, cb) => {
  // Allowed MIME types for academic resource files
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg",
    "image/png",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // accept the file
  } else {
    cb(new Error("Only PDF, Word, PowerPoint, and image files are allowed."), false);
  }
};

// Create the multer upload instance with storage + fileFilter + size limit
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max file size
    // WHY: Prevents huge files from crashing the server or filling disk space
  },
});

// ─────────────────────────────────────────────
// SECTION 2: AUTH ROUTES — /api/auth
// WHY: Handle user registration and login (no JWT needed — users aren't logged in yet)
// ─────────────────────────────────────────────

// POST /api/auth/register — Create a new student account
router.post("/auth/register", registerUser);

// POST /api/auth/login — Authenticate and get a JWT token
router.post("/auth/login", loginUser);

// ─────────────────────────────────────────────
// SECTION 3: RESOURCE ROUTES — /api/resources
// ─────────────────────────────────────────────

// GET /api/resources — Fetch all resources (public, no login needed)
// Supports query params: search, subject, semester, type, sort
router.get("/resources", getResources);

// POST /api/resources/upload — Upload a new resource file + metadata
// protect: user must be logged in (JWT required)
// upload.single("file"): multer processes exactly ONE file with field name "file"
router.post("/resources/upload", protect, upload.single("file"), uploadResource);

// GET /api/resources/:id/download — Increment download count + return file URL
// protect: must be logged in so we know who's downloading
router.get("/resources/:id/download", protect, downloadResource);

// POST /api/resources/:id/rate — Rate a resource (1–5 stars)
// protect: only logged-in users can rate
router.post("/resources/:id/rate", protect, rateResource);

// GET /api/resources/:id/recommendations — Get similar resources
// This is a public route — no login needed just to see recommendations
router.get("/resources/:id/recommendations", getRecommendations);

// ─────────────────────────────────────────────
// SECTION 4: REQUEST ROUTES — /api/requests
// ─────────────────────────────────────────────

// GET /api/requests — View all resource requests (public)
router.get("/requests", getRequests);

// POST /api/requests — Create a new resource request
// protect: must be logged in to post a request
router.post("/requests", protect, createRequest);

// POST /api/requests/:id/respond — Respond to an existing request
// protect: must be logged in to respond
router.post("/requests/:id/respond", protect, respondToRequest);

// Export the router so server.js can mount it
module.exports = router;

/*
 * ============================================================
 * END-OF-FILE SUMMARY:
 * This file defines all API endpoints for the platform in three groups: auth, resources, requests.
 * It configures Multer for safe file uploads (type filter, 20MB limit, unique filenames).
 * It applies the `protect` middleware to all routes that require authentication.
 * Routes here translate HTTP requests (GET/POST + URL) into controller function calls.
 * ============================================================
 */
