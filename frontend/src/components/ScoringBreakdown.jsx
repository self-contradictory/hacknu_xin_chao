import React from "react";
import { motion } from "framer-motion";

const CATEGORY_COLORS = {
  YES: "#10b981",
  PREFERABLE: "#f59e0b",
  HARD_NO: "#ef4444"
};

const CATEGORY_LABELS = {
  YES: "Required",
  PREFERABLE: "Preferred",
  HARD_NO: "Disqualifier"
};

const DECISION_COLORS = {
  PASS: "#10b981",
  REJECT: "#ef4444"
};

export default function ScoringBreakdown({ scoring, loading }) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ fontSize: "16px", color: "#a1a1aa" }}>
          Loading scoring data...
        </div>
      </div>
    );
  }

  if (!scoring) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ fontSize: "16px", color: "#a1a1aa" }}>
          No scoring data available for this application.
        </div>
      </div>
    );
  }

  const { overview, score_breakdown, key_insights, secondary_assessment, recommendations, detailed_breakdown } = scoring;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{
        border: "1px solid #2a2b4a",
        borderRadius: "12px",
        padding: "20px",
        backgroundColor: "linear-gradient(180deg, #141427cc, #0d0d1acc)",
        backdropFilter: "blur(10px)"
      }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "#e5e7eb" }}>
          📊 Scoring Overview
        </h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
          <ScoreCard 
            title="Final Score" 
            value={overview.final_score.toFixed(1)} 
            max={100}
            color={overview.final_score >= 70 ? "#10b981" : overview.final_score >= 50 ? "#f59e0b" : "#ef4444"}
          />
          <ScoreCard 
            title="Primary Score" 
            value={overview.primary_score.toFixed(1)} 
            max={100}
            color={overview.primary_score >= 70 ? "#10b981" : overview.primary_score >= 50 ? "#f59e0b" : "#ef4444"}
          />
          <ScoreCard 
            title="Secondary Score" 
            value={overview.secondary_score.toFixed(1)} 
            max={100}
            color={overview.secondary_score >= 70 ? "#10b981" : overview.secondary_score >= 50 ? "#f59e0b" : "#ef4444"}
          />
        </div>

        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "12px",
          padding: "12px 16px",
          backgroundColor: overview.decision === "PASS" ? "#10b98120" : "#ef444420",
          borderRadius: "8px",
          border: `1px solid ${overview.decision === "PASS" ? "#10b98140" : "#ef444440"}`
        }}>
          <div style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: DECISION_COLORS[overview.decision]
          }} />
          <span style={{ 
            fontWeight: "600", 
            color: DECISION_COLORS[overview.decision],
            fontSize: "16px"
          }}>
            {overview.decision === "PASS" ? "✅ Recommended" : "❌ Not Recommended"}
          </span>
        </div>
      </div>

      <div style={{
        border: "1px solid #2a2b4a",
        borderRadius: "12px",
        padding: "20px",
        backgroundColor: "linear-gradient(180deg, #141427cc, #0d0d1acc)",
        backdropFilter: "blur(10px)"
      }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "#e5e7eb" }}>
          📈 Score Breakdown
        </h3>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "14px", color: "#a1a1aa", marginBottom: "4px" }}>
              Points Awarded: {score_breakdown.total_awarded.toFixed(1)} / {score_breakdown.total_possible.toFixed(1)}
            </div>
            <div style={{ 
              width: "100%", 
              height: "8px", 
              backgroundColor: "#1a1b3a", 
              borderRadius: "4px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${score_breakdown.score_percentage}%`,
                height: "100%",
                backgroundColor: score_breakdown.score_percentage >= 70 ? "#10b981" : score_breakdown.score_percentage >= 50 ? "#f59e0b" : "#ef4444",
                transition: "width 0.3s ease"
              }} />
            </div>
          </div>
          <div style={{ fontSize: "18px", fontWeight: "600", color: "#e5e7eb" }}>
            {score_breakdown.score_percentage.toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{
        border: "1px solid #2a2b4a",
        borderRadius: "12px",
        padding: "20px",
        backgroundColor: "linear-gradient(180deg, #141427cc, #0d0d1acc)",
        backdropFilter: "blur(10px)"
      }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "#e5e7eb" }}>
          🔍 Detailed Criteria Breakdown
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {detailed_breakdown.map((criterion, index) => (
            <CriterionCard key={index} criterion={criterion} />
          ))}
        </div>
      </div>

      {(key_insights.strengths.length > 0 || key_insights.areas_of_concern.length > 0 || key_insights.major_deductions.length > 0) && (
        <div style={{
          border: "1px solid #2a2b4a",
          borderRadius: "12px",
          padding: "20px",
          backgroundColor: "linear-gradient(180deg, #141427cc, #0d0d1acc)",
          backdropFilter: "blur(10px)"
        }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "#e5e7eb" }}>
            💡 Key Insights
          </h3>
          
          {key_insights.strengths.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600", color: "#10b981" }}>
                ✅ Strengths
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {key_insights.strengths.map((strength, index) => (
                  <div key={index} style={{
                    padding: "6px 12px",
                    backgroundColor: "#10b98120",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#a7f3d0"
                  }}>
                    {strength.criterion}: {strength.points_awarded.toFixed(1)} points
                  </div>
                ))}
              </div>
            </div>
          )}

          {key_insights.areas_of_concern.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600", color: "#f59e0b" }}>
                ⚠️ Areas of Concern
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {key_insights.areas_of_concern.map((concern, index) => (
                  <div key={index} style={{
                    padding: "6px 12px",
                    backgroundColor: "#f59e0b20",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#fde68a"
                  }}>
                    {concern.criterion}: {concern.reason}
                  </div>
                ))}
              </div>
            </div>
          )}

          {key_insights.major_deductions.length > 0 && (
            <div>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600", color: "#ef4444" }}>
                ❌ Major Deductions
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {key_insights.major_deductions.map((deduction, index) => (
                  <div key={index} style={{
                    padding: "6px 12px",
                    backgroundColor: "#ef444420",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#fca5a5"
                  }}>
                    {deduction.criterion}: {deduction.reason}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {secondary_assessment && secondary_assessment.total_questions > 0 && (
        <div style={{
          border: "1px solid #2a2b4a",
          borderRadius: "12px",
          padding: "20px",
          backgroundColor: "linear-gradient(180deg, #141427cc, #0d0d1acc)",
          backdropFilter: "blur(10px)"
        }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "#e5e7eb" }}>
            💬 Secondary Assessment
          </h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" }}>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#10b98120", borderRadius: "8px" }}>
              <div style={{ fontSize: "20px", fontWeight: "600", color: "#10b981" }}>
                {secondary_assessment.yes_responses}
              </div>
              <div style={{ fontSize: "12px", color: "#a7f3d0" }}>Yes</div>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#f59e0b20", borderRadius: "8px" }}>
              <div style={{ fontSize: "20px", fontWeight: "600", color: "#f59e0b" }}>
                {secondary_assessment.preferable_responses}
              </div>
              <div style={{ fontSize: "12px", color: "#fde68a" }}>Preferable</div>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#ef444420", borderRadius: "8px" }}>
              <div style={{ fontSize: "20px", fontWeight: "600", color: "#ef4444" }}>
                {secondary_assessment.hard_no_responses}
              </div>
              <div style={{ fontSize: "12px", color: "#fca5a5" }}>Hard No</div>
            </div>
          </div>
          
          <div style={{ 
            marginTop: "12px", 
            padding: "8px 12px", 
            backgroundColor: "#1a1b3a", 
            borderRadius: "6px", 
            fontSize: "14px", 
            color: "#a1a1aa",
            textAlign: "center"
          }}>
            Quality: {secondary_assessment.response_quality}
          </div>
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div style={{
          border: "1px solid #4f46e5",
          borderRadius: "12px",
          padding: "20px",
          backgroundColor: "linear-gradient(180deg, #1a1b3acc, #141527cc)",
          backdropFilter: "blur(10px)"
        }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "#e5e7eb" }}>
            💡 Recommendations
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recommendations.map((recommendation, index) => (
              <div key={index} style={{
                padding: "8px 12px",
                backgroundColor: "#0b0c1a",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#e5e7eb",
                border: "1px solid #2a2b4a"
              }}>
                • {recommendation}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ title, value, max, color }) {
  const percentage = (value / max) * 100;
  
  return (
    <div style={{
      padding: "16px",
      backgroundColor: "#0b0c1a",
      borderRadius: "8px",
      border: "1px solid #2a2b4a"
    }}>
      <div style={{ fontSize: "12px", color: "#a1a1aa", marginBottom: "4px" }}>
        {title}
      </div>
      <div style={{ fontSize: "24px", fontWeight: "600", color: color, marginBottom: "8px" }}>
        {value}
      </div>
      <div style={{ 
        width: "100%", 
        height: "4px", 
        backgroundColor: "#1a1b3a", 
        borderRadius: "2px",
        overflow: "hidden"
      }}>
        <div style={{
          width: `${percentage}%`,
          height: "100%",
          backgroundColor: color,
          transition: "width 0.3s ease"
        }} />
      </div>
    </div>
  );
}

function CriterionCard({ criterion }) {
  const percentage = criterion.score_percentage;
  const color = criterion.passed ? 
    (criterion.category === "YES" ? "#10b981" : "#f59e0b") : 
    "#ef4444";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "12px",
        backgroundColor: "#0b0c1a",
        borderRadius: "8px",
        border: "1px solid #2a2b4a"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ 
            padding: "2px 6px", 
            borderRadius: "4px", 
            fontSize: "10px", 
            fontWeight: "500",
            backgroundColor: `${CATEGORY_COLORS[criterion.category]}20`,
            color: CATEGORY_COLORS[criterion.category],
            border: `1px solid ${CATEGORY_COLORS[criterion.category]}40`
          }}>
            {CATEGORY_LABELS[criterion.category]}
          </span>
          <span style={{ fontSize: "14px", fontWeight: "500", color: "#e5e7eb" }}>
            {criterion.criterion_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>
        <div style={{ fontSize: "14px", fontWeight: "600", color: color }}>
          {criterion.points_awarded.toFixed(1)} / {criterion.weight.toFixed(1)}
        </div>
      </div>
      
      <div style={{ 
        width: "100%", 
        height: "6px", 
        backgroundColor: "#1a1b3a", 
        borderRadius: "3px",
        overflow: "hidden",
        marginBottom: "8px"
      }}>
        <div style={{
          width: `${percentage}%`,
          height: "100%",
          backgroundColor: color,
          transition: "width 0.3s ease"
        }} />
      </div>
      
      <div style={{ fontSize: "12px", color: "#a1a1aa" }}>
        {criterion.notes}
      </div>
    </motion.div>
  );
}
