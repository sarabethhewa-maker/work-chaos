"use client";
import { useState, useEffect, useCallback } from "react";
import { useSimulation } from "@/hooks/useSimulation";
import EnvBackground from "@/components/EnvBackground";
import CharacterSprite from "@/components/CharacterSprite";
import PetSprite from "@/components/PetSprite";
import AddCharacter from "@/components/AddCharacter";
import CommandBar from "@/components/CommandBar";
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

  const {
    characters, pets, lavaBalls, addCharacter, removeCharacter,
    startFight, startChase, startFly, startCartwheel,
    startDance, startNap, startMeeting, startPanic, startPromote,
    sayPhrase, allCartwheel, allFight, chaosMode,
  } = useSimulation(weather, env);

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

  const handleCommand = useCallback((action: string, chars: string[], extra?: string) => {
    const findId = (name: string) => {
      const lower = name.toLowerCase();
      return characters.find(c => c.name.toLowerCase() === lower)?.id;
    };

    switch (action) {
      case "fight": {
        if (chars.length >= 2) { const a = findId(chars[0]); const b = findId(chars[1]); if (a && b) { startFight(a, b); showToast("👊 FIGHT!"); } } break;
      }
      case "chase": {
        if (chars.length >= 2) { const a = findId(chars[0]); const b = findId(chars[1]); if (a && b) { startChase(a, b); showToast("🎯 Chase!"); } } break;
      }
      case "fly": {
        const a = findId(chars[0]); const b = chars[1] ? findId(chars[1]) : undefined;
        if (a) { startFly(a, b); showToast("✈️ Flying!"); } break;
      }
      case "cartwheel": { const a = findId(chars[0]); if (a) { startCartwheel(a); showToast("🌀 Cartwheel!"); } break; }
      case "dance": {
        if (chars.length === 0) { characters.forEach(c => startDance(c.id)); showToast("💃 Everyone dance!"); }
        else { const a = findId(chars[0]); if (a) { startDance(a); showToast("💃 Dance!"); } } break;
      }
      case "nap": { const a = findId(chars[0]); if (a) { startNap(a); showToast("💤 Nap time!"); } break; }
      case "meeting": {
        const ids = chars.map(findId).filter((id): id is string => !!id);
        if (ids.length >= 3) { startMeeting(ids); showToast("📋 Meeting time!"); }
        else showToast("Need 3+ people for a meeting!"); break;
      }
      case "panic": {
        if (chars.length === 0) { characters.forEach(c => startPanic(c.id)); showToast("😱 EVERYONE PANIC!"); }
        else { const a = findId(chars[0]); if (a) { startPanic(a); showToast("😱 PANIC!"); } } break;
      }
      case "promote": { const a = findId(chars[0]); if (a) { startPromote(a); showToast("🏆 PROMOTED!"); } break; }
      case "say": { const a = findId(chars[0]); if (a) { sayPhrase(a); showToast("💬 Speaking!"); } break; }
      case "all_cartwheel": allCartwheel(); showToast("🌀 Everyone cartwheel!"); break;
      case "all_fight": allFight(); showToast("👊 BRAWL!"); break;
      case "chaos_mode": chaosMode(); showToast("🔥 CHAOS MODE!"); break;
      default: showToast(`Unknown action: ${action}`);
    }
  }, [characters, startFight, startChase, startFly, startCartwheel, startDance, startNap, startMeeting, startPanic, startPromote, sayPhrase, allCartwheel, allFight, chaosMode]);

  return (
    <main className="main">
      <header className="header">
        <h1 className="title">WORK CHAOS</h1>
        <p className="subtitle">// put your coworkers in the wild</p>
      </header>

      {/* Add Person bar — top */}
      <AddCharacter onAdd={addCharacter} count={characters.length}/>

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
          {characters.map(c => (
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
            <h3 className="cast-title">// CAST ({characters.length})</h3>
            <div className="cast-list">
              {characters.map(c => (
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
                     c.state === "promote" ? "🏆" : "🏃"}
                  </span>
                  <button onClick={() => removeCharacter(c.id)} className="cast-remove">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Command Bar */}
      {characters.length > 0 && (
        <CommandBar
          characterNames={characters.map(c => c.name)}
          onAction={handleCommand}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
