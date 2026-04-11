/**
 * ============================================================
 * FILE: App.js
 * TYPE: Frontend — React Root Component / Router
 * JOB: Sets up URL-based routing and wraps the app in an auth context
 * INTERACTS WITH: All pages (Home, Upload, Requests, Login), Navbar component
 * ============================================================
 */

// React core — required in every React file
import React, { useState, createContext, useContext } from "react";

// React Router v6 — handles client-side navigation (no page refresh)
// BrowserRouter uses the HTML5 History API for clean URLs (no hash)
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Global stylesheet — applies design tokens and utility classes to the whole app
import "./index.css";

// Page components — each represents one full "screen" of the app
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Requests from "./pages/Requests";
import Login from "./pages/Login";

// Shared UI components used across multiple pages
import Navbar from "./components/Navbar";

// ─────────────────────────────────────────────
// SECTION 1: AUTH CONTEXT
// WHY: We need to share login state (user, token) across all pages
// Without context, we'd have to "prop drill" — pass them through every component manually
// createContext creates a "global variable" accessible anywhere in the component tree
// ─────────────────────────────────────────────

// Create the context — initially empty; will be filled by AuthProvider
export const AuthContext = createContext(null);

/**
 * CUSTOM HOOK: useAuth
 * WHAT: Lets any child component easily access auth state and functions
 * INPUT: None
 * OUTPUT: { user, token, login, logout }
 * REAL-WORLD MEANING: "A shortcut to check if you're logged in from anywhere in the app"
 */
export const useAuth = () => useContext(AuthContext);

/**
 * COMPONENT: AuthProvider
 * WHAT: Wraps the whole app and provides login state to all children
 * INPUT: props.children (all child components — the entire app)
 * OUTPUT: JSX with context provided
 * REAL-WORLD MEANING: "The college gate security desk — everyone checks in here"
 */
const AuthProvider = ({ children }) => {
  // Try to restore user from localStorage so they stay logged in after refresh
  // WHY: React state is reset on page refresh, but localStorage persists
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null; // if JSON is corrupted, default to logged-out state
    }
  });

  // Same for token
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);

  /**
   * FUNCTION: login
   * WHAT: Saves user data + token to state AND localStorage
   * INPUT: userData (object), authToken (string)
   * OUTPUT: Updates state and persists to localStorage
   */
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    // Persist so user remains logged in after browser refresh
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
  };

  /**
   * FUNCTION: logout
   * WHAT: Clears all auth data from state and localStorage
   * INPUT: None
   * OUTPUT: Resets auth state, clearing the session
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // Provide these values to ALL child components via context
  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─────────────────────────────────────────────
// SECTION 2: PROTECTED ROUTE WRAPPER
// WHY: Some pages (Upload, Requests for posting) require login
// If a non-logged-in user tries to access them, redirect to /login
// ─────────────────────────────────────────────

/**
 * COMPONENT: ProtectedRoute
 * WHAT: Wraps a route — redirects to /login if user is not authenticated
 * INPUT: children (the protected page component)
 * OUTPUT: Either the protected component or a redirect to /login
 */
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth(); // read auth state from context

  // If no user is logged in, navigate to /login
  // `replace` avoids adding /upload to browser history when redirecting away
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated — render the requested page normally
  return children;
};

// ─────────────────────────────────────────────
// SECTION 3: MAIN APP COMPONENT
// WHY: This is the root component rendered by index.js
// It wires together the Router, AuthProvider, Navbar, and all page routes
// ─────────────────────────────────────────────

/**
 * COMPONENT: App
 * WHAT: Root component that composes the entire application
 * INPUT: None
 * OUTPUT: The full application with routing and auth context
 */
function App() {
  return (
    // AuthProvider wraps everything so all pages can access user/login/logout
    <AuthProvider>
      {/* BrowserRouter enables client-side routing using URL paths */}
      <Router>
        {/* Navbar renders on every page — it's outside <Routes> so it's always visible */}
        <Navbar />

        {/* Main content area — padded below navbar */}
        <div className="main-content">
          <Routes>
            {/* Home page — shows all resources + search (PUBLIC) */}
            <Route path="/" element={<Home />} />

            {/* Login/Register page — redirects home if already logged in */}
            <Route path="/login" element={<Login />} />

            {/* Upload page — requires authentication (PROTECTED) */}
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />

            {/* Requests page — public to view, login needed to post/respond */}
            <Route path="/requests" element={<Requests />} />

            {/* Catch-all: redirect any unknown URL to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

/*
 * ============================================================
 * END-OF-FILE SUMMARY:
 * This is the root of the React application — it sets up the entire app structure.
 * AuthProvider wraps everything to share login state (user, token) across all pages via Context.
 * React Router maps URL paths to specific page components (Home, Upload, Requests, Login).
 * ProtectedRoute ensures authenticated-only pages redirect unauthenticated users to /login.
 * ============================================================
 */
