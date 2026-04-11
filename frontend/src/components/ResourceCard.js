/**
 * ============================================================
 * FILE: ResourceCard.js
 * TYPE: Frontend — Reusable React Component (UI Layer)
 * JOB: Displays a single resource as a card with rating, download, and type badge
 * INTERACTS WITH: Home.js (renders this for each resource), api.js (download + rate calls)
 * ============================================================
 */

import React, { useState } from "react";
import { resourceAPI } from "../api";
import { useAuth } from "../App";
import "./ResourceCard.css";

/**
 * COMPONENT: ResourceCard
 * WHAT: A self-contained card that shows resource details, allows download and rating
 * INPUT: resource (object with title, subject, semester, type, avgRating, downloads, uploadedBy, etc.)
 * OUTPUT: A styled card JSX element
 * REAL-WORLD MEANING: "A library card catalogue entry — shows info and lets you borrow or rate the book"
 */
const ResourceCard = ({ resource }) => {
  // Read auth state — needed to check if user is logged in before rating/downloading
  const { user } = useAuth();

  // Local state: track the user's submitted star rating (highlighted stars)
  const [userRating, setUserRating] = useState(0);

  // hoveredStar: which star the mouse is hovering on (for interactive star UI)
  const [hoveredStar, setHoveredStar] = useState(0);

  // avgRating shown to the user — updates locally after they rate
  const [avgRating, setAvgRating] = useState(parseFloat(resource.avgRating) || 0);

  // Stores success/error messages for download and rating actions
  const [message, setMessage] = useState(null);

  // downloading: prevents multiple download clicks at once
  const [downloading, setDownloading] = useState(false);

  // rating: locks UI while submitting a rating request
  const [submittingRating, setSubmittingRating] = useState(false);

  // ─────────────────────────────────────────────
  // HELPER: Map resource type to a badge color class
  // WHY: Different types get different colored badges for visual distinction
  // ─────────────────────────────────────────────
  const typeBadgeClass = {
    notes: "badge-purple",
    book: "badge-cyan",
    paper: "badge-amber",
    assignment: "badge-blue",
    other: "badge-green",
  }[resource.type] || "badge-purple";

  // ─────────────────────────────────────────────
  // HELPER: Calculate Resource Score
  // Formula: (avgRating * 2) + downloads
  // WHY: Gives a single number representing quality + popularity combined
  // ─────────────────────────────────────────────
  const score = (avgRating * 2 + (resource.downloads || 0)).toFixed(1);

  /**
   * FUNCTION: handleDownload
   * WHAT: Calls the backend to increment download count, then opens the file in a new tab
   * INPUT: None (uses resource._id from props)
   * OUTPUT: Opens file URL or shows error message
   */
  const handleDownload = async () => {
    // Check if user is logged in — downloading requires authentication
    if (!user) {
      setMessage({ type: "error", text: "Please login to download resources." });
      return;
    }

    setDownloading(true);
    setMessage(null);

    try {
      // Call backend: GET /api/resources/:id/download
      // This increments the download counter in DB and returns the file URL
      const res = await resourceAPI.download(resource._id);

      // Build the full URL — the file is served by the backend at /uploads/
      const fileUrl = `http://localhost:5000${res.data.fileUrl}`;

      // Open the file in a new browser tab — triggers native download
      // WHY: window.open is the simplest cross-browser way to initiate a download
      window.open(fileUrl, "_blank");

      setMessage({ type: "success", text: "Download started! ✅" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Download failed. Please try again.",
      });
    } finally {
      // Always reset loading state, even if an error occurred
      setDownloading(false);
    }
  };

  /**
   * FUNCTION: handleRate
   * WHAT: Submits a star rating for this resource
   * INPUT: ratingValue (number 1–5)
   * OUTPUT: Updates avgRating in UI and shows success message
   */
  const handleRate = async (ratingValue) => {
    if (!user) {
      setMessage({ type: "error", text: "Please login to rate resources." });
      return;
    }

    setSubmittingRating(true);
    setMessage(null);

    try {
      // POST /api/resources/:id/rate — sends { rating: ratingValue }
      const res = await resourceAPI.rate(resource._id, ratingValue);

      // Save what the user chose (highlights their selected stars)
      setUserRating(ratingValue);

      // Update the displayed average rating from the server's recalculated value
      setAvgRating(parseFloat(res.data.avgRating));

      setMessage({ type: "success", text: `Rated ${ratingValue} ⭐ — thanks!` });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Rating failed. Please try again.",
      });
    } finally {
      setSubmittingRating(false);
    }
  };

  // ─────────────────────────────────────────────
  // RENDER: Build the card JSX
  // ─────────────────────────────────────────────
  return (
    <div className="resource-card card">
      {/* ── CARD HEADER: type badge + semester ── */}
      <div className="rc-header">
        {/* Resource type badge (notes / book / paper / etc.) */}
        <span className={`badge ${typeBadgeClass}`}>{resource.type}</span>

        {/* Semester badge — only show if semester is defined */}
        {resource.semester && (
          <span className="badge badge-purple">Sem {resource.semester}</span>
        )}

        {/* Resource Score pill — higher = better rated + popular */}
        <span className="rc-score" title="Resource Score = (Rating × 2) + Downloads">
          🏆 {score}
        </span>
      </div>

      {/* ── CARD BODY: title, subject, uploader ── */}
      <div className="rc-body">
        {/* Resource title — truncated if too long */}
        <h3 className="rc-title" title={resource.title}>
          {resource.title}
        </h3>

        {/* Subject name */}
        <p className="rc-subject">📖 {resource.subject}</p>

        {/* Optional description preview */}
        {resource.description && (
          <p className="rc-description">{resource.description}</p>
        )}

        {/* Tags — displayed as small pills */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="rc-tags">
            {resource.tags.slice(0, 4).map((tag, i) => (
              <span key={i} className="rc-tag">#{tag}</span>
            ))}
          </div>
        )}

        {/* Uploader info */}
        <p className="rc-uploader">
          👤 {resource.uploadedBy?.name || "Unknown"}{" "}
          {resource.uploadedBy?.college && (
            <span className="text-muted text-xs">— {resource.uploadedBy.college}</span>
          )}
        </p>
      </div>

      {/* ── CARD FOOTER: stats + actions ── */}
      <div className="rc-footer">
        {/* Stats row: avg rating and download count */}
        <div className="rc-stats">
          <span title="Average Rating">⭐ {avgRating > 0 ? avgRating : "—"}</span>
          <span title="Total Downloads">⬇️ {resource.downloads || 0}</span>
        </div>

        {/* Download button */}
        <button
          className="btn btn-primary btn-sm"
          onClick={handleDownload}
          disabled={downloading}
          id={`download-${resource._id}`}
        >
          {downloading ? "Opening..." : "⬇️ Download"}
        </button>
      </div>

      {/* ── STAR RATING SECTION ── */}
      <div className="rc-rating">
        <span className="rc-rating-label">Rate this:</span>

        {/* Render 5 star buttons */}
        {/* Each star listens to hover and click for an interactive experience */}
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`star-btn ${
              // Fill the star if it falls within the hover range OR selected range
              star <= (hoveredStar || userRating) ? "filled" : ""
              }`}
            onMouseEnter={() => setHoveredStar(star)} // highlight on hover
            onMouseLeave={() => setHoveredStar(0)}    // unhighlight when mouse leaves
            onClick={() => handleRate(star)}           // submit rating on click
            disabled={submittingRating}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            ★
          </button>
        ))}
      </div>

      {/* ── FEEDBACK MESSAGE ── */}
      {/* Show success/error message temporarily after action */}
      {message && (
        <div className={`rc-message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default ResourceCard;

/*
 * ============================================================
 * END-OF-FILE SUMMARY:
 * This component renders one resource card with all interactive features.
 * It handles downloading (calling the backend + opening file in new tab) and star ratings.
 * It computes and displays the Resource Score (avgRating × 2 + downloads).
 * It uses local state for UI interactions and calls api.js functions to communicate with the backend.
 * ============================================================
 */
