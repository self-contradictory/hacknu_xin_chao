import React, { useState } from 'react';

const EMPLOYMENT_TYPES = [
  { label: 'Full-time', value: 'full_time' },
  { label: 'Part-time', value: 'part_time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Internship', value: 'internship' },
  { label: 'Temporary', value: 'temporary' }
];

const WORK_FORMATS = [
  { label: 'Remote', value: 'remote' },
  { label: 'On-site', value: 'onsite' },
  { label: 'Hybrid', value: 'hybrid' }
];

export default function JobForm({ isOpen, onClose, onSubmit, recruiterId }) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    min_salary: '',
    max_salary: '',
    desired_location: '',
    desired_skills: '',
    employment_type: '',
    work_format: '',
    is_active: true
  });
  const [skillTags, setSkillTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillInput = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const skill = e.target.value.trim();
      if (skill && !skillTags.includes(skill)) {
        setSkillTags(prev => [...prev, skill]);
        setFormData(prev => ({ ...prev, desired_skills: '' }));
      }
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkillTags(prev => prev.filter(skill => skill !== skillToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const jobData = {
        ...formData,
        poster_id: recruiterId,
        min_salary: formData.min_salary ? parseFloat(formData.min_salary) : null,
        max_salary: formData.max_salary ? parseFloat(formData.max_salary) : null,
        desired_skills: skillTags
      };

      await onSubmit(jobData);
      setFormData({
        title: '',
        company: '',
        description: '',
        min_salary: '',
        max_salary: '',
        desired_location: '',
        desired_skills: '',
        employment_type: '',
        work_format: '',
        is_active: true
      });
      setSkillTags([]);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
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
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: "#0e0f20",
          border: "1px solid #2a2b4a",
          padding: "32px",
          borderRadius: "18px",
          boxShadow: "0 20px 60px rgba(0,0,0,.45)",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ 
          margin: "0 0 24px 0", 
          fontSize: "24px", 
          fontWeight: "700",
          color: "#e5e7eb"
        }}>
          Add New Job
        </h2>
        
        {error && (
          <div style={{
            backgroundColor: "#7f1d1d",
            border: "1px solid #dc2626",
            color: "#fca5a5",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label 
                  style={{ 
                    display: "block", 
                    marginBottom: "6px", 
                    fontSize: "12px", 
                    fontWeight: "500",
                    color: "#a1a1aa"
                  }}
                >
                  Job Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
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
                  placeholder="e.g. Senior React Developer"
                />
              </div>
              
              <div>
                <label 
                  style={{ 
                    display: "block", 
                    marginBottom: "6px", 
                    fontSize: "12px", 
                    fontWeight: "500",
                    color: "#a1a1aa"
                  }}
                >
                  Company *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleChange("company", e.target.value)}
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
                  placeholder="e.g. Tech Corp"
                />
              </div>
            </div>

            <div>
              <label 
                style={{ 
                  display: "block", 
                  marginBottom: "6px", 
                  fontSize: "12px", 
                  fontWeight: "500",
                  color: "#a1a1aa"
                }}
              >
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #2a2b4a",
                  borderRadius: "12px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  background: "#0b0c1a",
                  color: "#e5e7eb",
                  resize: "vertical"
                }}
                placeholder="Describe the role, responsibilities, and requirements..."
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div>
                <label 
                  style={{ 
                    display: "block", 
                    marginBottom: "6px", 
                    fontSize: "12px", 
                    fontWeight: "500",
                    color: "#a1a1aa"
                  }}
                >
                  Min Salary
                </label>
                <input
                  type="number"
                  value={formData.min_salary}
                  onChange={(e) => handleChange("min_salary", e.target.value)}
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
                  placeholder="e.g. 50000"
                />
              </div>
              
              <div>
                <label 
                  style={{ 
                    display: "block", 
                    marginBottom: "6px", 
                    fontSize: "12px", 
                    fontWeight: "500",
                    color: "#a1a1aa"
                  }}
                >
                  Max Salary
                </label>
                <input
                  type="number"
                  value={formData.max_salary}
                  onChange={(e) => handleChange("max_salary", e.target.value)}
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
                  placeholder="e.g. 80000"
                />
              </div>

              <div>
                <label 
                  style={{ 
                    display: "block", 
                    marginBottom: "6px", 
                    fontSize: "12px", 
                    fontWeight: "500",
                    color: "#a1a1aa"
                  }}
                >
                  Location
                </label>
                <input
                  type="text"
                  value={formData.desired_location}
                  onChange={(e) => handleChange("desired_location", e.target.value)}
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
                  placeholder="e.g. Remote, New York"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label 
                  style={{ 
                    display: "block", 
                    marginBottom: "6px", 
                    fontSize: "12px", 
                    fontWeight: "500",
                    color: "#a1a1aa"
                  }}
                >
                  Employment Type
                </label>
                <select
                  value={formData.employment_type}
                  onChange={(e) => handleChange("employment_type", e.target.value)}
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
                >
                  <option value="">Select type</option>
                  {EMPLOYMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label 
                  style={{ 
                    display: "block", 
                    marginBottom: "6px", 
                    fontSize: "12px", 
                    fontWeight: "500",
                    color: "#a1a1aa"
                  }}
                >
                  Work Format
                </label>
                <select
                  value={formData.work_format}
                  onChange={(e) => handleChange("work_format", e.target.value)}
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
                >
                  <option value="">Select format</option>
                  {WORK_FORMATS.map(format => (
                    <option key={format.value} value={format.value}>{format.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label 
                style={{ 
                  display: "block", 
                  marginBottom: "6px", 
                  fontSize: "12px", 
                  fontWeight: "500",
                  color: "#a1a1aa"
                }}
              >
                Required Skills
              </label>
              
              {skillTags.length > 0 && (
                <div style={{ 
                  display: "flex", 
                  gap: 8, 
                  flexWrap: "wrap", 
                  marginBottom: 8 
                }}>
                  {skillTags.map((skill, index) => (
                    <span 
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        backgroundColor: "#8b5cf6",
                        color: "white",
                        borderRadius: "16px",
                        fontSize: "14px",
                        fontWeight: 500
                      }}
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "white",
                          cursor: "pointer",
                          fontSize: "16px",
                          lineHeight: 1,
                          padding: 0,
                          marginLeft: 4
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <input
                type="text"
                value={formData.desired_skills}
                onChange={(e) => handleChange("desired_skills", e.target.value)}
                onKeyDown={handleSkillInput}
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
                placeholder="Type a skill and press Enter or comma to add"
              />
              <div style={{ 
                fontSize: "12px", 
                color: "#a1a1aa", 
                marginTop: "4px" 
              }}>
                Press Enter or comma to add skills as tags
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              style={{
                flex: 1,
                padding: "12px 16px",
                fontSize: "16px",
                borderRadius: "12px",
                background: "transparent",
                border: "1px solid #2a2b4a"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn primary"
              style={{
                flex: 1,
                padding: "12px 16px",
                fontSize: "16px",
                borderRadius: "12px",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Creating..." : "Create Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
