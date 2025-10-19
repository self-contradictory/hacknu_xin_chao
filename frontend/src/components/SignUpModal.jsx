import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiCreateUser } from "../lib/api";

const FORM_FIELDS = {
  FULL_NAME: "full_name",
  EMAIL: "email", 
  PASSWORD: "password",
  CONFIRM_PASSWORD: "confirmPassword",
  LOCATION: "location",
  BIO: "bio",
  USER_ROLE: "user_role"
};

const PLACEHOLDERS = {
  [FORM_FIELDS.FULL_NAME]: "Enter your full name",
  [FORM_FIELDS.EMAIL]: "Enter your email",
  [FORM_FIELDS.PASSWORD]: "Create a password",
  [FORM_FIELDS.CONFIRM_PASSWORD]: "Confirm your password",
  [FORM_FIELDS.LOCATION]: "Enter your location (optional)",
  [FORM_FIELDS.BIO]: "Tell us about yourself (optional)"
};

const LABELS = {
  [FORM_FIELDS.FULL_NAME]: "Full Name",
  [FORM_FIELDS.EMAIL]: "Email",
  [FORM_FIELDS.PASSWORD]: "Password",
  [FORM_FIELDS.CONFIRM_PASSWORD]: "Confirm Password",
  [FORM_FIELDS.LOCATION]: "Location",
  [FORM_FIELDS.BIO]: "Bio",
  [FORM_FIELDS.USER_ROLE]: "I am a"
};

const USER_ROLES = {
  CANDIDATE: "candidate",
  RECRUITER: "recruiter"
};

const ROLE_OPTIONS = [
  { value: USER_ROLES.CANDIDATE, label: "Job Seeker", description: "Looking for job opportunities" },
  { value: USER_ROLES.RECRUITER, label: "Recruiter", description: "Hiring for companies" }
];

