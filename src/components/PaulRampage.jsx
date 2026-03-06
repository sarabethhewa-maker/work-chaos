"use client";
import { useState, useRef, useEffect } from "react";

const WORKERS = [
  { id: "chad", name: "Chad", emoji: "\uD83D\uDE0E", color: "#ff6b6b" },
  { id: "karen", name: "Karen", emoji: "\uD83D\uDC81", color: "#ffa502" },
  { id: "dave", name: "Dave", emoji: "\uD83E\uDD13", color: "#2ed573" },
  { id: "brenda", name: "Brenda", emoji: "\uD83D\uDC83", color: "#1e90ff" },
  { id: "todd", name: "Todd", emoji: "\uD83E\uDD37", color: "#a29bfe" },
  { id: "linda", name: "Linda", emoji: "\uD83D\uDC69\u200D\uD83D\uDCBB", color: "#fd79a8" },
];

const POSITIONS = [
  { x: 12, y: 55 },
  { x: 78, y: 50 },
  { x: 25, y: 72 },
  { x: 68, y: 75 },
  { x: 8, y: 40 },
  { x: 82, y: 38 },
];

const PAUL_MOODS = {
  lurking: { emoji: "\uD83E\uDD96", label: "lurking..." },
  grabbing: { emoji: "\uD83E\uDD96", label: "GRABBING!" },
  roaring: { emoji: "\uD83E\uDD96", label: "ROOAAAR!" },
  victory: { emoji: "\uD83E\uDD96", label: "KING OF THE OFFICE" },
};

function Particles({ x, y, active }) {
  if (!active) return null;
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const dist = 40 + Math.random() * 30;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const colors = ["#ff6b6b", "#ffa502", "#ff4757", "#ff6348", "#ffd32a", "#fffa65"];
    const c = colors[i % colors.length];
    const size = 4 + Math.random() * 6;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: "50%",
          background: c,
          boxShadow: `0 0 6px ${c}`,
          animation: `particleFly 0.6s ease-out forwards`,
          animationDelay: `${i * 0.02}s`,
          "--tx": `${tx}px`,
          "--ty": `${ty}px`,
          pointerEvents: "none",
          zIndex: 50,
        }}
      />
    );
  });
  return <>{particles}</>;
}

