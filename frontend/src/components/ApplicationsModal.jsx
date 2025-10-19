import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiGetApplicationsByJob, apiGetApplicationsByJobFiltered, apiGetUserDetails, apiGetApplicationDetails, apiGetApplicationScoring, apiScoreApplication } from "../lib/api";
import ScoringBreakdown from "./ScoringBreakdown";

const STATUS_COLORS = {
  submitted: "#8b5cf6",
  viewed: "#06b6d4",
  shortlisted: "#10b981",
  rejected: "#ef4444",
  offered: "#f59e0b",
  hired: "#059669"
};

const STATUS_LABELS = {
  submitted: "Submitted",
  viewed: "Viewed", 
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  offered: "Offered",
  hired: "Hired"
};

export default function ApplicationsModal({ isOpen, job, onClose }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [applicantDetails, setApplicantDetails] = useState({});
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [applicationDetails, setApplicationDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [scoringData, setScoringData] = useState(null);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  const [filters, setFilters] = useState({
    minScore: '',
    maxScore: '',
    recommendedOnly: false
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (isOpen && job?.job_id) {
      fetchApplications();
    }
  }, [isOpen, job?.job_id]);

  const fetchApplications = async (useFilters = false) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching applications for job:', job.job_id);
      
      let apps;
      if (useFilters && (filters.minScore || filters.maxScore || filters.recommendedOnly)) {
        const filterParams = {};
        if (filters.minScore) filterParams.minScore = parseFloat(filters.minScore);
        if (filters.maxScore) filterParams.maxScore = parseFloat(filters.maxScore);
        if (filters.recommendedOnly) filterParams.recommendedOnly = true;
        
        console.log('Using filters:', filterParams);
        apps = await apiGetApplicationsByJobFiltered(job.job_id, filterParams);
      } else {
        apps = await apiGetApplicationsByJob(job.job_id);
      }
      
      console.log('Received applications:', apps);
      setApplications(apps);
      
      const details = {};
      for (const app of apps) {
        try {
          const userDetails = await apiGetUserDetails(app.user_id);
          details[app.user_id] = userDetails;
        } catch (err) {
          console.error(`Failed to fetch details for user ${app.user_id}:`, err);
        }
      }
      setApplicantDetails(details);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationDetails = async (applicationId) => {
    setDetailsLoading(true);
    try {
      const details = await apiGetApplicationDetails(applicationId);
      console.log('Application details received:', details);
      console.log('Chat history:', details.chat_history);
      setApplicationDetails(details);
    } catch (err) {
      console.error('Failed to fetch application details:', err);
      setError('Failed to load application details. Please try again.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchScoringData = async (applicationId) => {
    setScoringLoading(true);
    try {
      const scoring = await apiGetApplicationScoring(applicationId);
      console.log('Scoring data received:', scoring);
      setScoringData(scoring.scoring);
    } catch (err) {
      console.error('Failed to fetch scoring data:', err);
      setError('Failed to load scoring data. Please try again.');
    } finally {
      setScoringLoading(false);
    }
  };

  const triggerScoring = async (applicationId) => {
    setScoringLoading(true);
    try {
      const result = await apiScoreApplication(applicationId);
      console.log('Scoring triggered:', result);
      await fetchScoringData(applicationId);
    } catch (err) {
      console.error('Failed to trigger scoring:', err);
      setError('Failed to score application. Please try again.');
    } finally {
      setScoringLoading(false);
    }
  };

  const handleApplicationClick = (application) => {
    setSelectedApplication(application);
    setActiveTab('details');
    fetchApplicationDetails(application.application_id);
    fetchScoringData(application.application_id);
  };

  const handleBackToList = () => {
    setSelectedApplication(null);
    setApplicationDetails(null);
    setScoringData(null);
    setActiveTab('details');
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    fetchApplications(true);
  };

  const clearFilters = () => {
    setFilters({
      minScore: '',
      maxScore: '',
      recommendedOnly: false
    });
    fetchApplications(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const color = STATUS_COLORS[status] || "#a1a1aa";
    const label = STATUS_LABELS[status] || status;
    
    return (
      <span 
        style={{
          padding: "4px 8px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "500",
          backgroundColor: `${color}20`,
          color: color,
          border: `1px solid ${color}40`
        }}
      >
        {label}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(7, 7, 12, 0.6)",
          backdropFilter: "blur(6px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          style={{
            backgroundColor: "#0e0f20",
            border: "1px solid #2a2b4a",
            borderRadius: "18px",
            width: "100%",
            maxWidth: "800px",
            maxHeight: "90vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 60px rgba(0,0,0,.45)"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            padding: "20px 24px",
            borderBottom: "1px solid #26274a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#e5e7eb" }}>
                Applications for "{job?.title}"
              </h2>
              <p style={{ margin: "4px 0 0 0", color: "#a1a1aa", fontSize: "14px" }}>
                {job?.company} • {applications.length} application{applications.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  background: showFilters ? "#4f46e5" : "transparent",
                  border: "1px solid #2a2b4a",
                  color: showFilters ? "#e5e7eb" : "#a1a1aa",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                onMouseEnter={(e) => {
                  if (!showFilters) {
                    e.target.style.borderColor = "#4f46e5";
                    e.target.style.color = "#e5e7eb";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showFilters) {
                    e.target.style.borderColor = "#2a2b4a";
                    e.target.style.color = "#a1a1aa";
                  }
                }}
              >
                🔍 Filter by Score
              </button>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#a1a1aa",
                padding: "8px",
                borderRadius: "10px"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#17182e";
                e.target.style.color = "#e5e7eb";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#a1a1aa";
              }}
            >
              ×
            </button>
            </div>
          </div>

          {showFilters && (
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #26274a",
              backgroundColor: "#0b0c1a"
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600", color: "#e5e7eb" }}>
                  🔍 Filter Applications by Score
                </h3>
                
                <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "12px", color: "#a1a1aa", fontWeight: "500" }}>
                      Minimum Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={filters.minScore}
                      onChange={(e) => handleFilterChange('minScore', e.target.value)}
                      placeholder="0"
                      style={{
                        background: "#17182e",
                        border: "1px solid #2a2b4a",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        color: "#e5e7eb",
                        fontSize: "14px",
                        width: "120px"
                      }}
                    />
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "12px", color: "#a1a1aa", fontWeight: "500" }}>
                      Maximum Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={filters.maxScore}
                      onChange={(e) => handleFilterChange('maxScore', e.target.value)}
                      placeholder="100"
                      style={{
                        background: "#17182e",
                        border: "1px solid #2a2b4a",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        color: "#e5e7eb",
                        fontSize: "14px",
                        width: "120px"
                      }}
                    />
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      id="recommendedOnly"
                      checked={filters.recommendedOnly}
                      onChange={(e) => handleFilterChange('recommendedOnly', e.target.checked)}
                      style={{
                        width: "16px",
                        height: "16px",
                        accentColor: "#4f46e5"
                      }}
                    />
                    <label htmlFor="recommendedOnly" style={{ fontSize: "14px", color: "#e5e7eb", cursor: "pointer" }}>
                      ⭐ Recommended Only (Score ≥ 80)
                    </label>
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={applyFilters}
                    style={{
                      background: "#4f46e5",
                      border: "none",
                      color: "#e5e7eb",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    🔍 Apply Filters
                  </button>
                  <button
                    onClick={clearFilters}
                    style={{
                      background: "transparent",
                      border: "1px solid #2a2b4a",
                      color: "#a1a1aa",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = "#4f46e5";
                      e.target.style.color = "#e5e7eb";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = "#2a2b4a";
                      e.target.style.color = "#a1a1aa";
                    }}
                  >
                    🗑️ Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
            {selectedApplication ? (
              <ApplicationDetailsView 
                application={selectedApplication}
                applicationDetails={applicationDetails}
                detailsLoading={detailsLoading}
                scoringData={scoringData}
                scoringLoading={scoringLoading}
                applicant={applicantDetails[selectedApplication.user_id]}
                onBack={handleBackToList}
                formatDate={formatDate}
                getStatusBadge={getStatusBadge}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                triggerScoring={triggerScoring}
              />
            ) : (
              <ApplicationsListView 
                applications={applications}
                applicantDetails={applicantDetails}
                loading={loading}
                error={error}
                onApplicationClick={handleApplicationClick}
                onRetry={fetchApplications}
                formatDate={formatDate}
                getStatusBadge={getStatusBadge}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ApplicationsListView({ 
  applications, 
  applicantDetails, 
  loading, 
  error, 
  onApplicationClick, 
  onRetry, 
  formatDate, 
  getStatusBadge 
}) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ fontSize: "16px", color: "#a1a1aa" }}>
          Loading applications...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ fontSize: "16px", color: "#ef4444", marginBottom: "16px" }}>
          {error}
        </div>
        <button 
          onClick={onRetry}
          className="btn primary"
          style={{ padding: "8px 16px" }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ fontSize: "16px", color: "#a1a1aa" }}>
          No applications yet for this job.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {applications.map((application, index) => {
        const applicant = applicantDetails[application.user_id];
        
        return (
          <motion.div
            key={application.application_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{
              border: "1px solid #2a2b4a",
              borderRadius: "12px",
              padding: "20px",
              backgroundColor: "linear-gradient(180deg, #141427cc, #0d0d1acc)",
              backdropFilter: "blur(10px)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onClick={() => onApplicationClick(application)}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "#4f46e5";
              e.target.style.backgroundColor = "linear-gradient(180deg, #1a1b3acc, #141527cc)";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "#2a2b4a";
              e.target.style.backgroundColor = "linear-gradient(180deg, #141427cc, #0d0d1acc)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600", color: "#e5e7eb" }}>
                  {applicant?.full_name || "Unknown Applicant"}
                </h3>
                <p style={{ margin: "0 0 8px 0", color: "#a1a1aa", fontSize: "14px" }}>
                  {applicant?.email || "No email provided"}
                </p>
                <p style={{ margin: "0", color: "#a1a1aa", fontSize: "12px" }}>
                  Applied on {formatDate(application.created_at)}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {getStatusBadge(application.application_status)}
                {application.score && (
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "500",
                    backgroundColor: application.score >= 80 ? "#10b981" : application.score >= 70 ? "#f59e0b" : "#ef4444",
                    color: "#ffffff",
                    border: `1px solid ${application.score >= 80 ? "#059669" : application.score >= 70 ? "#d97706" : "#dc2626"}`
                  }}>
                    {application.score >= 80 ? "⭐ " : ""}Score: {application.score.toFixed(0)}
                  </span>
                )}
                {application.score && application.score >= 80 && (
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "500",
                    backgroundColor: "#4f46e5",
                    color: "#ffffff",
                    border: "1px solid #3730a3"
                  }}>
                    🎯 Recommended
                  </span>
                )}
              </div>
            </div>

            {application.cover_letter && (
              <div style={{ marginBottom: "12px" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "500", color: "#e5e7eb" }}>
                  Cover Letter:
                </h4>
                <p style={{ 
                  margin: "0", 
                  fontSize: "14px", 
                  color: "#a1a1aa",
                  lineHeight: "1.5",
                  maxHeight: "100px",
                  overflow: "auto",
                  backgroundColor: "#0b0c1a",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #2a2b4a"
                }}>
                  {application.cover_letter}
                </p>
              </div>
            )}

            {application.cv && (
              <div>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "500", color: "#e5e7eb" }}>
                  CV:
                </h4>
                <p style={{ 
                  margin: "0", 
                  fontSize: "14px", 
                  color: "#a1a1aa",
                  lineHeight: "1.5",
                  maxHeight: "100px",
                  overflow: "auto",
                  backgroundColor: "#0b0c1a",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #2a2b4a"
                }}>
                  {application.cv}
                </p>
              </div>
            )}

            <div style={{ 
              marginTop: "12px", 
              padding: "8px 12px", 
              backgroundColor: "#1a1b3a", 
              borderRadius: "6px", 
              fontSize: "12px", 
              color: "#a1a1aa",
              textAlign: "center"
            }}>
              Click to view chat history and discrepancies
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function ApplicationDetailsView({ 
  application, 
  applicationDetails, 
  detailsLoading, 
  scoringData,
  scoringLoading,
  applicant, 
  onBack, 
  formatDate, 
  getStatusBadge,
  activeTab,
  setActiveTab,
  triggerScoring
}) {
  if (detailsLoading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ fontSize: "16px", color: "#a1a1aa" }}>
          Loading application details...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: "1px solid #2a2b4a",
          color: "#a1a1aa",
          padding: "8px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          alignSelf: "flex-start"
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = "#4f46e5";
          e.target.style.color = "#e5e7eb";
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = "#2a2b4a";
          e.target.style.color = "#a1a1aa";
        }}
      >
        ← Back to Applications
      </button>

      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "20px",
        borderBottom: "1px solid #2a2b4a"
      }}>
        <button
          onClick={() => setActiveTab('details')}
          style={{
            background: activeTab === 'details' ? "#4f46e5" : "transparent",
            border: "none",
            color: activeTab === 'details' ? "#e5e7eb" : "#a1a1aa",
            padding: "8px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          📄 Application Details
        </button>
        <button
          onClick={() => setActiveTab('scoring')}
          style={{
            background: activeTab === 'scoring' ? "#4f46e5" : "transparent",
            border: "none",
            color: activeTab === 'scoring' ? "#e5e7eb" : "#a1a1aa",
            padding: "8px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          📊 Scoring Analysis
        </button>
      </div>

      {activeTab === 'details' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{
            border: "1px solid #2a2b4a",
            borderRadius: "12px",
            padding: "20px",
            backgroundColor: "linear-gradient(180deg, #141427cc, #0d0d1acc)",
            backdropFilter: "blur(10px)"
          }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "600", color: "#e5e7eb" }}>
              {applicant?.full_name || "Unknown Applicant"}
            </h3>
            <p style={{ margin: "0 0 8px 0", color: "#a1a1aa", fontSize: "14px" }}>
              {applicant?.email || "No email provided"}
            </p>
            <p style={{ margin: "0", color: "#a1a1aa", fontSize: "12px" }}>
              Applied on {formatDate(application.created_at)}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {getStatusBadge(application.application_status)}
            {application.score && (
              <span style={{
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "500",
                backgroundColor: application.score >= 80 ? "#10b981" : application.score >= 70 ? "#f59e0b" : "#ef4444",
                color: "#ffffff",
                border: `1px solid ${application.score >= 80 ? "#059669" : application.score >= 70 ? "#d97706" : "#dc2626"}`
              }}>
                {application.score >= 80 ? "⭐ " : ""}Score: {application.score.toFixed(0)}
              </span>
            )}
            {application.score && application.score >= 80 && (
              <span style={{
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "500",
                backgroundColor: "#4f46e5",
                color: "#ffffff",
                border: "1px solid #3730a3"
              }}>
                🎯 Recommended
              </span>
            )}
          </div>
        </div>

        {application.cover_letter && (
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "500", color: "#e5e7eb" }}>
              Cover Letter:
            </h4>
            <p style={{ 
              margin: "0", 
              fontSize: "14px", 
              color: "#a1a1aa",
              lineHeight: "1.5",
              backgroundColor: "#0b0c1a",
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #2a2b4a"
            }}>
              {application.cover_letter}
            </p>
          </div>
        )}

        {application.cv && (
          <div>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "500", color: "#e5e7eb" }}>
              CV:
            </h4>
            <p style={{ 
              margin: "0", 
              fontSize: "14px", 
              color: "#a1a1aa",
              lineHeight: "1.5",
              backgroundColor: "#0b0c1a",
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #2a2b4a"
            }}>
              {application.cv}
            </p>
          </div>
        )}
      </div>

      {applicationDetails?.discrepancies && applicationDetails.discrepancies.length > 0 && (
        <div style={{
          border: "1px solid #ef4444",
          borderRadius: "12px",
          padding: "20px",
          backgroundColor: "linear-gradient(180deg, #2d1b1bcc, #1a0d0dcc)",
          backdropFilter: "blur(10px)"
        }}>
          <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#ef4444" }}>
            ⚠️ Identified Discrepancies
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {applicationDetails.discrepancies.map((discrepancy, index) => (
              <div key={index} style={{
                padding: "8px 12px",
                backgroundColor: "#1a0d0d",
                borderRadius: "6px",
                border: "1px solid #ef4444",
                fontSize: "14px",
                color: "#fca5a5"
              }}>
                {discrepancy}
              </div>
            ))}
          </div>
        </div>
      )}

      {applicationDetails?.chat_history && applicationDetails.chat_history.length > 0 && (
        <div style={{
          border: "1px solid #2a2b4a",
          borderRadius: "12px",
          padding: "20px",
          backgroundColor: "linear-gradient(180deg, #141427cc, #0d0d1acc)",
          backdropFilter: "blur(10px)"
        }}>
          <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600", color: "#e5e7eb" }}>
            💬 Chat History
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflow: "auto" }}>
            {applicationDetails.chat_history.map((message, index) => (
              <div key={index} style={{
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: message.message_type === "user" ? "#1a1b3a" : "#0b0c1a",
                border: `1px solid ${message.message_type === "user" ? "#4f46e5" : "#2a2b4a"}`,
                fontSize: "14px"
              }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  marginBottom: "4px" 
                }}>
                  <span style={{ 
                    fontWeight: "500", 
                    color: message.message_type === "user" ? "#4f46e5" : "#a1a1aa",
                    fontSize: "12px",
                    textTransform: "uppercase"
                  }}>
                    {message.message_type === "user" ? "👤 Candidate" : 
                     message.message_type === "question" ? "❓ AI Question" : 
                     message.message_type === "system" ? "🤖 System" : 
                     message.message_type === "ai" ? "💬 AI" : "💬 Message"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    {formatDate(message.created_at)}
                  </span>
                </div>
                <p style={{ margin: "0", color: "#e5e7eb", lineHeight: "1.5" }}>
                  {message.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

          {(!applicationDetails?.chat_history || applicationDetails.chat_history.length === 0) && 
           (!applicationDetails?.discrepancies || applicationDetails.discrepancies.length === 0) && (
            <div style={{
              border: "1px solid #2a2b4a",
              borderRadius: "12px",
              padding: "20px",
              backgroundColor: "linear-gradient(180deg, #141427cc, #0d0d1acc)",
              backdropFilter: "blur(10px)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "16px", color: "#a1a1aa" }}>
                No chat history or discrepancies found for this application.
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {!scoringData && !scoringLoading && (
            <div style={{
              border: "1px solid #f59e0b",
              borderRadius: "12px",
              padding: "20px",
              backgroundColor: "linear-gradient(180deg, #2d1b1bcc, #1a0d0dcc)",
              backdropFilter: "blur(10px)",
              textAlign: "center"
            }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "600", color: "#f59e0b" }}>
                📊 No Scoring Data Available
              </h3>
              <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#a1a1aa" }}>
                This application hasn't been scored yet. Click the button below to run the scoring analysis.
              </p>
              <button
                onClick={() => triggerScoring(application.application_id)}
                disabled={scoringLoading}
                style={{
                  background: scoringLoading ? "#6b7280" : "#f59e0b",
                  border: "none",
                  color: "#ffffff",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  cursor: scoringLoading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  margin: "0 auto"
                }}
              >
                {scoringLoading ? "⏳ Scoring..." : "🚀 Run Scoring Analysis"}
              </button>
            </div>
          )}
          <ScoringBreakdown scoring={scoringData} loading={scoringLoading} />
        </div>
      )}
    </div>
  );
}
