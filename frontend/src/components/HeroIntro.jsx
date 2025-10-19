import React, { useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";

export default function HeroIntro({ onDone }) {
  const controls = useAnimationControls();

  useEffect(() => {
    (async () => {
      await controls.start("enter");
      await controls.start("pulse");
      await controls.start("shrink");
      onDone?.();
    })();
  }, [controls, onDone]);

  return (
    <div className="center-wrap" aria-label="Intro animation">
      <motion.div
        initial="initial"
        animate={controls}
        variants={{
          initial: { opacity: 0, scale: 0.8, filter: "blur(6px)" },
          enter:   { opacity: 1, scale: 1,   filter: "blur(0px)", transition: { duration: 0.8, ease: "easeOut" } },
          pulse:   { scale: [1, 1.04, 1], transition: { duration: 0.8 } },
          shrink:  { opacity: 0, scale: 0.86, transition: { duration: 0.45, ease: "easeInOut" } },
        }}
        style={{
          width: 280,
          height: 280,
          borderRadius: 28,
          position: "relative",
          background:
            "radial-gradient(60% 60% at 50% 40%, rgba(139,92,246,.9), rgba(6,182,212,.2))",
          boxShadow:
            "0 20px 80px rgba(139,92,246,.35), inset 0 0 40px rgba(6,182,212,.25)",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          style={{ textAlign: "center" }}
        >
          <div style={{ fontWeight: 800, fontSize: 34, letterSpacing: "0.02em" }}>
            LiftBot
          </div>
          <div style={{ opacity: 0.8, marginTop: 6 }}>Talent Screening Assistant</div>
        </motion.div>

        {[...Array(26)].map((_, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{
              delay: 0.2 + i * 0.02,
              duration: 1.0,
              repeat: 0,
            }}
            style={{
              position: "absolute",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              width: 4,
              height: 4,
              background: "white",
              borderRadius: "50%",
              filter: "blur(0.5px)",
              opacity: 0.6,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
