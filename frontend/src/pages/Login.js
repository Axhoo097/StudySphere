/**
 * ============================================================
 * FILE: Login.js
 * TYPE: Frontend — React Page Component (Auth Module)
 * JOB: Renders a login/register form and handles authentication API calls
 * INTERACTS WITH: api.js (authAPI), App.js (AuthContext login()), react-router (navigate)
 * ============================================================
 */

import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { authAPI } from "../api";
import { useAuth } from "../App";
import "./Login.css";

/**
 * COMPONENT: Login
 * WHAT: A tabbed page with both Login and Register forms
 * INPUT: None (reads from AuthContext to check if already logged in)
 * OUTPUT: JSX form that submits to the backend and updates auth state on success
 * REAL-WORLD MEANING: "The college admission gate — students get an ID card after verifying identity"
 */
const Login = () => {
  // If user is already logged in, no need to show login page — redirect home
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // tab: which form is displayed — "login" or "register"
  const [tab, setTab] = useState("login");

  // loading: true while the API request is in-flight — disables form and shows spinner
  const [loading, setLoading] = useState(false);

  // message: success or error feedback after form submission
  const [message, setMessage] = useState(null);

  // ── FORM STATE ──
  // All form fields managed in a single state object for simplicity
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    college: "",
    branch: "",
  });

  // If the user is already logged in, navigate them away from this page
  // WHY: No point showing login form to someone already authenticated
  if (user) return <Navigate to="/" replace />;

  /**
   * FUNCTION: handleChange
   * WHAT: Updates the corresponding field in formData when the user types
   * INPUT: e (change event from input)
   * OUTPUT: Updated formData state
   */
  const handleChange = (e) => {
    // Spread existing fields, then override the one that just changed
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setMessage(null); // clear any previous message when user starts typing
  };

  /**
   * FUNCTION: handleSubmit
   * WHAT: Validates form and calls the appropriate API (login or register)
   * INPUT: e (form submit event)
   * OUTPUT: Calls login() on success, sets error message on failure
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent default browser form submission (page reload)
    setLoading(true);
    setMessage(null);

    try {
      let res;

      if (tab === "login") {
        // Call POST /api/auth/login with email and password only
        res = await authAPI.login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        // Call POST /api/auth/register with all fields
        res = await authAPI.register(formData);
      }

      // On success, the backend returns { token, user }
      // Call the context's login() to save token + user globally
      login(res.data.user, res.data.token);

      setMessage({ type: "success", text: res.data.message });

      // Redirect to home after a short delay so user sees the success message
      setTimeout(() => navigate("/"), 800);
    } catch (err) {
      // Extract the error message from the backend response, or use a generic fallback
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false); // always turn off loading spinner
    }
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="login-page page-wrapper">
      <div className="container">
        <div className="login-card card">
          {/* Page branding */}
          <div className="login-header">
            <div className="login-logo">📚</div>
            <h1 className="login-title">StudySphere</h1>
            <p className="login-subtitle">
              {tab === "login"
                ? "Welcome back! Log in to access resources."
                : "Join the community and start sharing."}
            </p>
          </div>

          {/* ── TAB SWITCHER ── */}
          {/* Lets users switch between Login and Register without a page change */}
          <div className="login-tabs">
            <button
              className={`tab-btn ${tab === "login" ? "active" : ""}`}
              onClick={() => { setTab("login"); setMessage(null); }}
              id="tab-login"
            >
              Login
            </button>
            <button
              className={`tab-btn ${tab === "register" ? "active" : ""}`}
              onClick={() => { setTab("register"); setMessage(null); }}
              id="tab-register"
            >
              Register
            </button>
          </div>

          {/* ── FORM ── */}
          <form className="login-form" onSubmit={handleSubmit}>

            {/* Name field — only shown for registration */}
            {tab === "register" && (
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ravi Kumar"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@college.edu"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder={tab === "register" ? "Min. 6 characters" : "Your password"}
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            {/* College + Branch — only for registration */}
            {tab === "register" && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="college">College (optional)</label>
                  <input
                    id="college"
                    name="college"
                    type="text"
                    className="form-input"
                    placeholder="e.g. IIT Delhi"
                    value={formData.college}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="branch">Branch (optional)</label>
                  <input
                    id="branch"
                    name="branch"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Computer Science"
                    value={formData.branch}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {/* Feedback message */}
            {message && (
              <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}>
                {message.text}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
              id="btn-submit"
            >
              {loading
                ? "Please wait..."
                : tab === "login" ? "Login →" : "Create Account →"}
            </button>
          </form>

          {/* Footer switch hint */}
          <p className="login-switch">
            {tab === "login" ? "Don't have an account? " : "Already registered? "}
            <button
              className="switch-link"
              onClick={() => { setTab(tab === "login" ? "register" : "login"); setMessage(null); }}
            >
              {tab === "login" ? "Register here" : "Login here"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

/*
 * ============================================================
 * END-OF-FILE SUMMARY:
 * This page handles both registration and login via a tabbed form UI.
 * On success, it stores the JWT + user in AuthContext and localStorage, then redirects home.
 * If already logged in, it immediately redirects to the home page via <Navigate>.
 * It cleanly handles loading states, field validation, and server error messages.
 * ============================================================
 */
