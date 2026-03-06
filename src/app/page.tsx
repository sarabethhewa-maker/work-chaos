"use client";
import { useState, useEffect, useRef } from "react";
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
  const [ianArmy, setIanArmy] = useState(false);
  const ianArmyRef = useRef<{ id: number; x: number; y: number; vx: number; vy: number; size: number; chantDelay: number }[]>([]);
  const [paulRampage, setPaulRampage] = useState(false);
  const paulRampageRef = useRef<{
    paulFace: string;
    victims: { id: number; name: string; faceUrl: string; x: number; y: number; grabDelay: number; throwAngle: number; throwDist: number; state: "waiting" | "grabbed" | "thrown" }[];
  } | null>(null);
  const [paulTick, setPaulTick] = useState(0);

  const {
    characters, pets, lavaBalls, snowballs, addCharacter, removeCharacter, updateCharacterFace,
    startFight, startChase, startFly, startCartwheel,
    startDance, startNap, startPanic,
    sayPhrase, allCartwheel, allFight, reviveAll,
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
    if (paulRampage) return;
    const others = characters.filter(c => c.name.toLowerCase() !== "paul");
    if (others.length === 0) { showToast("⚠️ Add more people for Paul to throw!"); return; }
    const victims = others.map((c, i) => ({
      id: i, name: c.name, faceUrl: c.faceUrl,
      x: 15 + Math.random() * 70,
      y: 50 + Math.random() * 35,
      grabDelay: 1.5 + i * 0.8 + Math.random() * 0.5,
      throwAngle: -30 - Math.random() * 120,
      throwDist: 600 + Math.random() * 800,
      state: "waiting" as const,
    }));
    paulRampageRef.current = { paulFace: paul.faceUrl, victims };
    setPaulRampage(true);
    setPaulTick(0);
  };

  useEffect(() => {
    if (!paulRampage) return;
    const start = Date.now();
    let rafId: number;
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      setPaulTick(elapsed);
      if (paulRampageRef.current) {
        paulRampageRef.current.victims.forEach(v => {
          if (v.state === "waiting" && elapsed > v.grabDelay) v.state = "grabbed";
          if (v.state === "grabbed" && elapsed > v.grabDelay + 0.6) v.state = "thrown";
        });
      }
      if (elapsed < 12) rafId = requestAnimationFrame(tick);
      else setPaulRampage(false);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [paulRampage]);

  const triggerIanArmy = () => {
    const ian = characters.find(c => c.name.toLowerCase() === "ian");
    if (!ian) { showToast("⚠️ Add Ian first!"); return; }
    if (ianArmy) return;
    const bots = [];
    for (let i = 0; i < 200; i++) {
      bots.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 3,
        size: 40 + Math.random() * 40,
        chantDelay: Math.random() * 2,
      });
    }
    ianArmyRef.current = bots;
    setIanArmy(true);
    setTimeout(() => setIanArmy(false), 10000);
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

      {/* Paul Rampage Overlay */}
      {paulRampage && paulRampageRef.current && (() => {
        const data = paulRampageRef.current!;
        const paulX = 10 + Math.min(paulTick * 6, 70);
        const paulScale = Math.min(1, paulTick / 1.5);
        const isRoaring = data.victims.some(v => v.state === "grabbed");
        const allThrown = data.victims.every(v => v.state === "thrown");
        return (
          <div className="paul-rampage-overlay" style={{ animation: paulTick > 11 ? "paulOverlayOut 1s forwards" : undefined }}>
            <div className="paul-rampage-shake" style={{ animation: isRoaring ? "paulScreenShake 0.1s infinite" : "none" }}>
              {/* Title */}
              <div className="paul-rampage-title">
                {allThrown ? "🦖 PAUL WINS 🦖" : "🦖 PAUL RAMPAGE 🦖"}
              </div>

              {/* Victims */}
              {data.victims.map(v => {
                if (v.state === "waiting") {
                  return (
                    <div key={v.id} className="paul-victim" style={{ left: `${v.x}%`, top: `${v.y}%` }}>
                      <img src={v.faceUrl} alt={v.name} className="paul-victim-face" />
                      <span className="paul-victim-name">{v.name}</span>
                      <span className="paul-victim-panic">😰</span>
                    </div>
                  );
                }
                if (v.state === "grabbed") {
                  return (
                    <div key={v.id} className="paul-victim paul-victim-grabbed" style={{ left: `${paulX + 8}%`, top: "25%" }}>
                      <img src={v.faceUrl} alt={v.name} className="paul-victim-face" />
                      <span className="paul-victim-name">{v.name}</span>
                      <span className="paul-victim-panic">😱</span>
                    </div>
                  );
                }
                const throwTime = paulTick - (v.grabDelay + 0.6);
                const throwProg = Math.min(throwTime / 1.2, 1);
                const rad = (v.throwAngle * Math.PI) / 180;
                const tx = v.x + Math.cos(rad) * v.throwDist * throwProg;
                const ty = v.y + Math.sin(rad) * v.throwDist * throwProg - 200 * throwProg * (1 - throwProg);
                const spin = throwProg * 1080;
                return (
                  <div key={v.id} className="paul-victim paul-victim-thrown" style={{
                    left: `${tx}%`, top: `${ty}%`,
                    transform: `rotate(${spin}deg) scale(${1 - throwProg * 0.5})`,
                    opacity: 1 - throwProg * 0.8,
                  }}>
                    <img src={v.faceUrl} alt={v.name} className="paul-victim-face" />
                    <span className="paul-victim-panic">💀</span>
                  </div>
                );
              })}

              {/* Paul the Dino */}
              <div className="paul-dino" style={{
                left: `${paulX}%`,
                transform: `scale(${paulScale})`,
              }}>
                <div className="paul-dino-body">
                  <img src={data.paulFace} alt="Paul" className="paul-dino-face" />
                  <svg width="280" height="320" viewBox="0 0 280 320" className="paul-dino-svg">
                    {/* Body */}
                    <ellipse cx="140" cy="200" rx="90" ry="110" fill="#2d8a4e" />
                    {/* Belly */}
                    <ellipse cx="140" cy="220" rx="60" ry="80" fill="#4ade80" />
                    {/* Head shape behind face */}
                    <circle cx="140" cy="75" r="65" fill="#2d8a4e" />
                    {/* Spikes */}
                    <polygon points="100,20 110,0 120,20" fill="#166534" />
                    <polygon points="125,10 135,-10 145,10" fill="#166534" />
                    <polygon points="150,15 160,-5 170,20" fill="#166534" />
                    {/* Teeth */}
                    <polygon points="100,110 108,130 116,110" fill="white" />
                    <polygon points="120,112 128,134 136,112" fill="white" />
                    <polygon points="145,112 153,134 161,112" fill="white" />
                    <polygon points="165,110 173,130 181,110" fill="white" />
                    {/* Tiny arms */}
                    <g className={isRoaring ? "paul-arms-grab" : ""}>
                      <rect x="48" y="170" width="30" height="14" rx="6" fill="#2d8a4e" transform="rotate(-20 48 170)" />
                      <rect x="202" y="170" width="30" height="14" rx="6" fill="#2d8a4e" transform="rotate(20 232 170)" />
                      <circle cx="42" cy="164" r="8" fill="#2d8a4e" />
                      <circle cx="238" cy="164" r="8" fill="#2d8a4e" />
                    </g>
                    {/* Legs */}
                    <rect x="90" y="290" width="30" height="30" rx="8" fill="#2d8a4e" />
                    <rect x="160" y="290" width="30" height="30" rx="8" fill="#2d8a4e" />
                    {/* Tail */}
                    <path d="M 50 240 Q 0 250, -20 220 Q -35 200, -15 190" stroke="#2d8a4e" strokeWidth="24" fill="none" strokeLinecap="round" />
                  </svg>
                  {isRoaring && <div className="paul-roar">ROAR!!!</div>}
                  {allThrown && <div className="paul-roar paul-victory">HAHAHA!</div>}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Ian Bot Army Overlay */}
      {ianArmy && (() => {
        const ian = characters.find(c => c.name.toLowerCase() === "ian");
        if (!ian) return null;
        return (
          <div className="ian-army-overlay">
            <div className="ian-army-title">🤖 IAN BOT ARMY 🤖</div>
            {ianArmyRef.current.map(bot => (
              <div key={bot.id} className="ian-bot" style={{
                left: `${bot.x}%`, top: `${bot.y}%`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
                animationDelay: `${Math.random() * 0.5}s`,
                ["--vx" as string]: `${bot.vx * 100}px`,
                ["--vy" as string]: `${bot.vy * 60}px`,
              }}>
                <img src={ian.faceUrl} alt="Ian" style={{
                  width: bot.size, height: bot.size, borderRadius: "50%",
                  objectFit: "cover", border: "2px solid #00ff88",
                  transform: bot.vx < 0 ? "scaleX(-1)" : "none",
                }} />
                <span className="ian-chant" style={{ animationDelay: `${bot.chantDelay}s` }}>IAN</span>
              </div>
            ))}
          </div>
        );
      })()}
    </main>
  );
}
