"use client";
import { useState, useRef } from "react";

interface CharacterInfo {
  id: string;
  name: string;
}

interface AddCharacterProps {
  onAdd: (name: string, faceUrl: string) => void;
  onUpdateFace: (id: string, faceUrl: string) => void;
  characters: CharacterInfo[];
  count: number;
}

export default function AddCharacter({ onAdd, onUpdateFace, characters, count }: AddCharacterProps) {
  // Section A: Update photo
  const [updateId, setUpdateId] = useState("");
  const [updatePreview, setUpdatePreview] = useState<string | null>(null);
  const [updateDragging, setUpdateDragging] = useState(false);
  const updateFileRef = useRef<HTMLInputElement>(null);

  // Section B: Add new
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File, setter: (url: string) => void) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setter(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpdate = () => {
    if (!updateId || !updatePreview) return;
    onUpdateFace(updateId, updatePreview);
    setUpdatePreview(null);
  };

  const handleAdd = () => {
    if (!name.trim() || !preview) return;
    onAdd(name.trim(), preview);
    setName("");
    setPreview(null);
  };

  return (
    <div className="add-bar">
      {/* Section A: Update photo */}
      {characters.length > 0 && (
        <div className="add-bar-section">
          <span className="add-bar-label">📸 UPDATE</span>
          <select
            className="add-bar-select"
            value={updateId}
            onChange={(e) => setUpdateId(e.target.value)}
          >
            <option value="">Pick...</option>
            {characters.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div
            className={`add-bar-drop small ${updateDragging ? "dragging" : ""} ${updatePreview ? "has-preview" : ""}`}
            onClick={() => updateFileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setUpdateDragging(true); }}
            onDragLeave={() => setUpdateDragging(false)}
            onDrop={(e) => { e.preventDefault(); setUpdateDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f, setUpdatePreview); }}
          >
            {updatePreview ? (
              <img src={updatePreview} alt="update preview" className="add-bar-preview"/>
            ) : (
              <span className="add-bar-drop-hint">📸</span>
            )}
          </div>
          <input ref={updateFileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], setUpdatePreview)}/>
          <button onClick={handleUpdate} disabled={!updateId || !updatePreview} className="add-bar-btn">Update</button>
        </div>
      )}

      <div className="add-bar-divider"/>

      {/* Section B: Add new */}
      <div className="add-bar-section">
        <span className="add-bar-label">+ ADD</span>
        <div
          className={`add-bar-drop small ${dragging ? "dragging" : ""} ${preview ? "has-preview" : ""}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f, setPreview); }}
        >
          {preview ? (
            <img src={preview} alt="face preview" className="add-bar-preview"/>
          ) : (
            <span className="add-bar-drop-hint">📸</span>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], setPreview)}/>
        <input
          type="text"
          placeholder="Name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="add-bar-name"
          maxLength={20}
        />
        <button onClick={handleAdd} disabled={!name.trim() || !preview} className="add-bar-btn">
          Add ({count}/10)
        </button>
      </div>
    </div>
  );
}
