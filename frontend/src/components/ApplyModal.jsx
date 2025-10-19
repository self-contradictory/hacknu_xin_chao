import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AuthModal from "./AuthModal";
import FileDropzone from "./FileDropzone";
import { apiGetJobDetails, apiApplyWithText, apiGetUserDetails, apiExtractPdfText } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

const JOB_DETAILS_LABELS = {
  title: "Position",
  company: "Company", 
  description: "Description",
  min_salary: "Min Salary",
  max_salary: "Max Salary",
  desired_location: "Location",
  employment_type: "Employment Type",
  work_format: "Work Format"
};


export default function ApplyModal({ isOpen, job, onClose, onSubmitted }) {
  const [jobDetails, setJobDetails] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [cvText, setCvText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [applicationData, setApplicationData] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const { user } = useAuth();

  const canSubmit = !!cvText && !submitting && !extractingPdf;

  const handlePdfUpload = async (file) => {
    if (!file) {
      setPdfFile(null);
      return;
    }

    setPdfFile(file);
    setExtractingPdf(true);
    setError("");

    try {
      const result = await apiExtractPdfText(file);
      if (result.ok && result.extracted_text) {
        setCvText(result.extracted_text);
      } else {
        setError("Failed to extract text from PDF");
      }
    } catch (err) {
      console.error("PDF extraction error:", err);
      setError(err.message || "Failed to process PDF");
    } finally {
      setExtractingPdf(false);
    }
  };

  useEffect(() => {
    if (isOpen && job) {
      setLoading(true);
      
      if (user?.id) {
        apiGetUserDetails(user.id)
          .then(setUserDetails)
          .catch(err => {
            console.error("Failed to fetch user details:", err);
          });
      }
      
      if (job.id && !job.job_id) {
        setJobDetails({
          job_id: parseInt(job.id),
          title: job.title,
          company: job.company,
          description: job.description,
          min_salary: null,
          max_salary: null,
          desired_location: job.location || job.desired_location,
          employment_type: job.type || job.employment_type,
          work_format: job.work_format || null,
          poster_id: null,
          is_active: true,
          desired_skills: job.tags || job.desired_skills || []
        });
        setLoading(false);
      } else if (job.job_id) {
        apiGetJobDetails(job.job_id)
          .then(setJobDetails)
          .catch(err => {
            console.error("Failed to fetch job details:", err);
            setError("Failed to load job details");
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [isOpen, job, user]);

  const handleSubmit = async (e) => {
    e && e.preventDefault && e.preventDefault();
    setError("");
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload = {
        job_id: job?.job_id || job?.id,
        cv: cvText,
        cover_letter: notes,
        user_id: user?.id,
        candidate: {
          name: user?.name || userDetails?.full_name || "",
          email: user?.email || userDetails?.email || "",
          city: userDetails?.location || "",
          experience: 0,
          position: job?.title || "",
          education: "",
          languages: [],
          salary_expectation: 0,
          work_format: "remote",
        },
      };
      
      const result = await apiApplyWithText(payload);
      console.log('Application result:', result);
      setApplicationData(result);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        console.log('Passing to onSubmitted:', result);
        onSubmitted && onSubmitted(result);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.message || "Application failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplicationSuccess = () => {
    setApplicationData(null);
    onSubmitted && onSubmitted();
  };

  const title = job ? `Apply — ${job.title}` : "Apply";


  return (
    <AuthModal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ display: "grid", gap: 20 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
            Loading job details...
          </div>
        ) : jobDetails ? (
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 18 }}>Job Details</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {Object.entries(JOB_DETAILS_LABELS).map(([key, label]) => {
                const value = jobDetails[key];
                if (!value) return null;
                return (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "var(--muted)", fontWeight: 500 }}>{label}:</span>
                    <span style={{ textAlign: "right", maxWidth: "60%" }}>
                      {key === "description" ? (
                        <div style={{ whiteSpace: "pre-wrap", textAlign: "left" }}>{value}</div>
                      ) : (
                        value
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label>Upload CV (PDF)</label>
            <FileDropzone
              file={pdfFile}
              onFile={handlePdfUpload}
              accept="application/pdf,.pdf"
              maxSizeMB={8}
              label="Upload CV"
            />
            {extractingPdf && (
              <div style={{ color: "#8b5cf6", fontSize: 12, marginTop: 6 }}>
                Extracting text from PDF...
              </div>
            )}
          </div>

          {cvText && (
            <div className="field">
              <label>CV Status</label>
              <div style={{ 
                padding: "12px", 
                backgroundColor: "#0b0c1a", 
                border: "1px solid #2a2b4a", 
                borderRadius: "8px",
                fontSize: "13px",
                color: "var(--muted)"
              }}>
                {pdfFile ? (
                  <div>
                    <div style={{ color: "#34d399", marginBottom: "4px" }}>
                      ✓ PDF processed: {pdfFile.name}
                    </div>
                    <div>
                      Text extracted ({cvText.length} characters)
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "#f87171" }}>
                    ⚠ No CV uploaded
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="field">
            <label htmlFor="notes">Cover Letter (optional)</label>
            <textarea 
              id="notes"
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Add your cover letter or additional notes..."
              rows={4}
              style={{ resize: "vertical", minHeight: "80px" }}
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              style={{ color: "#f87171", fontSize: 13 }}
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              style={{ color: "#34d399", fontSize: 13 }}
            >
              Application sent successfully!
            </motion.div>
          )}

          <div className="hr" />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button 
              type="button" 
              className="btn" 
              onClick={onClose} 
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn primary" 
              disabled={!canSubmit}
            >
              {submitting ? "Submitting…" : 
               !cvText ? "Upload CV to continue" : 
               "Submit application"}
            </button>
          </div>
        </form>
      </div>
    </AuthModal>
  );
}
