/**
 * ============================================================
 * FILE: Home.js
 * TYPE: Frontend — React Page Component
 * JOB: Main browsing page — shows all resources with search, filters, and top picks section
 * INTERACTS WITH: api.js (resourceAPI.getAll), ResourceCard.js (renders each resource)
 * ============================================================
 */

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { resourceAPI } from "../api";
import ResourceCard from "../components/ResourceCard";
import { useAuth } from "../App";
import "./Home.css";

/**
 * COMPONENT: Home
 * WHAT: The main browsing page showing all resources with live search and filters
 * INPUT: None (fetches data from backend via API)
 * OUTPUT: A grid of ResourceCard components with search/filter bar and hero section
 * REAL-WORLD MEANING: "The main hall of the library — browse, search, find what you need"
 */
const Home = () => {
  const { user } = useAuth();

  // ─────────────────────────────────────────────
  // STATE DECLARATIONS
  // ─────────────────────────────────────────────

  // resources: the full list fetched from backend
  const [resources, setResources] = useState([]);

  // topResources: top 3 by score for the "Top Resources" spotlight section
  const [topResources, setTopResources] = useState([]);

  // loading: true while the API call is in progress — shows spinner
  const [loading, setLoading] = useState(true);

  // error: stores any fetch error to display to the user
  const [error, setError] = useState(null);

  // filters: all search/filter field values in one object
  const [filters, setFilters] = useState({
    search: "",
    subject: "",
    semester: "",
    type: "",
    sort: "newest", // default sort: newest first
  });

  // ─────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────

  /**
   * FUNCTION: fetchResources
   * WHAT: Calls the backend to get resources matching current filters
   * INPUT: current filters state
   * OUTPUT: Sets resources + topResources state
   * WHY useCallback: Prevents recreating this function on every render
   */
  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query params from filters — only include non-empty ones
      const params = {};
      if (filters.search)   params.search   = filters.search;
      if (filters.subject)  params.subject  = filters.subject;
      if (filters.semester) params.semester = filters.semester;
      if (filters.type)     params.type     = filters.type;
      if (filters.sort && filters.sort !== "newest") params.sort = filters.sort;

      // GET /api/resources?search=...&semester=...&type=...
      const res = await resourceAPI.getAll(params);
      const data = res.data.resources || [];
      setResources(data);

      // Compute top 3 by Resource Score for the spotlight section
      const sorted = [...data].sort((a, b) => {
        const scoreA = a.avgRating * 2 + a.downloads;
        const scoreB = b.avgRating * 2 + b.downloads;
        return scoreB - scoreA; // descending: highest score first
      });
      setTopResources(sorted.slice(0, 3)); // top 3 only
    } catch (err) {
      setError("Failed to load resources. Is the backend server running?");
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]); // re-run whenever filters change

  // useEffect: runs fetchResources on first render and whenever filters change
  // WHY: We want the list to update in real-time as the user changes filters
  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  /**
   * FUNCTION: handleFilterChange
   * WHAT: Updates a single filter field in the filters state
   * INPUT: e (input change event) — reads name and value
   * OUTPUT: Updated filters state → triggers re-fetch via useEffect
   */
  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * FUNCTION: clearFilters
   * WHAT: Resets all filters to their default (empty) values
   * INPUT: None
   * OUTPUT: Resets filters state → triggers a full resource refresh
   */
  const clearFilters = () => {
    setFilters({ search: "", subject: "", semester: "", type: "", sort: "newest" });
  };

  // Is any filter currently active? Used to show a "Clear" button conditionally
  const hasActiveFilters =
    filters.search || filters.subject || filters.semester || filters.type;

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="home-page page-wrapper">
      <div className="container">

        {/* ── HERO SECTION ── */}
        <div className="hero">
          <h1 className="hero-title">
            Find & Share <span className="highlight">Academic Resources</span>
          </h1>
          <p className="hero-subtitle">
            Notes, books, papers — uploaded by students, for students.
            {user ? ` Welcome back, ${user.name.split(" ")[0]}! 👋` : ""}
          </p>
          {/* CTA buttons: upload or request */}
          <div className="hero-actions">
            <Link to="/upload" className="btn btn-primary btn-lg">
              ⬆️ Upload a Resource
            </Link>
            <Link to="/requests" className="btn btn-outline btn-lg">
              📋 Browse Requests
            </Link>
          </div>
        </div>

        {/* ── TOP RESOURCES SECTION ── */}
        {/* Only show if we have data and no active search filters */}
        {!hasActiveFilters && topResources.length > 0 && (
          <div className="top-resources-section">
            <h2 className="section-title">🏆 Top Resources</h2>
            <p className="section-subtitle">Highest rated and most downloaded this week</p>
            <div className="grid grid-3">
              {topResources.map((r) => (
                <ResourceCard key={r._id} resource={r} />
              ))}
            </div>
            <hr className="divider" />
          </div>
        )}

        {/* ── SEARCH + FILTER BAR ── */}
        <div className="filter-bar">
          {/* Text search input */}
          <input
            type="text"
            name="search"
            className="form-input search-input"
            placeholder="🔍 Search title, subject, tags..."
            value={filters.search}
            onChange={handleFilterChange}
            id="search-input"
          />

          {/* Subject filter */}
          <input
            type="text"
            name="subject"
            className="form-input filter-input"
            placeholder="Subject"
            value={filters.subject}
            onChange={handleFilterChange}
            id="filter-subject"
          />

          {/* Semester dropdown */}
          <select
            name="semester"
            className="form-select filter-select"
            value={filters.semester}
            onChange={handleFilterChange}
            id="filter-semester"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>Sem {s}</option>
            ))}
          </select>

          {/* Type dropdown */}
          <select
            name="type"
            className="form-select filter-select"
            value={filters.type}
            onChange={handleFilterChange}
            id="filter-type"
          >
            <option value="">All Types</option>
            <option value="notes">📝 Notes</option>
            <option value="book">📗 Book</option>
            <option value="paper">📄 Paper</option>
            <option value="assignment">✏️ Assignment</option>
            <option value="other">📦 Other</option>
          </select>

          {/* Sort dropdown */}
          <select
            name="sort"
            className="form-select filter-select"
            value={filters.sort}
            onChange={handleFilterChange}
            id="filter-sort"
          >
            <option value="newest">🕒 Newest</option>
            <option value="score">🏆 Top Score</option>
            <option value="rating">⭐ Highest Rated</option>
            <option value="downloads">⬇️ Most Downloaded</option>
          </select>

          {/* Clear filters button — only visible when at least one filter is active */}
          {hasActiveFilters && (
            <button className="btn btn-sm btn-outline" onClick={clearFilters} id="btn-clear">
              ✕ Clear
            </button>
          )}
        </div>

        {/* ── RESULTS SECTION ── */}
        <div className="results-header">
          <h2 className="section-title">
            {hasActiveFilters ? "Search Results" : "All Resources"}
          </h2>
          {!loading && (
            <span className="results-count">
              {resources.length} resource{resources.length !== 1 ? "s" : ""} found
            </span>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="spinner-wrapper">
            <div className="spinner"></div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="alert alert-error">{error}</div>
        )}

        {/* Empty state — no results found */}
        {!loading && !error && resources.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No resources found</h3>
            <p>
              {hasActiveFilters
                ? "Try clearing your filters or searching for something different."
                : "Be the first to upload a resource!"}
            </p>
            <Link to="/upload" className="btn btn-primary mt-3">
              ⬆️ Upload First Resource
            </Link>
          </div>
        )}

        {/* Resource grid */}
        {!loading && !error && resources.length > 0 && (
          <div className="grid grid-3">
            {resources.map((resource) => (
              // Each ResourceCard gets the full resource object as a prop
              <ResourceCard key={resource._id} resource={resource} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

/*
 * ============================================================
 * END-OF-FILE SUMMARY:
 * This is the main landing page — it fetches and displays all resources from the backend.
 * It supports real-time search and filtering with 4 filter controls (search, subject, semester, type).
 * It renders a "Top Resources" spotlight for the highest-scored content when no filters are active.
 * It handles loading spinners, error messages, and empty states for a complete user experience.
 * ============================================================
 */
