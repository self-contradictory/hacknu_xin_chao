import React from "react";
import { motion } from "framer-motion";

export default function JobResults({ items = [], onApply, onViewApplications, isAuthenticated = false, userRole = 'candidate' }) {
  if (!items.length) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
        <div>
          {userRole === 'recruiter' 
            ? 'No jobs posted yet. Click "Add New Job" to create your first job posting.' 
            : 'No jobs found. Try adjusting your filters.'
          }
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((job, i) => (
        <JobCard key={job.job_id || job.id} job={job} delay={i * 0.03} onApply={onApply} onViewApplications={onViewApplications} isAuthenticated={isAuthenticated} userRole={userRole} />
      ))}
    </div>
  );
}

function JobCard({ job, delay = 0, onApply, onViewApplications, isAuthenticated = false, userRole = 'candidate' }) {
  const jobTitle = job.title;
  const jobCompany = job.company;
  const jobDescription = job.description;
  const jobLocation = job.desired_location || job.location;
  const jobType = job.employment_type || job.type;
  const jobLevel = job.level;
  const jobSalary = job.min_salary && job.max_salary 
    ? `$${job.min_salary.toLocaleString()}–$${job.max_salary.toLocaleString()}`
    : job.salary;
  const jobSkills = job.desired_skills || job.tags || [];

  return (
    <motion.article
      className="card"
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay }}
      style={{ display: "grid", gap: 6 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>{jobTitle}</h3>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{jobType}</span>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "var(--muted)", fontSize: 14 }}>
        <span>{jobCompany}</span>
        <span>•</span>
        <span>{jobLocation}</span>
        {jobLevel && (
          <>
            <span>•</span>
            <span>{jobLevel}</span>
          </>
        )}
        {jobSalary && (
          <>
            <span>•</span>
            <span>{jobSalary}</span>
          </>
        )}
      </div>

      {jobDescription && (
        <p style={{ margin: 0, color: "var(--muted)" }}>{jobDescription}</p>
      )}

      {jobSkills.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          {jobSkills.map((skill, index) => (
            <span key={index} className="btn" style={{ padding: "6px 10px", fontWeight: 500 }}>
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="actions" style={{ marginTop: 12, justifyContent: "flex-end" }}>
        {userRole === 'recruiter' ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              Posted by you
            </span>
            <button 
              className="btn" 
              onClick={() => onViewApplications?.(job)}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                backgroundColor: "transparent",
                border: "1px solid #d1d5db",
                color: "#374151"
              }}
            >
              View Applications
            </button>
          </div>
        ) : (
          <button 
            className="btn primary" 
            onClick={() => onApply?.(job)}
            disabled={!isAuthenticated}
            style={{
              opacity: !isAuthenticated ? 0.5 : 1,
              cursor: !isAuthenticated ? 'not-allowed' : 'pointer'
            }}
          >
            {!isAuthenticated ? 'Sign in to Apply' : 'Apply'}
          </button>
        )}
      </div>
    </motion.article>
  );
}
