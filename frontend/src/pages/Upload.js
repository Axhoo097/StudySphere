/**
 * ============================================================
 * FILE: Upload.js
 * TYPE: Frontend — React Page Component
 * JOB: Provides a form for students to upload new academic resources
 * INTERACTS WITH: api.js (resourceAPI.upload), App.js (protected route context)
 * ============================================================
 */

// Import React and necessary hooks
// WHY: useState to manage form data, useNavigate to redirect after success
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Import our pre-configured API methods
import { resourceAPI } from "../api";

// Import CSS specific to the Upload page layout
import "./Upload.css";

/**
 * COMPONENT: Upload
 * WHAT: A page with a multipart form to submit files and metadata
 * INPUT: None (reads user input directly)
 * OUTPUT: Renders the upload form and sends FormData to backend
 * REAL-WORLD MEANING: "The librarian's desk where you drop off new notes for others to find"
 */
const Upload = () => {
  // Navigation hook to redirect the user back to Home upon successful upload
  const navigate = useNavigate();

  // ─────────────────────────────────────────────
  // STATE DECLARATIONS
  // ─────────────────────────────────────────────

  // formData: Holds all the text inputs for the resource
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    semester: "",
    type: "notes", // default matching the backend enum
    description: "",
    tags: "", // tags will be sent as a comma-separated string
  });

  // file: Holds the actual File object selected by the user
  // WHY: Needs separate state because files aren't handled like standard text inputs
  const [file, setFile] = useState(null);

  // loading: Disables the form and changes button text while waiting for backend
  const [loading, setLoading] = useState(false);

  // message: Displays success or error alerts to the user
  const [message, setMessage] = useState(null);

  // ─────────────────────────────────────────────
  // INPUT HANDLERS
  // ─────────────────────────────────────────────

  /**
   * FUNCTION: handleChange
   * WHAT: Updates text-based form fields in state when the user types
   * INPUT: e (change event from text inputs/selects)
   * OUTPUT: Updates formData state
   */
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * FUNCTION: handleFileChange
   * WHAT: Captures the file selected by the user via the file input
   * INPUT: e (change event from file input)
   * OUTPUT: Updates the 'file' state with the selected File object
   */
  const handleFileChange = (e) => {
    // e.target.files is an array; we only allow a single file upload, so take index 0
    // WHAT breaks if removed: The file won't be saved in state, upload will fail.
    setFile(e.target.files[0]);
  };

  // ─────────────────────────────────────────────
  // SUBMISSION LOGIC
  // ─────────────────────────────────────────────

  /**
   * FUNCTION: handleSubmit
   * WHAT: Packages the form data + file and sends it to the backend
   * INPUT: e (form submission event)
   * OUTPUT: Calls API, redirects on success, displays error on failure
   */
  const handleSubmit = async (e) => {
    // Prevent the default browser form refresh
    e.preventDefault();

    // Basic validation before hitting the server
    if (!file) {
      setMessage({ type: "error", text: "Please select a file to upload." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Create a new FormData object
      // WHY: Standard JSON can't carry binary file data. FormData constructs a multipart/form-data request.
      const data = new FormData();
      
      // Append text fields to the FormData object
      data.append("title", formData.title);
      data.append("subject", formData.subject);
      data.append("semester", formData.semester);
      data.append("type", formData.type);
      data.append("description", formData.description);
      data.append("tags", formData.tags);

      // Append the actual file object. The key MUST match the backend multer's expected field name ("file").
      // WHAT breaks if removed: Multer throws an error because req.file will be undefined.
      data.append("file", file);

      // Call the API
      await resourceAPI.upload(data);

      setMessage({ type: "success", text: "Resource uploaded successfully!" });

      // After 1.5s, head back to home to see the newly uploaded resource
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Upload failed. Please try again.",
      });
    } finally {
      // Regardless of success or failure, turn off the loading tracker
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="upload-page page-wrapper">
      <div className="container">
        
        {/* Centered card container for the form */}
        <div className="upload-card card">
          <div className="upload-header">
            <h1 className="section-title">⬆️ Upload Resource</h1>
            <p className="section-subtitle">Share notes, papers, or books with the community.</p>
          </div>

          <form className="upload-form grid grid-2" onSubmit={handleSubmit}>
            
            {/* Title Input */}
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label" htmlFor="title">Resource Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                className="form-input"
                placeholder="e.g. Operating Systems Final Notes"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Subject Input */}
            <div className="form-group">
              <label className="form-label" htmlFor="subject">Subject *</label>
              <input
                id="subject"
                name="subject"
                type="text"
                className="form-input"
                placeholder="e.g. Computer Science"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>

            {/* Semester Dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="semester">Semester *</label>
              <select
                id="semester"
                name="semester"
                className="form-select"
                value={formData.semester}
                onChange={handleChange}
                required
              >
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            {/* Type Dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="type">Resource Type *</label>
              <select
                id="type"
                name="type"
                className="form-select"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="notes">Notes</option>
                <option value="book">Book</option>
                <option value="paper">Previous Year Paper</option>
                <option value="assignment">Assignment</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Tags Input */}
            <div className="form-group">
              <label className="form-label" htmlFor="tags">Tags (comma separated)</label>
              <input
                id="tags"
                name="tags"
                type="text"
                className="form-input"
                placeholder="e.g. midterms, easy, diagrams"
                value={formData.tags}
                onChange={handleChange}
              />
            </div>

            {/* Description Textarea */}
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label" htmlFor="description">Description (optional)</label>
              <textarea
                id="description"
                name="description"
                className="form-textarea"
                placeholder="Add some details about the content..."
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            {/* File Upload Input */}
            {/* gridColumn ensures it stretches across the entire row in the grid layout */}
            <div className="form-group file-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label" htmlFor="file">Select File * (Max 20MB)</label>
              <input
                id="file"
                type="file"
                className="form-input file-input"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png"
                required
              />
            </div>

            {/* Feedback Message */}
            {message && (
              <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`} style={{ gridColumn: "1 / -1" }}>
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <div style={{ gridColumn: "1 / -1" }}>
              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block"
                disabled={loading}
              >
                {loading ? "Uploading..." : "Upload Resource 🚀"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Upload;

/*
 * ============================================================
 * END-OF-FILE SUMMARY:
 * This file provides the user interface for uploading new academic resources.
 * It carefully handles file selection using the HTML file input and stores the File object.
 * On submit, it constructs a FormData object to bridge binary data (file) and JSON data (metadata).
 * Upon successful upload, it gives visual feedback and safely redirects the user back to the Home page.
 * ============================================================
 */