export default function PaulRampage() {
  const [workers, setWorkers] = useState(
    WORKERS.map((w, i) => ({
      ...w,
      pos: POSITIONS[i],
      status: "idle", // idle | grabbed | flying | gone
    }))
  );
  const [paulMood, setPaulMood] = useState("lurking");
  const [thrown, setThrown] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [particlePos, setParticlePos] = useState(null);
  const [victory, setVictory] = useState(false);
  const timeouts = useRef([]);

  const clearAllTimeouts = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  };

  const addTimeout = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timeouts.current.push(id);
    return id;
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  const handleWorkerClick = (workerId) => {
    const w = workers.find((w) => w.id === workerId);
    if (!w || w.status !== "idle") return;

    // Grab phase
    setWorkers((prev) =>
      prev.map((w) => (w.id === workerId ? { ...w, status: "grabbed" } : w))
    );
    setPaulMood("grabbing");
    setShaking(true);
    setParticlePos({ x: `${w.pos.x}%`, y: `${w.pos.y}%` });

    addTimeout(() => setShaking(false), 400);
    addTimeout(() => setParticlePos(null), 600);

    // Fly phase
    addTimeout(() => {
      setWorkers((prev) =>
        prev.map((w) => (w.id === workerId ? { ...w, status: "flying" } : w))
      );
      setPaulMood("roaring");
    }, 800);

    // Gone phase
    addTimeout(() => {
      setWorkers((prev) =>
        prev.map((w) => (w.id === workerId ? { ...w, status: "gone" } : w))
      );
      setPaulMood("lurking");
      setThrown((t) => {
        const next = t + 1;
        if (next >= WORKERS.length) {
          addTimeout(() => {
            setPaulMood("victory");
            setVictory(true);
          }, 300);
        }
        return next;
      });
    }, 1600);
  };

  const handleReset = () => {
    clearAllTimeouts();
    setWorkers(
      WORKERS.map((w, i) => ({
        ...w,
        pos: POSITIONS[i],
        status: "idle",
      }))
    );
    setPaulMood("lurking");
    setThrown(0);
    setVictory(false);
    setShaking(false);
    setParticlePos(null);
  };

  const mood = PAUL_MOODS[paulMood];
  const aliveCount = workers.filter((w) => w.status !== "gone").length;

  return (
    <div style={styles.wrapper}>
      <style>{keyframes}</style>

      <div style={{ ...styles.scene, animation: shaking ? "screenShake 0.3s ease" : "none" }}>
        {/* Background */}
        <div style={styles.bg}>
          {/* Building silhouettes */}
          {[15, 30, 55, 72, 88].map((x, i) => {
            const h = 30 + ((i * 17) % 25);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  bottom: "18%",
                  left: `${x}%`,
                  width: `${8 + (i % 3) * 3}%`,
                  height: `${h}%`,
                  background: "rgba(20,15,30,0.8)",
                  borderRadius: "2px 2px 0 0",
                  boxShadow: "0 0 15px rgba(0,0,0,0.5)",
                }}
              >
                {/* Windows */}
                {Array.from({ length: Math.floor(h / 8) }, (_, r) =>
                  Array.from({ length: 2 }, (_, c) => (
                    <div
                      key={`${r}-${c}`}
                      style={{
                        position: "absolute",
                        top: `${10 + r * 22}%`,
                        left: `${20 + c * 40}%`,
                        width: "20%",
                        height: "12%",
                        background: Math.random() > 0.4 ? "rgba(255,200,50,0.15)" : "rgba(255,200,50,0.04)",
                        borderRadius: 1,
                      }}
                    />
                  ))
                )}
              </div>
            );
          })}
          {/* Ground */}
          <div style={styles.ground} />
          <div style={styles.groundLine} />
        </div>

        {/* Title */}
        <div style={styles.title}>PAUL&apos;S RAMPAGE</div>

        {/* Score */}
        <div style={styles.score}>
          THROWN: {thrown}/{WORKERS.length}
        </div>

        {/* Paul */}
        <div
          style={{
            ...styles.paul,
            animation:
              paulMood === "roaring"
                ? "paulRoar 0.3s ease infinite"
                : paulMood === "grabbing"
                ? "paulGrab 0.4s ease"
                : "paulBob 2s ease-in-out infinite",
          }}
        >
          <div style={{ fontSize: paulMood === "roaring" ? 72 : 64, lineHeight: 1, transition: "font-size 0.2s" }}>
            {mood.emoji}
          </div>
          <div
            style={{
              ...styles.paulLabel,
              color: paulMood === "roaring" ? "#ff4757" : paulMood === "victory" ? "#ffd32a" : "#aaa",
            }}
          >
            {mood.label}
          </div>
        </div>

        {/* Workers */}
        {workers.map((w) => {
          if (w.status === "gone") return null;
          const animStyle =
            w.status === "grabbed"
              ? { animation: "workerGrabbed 0.6s ease forwards" }
              : w.status === "flying"
              ? { animation: "workerFlyAway 0.8s ease-in forwards" }
              : { animation: "workerIdle 2s ease-in-out infinite" };

          return (
            <div
              key={w.id}
              onClick={() => handleWorkerClick(w.id)}
              style={{
                ...styles.worker,
                left: `${w.pos.x}%`,
                top: `${w.pos.y}%`,
                cursor: w.status === "idle" ? "pointer" : "default",
                ...animStyle,
              }}
            >
              <div style={{ fontSize: 36, lineHeight: 1 }}>{w.emoji}</div>
              <div style={{ ...styles.workerName, color: w.color }}>{w.name}</div>
            </div>
          );
        })}

        {/* Particles */}
        {particlePos && (
          <Particles x={particlePos.x} y={particlePos.y} active={true} />
        )}

        {/* Victory overlay */}
        {victory && (
          <div style={styles.victoryOverlay}>
            <div style={styles.victoryEmoji}>{"\uD83E\uDD96"}{"\uD83D\uDC51"}</div>
            <div style={styles.victoryText}>PAUL WINS</div>
            <div style={styles.victorySubtext}>The office is his now.</div>
            <button onClick={handleReset} style={styles.resetBtn}>
              RESET RAMPAGE
            </button>
          </div>
        )}
      </div>

      {/* Reset hint when not victory */}
      {!victory && thrown > 0 && (
        <button onClick={handleReset} style={styles.smallReset}>
          RESET
        </button>
      )}
    </div>
  );
}

