"use client";
import { useState, useRef } from "react";

interface AddCharacterProps {
  onAdd: (name: string, faceUrl: string) => void;
  count: number;
}

export default function AddCharacter({ onAdd, count }: AddCharacterProps) {
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleAdd = () => {
    if (!name.trim() || !preview) return;
    onAdd(name.trim(), preview);
    setName("");
    setPreview(null);
  };

  return (
    <div className="add-bar">
      <span className="add-bar-label">+ ADD</span>
      <div
        className={`add-bar-drop ${dragging ? "dragging" : ""} ${preview ? "has-preview" : ""}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <img src={preview} alt="face preview" className="add-bar-preview"/>
        ) : (
          <span className="add-bar-drop-hint">📸</span>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <input
        type="text"
        placeholder="Name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        className="add-bar-name"
        maxLength={20}
      />
      <button
        onClick={handleAdd}
        disabled={!name.trim() || !preview}
        className="add-bar-btn"
      >
        Add ({count}/10)
      </button>
    </div>
  );
}
