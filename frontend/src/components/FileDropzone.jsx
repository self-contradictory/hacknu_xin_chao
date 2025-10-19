import React, { useCallback, useRef, useState } from "react";

export default function FileDropzone({
  file,
  onFile,
  accept = "application/pdf,.pdf",
  maxSizeMB = 8,
  label = "Upload file",
}) {
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (files) => {
      setErr("");
      if (!files || files.length === 0) return;
      const f = files[0];

      const isPdf =
        f.type === "application/pdf" || (f.name && f.name.toLowerCase().endsWith(".pdf"));
      const tooBig = f.size > maxSizeMB * 1024 * 1024;

      if (!isPdf) {
        setErr("Only PDF is allowed.");
        return;
      }
      if (tooBig) {
        setErr(`Max size is ${maxSizeMB} MB.`);
        return;
      }

      if (typeof onFile === "function") onFile(f);
    },
    [maxSizeMB, onFile]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const onChange = (e) => {
    handleFiles(e.target.files);
  };

  const openPicker = () => {
    if (inputRef.current) inputRef.current.click();
  };

  const removeFile = (e) => {
    e.stopPropagation();
    if (typeof onFile === "function") onFile(null);
  };

  const replaceFile = (e) => {
    e.stopPropagation();
    openPicker();
  };

  return (
    <div className="field">
      <label>{label}</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={openPicker}
        style={{
          border: `2px dashed ${dragOver ? "#8b5cf6" : "#2a2b4a"}`,
          borderRadius: 14,
          padding: 18,
          textAlign: "center",
          cursor: "pointer",
          background: dragOver ? "#121233" : "#0b0c1a",
        }}
        aria-label="Drop your PDF here or click to upload"
      >
        {!file ? (
          <>
            <div style={{ fontWeight: 600 }}>Drag & Drop your CV.pdf here</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
              or click to browse
            </div>
          </>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 600 }}>{file.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button type="button" className="btn" onClick={removeFile}>
                Remove
              </button>
              <button type="button" className="btn" onClick={replaceFile}>
                Replace
              </button>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: "none" }}
          onChange={onChange}
        />
      </div>
      {err && (
        <div style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>
          {err}
        </div>
      )}
      <div className="helper">PDF only. Max {maxSizeMB} MB.</div>
    </div>
  );
}