const keyframes = `
@keyframes workerIdle {
  0%, 100% { transform: translate(-50%, -50%) rotate(-2deg); }
  50% { transform: translate(-50%, -50%) rotate(2deg) translateY(-3px); }
}
@keyframes workerGrabbed {
  0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
  40% { transform: translate(-50%, -50%) scale(1.5) rotate(-15deg); }
  100% { transform: translate(-50%, -50%) scale(1.4) rotate(10deg); }
}
@keyframes workerFlyAway {
  0% { transform: translate(-50%, -50%) scale(1.4) rotate(10deg); opacity: 1; }
  100% { transform: translate(-50%, -300%) scale(0) rotate(720deg); opacity: 0; }
}
@keyframes paulBob {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.05) translateY(-5px); }
}
@keyframes paulGrab {
  0% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.2) rotate(-8deg); }
  100% { transform: translate(-50%, -50%) scale(1.1); }
}
@keyframes paulRoar {
  0%, 100% { transform: translate(-50%, -50%) scale(1.15); }
  25% { transform: translate(-50%, -50%) scale(1.25) rotate(-5deg); }
  75% { transform: translate(-50%, -50%) scale(1.25) rotate(5deg); }
}
@keyframes screenShake {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-6px, 3px); }
  20% { transform: translate(5px, -4px); }
  30% { transform: translate(-4px, 5px); }
  40% { transform: translate(6px, -2px); }
  50% { transform: translate(-3px, 4px); }
  60% { transform: translate(4px, -3px); }
  70% { transform: translate(-5px, 2px); }
  80% { transform: translate(3px, -5px); }
  90% { transform: translate(-2px, 3px); }
}
@keyframes particleFly {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}
@keyframes titleGlow {
  0%, 100% { text-shadow: 0 0 20px rgba(255,50,50,0.6), 0 0 40px rgba(255,50,50,0.3), 0 0 80px rgba(255,50,50,0.15); }
  50% { text-shadow: 0 0 30px rgba(255,50,50,0.9), 0 0 60px rgba(255,50,50,0.5), 0 0 100px rgba(255,50,50,0.3); }
}
@keyframes victoryPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
`;

const styles = {
  wrapper: {
    width: "100%",
    maxWidth: 900,
    margin: "0 auto",
    fontFamily: "'Courier New', 'Consolas', monospace",
    userSelect: "none",
  },
  scene: {
    position: "relative",
    width: "100%",
    height: 500,
    borderRadius: 12,
    overflow: "hidden",
    border: "1.5px solid rgba(255,50,50,0.2)",
    boxShadow: "0 0 40px rgba(0,0,0,0.8)",
  },
  bg: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(ellipse at 50% 40%, #1a1025 0%, #0a0510 60%, #050208 100%)",
  },
  ground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "18%",
    background: "linear-gradient(to bottom, #0d0a15, #080510)",
  },
  groundLine: {
    position: "absolute",
    bottom: "18%",
    left: 0,
    right: 0,
    height: 2,
    background: "linear-gradient(to right, transparent, rgba(255,50,50,0.15), rgba(255,200,50,0.1), rgba(255,50,50,0.15), transparent)",
  },
  title: {
    position: "absolute",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: 28,
    fontWeight: 700,
    color: "#ff4040",
    letterSpacing: 6,
    zIndex: 10,
    animation: "titleGlow 2s ease-in-out infinite",
    whiteSpace: "nowrap",
  },
  score: {
    position: "absolute",
    top: 16,
    right: 16,
    fontSize: 13,
    fontWeight: 700,
    color: "#ff6b6b",
    letterSpacing: 2,
    zIndex: 10,
    background: "rgba(0,0,0,0.6)",
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid rgba(255,100,100,0.2)",
  },
  paul: {
    position: "absolute",
    left: "50%",
    top: "52%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
    zIndex: 5,
  },
  paulLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 3,
    marginTop: 4,
    textTransform: "uppercase",
  },
  worker: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
    zIndex: 8,
    transition: "filter 0.15s",
  },
  workerName: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.5,
    marginTop: 2,
    textShadow: "0 1px 4px rgba(0,0,0,0.8)",
    textTransform: "uppercase",
  },
  victoryOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(5,2,10,0.92)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
    animation: "victoryPulse 3s ease-in-out infinite",
  },
  victoryEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  victoryText: {
    fontSize: 36,
    fontWeight: 700,
    color: "#ffd32a",
    letterSpacing: 8,
    textShadow: "0 0 30px rgba(255,210,40,0.5), 0 0 60px rgba(255,210,40,0.2)",
    marginBottom: 8,
  },
  victorySubtext: {
    fontSize: 14,
    color: "#888",
    letterSpacing: 3,
    marginBottom: 28,
  },
  resetBtn: {
    padding: "12px 32px",
    background: "rgba(255,50,50,0.15)",
    border: "1.5px solid #ff4757",
    borderRadius: 6,
    color: "#ff4757",
    fontFamily: "'Courier New', monospace",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 3,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  smallReset: {
    display: "block",
    margin: "12px auto 0",
    padding: "6px 18px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 4,
    color: "#666",
    fontFamily: "'Courier New', monospace",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 2,
    cursor: "pointer",
  },
};
