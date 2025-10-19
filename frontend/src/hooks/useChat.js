import { useEffect, useMemo, useRef, useState } from "react";

export default function useChat(open, context = null, websocketUrl = null) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("idle");
  const [ended, setEnded] = useState(false);
  const wsRef = useRef(null);

  const WS_URL = useMemo(() => {
    if (websocketUrl) {
      console.log("WebSocket URL (from context):", websocketUrl);
      return websocketUrl;
    }
    
    const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    
    if (import.meta.env.VITE_WS_URL) {
      console.log("WebSocket URL (from env):", import.meta.env.VITE_WS_URL);
      return import.meta.env.VITE_WS_URL;
    }
    
    const host = window.location.hostname === "localhost" 
      ? "localhost:8000" 
      : `${window.location.hostname}:8000`;
    const url = `${proto}://${host}/api/chat`;
    console.log("WebSocket URL (constructed):", url);
    return url;
  }, [websocketUrl]);

  useEffect(() => {
    if (!open) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
      setStatus("idle");
      setEnded(false);
      setMessages([]);
      return;
    }

    setStatus("connecting");
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected successfully");
      setStatus("open");
      if (context) {
        console.log("Sending context:", context);
        try {
          ws.send(JSON.stringify({
            type: "context",
            message: context
          }));
        } catch (error) {
          console.error("Error sending context:", error);
        }
      } else {
        console.log("No context provided, sending empty context");
        try {
          ws.send(JSON.stringify({
            type: "context",
            message: null
          }));
        } catch (error) {
          console.error("Error sending empty context:", error);
        }
      }
    };

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        const type = data.type;
        if (type === "system_message") {
          setMessages((prev) => [...prev, { role: "system", text: data.text }]);
        } else if (type === "question") {
          setMessages((prev) => [
            ...prev,
            { role: "bot", text: data.text, questionId: data.question_id },
          ]);
        } else if (type === "end_session") {
          setMessages((prev) => [...prev, { role: "system", text: data.text }]);
          setEnded(true);
          try { ws.close(); } catch {}
          setStatus("closed");
        } else {
          setMessages((prev) => [...prev, { role: "system", text: JSON.stringify(data) }]);
        }
      } catch (e) {
        console.error("WS parse error", e);
      }
    };

    ws.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
      setStatus("closed");
    };
    ws.onerror = (error) => {
      console.log("WebSocket error:", error);
      setStatus("closed");
    };

    return () => {
      try { ws.close(); } catch {}
    };
  }, [open, WS_URL]);

  const send = (text, meta = {}) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const payload = { type: "user_message", message: text };
    if (meta?.questionId) payload.question_id = meta.questionId;
    wsRef.current.send(JSON.stringify(payload));
    setMessages((prev) => [...prev, { role: "user", text }]);
  };

  return { messages, send, status, ended };
}
