import React from "react";
import { motion } from "framer-motion";

export default function RoleCards({ onApplicant }) {
  return (
    <div className="center-wrap">
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ margin: 0, fontSize: 28, letterSpacing: "0.02em" }}
        >
          Welcome to <span style={{ color: "#8b5cf6" }}>LiftBot</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          style={{ color: "var(--muted)" }}
        >
          Get started as a job applicant
        </motion.p>
      </div>

      <div className="roles-grid" role="list">
        <RoleCard
          title="Job Applicant"
          desc="Create a candidate profile, answer clarifying questions and track your application."
          bullet1="Fast profile setup"
          bullet2="Guided clarifications"
          cta="I am an Applicant"
          onClick={onApplicant}
          delay={0}
        />
      </div>
    </div>
  );
}

function RoleCard({ title, desc, bullet1, bullet2, cta, onClick, delay = 0 }) {
  return (
    <motion.article
      role="listitem"
      className="card"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay }}
    >
      <h3>{title}</h3>
      <p>{desc}</p>
      <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--muted)" }}>
        <li>{bullet1}</li>
        <li>{bullet2}</li>
      </ul>
      <div className="actions" style={{ marginTop: 16 }}>
        <button className="btn primary" onClick={onClick} aria-label={cta}>
          {cta}
        </button>
        <button className="btn" onClick={onClick} aria-label="Sign up">
          Sign up
        </button>
      </div>
    </motion.article>
  );
}
