/**
 * ============================================================
 * FILE: server.js
 * TYPE: Backend — Application Entry Point
 * JOB: Starts the Express server, connects to DB, and wires everything together
 * INTERACTS WITH: config.js (DB connection), routes.js (all API routes)
 * ============================================================
 */

// Load environment variables FIRST — before any other imports
// WHY: Other modules (config.js, middleware.js) need process.env.* to be available
require("dotenv").config();

// Express is the web framework that handles HTTP requests and responses
const express = require("express");

// cors allows the React frontend (running on port 3000) to talk to this server (port 5000)
// WHY: Browsers block cross-origin requests by default for security (CORS policy)
const cors = require("cors");

// path helps construct OS-independent file paths (important on Windows vs Linux)
const path = require("path");

// Import the MongoDB connection function
const connectDB = require("./config");

// Import all routes (auth, resources, requests) from routes.js
const routes = require("./routes");

// ─────────────────────────────────────────────
// SECTION 1: CONNECT TO DATABASE
// WHY: We must connect to MongoDB before the server starts accepting requests
// ─────────────────────────────────────────────
connectDB();

// ─────────────────────────────────────────────
// SECTION 2: INITIALIZE EXPRESS APP
// ─────────────────────────────────────────────

// Create the Express application instance
const app = express();

// ─────────────────────────────────────────────
// SECTION 3: GLOBAL MIDDLEWARE
// WHY: These run on EVERY request before it reaches any route handler
// ─────────────────────────────────────────────

// Enable CORS for all origins in development
// WHY: Allows React (localhost:3000) to send requests to this server (localhost:5000)
// In production, replace "*" with your actual frontend domain for security
app.use(cors());

// Parse incoming JSON request bodies automatically
// WHY: Without this, req.body would be undefined for POST/PUT requests with JSON data
app.use(express.json());

// Parse URL-encoded form data (e.g., HTML form submissions)
// extended: true allows nested objects in form data
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
// SECTION 4: SERVE UPLOADED FILES STATICALLY
// WHY: Uploaded PDFs/images are stored in /uploads — we must expose this folder
// so the frontend can access file URLs like /uploads/1234567890.pdf
// ─────────────────────────────────────────────
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
  // __dirname = the directory where server.js lives
  // path.join builds the correct path: ./backend/uploads/
);

// ─────────────────────────────────────────────
// SECTION 5: MOUNT API ROUTES
// WHY: All routes from routes.js are prefixed with /api
// So /auth/login becomes /api/auth/login when accessed by the frontend
// ─────────────────────────────────────────────
app.use("/api", routes);

// ─────────────────────────────────────────────
// SECTION 6: ROOT HEALTH CHECK ROUTE
// WHY: Gives us a quick way to confirm the server is running (hit / in browser)
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "📚 StudySphere API is running!",
    status: "OK",
    routes: {
      auth: "/api/auth/register | /api/auth/login",
      resources: "/api/resources",
      requests: "/api/requests",
    },
  });
});

// ─────────────────────────────────────────────
// SECTION 7: GLOBAL ERROR HANDLER
// WHY: Catches any error from middlewares (e.g., Multer file size error)
// and returns a clean JSON error response instead of crashing the server
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "An internal server error occurred.",
  });
});

// ─────────────────────────────────────────────
// SECTION 8: START LISTENING FOR REQUESTS
// ─────────────────────────────────────────────

// Read the port from .env or fall back to 5000
const PORT = process.env.PORT || 5000;

// app.listen() starts the HTTP server — it's now ready to accept requests
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

/*
 * ============================================================
 * END-OF-FILE SUMMARY:
 * This is the main entry point of the backend — it's the first file Node.js runs.
 * It connects to MongoDB, sets up CORS/JSON parsing, mounts all routes, and starts listening.
 * It runs continuously in the background, handling every API request from the React frontend.
 * Without this file, there is no backend — everything else depends on it being active.
 * ============================================================
 */
