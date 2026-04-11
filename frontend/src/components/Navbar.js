/**
 * ============================================================
 * FILE: Navbar.js
 * TYPE: Frontend — React Component (UI Layer)
 * JOB: Fixed top navigation bar shown on every page of the app
 * INTERACTS WITH: App.js (AuthContext for user state), React Router (navigation links)
 * ============================================================
 */

import React, { useState } from "react";
// Link = client-side navigation (no page reload), useNavigate = programmatic navigation
import { Link, useNavigate, useLocation } from "react-router-dom";
// useAuth = our custom hook to read login state and logout function from context
import { useAuth } from "../App";
import "./Navbar.css";

/**
 * COMPONENT: Navbar
 * WHAT: Renders the top navigation bar with links, user info, and logout
 * INPUT: None (reads from AuthContext via useAuth)
 * OUTPUT: A sticky <nav> element with branding, links, and auth controls
 * REAL-WORLD MEANING: "The reception desk at a college — shows who's logged in and where to go"
 */
const Navbar = () => {
  // user: the logged-in user object (null if not logged in)
  // logout: function that clears user session
  const { user, logout } = useAuth();

  // useNavigate: lets us programmatically go to a route (e.g., after logout)
  const navigate = useNavigate();

  // useLocation: gives us the current URL path so we can highlight the active nav link
  const location = useLocation();

  // Mobile hamburger menu open/close state
  const [menuOpen, setMenuOpen] = useState(false);

  /**
   * FUNCTION: handleLogout
   * WHAT: Logs the user out and redirects to the login page
   * INPUT: None
   * OUTPUT: Clears auth state, navigates to /login
   */
  const handleLogout = () => {
    logout(); // clears token + user from localStorage and state
    navigate("/login"); // redirect to login page
    setMenuOpen(false); // close mobile menu if open
  };

  // Helper: returns true if the given path matches the current URL
  // WHY: Used to apply "active" class to the current page link for visual feedback
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* ── BRAND LOGO ── */}
        {/* Clicking the logo always navigates to the home page */}
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-icon">📚</span>
          <span className="brand-name">StudySphere</span>
        </Link>

        {/* ── DESKTOP NAV LINKS ── */}
        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          {/* Browse Resources link — active styling applied when on "/" */}
          <Link
            to="/"
            className={`nav-link ${isActive("/") ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            🔍 Browse
          </Link>

          {/* Upload page — shown always in nav, but protected by ProtectedRoute in App.js */}
          <Link
            to="/upload"
            className={`nav-link ${isActive("/upload") ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            ⬆️ Upload
          </Link>

          {/* Requests page */}
          <Link
            to="/requests"
            className={`nav-link ${isActive("/requests") ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            📋 Requests
          </Link>

          {/* ── AUTH SECTION ── */}
          {/* Conditional rendering: show user info if logged in, else show login button */}
          {user ? (
            <div className="navbar-user">
              {/* User avatar — first letter of their name (like Google's avatar) */}
              <div className="user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {/* Display the user's name */}
              <span className="user-name">{user.name.split(" ")[0]}</span>
              {/* Logout button */}
              <button className="btn btn-sm btn-outline" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            // Not logged in — show login/register button
            <Link
              to="/login"
              className="btn btn-primary btn-sm"
              onClick={() => setMenuOpen(false)}
            >
              Login / Register
            </Link>
          )}
        </div>

        {/* ── HAMBURGER MENU (Mobile) ── */}
        {/* Toggles the mobile menu open/close */}
        <button
          className="hamburger"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {/* Show ✕ when open, ☰ when closed */}
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

/*
 * ============================================================
 * END-OF-FILE SUMMARY:
 * This component renders the sticky top navigation bar visible on every page.
 * It reads auth state from AuthContext to conditionally show user info or login button.
 * Active nav links are highlighted using the current URL (useLocation).
 * On mobile, a hamburger button toggles the navigation links open/closed.
 * ============================================================
 */
