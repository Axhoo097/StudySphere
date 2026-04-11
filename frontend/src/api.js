/**
 * ============================================================
 * FILE: api.js
 * TYPE: Frontend — API Layer / Axios Configuration
 * JOB: Single place to configure all HTTP requests to the backend
 * INTERACTS WITH: All pages (Home, Upload, Requests, Login) use this to call the backend
 * ============================================================
 */

// axios is a promise-based HTTP client — easier to use than fetch()
// WHY: It automatically parses JSON, handles errors better, and supports interceptors
import axios from "axios";

// ─────────────────────────────────────────────
// SECTION 1: CREATE AXIOS INSTANCE
// WHY: Instead of manually writing the full URL in every request,
// we configure a base URL once here. All requests use it automatically.
// ─────────────────────────────────────────────

const api = axios.create({
  // Base URL of the backend server
  // All API calls will be prefixed with this — e.g., api.get("/resources") → GET http://localhost:5000/api/resources
  baseURL: "http://localhost:5000/api",

  // Default headers sent with every request
  headers: {
    "Content-Type": "application/json",
  },
});

// ─────────────────────────────────────────────
// SECTION 2: REQUEST INTERCEPTOR
// WHY: Automatically attaches the JWT token to every request that needs auth
// Without this, we'd have to manually add the Authorization header in every API call
// ─────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    // Read the JWT token from localStorage — it was saved there at login
    const token = localStorage.getItem("token");

    // If a token exists, add it to the Authorization header
    // Format: "Bearer TOKEN_STRING" — this is the standard Bearer Token scheme
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Must return config — without this, the request would never be sent
    return config;
  },
  (error) => {
    // If something breaks during request setup, reject the promise
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
// SECTION 3: RESPONSE INTERCEPTOR
// WHY: Globally handle 401 (Unauthorized) responses — log the user out automatically
// If the token expires, the server returns 401 — we clear the token and redirect to login
// ─────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response, // successful response — pass through unchanged

  (error) => {
    // If the server responds with 401 (expired or invalid token)
    if (error.response && error.response.status === 401) {
      // Remove stored credentials from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login page — comment out if using React Router navigation instead
      // window.location.href = "/login";
    }

    // Re-throw the error so individual API calls can handle it (show message to user)
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
// SECTION 4: NAMED API FUNCTION GROUPS
// WHY: Centralising all API calls makes it easy to change endpoints in one place
// ─────────────────────────────────────────────

/** AUTH API CALLS */
export const authAPI = {
  // Register a new student account
  register: (data) => api.post("/auth/register", data),

  // Login with email and password — returns JWT token
  login: (data) => api.post("/auth/login", data),
};

/** RESOURCE API CALLS */
export const resourceAPI = {
  // Fetch all resources with optional filters
  // params example: { search: "DSA", semester: 3, type: "notes", sort: "score" }
  getAll: (params) => api.get("/resources", { params }),

  // Upload a new resource — uses FormData for file + metadata
  // WHY: Regular JSON cannot send files — multipart FormData is required
  upload: (formData) =>
    api.post("/resources/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }, // override default JSON header
    }),

  // Increment download count and get the file URL
  download: (id) => api.get(`/resources/${id}/download`),

  // Rate a resource (1–5 stars)
  rate: (id, rating) => api.post(`/resources/${id}/rate`, { rating }),

  // Get similar resource recommendations
  getRecommendations: (id) => api.get(`/resources/${id}/recommendations`),
};

/** REQUEST API CALLS */
export const requestAPI = {
  // Fetch all resource requests
  getAll: () => api.get("/requests"),

  // Create a new resource request (requires login)
  create: (data) => api.post("/requests", data),

  // Respond to an existing request (requires login)
  respond: (id, data) => api.post(`/requests/${id}/respond`, data),
};

// Export the configured axios instance as default
// WHY: Some components may want to make custom API calls not in the groups above
export default api;

/*
 * ============================================================
 * END-OF-FILE SUMMARY:
 * This file sets up a pre-configured axios instance with the backend base URL.
 * It automatically attaches the JWT auth token to every request via an interceptor.
 * It handles 401 errors globally and exports clean, named API functions for each feature.
 * Every React component/page that talks to the backend imports from this file.
 * ============================================================
 */
