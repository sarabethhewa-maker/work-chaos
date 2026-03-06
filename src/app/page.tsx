"use client";
import { useState, useEffect } from "react";
import { useSimulation } from "@/hooks/useSimulation";
import { useSounds } from "@/hooks/useSounds";
import EnvBackground from "@/components/EnvBackground";
import CharacterSprite from "@/components/CharacterSprite";
import PetSprite from "@/components/PetSprite";
import AddCharacter from "@/components/AddCharacter";

import WeatherOverlay from "@/components/WeatherOverlay";
import { ENVIRONMENTS } from "@/types";
import type { WeatherState } from "@/types";

type InteractionMode = "none" | "fight" | "chase" | "fly" | "cartwheel" | "dance" | "nap" | "panic";

const WEATHERS: { id: WeatherState; emoji: string; label: string }[] = [
  { id: "clear", emoji: "☀️", label: "Clear" },
  { id: "rain", emoji: "🌧️", label: "Rain" },
  { id: "snow", emoji: "❄️", label: "Snow" },
  { id: "lava", emoji: "🌋", label: "Lava" },
  { id: "wind", emoji: "💨", label: "Wind" },
  { id: "fog", emoji: "🌫️", label: "Fog" },
];

export default function Home() {
  const [env, setEnv] = useState("garden");
  const [frame, setFrame] = useState(0);
  const [mode, setMode] = useState<InteractionMode>("none");
  const [selected, setSelected] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherState>("clear");
  const [windDirection] = useState<"left" | "right">(Math.random() > 0.5 ? "right" : "left");
  const [muted, setMuted] = useState(false);

  const {
    characters, pets, lavaBalls, snowballs, addCharacter, removeCharacter, updateCharacterFace,
    startFight, startChase, startFly, startCartwheel,
    startDance, startNap, startPanic,
    sayPhrase, allCartwheel, allFight, reviveAll, ianBotArmy, paulRampage, ryanAndHisCats,
  } = useSimulation(weather, env);

  useSounds(characters, muted);

  useEffect(() => {
    let id: number;
    const tick = () => { setFrame(f => f + 1); id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const showToast = (msg: string, dur = 2500) => {
    setToast(msg);
    setTimeout(() => setToast(null), dur);
  };

  const handleCharacterClick = (id: string) => {
    if (mode === "none") { sayPhrase(id); return; }

    if (mode === "cartwheel") { startCartwheel(id); showToast("🌀 Cartwheel!"); setMode("none"); setSelected([]); return; }
    if (mode === "dance") { startDance(id); showToast("💃 Dance!"); setMode("none"); setSelected([]); return; }
    if (mode === "nap") { startNap(id); showToast("💤 Nap time!"); setMode("none"); setSelected([]); return; }
    if (mode === "panic") { startPanic(id); showToast("😱 PANIC!"); setMode("none"); setSelected([]); return; }

    if (selected.length === 0) {
      setSelected([id]);
      showToast(
        mode === "fight" ? "👊 Now pick who they fight!" :
        mode === "chase" ? "🎯 Now pick who to chase!" :
        "✈️ Now pick who to carry! (or click same to fly solo)"
      );
      return;
    }

    const first = selected[0];
    if (first === id && mode === "fly") {
      startFly(first); showToast("✈️ Flying solo!");
    } else if (first === id) {
      setSelected([]); return;
    } else if (mode === "fight") {
      startFight(first, id); showToast("👊 FIGHT!");
    } else if (mode === "chase") {
      startChase(first, id); showToast("🎯 Chase is on!");
    } else if (mode === "fly") {
      startFly(first, id); showToast("✈️ Picked up!");
    }
    setSelected([]); setMode("none");
  };

  const toggleMode = (m: InteractionMode) => {
    if (mode === m) { setMode("none"); setSelected([]); return; }
    setMode(m); setSelected([]);
    const hints: Record<string, string> = {
      fight: "👊 Click the first fighter!",
      chase: "🎯 Click the chaser!",
      cartwheel: "🌀 Click anyone to cartwheel!",
      fly: "✈️ Click who flies!",
      dance: "💃 Click anyone to dance!",
      nap: "💤 Click anyone to nap!",
      panic: "😱 Click anyone to panic!",
    };
    showToast(hints[m] ?? "");
  };

  const handleSelectAll = () => {
    if (mode === "none" || characters.length < 2) return;
    if (mode === "cartwheel") { allCartwheel(); showToast("🌀 Everyone cartwheel!"); }
    else if (mode === "dance") { characters.forEach(c => startDance(c.id)); showToast("💃 Everyone dance!"); }
    else if (mode === "nap") { characters.forEach(c => startNap(c.id)); showToast("💤 Everyone nap!"); }
    else if (mode === "panic") { characters.forEach(c => startPanic(c.id)); showToast("😱 EVERYONE PANIC!"); }
    else if (mode === "fight") { allFight(); showToast("👊 BRAWL!"); }
    else if (mode === "fly") { characters.forEach(c => startFly(c.id)); showToast("✈️ Everyone fly!"); }
    else if (mode === "chase") {
      const shuffled = [...characters].sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffled.length - 1; i += 2) {
        startChase(shuffled[i].id, shuffled[i + 1].id);
      }
      showToast("🎯 Everyone chase!");
    }
    setMode("none"); setSelected([]);
  };

  const triggerPaulRampage = () => {
    const paul = characters.find(c => c.name.toLowerCase() === "paul");
    if (!paul) { showToast("⚠️ Add Paul first!"); return; }
    if (characters.filter(c => c.name.toLowerCase() !== "paul").length === 0) { showToast("⚠️ Add more people for Paul to throw!"); return; }
    paulRampage();
    showToast("🦖 PAUL RAMPAGE!");
  };

  const triggerIanArmy = () => {
    const ian = characters.find(c => c.name.toLowerCase() === "ian");
    if (!ian) { showToast("⚠️ Add Ian first!"); return; }
    ianBotArmy();
    showToast("🤖 IAN BOT ARMY DEPLOYED!");
  };

  const triggerRyanCats = () => {
    const ryan = characters.find(c => c.name.toLowerCase() === "ryan");
    if (!ryan) { showToast("⚠️ Add Ryan first!"); return; }
    ryanAndHisCats();
    showToast("🐱 RYAN AND HIS CATS!");
  };

  return (
    <main className="main">
      <header className="header">
        <h1 className="title">WORK CHAOS</h1>
        <p className="subtitle">// put your coworkers in the wild</p>
      </header>

      {/* Add Person bar — top */}
      <AddCharacter onAdd={addCharacter} onUpdateFace={updateCharacterFace} characters={characters.map(c => ({ id: c.id, name: c.name }))} count={characters.length}/>

      {/* Env tabs */}
      <div className="env-tabs">
        {ENVIRONMENTS.map(e => (
          <button key={e.id} onClick={() => setEnv(e.id)} className={`env-tab ${env === e.id ? "active" : ""}`}>
            {e.emoji} {e.name}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <span className="toolbar-label">ACTIONS</span>
        <button onClick={() => toggleMode("fight")} className={`tool-btn ${mode === "fight" ? "active" : ""}`}>👊 FIGHT</button>
        <button onClick={() => toggleMode("fly")} className={`tool-btn ${mode === "fly" ? "active" : ""}`}>✈️ FLY</button>
        <button onClick={() => toggleMode("chase")} className={`tool-btn ${mode === "chase" ? "active" : ""}`}>🎯 CHASE</button>
        <button onClick={() => toggleMode("cartwheel")} className={`tool-btn ${mode === "cartwheel" ? "active" : ""}`}>🌀 CARTWHEEL</button>
        <button onClick={() => toggleMode("dance")} className={`tool-btn ${mode === "dance" ? "active" : ""}`}>💃 DANCE</button>
        <button onClick={() => toggleMode("nap")} className={`tool-btn ${mode === "nap" ? "active" : ""}`}>💤 NAP</button>
        <button onClick={() => toggleMode("panic")} className={`tool-btn ${mode === "panic" ? "active" : ""}`}>😱 PANIC</button>
        {mode !== "none" && characters.length >= 2 && (
          <button onClick={handleSelectAll} className="tool-btn active">🔥 ALL</button>
        )}
      </div>

      {/* Special Buttons */}
      <div style={{ display: "flex", justifyContent: "center", gap: "16px", margin: "12px 0", flexWrap: "wrap" }}>
        <button onClick={triggerPaulRampage} className="paul-rampage-btn">🦖 PAUL RAMPAGE</button>
        <button onClick={triggerIanArmy} className="ian-army-btn">🤖 IAN BOT ARMY</button>
        <button onClick={triggerRyanCats} className="ryan-cats-btn">🐱 RYAN AND HIS CATS</button>
      </div>

      {/* Sound mute toggle */}
      <div className="toolbar sound-toolbar">
        <span className="toolbar-label">SOUND</span>
        <button onClick={() => setMuted(!muted)} className={`tool-btn ${muted ? "active" : ""}`}>
          {muted ? "MUTED" : "ON"}
        </button>
      </div>

      {/* Weather toolbar */}
      <div className="toolbar weather-toolbar">
        <span className="toolbar-label">WEATHER</span>
        {WEATHERS.map(w => (
          <button key={w.id} onClick={() => setWeather(w.id)}
            className={`tool-btn ${weather === w.id ? "active" : ""}`}>
            {w.emoji} {w.label}
          </button>
        ))}
      </div>

      {/* Character selector cards */}
      {characters.length > 0 && (
        <div className="char-selector">
          {characters.filter(c => !c.id.startsWith("ian-bot-")).map(c => (
            <button key={c.id}
              className={`char-card ${selected.includes(c.id) ? "selected" : ""}`}
              onClick={() => handleCharacterClick(c.id)}
            >
              <img src={c.faceUrl} alt={c.name} className="char-card-face"/>
              <span className="char-card-name">{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Stage */}
      <div className={`stage-wrap ${mode !== "none" ? "interaction-mode" : ""}`}>
        <div className="stage">
          <EnvBackground env={env} />
          <div className="characters-layer">
            {pets.map(p => <PetSprite key={p.id} pet={p} frame={frame}/>)}
            {characters.map(c => (
              <CharacterSprite key={c.id} character={c} frame={frame}
                onClick={() => handleCharacterClick(c.id)}
                isSelected={selected.includes(c.id)}
                weather={weather}
                windDirection={windDirection}
                allCharacters={characters}
              />
            ))}
          </div>
          <WeatherOverlay weather={weather} lavaBalls={lavaBalls} windDirection={windDirection}/>
          {/* Snowballs */}
          {snowballs.map(sb => (
            <div key={sb.id} className="snowball" style={{ left: sb.x - 6, top: sb.y - 6 }}>
              <svg width="12" height="12" viewBox="0 0 12 12">
                <circle cx="6" cy="6" r="5" fill="white" stroke="#cde" strokeWidth="1"/>
                <circle cx="4" cy="4" r="1.5" fill="#e8f0ff" opacity="0.6"/>
              </svg>
            </div>
          ))}
          {characters.some(c => c.state === "knocked-out" || c.state === "tripping" || c.state === "getting-up" || c.state === "wobble" || c.state === "melting") && (
            <button className="revive-btn" onClick={reviveAll}>REVIVE ALL</button>
          )}
          {characters.length === 0 && (
            <div className="empty-hint">Add some people to watch the chaos unfold!</div>
          )}
          {mode !== "none" && (
            <div className="mode-banner">
              {mode === "fight" ? "👊" : mode === "fly" ? "✈️" : mode === "chase" ? "🎯" :
               mode === "cartwheel" ? "🌀" : mode === "dance" ? "💃" : mode === "nap" ? "💤" : "😱"}&nbsp;
              {selected.length === 0 ? "Click a character!" : "Now click another!"}
            </div>
          )}
        </div>
      </div>

      {/* Bottom UI */}
      <div className="bottom-ui">
        {characters.length > 0 && (
          <div className="cast-panel">
            <h3 className="cast-title">// CAST ({characters.filter(c => !c.id.startsWith("ian-bot-")).length})</h3>
            <div className="cast-list">
              {characters.filter(c => !c.id.startsWith("ian-bot-")).map(c => (
                <div key={c.id} className="cast-item">
                  <img src={c.faceUrl} alt={c.name} className="cast-face"/>
                  <span className="cast-name">{c.name}</span>
                  <span className="cast-state">
                    {c.state === "running" ? "🏃" : c.state === "tripping" ? "😵" :
                     c.state === "getting-up" ? "💪" : c.state === "wobble" ? "💪" :
                     c.state === "fighting" ? "👊" :
                     c.state === "flying" ? "✈️" : c.state === "carried" ? "😱" :
                     c.state === "chasing" ? "😤" : c.state === "cartwheel" ? "🌀" :
                     c.state === "dancing" ? "💃" : c.state === "napping" ? "💤" :
                     c.state === "meeting" ? "📋" : c.state === "panic" ? "😱" :
                     c.state === "promote" ? "🏆" : c.state === "knocked-out" ? "💀" :
                     c.state === "melting" ? "🫠" : "🏃"}
                  </span>
                  <button onClick={() => removeCharacter(c.id)} className="cast-remove">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}

    </main>
  );
}
