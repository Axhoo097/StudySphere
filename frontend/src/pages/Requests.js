/**
 * ============================================================
 * FILE: Requests.js
 * TYPE: Frontend — React Page Component
 * JOB: Displays all community requests, allows creating new ones, and posting responses
 * INTERACTS WITH: api.js (requestAPI), App.js (for user auth state)
 * ============================================================
 */

// Import React and hooks for data fetching and state management
import React, { useState, useEffect, useCallback } from "react";

// Link for navigation, e.g., directing users to login if they try to interact unauthenticated
import { Link } from "react-router-dom";

// Centralised API methods for requests and user context
import { requestAPI } from "../api";
import { useAuth } from "../App";

// Import stylesheet for layout and UI components
import "./Requests.css";

/**
 * COMPONENT: Requests
 * WHAT: The page that acts as a community bulletin board for missing resources.
 * INPUT: None
 * OUTPUT: Renders a list of requests and forms to ask for/respond to them.
 * REAL-WORLD MEANING: "The physical notice board where students pin index cards asking for notes."
 */
const Requests = () => {
  // Pulling 'user' from context tells us if someone is logged in and who they are
  const { user } = useAuth();

  // ─────────────────────────────────────────────
  // STATE DECLARATIONS
  // ─────────────────────────────────────────────

  // Array of all requests fetched from the backend
  const [requests, setRequests] = useState([]);
  
  // Track initial page load state to show spinner
  const [loading, setLoading] = useState(true);
  
  // Track page-level errors like network failure
  const [error, setError] = useState(null);

  // Toggle for the "Create New Request" form modal/section
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  
  // Form state for creating a NEW request
  const [newRequest, setNewRequest] = useState({
    title: "",
    subject: "",
    semester: "",
    description: ""
  });

  // Tracks which specific request the user is currently replying to (stores the request's ID)
  // WHY: Without this, we wouldn't know which request card should display the reply form
  const [respondingTo, setRespondingTo] = useState(null);

  // Form state for RESPONDING to an existing request
  const [responseData, setResponseData] = useState({
    message: "",
    markFulfilled: false
  });

  // Track submission state for forms to disable buttons and prevent double-clicks
  const [submitting, setSubmitting] = useState(false);

  // ─────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────

  /**
   * FUNCTION: fetchRequests
   * WHAT: Retrieves the latest list of requests from the backend
   * INPUT: None
   * OUTPUT: Updates 'requests' state with the fetched array
   */
  const fetchRequests = useCallback(async () => {
    try {
      // Call GET /api/requests
      const res = await requestAPI.getAll();
      setRequests(res.data.requests);
    } catch (err) {
      setError("Failed to load requests.");
      console.error(err);
    } finally {
      // Always stop the spinner, even on failure
      setLoading(false);
    }
  }, []);

  // Fetch all requests exactly once when the component mounts
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ─────────────────────────────────────────────
  // FORM HANDLERS
  // ─────────────────────────────────────────────

  /**
   * FUNCTION: handleCreateRequest
   * WHAT: Submits the form data to create a new request on the board
   * INPUT: e (form submit event)
   * OUTPUT: Calls API, resets form, and refreshes the list
   */
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Send the state object directly to the backend
      await requestAPI.create(newRequest);
      
      // Cleanup: hide form, wipe data, fetch updated list
      setShowSubmitForm(false);
      setNewRequest({ title: "", subject: "", semester: "", description: "" });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create request.");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * FUNCTION: handleRespond
   * WHAT: Submits a reply to a specific request
   * INPUT: e (form submit event), requestId (ID of the request being answered)
   * OUTPUT: Posts response, closes reply form, refreshes list to show new reply
   */
  const handleRespond = async (e, requestId) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // POST the response payload to the specific request's endpoint
      await requestAPI.respond(requestId, responseData);
      
      // Cleanup: close the active reply box, wipe response data, fetch updated list
      setRespondingTo(null);
      setResponseData({ message: "", markFulfilled: false });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post response.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────

  // Loading Screen
  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  // General Error Screen
  if (error) {
    return <div className="alert alert-error" style={{ margin: "40px" }}>{error}</div>;
  }

  // ─────────────────────────────────────────────
  // RENDER PAGE
  // ─────────────────────────────────────────────
  return (
    <div className="requests-page page-wrapper">
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Page Header */}
        <div className="requests-header">
          <h1 className="section-title">📋 Community Requests</h1>
          <p className="section-subtitle">Can't find what you're looking for? Ask the community!</p>
          
          {/* 
            Inline conditional rendering: If user is logged in, show 'Ask' button.
            If not, show a link to the login page.
            WHAT breaks if removed: Unauthenticated users might try to open the form and get API errors.
          */}
          {user ? (
            <button 
              className="btn btn-primary"
              onClick={() => setShowSubmitForm(!showSubmitForm)}
            >
              {showSubmitForm ? "Cancel" : "➕ Ask for a Resource"}
            </button>
          ) : (
            <Link to="/login" className="btn btn-outline">Login to Ask for a Resource</Link>
          )}
        </div>

        {/* ── CREATE REQUEST FORM ── */}
        {showSubmitForm && user && (
          <form className="card request-form-card" onSubmit={handleCreateRequest}>
            <h3 className="form-title">What do you need?</h3>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input 
                required type="text" className="form-input" placeholder="e.g. Need Sem 5 DBMS Notes"
                value={newRequest.title}
                onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
              />
            </div>
            
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Subject *</label>
                <input 
                  required type="text" className="form-input" placeholder="e.g. DBMS"
                  value={newRequest.subject}
                  onChange={(e) => setNewRequest({...newRequest, subject: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select 
                  className="form-select"
                  value={newRequest.semester}
                  onChange={(e) => setNewRequest({...newRequest, semester: e.target.value})}
                >
                  <option value="">Any</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Details</label>
              <textarea 
                className="form-textarea" placeholder="Any specific topics or authors?"
                value={newRequest.description}
                onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Posting..." : "Post Request"}
            </button>
          </form>
        )}

        {/* ── NO REQUESTS EMPTY STATE ── */}
        {requests.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No active requests</h3>
            <p>Everyone seems to have what they need!</p>
          </div>
        )}

        {/* ── LIST OF REQUESTS ── */}
        <div className="requests-feed">
          {requests.map(req => (
            <div key={req._id} className={`card request-card ${req.status === 'fulfilled' ? 'fulfilled' : ''}`}>
              
              {/* Card Header showing status and metadata */}
              <div className="req-header">
                <div className="req-badges">
                  {req.status === 'fulfilled' 
                    ? <span className="badge badge-green">✅ Fulfilled</span>
                    : <span className="badge badge-amber">⏳ Open</span>
                  }
                  <span className="badge badge-purple">{req.subject}</span>
                  {req.semester && <span className="badge badge-cyan">Sem {req.semester}</span>}
                </div>
                <span className="req-date">{new Date(req.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Card Body */}
              <h3 className="req-title">{req.title}</h3>
              {req.description && <p className="req-desc">{req.description}</p>}
              <p className="req-author">Requested by: <strong>{req.requestedBy?.name || "Unknown"}</strong></p>

              {/* ── RESPONSES SECTION ── */}
              {req.responses && req.responses.length > 0 && (
                <div className="req-responses">
                  <h4 className="resp-title">Responses ({req.responses.length})</h4>
                  {req.responses.map((resp, idx) => (
                    <div key={idx} className="resp-item">
                      <strong>{resp.respondedBy?.name}:</strong> {resp.message}
                    </div>
                  ))}
                </div>
              )}

              {/* ── ACTION FOOTER ── */}
              {/* Only show Reply button if request is open and user is logged in */}
              {req.status === 'open' && user && respondingTo !== req._id && (
                <div className="req-actions">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setRespondingTo(req._id);
                      setResponseData({ message: "", markFulfilled: false });
                    }}
                  >
                    💬 Reply
                  </button>
                </div>
              )}

              {/* ── REPLY FORM ── */}
              {/* Conditionally rendered inline when 'respondingTo' matches this card's ID */}
              {respondingTo === req._id && (
                <form className="req-reply-form" onSubmit={(e) => handleRespond(e, req._id)}>
                  <div className="form-group">
                    <textarea 
                      required rows={2} className="form-textarea" placeholder="Help them out..."
                      value={responseData.message}
                      onChange={(e) => setResponseData({...responseData, message: e.target.value})}
                    ></textarea>
                  </div>
                  
                  {/* Option for the responder (or OP) to mark the request as solved */}
                  <label className="checkbox-label" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <input 
                      type="checkbox" 
                      checked={responseData.markFulfilled}
                      onChange={(e) => setResponseData({...responseData, markFulfilled: e.target.checked})}
                    />
                    <span className="text-sm">Mark as completely fulfilled</span>
                  </label>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit" className="btn btn-sm btn-primary" disabled={submitting}>
                      {submitting ? "Sending..." : "Send Reply"}
                    </button>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => setRespondingTo(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Requests;

/*
 * ============================================================
 * END-OF-FILE SUMMARY:
 * This file creates the "Requests" bulletin board feature.
 * It manages multiple layers of state (global list, new request form, inline reply forms).
 * It ensures only logged-in users can ask or respond.
 * It beautifully maps over responses, rendering them nested inside their parent request cards.
 * ============================================================
 */
