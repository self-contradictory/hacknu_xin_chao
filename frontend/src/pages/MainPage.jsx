import React, { useMemo, useState, useCallback, useEffect } from "react";
import JobSearchBar from "../components/JobSearchBar";
import JobResults from "../components/JobResults";
import ApplyModal from "../components/ApplyModal";
import ApplicationsModal from "../components/ApplicationsModal";
import ChatWidget from "../components/ChatWidget";
import SignUpModal from "../components/SignUpModal";
import JobForm from "../components/JobForm";
import { useAuth } from "../hooks/useAuth";
import { apiGetAllJobs, apiGetJobsByRecruiter, apiCreateJob } from "../lib/api";

export default function MainPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ location: "", level: "", type: "" });
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicationsJob, setApplicationsJob] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobFormOpen, setJobFormOpen] = useState(false);
  
  const { user, loading: authLoading, login, signUp, logout, isAuthenticated } = useAuth();
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [signUpModalOpen, setSignUpModalOpen] = useState(false);
  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setJobsLoading(true);
      try {
        if (!user) {
          const allJobs = await apiGetAllJobs();
          setJobs(allJobs);
        } else if (user.role === 'recruiter') {
          const recruiterJobs = await apiGetJobsByRecruiter(user.id);
          setJobs(recruiterJobs);
        } else {
          const allJobs = await apiGetAllJobs();
          setJobs(allJobs);
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
        setJobs([]);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, [user]);

  const results = useMemo(() => {
    const list = Array.isArray(jobs) ? jobs : [];
    const q = query.trim().toLowerCase();

    return list.filter((j) => {
      const matchesQ =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        (j.desired_location && j.desired_location.toLowerCase().includes(q)) ||
        (Array.isArray(j.desired_skills) && j.desired_skills.some((t) => t.toLowerCase().includes(q)));

      const byLocation = !filters.location || (j.desired_location && j.desired_location === filters.location);
      const byLevel = !filters.level || (j.level && j.level === filters.level);
      const byType = !filters.type || (j.employment_type && j.employment_type === filters.type);

      return matchesQ && byLocation && byLevel && byType;
    });
  }, [query, filters, jobs]);

  const handleApply = useCallback((job) => setSelectedJob(job), []);
  const closeApply = useCallback(() => setSelectedJob(null), []);
  
  const handleApplicationSubmitted = useCallback((applicationData) => {
    console.log('Application submitted with data:', applicationData);
    setSelectedJob(null);
    if (applicationData) {
      const context = {
        userId: user?.id,
        applicationId: applicationData.application_id,
        type: "answer_questions",
        jobDescription: applicationData.job_description,
        userInfo: applicationData.user_info,
        websocketUrl: applicationData.websocket_url
      };
      console.log('Setting chat context:', context);
      setChatContext(context);
      setChatOpen(true);
    }
  }, [user]);
  
  const handleViewApplications = useCallback((job) => setApplicationsJob(job), []);
  const closeApplications = useCallback(() => setApplicationsJob(null), []);
  
  const handleSignInClick = useCallback(() => {
    setSignInModalOpen(true);
    setSignInError(null);
  }, []);
  
  const handleSignInSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSignInLoading(true);
    setSignInError(null);
    
    try {
      await login(signInForm.email, signInForm.password);
      setSignInModalOpen(false);
      setSignInForm({ email: "", password: "" });
    } catch (error) {
      console.error("Login error:", error);
      setSignInError(error.message || "Login failed. Please check your credentials.");
    } finally {
      setSignInLoading(false);
    }
  }, [signInForm.email, signInForm.password, login]);
  
  const handleSignOut = useCallback(() => {
    logout();
  }, [logout]);
  
  const handleSignInFormChange = useCallback((field, value) => {
    setSignInForm(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const closeSignInModal = useCallback(() => {
    setSignInModalOpen(false);
    setSignInForm({ email: "", password: "" });
    setSignInError(null);
  }, []);
  
  const handleSignUpClick = useCallback(() => {
    setSignUpModalOpen(true);
  }, []);
  
  const handleSignUpSuccess = useCallback((userData) => {
    signUp(userData);
    setSignUpModalOpen(false);
  }, [signUp]);
  
  const closeSignUpModal = useCallback(() => {
    setSignUpModalOpen(false);
  }, []);

  const handleCreateJob = useCallback(async (jobData) => {
    try {
      await apiCreateJob(jobData);
      if (user?.role === 'recruiter') {
        const recruiterJobs = await apiGetJobsByRecruiter(user.id);
        setJobs(recruiterJobs);
      }
    } catch (error) {
      throw error;
    }
  }, [user]);

  const handleAddJobClick = useCallback(() => {
    setJobFormOpen(true);
  }, []);

  const closeJobForm = useCallback(() => {
    setJobFormOpen(false);
  }, []);

  if (authLoading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        padding: "28px 20px", 
        maxWidth: 1100, 
        margin: "0 auto" 
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "18px", color: "#8b5cf6" }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "28px 20px", maxWidth: 1100, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24 }}>
          {user?.role === 'recruiter' ? 'Manage Jobs' : 'Explore Jobs'}
        </h1>
        
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {user.role === 'recruiter' && (
                <button 
                  onClick={handleAddJobClick}
                  className="btn primary"
                  style={{ 
                    padding: "8px 16px", 
                    fontSize: 14,
                    borderRadius: 6
                  }}
                >
                  Add New Job
                </button>
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ fontSize: 16, fontWeight: 500 }}>{user.name}</span>
                <span style={{ fontSize: 12, color: "#8b5cf6", textTransform: "capitalize" }}>
                  {user.role}
                </span>
              </div>
              <button 
                onClick={handleSignOut}
                className="btn"
                style={{ 
                  padding: "6px 12px", 
                  fontSize: 14,
                  background: "transparent",
                  border: "1px solid #ddd",
                  borderRadius: 6
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={handleSignInClick}
                className="btn"
                style={{ 
                  padding: "8px 16px", 
                  fontSize: 14,
                  borderRadius: 6,
                  background: "transparent",
                  border: "1px solid #ddd"
                }}
              >
                Sign In
              </button>
              <button 
                onClick={handleSignUpClick}
                className="btn primary"
                style={{ 
                  padding: "8px 16px", 
                  fontSize: 14,
                  borderRadius: 6
                }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      <JobSearchBar
        value={query}
        onChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <JobResults 
        items={results} 
        onApply={handleApply} 
        onViewApplications={handleViewApplications}
        isAuthenticated={isAuthenticated} 
        userRole={user?.role}
      />

      <ApplyModal
        isOpen={!!selectedJob}
        job={selectedJob}
        onClose={closeApply}
        onSubmitted={handleApplicationSubmitted}
      />
      
      <ApplicationsModal
        isOpen={!!applicationsJob}
        job={applicationsJob}
        onClose={closeApplications}
      />
      <button
        className="btn primary"
        onClick={() => {
          setChatContext(null);
          setChatOpen(true);
        }}
        style={{
          position: "fixed", right: 20, bottom: 20, zIndex: 60,
          boxShadow: "0 10px 30px rgba(0,0,0,.35)"
        }}
      >
        Chat with SmartBot
      </button>

      <ChatWidget 
        open={chatOpen} 
        onClose={() => {
          setChatOpen(false);
          setChatContext(null);
        }} 
        context={chatContext}
      />
      
      {signInModalOpen && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(7, 7, 12, 0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}
          onClick={closeSignInModal}
        >
          <div 
            style={{
              backgroundColor: "#0e0f20",
              border: "1px solid #2a2b4a",
              padding: "32px",
              borderRadius: "18px",
              boxShadow: "0 20px 60px rgba(0,0,0,.45)",
              width: "100%",
              maxWidth: "400px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ 
              margin: "0 0 24px 0", 
              fontSize: "24px", 
              fontWeight: "700",
              color: "#e5e7eb"
            }}>
              Sign In
            </h2>
            
            {signInError && (
              <div style={{
                backgroundColor: "#7f1d1d",
                border: "1px solid #dc2626",
                color: "#fca5a5",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px"
              }}>
                {signInError}
              </div>
            )}
            
            <form onSubmit={handleSignInSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label 
                  htmlFor="email"
                  style={{ 
                    display: "block", 
                    marginBottom: "6px", 
                    fontSize: "12px", 
                    fontWeight: "500",
                    color: "#a1a1aa"
                  }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={signInForm.email}
                  onChange={(e) => handleSignInFormChange("email", e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1px solid #2a2b4a",
                    borderRadius: "12px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                    background: "#0b0c1a",
                    color: "#e5e7eb"
                  }}
                  placeholder="Enter your email"
                />
              </div>
              
              <div style={{ marginBottom: "24px" }}>
                <label 
                  htmlFor="password"
                  style={{ 
                    display: "block", 
                    marginBottom: "6px", 
                    fontSize: "12px", 
                    fontWeight: "500",
                    color: "#a1a1aa"
                  }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={signInForm.password}
                  onChange={(e) => handleSignInFormChange("password", e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1px solid #2a2b4a",
                    borderRadius: "12px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                    background: "#0b0c1a",
                    color: "#e5e7eb"
                  }}
                  placeholder="Enter your password"
                />
              </div>
              
              <button
                type="submit"
                disabled={signInLoading}
                className="btn primary"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "16px",
                  borderRadius: "12px",
                  marginBottom: "16px",
                  opacity: signInLoading ? 0.7 : 1,
                  cursor: signInLoading ? "not-allowed" : "pointer"
                }}
              >
                {signInLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>
            
            <div style={{ textAlign: "center" }}>
              <span style={{ color: "#a1a1aa", fontSize: "14px" }}>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setSignInModalOpen(false);
                    setSignUpModalOpen(true);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#8b5cf6",
                    fontSize: "14px",
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Sign up
                </button>
              </span>
            </div>
          </div>
        </div>
      )}
      
      <SignUpModal
        isOpen={signUpModalOpen}
        onClose={closeSignUpModal}
        onSuccess={handleSignUpSuccess}
      />

      <JobForm
        isOpen={jobFormOpen}
        onClose={closeJobForm}
        onSubmit={handleCreateJob}
        recruiterId={user?.id}
      />
    </div>
  );
}
