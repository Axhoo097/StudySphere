/**
 * ============================================================
 * FILE: middleware.js
 * TYPE: Backend Middleware — Auth Module
 * JOB: Verifies a user's identity before allowing access to protected routes
 * INTERACTS WITH: routes.js (applied to protected routes), controllers.js (reads req.user)
 * ============================================================
 */

// Load environment variables — we need JWT_SECRET to verify tokens
require("dotenv").config();

// jsonwebtoken lets us create and verify JWT tokens
// A JWT is like a digital stamp that proves "this user logged in and is who they say they are"
const jwt = require("jsonwebtoken");

// Import the User model to look up the user from the database using the ID in the token
const { User } = require("./models");

/**
 * FUNCTION: protect
 * WHAT: Middleware that checks if the request contains a valid JWT token
 * INPUT: req (HTTP request), res (HTTP response), next (function to move to next handler)
 * OUTPUT: Attaches `req.user` if valid; sends 401 error if not
 * REAL-WORLD MEANING: "Check the student's ID card before letting them into the library"
 */
const protect = async (req, res, next) => {
  // We read the Authorization header which looks like: "Bearer eyJhbGciOiJ..."
  // WHY: This is the standard HTTP way to send tokens in API requests
  const authHeader = req.headers.authorization;

  // Check if the header exists AND starts with "Bearer "
  // If missing, reject the request immediately
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Not authorized. No token provided.", // 401 = Unauthorized
    });
  }

  try {
    // Extract just the token part by splitting on space and taking the second element
    // "Bearer TOKEN_HERE" → split → ["Bearer", "TOKEN_HERE"] → [1] → "TOKEN_HERE"
    const token = authHeader.split(" ")[1];

    // jwt.verify() decodes and validates the token using the secret key
    // If the token is fake, expired, or tampered with — it throws an error
    // WHY: Only our server issued the secret, so only our server can verify it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded.id is the user's MongoDB _id that we embedded when creating the token
    // We fetch the user from DB to confirm they still exist (they may have been deleted)
    // .select("-password") means: return all fields EXCEPT the password
    // WHY: Never attach the password to req — it's a security risk
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    // next() passes control to the actual route handler (e.g., uploadResource)
    // WHY: Without calling next(), the request would hang forever
    next();
  } catch (error) {
    // Token verification failed — either expired or invalid
    console.error("JWT Error:", error.message);
    return res.status(401).json({ message: "Not authorized. Invalid token." });
  }
};

// Export the middleware so routes.js can use it on protected routes
module.exports = { protect };

/*
 * ============================================================
 * END-OF-FILE SUMMARY:
 * This file contains authentication middleware that acts as a gatekeeper.
 * It runs BEFORE any protected route's controller logic executes.
 * It reads the JWT from the Authorization header, verifies it, fetches the user, and attaches them to req.user.
 * If the token is missing or invalid, it blocks the request with a 401 response.
 * ============================================================
 */