export default function SignUpModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    [FORM_FIELDS.FULL_NAME]: "",
    [FORM_FIELDS.EMAIL]: "",
    [FORM_FIELDS.PASSWORD]: "",
    [FORM_FIELDS.CONFIRM_PASSWORD]: "",
    [FORM_FIELDS.LOCATION]: "",
    [FORM_FIELDS.BIO]: "",
    [FORM_FIELDS.USER_ROLE]: USER_ROLES.CANDIDATE
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData[FORM_FIELDS.FULL_NAME].trim()) {
      errors[FORM_FIELDS.FULL_NAME] = "Full name is required";
    }
    
    if (!formData[FORM_FIELDS.EMAIL].trim()) {
      errors[FORM_FIELDS.EMAIL] = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData[FORM_FIELDS.EMAIL])) {
      errors[FORM_FIELDS.EMAIL] = "Please enter a valid email";
    }
    
    if (!formData[FORM_FIELDS.PASSWORD]) {
      errors[FORM_FIELDS.PASSWORD] = "Password is required";
    } else if (formData[FORM_FIELDS.PASSWORD].length < 6) {
      errors[FORM_FIELDS.PASSWORD] = "Password must be at least 6 characters";
    }
    
    if (formData[FORM_FIELDS.PASSWORD] !== formData[FORM_FIELDS.CONFIRM_PASSWORD]) {
      errors[FORM_FIELDS.CONFIRM_PASSWORD] = "Passwords do not match";
    }
    
    if (!formData[FORM_FIELDS.USER_ROLE]) {
      errors[FORM_FIELDS.USER_ROLE] = "Please select your role";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const userData = {
        full_name: formData[FORM_FIELDS.FULL_NAME].trim(),
        email: formData[FORM_FIELDS.EMAIL].trim(),
        password: formData[FORM_FIELDS.PASSWORD],
        location: formData[FORM_FIELDS.LOCATION].trim() || null,
        bio: formData[FORM_FIELDS.BIO].trim() || null,
        user_role: formData[FORM_FIELDS.USER_ROLE]
      };
      
      const response = await apiCreateUser(userData);
      console.log("User created successfully:", response);
      
      setFormData({
        [FORM_FIELDS.FULL_NAME]: "",
        [FORM_FIELDS.EMAIL]: "",
        [FORM_FIELDS.PASSWORD]: "",
        [FORM_FIELDS.CONFIRM_PASSWORD]: "",
        [FORM_FIELDS.LOCATION]: "",
        [FORM_FIELDS.BIO]: "",
        [FORM_FIELDS.USER_ROLE]: USER_ROLES.CANDIDATE
      });
      
      onSuccess?.(response);
      onClose?.();
      
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      [FORM_FIELDS.FULL_NAME]: "",
      [FORM_FIELDS.EMAIL]: "",
      [FORM_FIELDS.PASSWORD]: "",
      [FORM_FIELDS.CONFIRM_PASSWORD]: "",
      [FORM_FIELDS.LOCATION]: "",
      [FORM_FIELDS.BIO]: "",
      [FORM_FIELDS.USER_ROLE]: USER_ROLES.CANDIDATE
    });
    setError(null);
    setValidationErrors({});
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            style={{
              backgroundColor: "#0e0f20",
              border: "1px solid #2a2b4a",
              padding: "32px",
              borderRadius: "18px",
              boxShadow: "0 20px 60px rgba(0,0,0,.45)",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "24px"
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: "24px", 
                fontWeight: "700",
                color: "#e5e7eb"
              }}>
                Create Account
              </h2>
              <button
                onClick={handleClose}
                style={{
                  background: "none",
                  border: "none",
                  color: "#a1a1aa",
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "4px"
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            
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
                <div>
                  <label 
                    htmlFor={FORM_FIELDS.FULL_NAME}
                    style={{ 
                      display: "block", 
                      marginBottom: "6px", 
                      fontSize: "12px", 
                      fontWeight: "500",
                      color: "#a1a1aa"
                    }}
                  >
                    {LABELS[FORM_FIELDS.FULL_NAME]} *
                  </label>
                  <input
                    id={FORM_FIELDS.FULL_NAME}
                    type="text"
                    value={formData[FORM_FIELDS.FULL_NAME]}
                    onChange={(e) => handleInputChange(FORM_FIELDS.FULL_NAME, e.target.value)}
                    placeholder={PLACEHOLDERS[FORM_FIELDS.FULL_NAME]}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: `1px solid ${validationErrors[FORM_FIELDS.FULL_NAME] ? "#dc2626" : "#2a2b4a"}`,
                      borderRadius: "12px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                      background: "#0b0c1a",
                      color: "#e5e7eb"
                    }}
                  />
                  {validationErrors[FORM_FIELDS.FULL_NAME] && (
                    <div style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
                      {validationErrors[FORM_FIELDS.FULL_NAME]}
                    </div>
                  )}
                </div>

                <div>
                  <label 
                    htmlFor={FORM_FIELDS.EMAIL}
                    style={{ 
                      display: "block", 
                      marginBottom: "6px", 
                      fontSize: "12px", 
                      fontWeight: "500",
                      color: "#a1a1aa"
                    }}
                  >
                    {LABELS[FORM_FIELDS.EMAIL]} *
                  </label>
                  <input
                    id={FORM_FIELDS.EMAIL}
                    type="email"
                    value={formData[FORM_FIELDS.EMAIL]}
                    onChange={(e) => handleInputChange(FORM_FIELDS.EMAIL, e.target.value)}
                    placeholder={PLACEHOLDERS[FORM_FIELDS.EMAIL]}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: `1px solid ${validationErrors[FORM_FIELDS.EMAIL] ? "#dc2626" : "#2a2b4a"}`,
                      borderRadius: "12px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                      background: "#0b0c1a",
                      color: "#e5e7eb"
                    }}
                  />
                  {validationErrors[FORM_FIELDS.EMAIL] && (
                    <div style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
                      {validationErrors[FORM_FIELDS.EMAIL]}
                    </div>
                  )}
                </div>

                <div>
                  <label 
                    style={{ 
                      display: "block", 
                      marginBottom: "12px", 
                      fontSize: "12px", 
                      fontWeight: "500",
                      color: "#a1a1aa"
                    }}
                  >
                    {LABELS[FORM_FIELDS.USER_ROLE]} *
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {ROLE_OPTIONS.map((option) => (
                      <div key={option.value}>
                        <input
                          type="radio"
                          id={`role-${option.value}`}
                          name={FORM_FIELDS.USER_ROLE}
                          value={option.value}
                          checked={formData[FORM_FIELDS.USER_ROLE] === option.value}
                          onChange={(e) => handleInputChange(FORM_FIELDS.USER_ROLE, e.target.value)}
                          style={{ display: "none" }}
                        />
                        <label
                          htmlFor={`role-${option.value}`}
                          style={{
                            display: "block",
                            padding: "16px",
                            border: `2px solid ${
                              formData[FORM_FIELDS.USER_ROLE] === option.value 
                                ? "#8b5cf6" 
                                : validationErrors[FORM_FIELDS.USER_ROLE] 
                                  ? "#dc2626" 
                                  : "#2a2b4a"
                            }`,
                            borderRadius: "12px",
                            cursor: "pointer",
                            backgroundColor: formData[FORM_FIELDS.USER_ROLE] === option.value ? "#1e1b4b" : "#0b0c1a",
                            transition: "all 0.2s ease",
                            textAlign: "center"
                          }}
                        >
                          <div style={{ 
                            fontSize: "16px", 
                            fontWeight: "600", 
                            color: "#e5e7eb",
                            marginBottom: "4px"
                          }}>
                            {option.label}
                          </div>
                          <div style={{ 
                            fontSize: "12px", 
                            color: "#a1a1aa"
                          }}>
                            {option.description}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                  {validationErrors[FORM_FIELDS.USER_ROLE] && (
                    <div style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
                      {validationErrors[FORM_FIELDS.USER_ROLE]}
                    </div>
                  )}
                </div>

                <div>
                  <label 
                    htmlFor={FORM_FIELDS.PASSWORD}
                    style={{ 
                      display: "block", 
                      marginBottom: "6px", 
                      fontSize: "12px", 
                      fontWeight: "500",
                      color: "#a1a1aa"
                    }}
                  >
                    {LABELS[FORM_FIELDS.PASSWORD]} *
                  </label>
                  <input
                    id={FORM_FIELDS.PASSWORD}
                    type="password"
                    value={formData[FORM_FIELDS.PASSWORD]}
                    onChange={(e) => handleInputChange(FORM_FIELDS.PASSWORD, e.target.value)}
                    placeholder={PLACEHOLDERS[FORM_FIELDS.PASSWORD]}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: `1px solid ${validationErrors[FORM_FIELDS.PASSWORD] ? "#dc2626" : "#2a2b4a"}`,
                      borderRadius: "12px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                      background: "#0b0c1a",
                      color: "#e5e7eb"
                    }}
                  />
                  {validationErrors[FORM_FIELDS.PASSWORD] && (
                    <div style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
                      {validationErrors[FORM_FIELDS.PASSWORD]}
                    </div>
                  )}
                </div>

                <div>
                  <label 
                    htmlFor={FORM_FIELDS.CONFIRM_PASSWORD}
                    style={{ 
                      display: "block", 
                      marginBottom: "6px", 
                      fontSize: "12px", 
                      fontWeight: "500",
                      color: "#a1a1aa"
                    }}
                  >
                    {LABELS[FORM_FIELDS.CONFIRM_PASSWORD]} *
                  </label>
                  <input
                    id={FORM_FIELDS.CONFIRM_PASSWORD}
                    type="password"
                    value={formData[FORM_FIELDS.CONFIRM_PASSWORD]}
                    onChange={(e) => handleInputChange(FORM_FIELDS.CONFIRM_PASSWORD, e.target.value)}
                    placeholder={PLACEHOLDERS[FORM_FIELDS.CONFIRM_PASSWORD]}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: `1px solid ${validationErrors[FORM_FIELDS.CONFIRM_PASSWORD] ? "#dc2626" : "#2a2b4a"}`,
                      borderRadius: "12px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                      background: "#0b0c1a",
                      color: "#e5e7eb"
                    }}
                  />
                  {validationErrors[FORM_FIELDS.CONFIRM_PASSWORD] && (
                    <div style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
                      {validationErrors[FORM_FIELDS.CONFIRM_PASSWORD]}
                    </div>
                  )}
                </div>

                <div>
                  <label 
                    htmlFor={FORM_FIELDS.LOCATION}
                    style={{ 
                      display: "block", 
                      marginBottom: "6px", 
                      fontSize: "12px", 
                      fontWeight: "500",
                      color: "#a1a1aa"
                    }}
                  >
                    {LABELS[FORM_FIELDS.LOCATION]}
                  </label>
                  <input
                    id={FORM_FIELDS.LOCATION}
                    type="text"
                    value={formData[FORM_FIELDS.LOCATION]}
                    onChange={(e) => handleInputChange(FORM_FIELDS.LOCATION, e.target.value)}
                    placeholder={PLACEHOLDERS[FORM_FIELDS.LOCATION]}
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
                  />
                </div>

                <div>
                  <label 
                    htmlFor={FORM_FIELDS.BIO}
                    style={{ 
                      display: "block", 
                      marginBottom: "6px", 
                      fontSize: "12px", 
                      fontWeight: "500",
                      color: "#a1a1aa"
                    }}
                  >
                    {LABELS[FORM_FIELDS.BIO]}
                  </label>
                  <textarea
                    id={FORM_FIELDS.BIO}
                    value={formData[FORM_FIELDS.BIO]}
                    onChange={(e) => handleInputChange(FORM_FIELDS.BIO, e.target.value)}
                    placeholder={PLACEHOLDERS[FORM_FIELDS.BIO]}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "1px solid #2a2b4a",
                      borderRadius: "12px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                      background: "#0b0c1a",
                      color: "#e5e7eb",
                      resize: "vertical",
                      fontFamily: "inherit"
                    }}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="btn primary"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "16px",
                  borderRadius: "12px",
                  marginTop: "24px",
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
            
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <span style={{ color: "#a1a1aa", fontSize: "14px" }}>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
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
                  Sign in
                </button>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
