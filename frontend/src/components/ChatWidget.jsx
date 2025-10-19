import React, { useEffect, useRef, useState } from "react";
import AuthModal from "./AuthModal";
import useChat from "../hooks/useChat";

const CHAT_MESSAGES = {
  CONNECTING: "Connecting…",
  CONNECTED: "Connected. Waiting for questions…",
  CONNECTION_CLOSED: "Connection closed.",
  SESSION_FINISHED: "Session finished.",
  CHAT_ENDED: "Chat ended or not connected",
  TYPE_ANSWER: "Type your answer…"
};

export default function ChatWidget({ open, onClose, context }) {
  const { messages, send, status, ended } = useChat(open, context, context?.websocketUrl);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  const disabled = status !== "open" || ended;

  const onSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    send(text);
    setInput("");
  };

  return (
    <AuthModal isOpen={open} onClose={onClose} title="Chat — SmartBot">
      <div style={{ display: "grid", gridTemplateRows: "minmax(260px, 48vh) auto", gap: 12 }}>
        <div
          ref={scrollRef}
          style={{
            background: "#0b0c1a",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 12,
            height: "48vh",
            overflowY: "auto",
          }}
        >
          <BubbleSystem>
            {status === "connecting"
              ? CHAT_MESSAGES.CONNECTING
              : status === "open"
              ? CHAT_MESSAGES.CONNECTED
              : status === "closed" && !messages.length
              ? CHAT_MESSAGES.CONNECTION_CLOSED
              : " "}
          </BubbleSystem>

          {messages.map((m, i) => {
            if (m.role === "user") return <BubbleUser key={i} text={m.text} />;
            if (m.role === "bot") return <BubbleBot key={i} text={m.text} />;
            return <BubbleSystem key={i}>{m.text}</BubbleSystem>;
          })}

          {ended && <BubbleSystem>{CHAT_MESSAGES.SESSION_FINISHED}</BubbleSystem>}
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
          <input
            placeholder={disabled ? CHAT_MESSAGES.CHAT_ENDED : CHAT_MESSAGES.TYPE_ANSWER}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "#0b0c1a",
              color: "var(--text)",
            }}
          />
          <button className="btn primary" type="submit" disabled={disabled || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </AuthModal>
  );
}

function BubbleUser({ text }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", margin: "8px 0" }}>
      <div
        style={{
          background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
          color: "#fff",
          borderRadius: 14,
          padding: "10px 12px",
          maxWidth: "80%",
        }}
      >
        {text}
      </div>
    </div>
  );
}
function BubbleBot({ text }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", margin: "8px 0" }}>
      <div
        style={{
          background: "#111427",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "10px 12px",
          maxWidth: "80%",
        }}
      >
        {text}
      </div>
    </div>
  );
}
function BubbleSystem({ children }) {
  return (
    <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, margin: "8px 0" }}>
      {children}
    </div>
  );
}
