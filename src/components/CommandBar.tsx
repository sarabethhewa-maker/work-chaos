"use client";
import { useState } from "react";

interface Props {
  characterNames: string[];
  onAction: (action: string, characters: string[], extra?: string) => void;
}

export default function CommandBar({ characterNames, onAction }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: input.trim(), characterNames }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        onAction(data.action, data.characters, data.extra);
        setInput("");
      }
    } catch {
      setError("Failed to reach AI");
    }
    setLoading(false);
  };

  return (
    <div className="cmd-bar">
      <span className="cmd-prefix">CHAOS CMD &gt;</span>
      <input
        className="cmd-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={loading ? "thinking..." : "tell them what to do..."}
        disabled={loading}
      />
      <button className="cmd-send" onClick={submit} disabled={loading || !input.trim()}>
        {loading ? "..." : "RUN"}
      </button>
      {error && <span className="cmd-error">{error}</span>}
    </div>
  );
}
