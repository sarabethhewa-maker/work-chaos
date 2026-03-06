"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import type { Character, CharacterState, Direction, Pet, WeatherState, LavaBall, Snowball } from "@/types";
import { SHIRT_COLORS, SKIN_TONES, WORK_PHRASES, SHELTER_ZONES } from "@/types";
import { DEFAULT_CHARACTERS } from "@/data/defaultCharacters";
import { playPunch, playThwack, playOof } from "@/lib/sounds";

const W = 900;
const H = 500;
const GROUND_Y = 200;
const MAX_Y = H - 90;

function rand(a: number, b: number) { return a + Math.random() * (b - a); }
function randSign() { return Math.random() > 0.5 ? 1 : -1; }

function makeCharacter(id: string, name: string, faceUrl: string, index: number, color?: string): Character {
  return {
    id, name, faceUrl,
    x: rand(60, W - 120),
    y: rand(GROUND_Y, MAX_Y),
    vx: randSign() * rand(0.8, 1.6),
    vy: randSign() * rand(0.1, 0.3),
    direction: Math.random() > 0.5 ? "right" : "left",
    state: "running",
    stateTimer: 0,
    color: color ?? SHIRT_COLORS[index % SHIRT_COLORS.length],
    skinTone: SKIN_TONES[index % SKIN_TONES.length],
  };
}

function makePet(index: number): Pet {
  const isDog = Math.random() > 0.5;
  return {
    id: `pet-${Date.now()}-${index}`,
    type: isDog ? "dog" : "cat",
    x: rand(40, W - 80),
    y: rand(GROUND_Y + 20, MAX_Y + 10),
    vx: randSign() * rand(0.6, 1.4),
    vy: randSign() * rand(0.1, 0.3),
    direction: Math.random() > 0.5 ? "right" : "left",
    color: ["#c8a882","#4a3728","#f0d0a0","#888","#fff","#f5a623"][Math.floor(Math.random()*6)],
  };
}

const WIN_PHRASES = ["DESTROYED!", "TOO EASY!", "L + RATIO \u{1F480}", "GET REKT!", "GG NO RE"];

export function useSimulation(weather: WeatherState = "clear", env: string = "garden") {
  const [characters, setCharacters] = useState<Character[]>(
    DEFAULT_CHARACTERS.map((d, i) => makeCharacter(d.id, d.name, d.faceUrl, i, d.color))
  );
  const [pets, setPets] = useState<Pet[]>([makePet(0), makePet(1), makePet(2), makePet(3)]);
  const [lavaBalls, setLavaBalls] = useState<LavaBall[]>([]);
  const [snowballs, setSnowballs] = useState<Snowball[]>([]);
  const rafRef = useRef<number>(0);
  const weatherRef = useRef(weather);
  const envRef = useRef(env);
  const windDirRef = useRef<"left" | "right">(Math.random() > 0.5 ? "right" : "left");
  const lavaIdRef = useRef(0);
  const snowballIdRef = useRef(0);

  // Fight result tracking: maps character id -> "winner" | "loser"
  const fightResultRef = useRef<Map<string, "winner" | "loser">>(new Map());
  // Track punch sound timing per fight pair
  const punchTickRef = useRef<Map<string, number>>(new Map());

  useEffect(() => { weatherRef.current = weather; }, [weather]);
  useEffect(() => { envRef.current = env; }, [env]);
  useEffect(() => {
    if (weather === "wind") windDirRef.current = Math.random() > 0.5 ? "right" : "left";
    if (weather !== "lava") setLavaBalls([]);
    if (weather !== "snow") setSnowballs([]);
  }, [weather]);

  const addCharacter = useCallback((name: string, faceUrl: string) => {
    setCharacters(prev => {
      if (prev.length >= 10) return prev;
      return [...prev, makeCharacter(`c-${Date.now()}`, name, faceUrl, prev.length)];
    });
  }, []);

  const removeCharacter = useCallback((id: string) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateCharacterFace = useCallback((id: string, faceUrl: string) => {
    setCharacters(prev => prev.map(c =>
      c.id === id ? { ...c, faceUrl } : c
    ));
  }, []);

  const startFight = useCallback((id1: string, id2: string) => {
    // Randomly pick winner/loser
    const [winner, loser] = Math.random() > 0.5 ? [id1, id2] : [id2, id1];
    fightResultRef.current.set(winner, "winner");
    fightResultRef.current.set(loser, "loser");
    punchTickRef.current.set(`${id1}-${id2}`, 0);

    setCharacters(prev => prev.map(c => {
      if (c.id === id1) return { ...c, state: "fighting" as CharacterState, stateTimer: 45, targetId: id2, vx: 0, vy: 0 };
      if (c.id === id2) return { ...c, state: "fighting" as CharacterState, stateTimer: 45, targetId: id1, vx: 0, vy: 0 };
      return c;
    }));
  }, []);

  const startChase = useCallback((chaserId: string, targetId: string) => {
    setCharacters(prev => prev.map(c =>
      c.id === chaserId ? { ...c, state: "chasing" as CharacterState, stateTimer: 75, targetId } : c
    ));
  }, []);

  const startFly = useCallback((flyerId: string, carryId?: string) => {
    setCharacters(prev => prev.map(c => {
      if (c.id === flyerId) return { ...c, isFlying: true, state: "flying" as CharacterState, stateTimer: 100, targetId: carryId };
      if (carryId && c.id === carryId) return { ...c, state: "carried" as CharacterState, carriedById: flyerId };
      return c;
    }));
  }, []);

  const startCartwheel = useCallback((id: string) => {
    setCharacters(prev => prev.map(c =>
      c.id === id ? { ...c, state: "cartwheel" as CharacterState, stateTimer: 30, vx: (c.direction === "right" ? 1 : -1) * 2.5 } : c
    ));
  }, []);

  const startDance = useCallback((id: string) => {
    setCharacters(prev => prev.map(c =>
      c.id === id ? { ...c, state: "dancing" as CharacterState, stateTimer: 45, vx: 0, vy: 0 } : c
    ));
  }, []);

  const startNap = useCallback((id: string) => {
    setCharacters(prev => prev.map(c =>
      c.id === id ? { ...c, state: "napping" as CharacterState, stateTimer: 60, vx: 0, vy: 0 } : c
    ));
  }, []);

  const startMeeting = useCallback((ids: string[]) => {
    if (ids.length < 3) return;
    const centerX = W / 2;
    const centerY = (GROUND_Y + MAX_Y) / 2;
    setCharacters(prev => prev.map(c => {
      if (ids.includes(c.id)) {
        return { ...c, state: "meeting" as CharacterState, stateTimer: 75, meetingX: centerX, meetingY: centerY };
      }
      return c;
    }));
  }, []);

  const startPanic = useCallback((id: string) => {
    setCharacters(prev => prev.map(c =>
      c.id === id ? {
        ...c, state: "panic" as CharacterState, stateTimer: 45,
        vx: randSign() * rand(4, 6), vy: randSign() * rand(1, 2),
        speechBubble: "AAHHH!!!", speechTimer: 180,
      } : c
    ));
  }, []);

  const startPromote = useCallback((id: string) => {
    setCharacters(prev => prev.map(c =>
      c.id === id ? { ...c, state: "promote" as CharacterState, stateTimer: 38, vx: 0, vy: 0 } : c
    ));
  }, []);

  const sayPhrase = useCallback((id: string) => {
    const phrase = WORK_PHRASES[Math.floor(Math.random() * WORK_PHRASES.length)];
    setCharacters(prev => prev.map(c =>
      c.id === id ? { ...c, speechBubble: phrase, speechTimer: 160 } : c
    ));
  }, []);

  const allCartwheel = useCallback(() => {
    setCharacters(prev => prev.map(c => ({
      ...c, state: "cartwheel" as CharacterState, stateTimer: 30,
      vx: (c.direction === "right" ? 1 : -1) * 2.5,
    })));
  }, []);

  const allFight = useCallback(() => {
    setCharacters(prev => {
      const shuffled = [...prev].sort(() => Math.random() - 0.5);
      const result = [...prev];
      for (let i = 0; i < shuffled.length - 1; i += 2) {
        const a = shuffled[i].id;
        const b = shuffled[i + 1].id;
        const ai = result.findIndex(c => c.id === a);
        const bi = result.findIndex(c => c.id === b);
        // Assign winner/loser
        const [winner, loser] = Math.random() > 0.5 ? [a, b] : [b, a];
        fightResultRef.current.set(winner, "winner");
        fightResultRef.current.set(loser, "loser");
        punchTickRef.current.set(`${a}-${b}`, 0);
        if (ai >= 0) result[ai] = { ...result[ai], state: "fighting" as CharacterState, stateTimer: 45, targetId: b, vx: 0, vy: 0 };
        if (bi >= 0) result[bi] = { ...result[bi], state: "fighting" as CharacterState, stateTimer: 45, targetId: a, vx: 0, vy: 0 };
      }
      return result;
    });
  }, []);

  const chaosMode = useCallback(() => {
    setCharacters(prev => prev.map(c => ({
      ...c, vx: randSign() * rand(8, 16), vy: randSign() * rand(2, 5),
    })));
    setTimeout(() => {
      setCharacters(prev => prev.map(c => ({
        ...c, vx: randSign() * rand(0.8, 1.6), vy: randSign() * rand(0.1, 0.3),
      })));
    }, 5000);
  }, []);

  useEffect(() => {
    const tick = () => {
      const w = weatherRef.current;
      const curEnv = envRef.current;
      const windDir = windDirRef.current;

      // Tick lava balls
      if (w === "lava") {
        setLavaBalls(prev => {
          let balls = prev.map(b => {
            let { y, vy } = b;
            vy += 0.15;
            y += vy;
            if (y > MAX_Y + 30) { vy = -vy * 0.6; y = MAX_Y + 30; }
            return { ...b, y, vy };
          }).filter(b => b.y < H + 50);
          if (Math.random() < 0.04 && balls.length < 25) {
            balls = [...balls, { id: lavaIdRef.current++, x: rand(20, W - 20), y: -20, vy: rand(1, 3) }];
          }
          return balls;
        });
      }

      // Tick snowballs (snow weather)
      if (w === "snow") {
        setSnowballs(prev => {
          let balls = prev.map(b => {
            const p = b.progress + 0.025;
            const t = p;
            const x = b.startX + (b.targetX - b.startX) * t;
            const arc = -120 * t * (1 - t); // parabolic arc
            const y = b.startY + (b.targetY - b.startY) * t + arc;
            return { ...b, x, y, progress: p };
          }).filter(b => b.progress < 1);
          return balls;
        });
      }

      // Tick characters
      setCharacters(prev => {
        if (prev.length === 0) return prev;
        const map = new Map(prev.map(c => [c.id, c]));

        return prev.map((c, i) => {
          let { x, y, vx, vy, state, stateTimer, direction, speechTimer, speechBubble } = c;

          if (speechTimer && speechTimer > 0) {
            speechTimer--;
            if (speechTimer === 0) speechBubble = undefined;
          }
          if (state === "running" && Math.random() < 0.0008) {
            speechBubble = WORK_PHRASES[Math.floor(Math.random() * WORK_PHRASES.length)];
            speechTimer = 160;
          }

          const snowMult = w === "snow" ? 0.4 : 1;
          const fogMult = w === "fog" ? 0.6 : 1;
          const weatherMult = snowMult * fogMult;

          // MELTING (lava weather)
          if (state === "melting") {
            stateTimer--;
            if (stateTimer <= 0) {
              // Respawn at random position
              return {
                ...c, state: "running" as CharacterState, stateTimer: 0,
                x: rand(60, W - 120), y: rand(GROUND_Y, MAX_Y),
                vx: randSign() * rand(0.8, 1.6), vy: randSign() * rand(0.1, 0.3),
                direction: Math.random() > 0.5 ? "right" as Direction : "left" as Direction,
                speechBubble: "I'm back!", speechTimer: 80,
              };
            }
            return { ...c, stateTimer, speechTimer, speechBubble };
          }

          // CARRIED
          if (state === "carried" && c.carriedById) {
            const carrier = map.get(c.carriedById);
            if (!carrier || carrier.state !== "flying") {
              return { ...c, state: "running" as CharacterState, carriedById: undefined, vx: randSign() * rand(0.8, 1.6), vy: rand(0.1, 0.3), speechTimer, speechBubble };
            }
            return { ...c, x: carrier.x + 4, y: carrier.y - 32, speechTimer, speechBubble };
          }

          // FLYING
          if (state === "flying") {
            stateTimer--;
            const targetY = 40 + ((c.id.charCodeAt(c.id.length - 1) % 80));
            if (y > targetY + 5) y -= 3.5;
            y += Math.sin(Date.now() * 0.003) * 0.6;
            x += vx * 0.6;
            if (x < 20) { x = 20; vx = Math.abs(vx); direction = "right"; }
            if (x > W - 60) { x = W - 60; vx = -Math.abs(vx); direction = "left"; }
            y = Math.max(40, Math.min(120, y));
            if (stateTimer <= 20) {
              const groundY = rand(GROUND_Y, MAX_Y);
              const descent = (20 - stateTimer) / 20;
              y = y + (groundY - y) * descent;
            }
            if (stateTimer <= 0) return { ...c, isFlying: false, state: "running" as CharacterState, stateTimer: 0, targetId: undefined, y: rand(GROUND_Y, MAX_Y), speechTimer, speechBubble };
            return { ...c, x, y, vx, direction, stateTimer, speechTimer, speechBubble };
          }

          // CARTWHEEL
          if (state === "cartwheel") {
            stateTimer--;
            x += vx;
            if (x < 10) { x = 10; vx = Math.abs(vx); direction = "right"; }
            if (x > W - 60) { x = W - 60; vx = -Math.abs(vx); direction = "left"; }
            if (stateTimer <= 0) return { ...c, state: "running" as CharacterState, stateTimer: 0, x, vx: randSign() * rand(0.8, 1.6), vy: randSign() * rand(0.1, 0.3), speechTimer, speechBubble };
            return { ...c, x, direction, stateTimer, speechTimer, speechBubble };
          }

          // DANCING
          if (state === "dancing") {
            stateTimer--;
            if (stateTimer <= 0) return { ...c, state: "running" as CharacterState, stateTimer: 0, vx: randSign() * rand(0.8, 1.6), vy: randSign() * rand(0.1, 0.3), speechTimer, speechBubble };
            return { ...c, stateTimer, speechTimer, speechBubble };
          }

          // NAPPING
          if (state === "napping") {
            stateTimer--;
            if (stateTimer <= 0) return { ...c, state: "getting-up" as CharacterState, stateTimer: 15, speechTimer, speechBubble };
            return { ...c, stateTimer, speechTimer, speechBubble };
          }

          // MEETING
          if (state === "meeting") {
            stateTimer--;
            const mx = c.meetingX ?? W / 2;
            const my = c.meetingY ?? (GROUND_Y + MAX_Y) / 2;
            const dx = mx - x; const dy = my - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 30) {
              x += (dx / dist) * 2;
              y += (dy / dist) * 1;
              direction = dx > 0 ? "right" : "left";
            }
            if (stateTimer <= 0) return { ...c, state: "running" as CharacterState, stateTimer: 0, meetingX: undefined, meetingY: undefined, vx: randSign() * rand(0.8, 1.6), vy: randSign() * rand(0.1, 0.3), x, y, direction, speechTimer, speechBubble };
            return { ...c, x, y, direction, stateTimer, speechTimer, speechBubble };
          }

          // PANIC
          if (state === "panic") {
            stateTimer--;
            x += vx; y += vy;
            if (x < 10) { x = 10; vx = Math.abs(vx); direction = "right"; }
            if (x > W - 60) { x = W - 60; vx = -Math.abs(vx); direction = "left"; }
            if (y < GROUND_Y) { y = GROUND_Y; vy = Math.abs(vy); }
            if (y > MAX_Y) { y = MAX_Y; vy = -Math.abs(vy); }
            if (Math.random() < 0.08) { vx = randSign() * rand(4, 6); vy = randSign() * rand(1, 2); direction = vx > 0 ? "right" : "left"; }
            if (stateTimer <= 0) return { ...c, state: "running" as CharacterState, stateTimer: 0, vx: randSign() * rand(0.8, 1.6), vy: randSign() * rand(0.1, 0.3), x, y, direction, speechTimer, speechBubble };
            return { ...c, x, y, vx, vy, direction, stateTimer, speechTimer, speechBubble };
          }

          // PROMOTE
          if (state === "promote") {
            stateTimer--;
            if (stateTimer <= 0) return { ...c, state: "running" as CharacterState, stateTimer: 0, vx: randSign() * rand(0.8, 1.6), vy: randSign() * rand(0.1, 0.3), speechTimer, speechBubble };
            return { ...c, stateTimer, speechTimer, speechBubble };
          }

          // KNOCKED-OUT
          if (state === "knocked-out") {
            stateTimer--;
            if (stateTimer <= 0) {
              fightResultRef.current.delete(c.id);
              return { ...c, state: "getting-up" as CharacterState, stateTimer: 22, speechBubble: undefined, speechTimer: 0 };
            }
            return { ...c, stateTimer, speechTimer, speechBubble };
          }

          // TRIPPING
          if (state === "tripping") {
            stateTimer--;
            if (stateTimer <= 0) return { ...c, state: "getting-up" as CharacterState, stateTimer: 15, speechTimer, speechBubble };
            return { ...c, speechTimer, speechBubble };
          }

          // GETTING UP
          if (state === "getting-up") {
            stateTimer--;
            if (stateTimer <= 0) {
              return { ...c, state: "wobble" as CharacterState, stateTimer: 15, vx: randSign() * rand(0.3, 0.6), vy: randSign() * rand(0.05, 0.15), direction: c.direction, speechTimer, speechBubble };
            }
            return { ...c, stateTimer, speechTimer, speechBubble };
          }

          // WOBBLE
          if (state === "wobble") {
            stateTimer--;
            x += vx * 0.5; y += vy * 0.5;
            if (x < 10) { x = 10; vx = Math.abs(vx); direction = "right"; }
            if (x > W - 60) { x = W - 60; vx = -Math.abs(vx); direction = "left"; }
            if (y < GROUND_Y) { y = GROUND_Y; vy = Math.abs(vy); }
            if (y > MAX_Y) { y = MAX_Y; vy = -Math.abs(vy); }
            if (stateTimer <= 0) {
              vx = randSign() * rand(0.8, 1.6);
              vy = randSign() * rand(0.1, 0.3);
              return { ...c, state: "running" as CharacterState, stateTimer: 0, vx, vy, direction: vx > 0 ? "right" : "left", x, y, speechTimer, speechBubble };
            }
            return { ...c, x, y, stateTimer, speechTimer, speechBubble };
          }

          // FIGHTING — with winner/loser system
          if (state === "fighting") {
            stateTimer--;
            const opponent = c.targetId ? map.get(c.targetId) : undefined;
            const distToOpponent = opponent ? Math.abs(c.x - opponent.x) : 999;

            if (opponent && distToOpponent > 55) {
              // Approach phase
              const dx = opponent.x - c.x;
              x += Math.sign(dx) * 0.8;
              direction = dx > 0 ? "right" : "left";
            } else {
              // Close combat — shake
              x += Math.sin(stateTimer * 0.3) * 0.8;

              // Play punch sound every 30 ticks
              if (c.targetId) {
                const pairKey = c.id < c.targetId ? `${c.id}-${c.targetId}` : `${c.targetId}-${c.id}`;
                const lastPunch = punchTickRef.current.get(pairKey) ?? 0;
                if (45 - stateTimer - lastPunch >= 10) {
                  if (Math.random() > 0.5) playPunch(); else playThwack();
                  punchTickRef.current.set(pairKey, 45 - stateTimer);
                }
              }
            }

            if (stateTimer <= 0) {
              const result = fightResultRef.current.get(c.id);
              // Clean up punch tracking
              if (c.targetId) {
                const pairKey = c.id < c.targetId ? `${c.id}-${c.targetId}` : `${c.targetId}-${c.id}`;
                punchTickRef.current.delete(pairKey);
              }

              if (result === "winner") {
                fightResultRef.current.delete(c.id);
                const phrase = WIN_PHRASES[Math.floor(Math.random() * WIN_PHRASES.length)];
                return {
                  ...c, state: "dancing" as CharacterState, stateTimer: 15, targetId: undefined,
                  vx: 0, vy: 0, x, direction,
                  speechBubble: phrase, speechTimer: 120,
                };
              } else if (result === "loser") {
                playOof();
                return {
                  ...c, state: "knocked-out" as CharacterState, stateTimer: 150, targetId: undefined,
                  vx: 0, vy: 0, x, direction,
                  speechBubble: "KO!", speechTimer: 150,
                };
              } else {
                // Fallback (shouldn't happen)
                return { ...c, state: "running" as CharacterState, stateTimer: 0, targetId: undefined, vx: randSign() * rand(1, 2), vy: randSign() * rand(0.15, 0.4), x, direction, speechTimer, speechBubble };
              }
            }
            return { ...c, x, direction, stateTimer, speechTimer, speechBubble };
          }

          // CHASING
          if (state === "chasing" && c.targetId) {
            stateTimer--;
            const target = map.get(c.targetId);
            if (target) {
              const dx = target.x - c.x;
              const dy = target.y - c.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 5) { x += (dx / dist) * 2.0; y += (dy / dist) * 0.7; direction = dx > 0 ? "right" : "left"; }
            }
            if (stateTimer <= 0) return { ...c, state: "running" as CharacterState, stateTimer: 0, targetId: undefined, x, y, direction, vx: randSign() * rand(0.8, 1.6), vy: randSign() * rand(0.1, 0.3), speechTimer, speechBubble };
            x = Math.max(10, Math.min(W - 60, x));
            y = Math.max(GROUND_Y, Math.min(MAX_Y, y));
            return { ...c, x, y, direction, stateTimer, speechTimer, speechBubble };
          }

          // RUNNING — with weather effects
          let runVx = vx * weatherMult;
          let runVy = vy * weatherMult;

          if (w === "wind") {
            const windPush = windDir === "right" ? 0.5 : -0.5;
            runVx += windPush;
            if ((windDir === "right" && vx < 0) || (windDir === "left" && vx > 0)) {
              runVx *= 0.5;
            }
          }

          if (w === "rain") {
            const shelters = SHELTER_ZONES[curEnv] ?? SHELTER_ZONES.garden;
            let nearestShelter = shelters[0];
            let nearestDist = Infinity;
            for (const s of shelters) {
              const d = Math.sqrt((x - s.x) ** 2 + (y - s.y) ** 2);
              if (d < nearestDist) { nearestDist = d; nearestShelter = s; }
            }
            if (nearestDist > 30) {
              const dx = nearestShelter.x - x;
              const dy = nearestShelter.y - y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              runVx = (dx / dist) * 1.8;
              runVy = (dy / dist) * 0.6;
              direction = dx > 0 ? "right" : "left";
            } else {
              runVx = 0; runVy = 0;
            }
          }

          if (w === "fog" && Math.random() < 0.015) {
            vx = randSign() * rand(0.4, 1.0);
            vy = randSign() * rand(0.05, 0.2);
            direction = vx > 0 ? "right" : "left";
          }

          x += runVx; y += runVy;
          if (x < 10) { x = 10; vx = Math.abs(vx); direction = "right"; }
          if (x > W - 60) { x = W - 60; vx = -Math.abs(vx); direction = "left"; }
          if (y < GROUND_Y) { y = GROUND_Y; vy = Math.abs(vy); }
          if (y > MAX_Y) { y = MAX_Y; vy = -Math.abs(vy); }
          if (Math.random() < 0.004) { vx = randSign() * rand(0.8, 1.6); vy = randSign() * rand(0.1, 0.3); direction = vx > 0 ? "right" : "left"; }

          // Tripping collision
          let tripped = false;
          for (let j = 0; j < prev.length; j++) {
            if (i === j) continue;
            const other = prev[j];
            if (other.state !== "running") continue;
            const dx = x - other.x; const dy = y - other.y;
            if (Math.sqrt(dx * dx + dy * dy) < 44) {
              if (Math.random() < 0.22) { tripped = true; break; }
              vx = -vx + rand(-0.5, 0.5); vy = -vy + rand(-0.3, 0.3); direction = vx > 0 ? "right" : "left";
            }
          }
          if (tripped) return { ...c, x, y, vx: 0, vy: 0, state: "tripping" as CharacterState, stateTimer: 15, speechTimer, speechBubble };

          if (w === "snow" && Math.random() < 0.002 && !speechBubble) {
            speechBubble = "brrr...";
            speechTimer = 80;
          }

          // Lava: randomly start melting
          if (w === "lava" && Math.random() < 0.003) {
            return {
              ...c, x, y, vx: 0, vy: 0, state: "melting" as CharacterState, stateTimer: 90,
              speechBubble: "🫠 MELTING!", speechTimer: 90,
            };
          }

          // Snow: randomly throw snowball at another character
          if (w === "snow" && Math.random() < 0.005 && prev.length >= 2) {
            const others = prev.filter(o => o.id !== c.id && o.state === "running");
            if (others.length > 0) {
              const target = others[Math.floor(Math.random() * others.length)];
              setSnowballs(sb => [...sb, {
                id: snowballIdRef.current++,
                x: x + 28, y: y + 20,
                startX: x + 28, startY: y + 20,
                targetX: target.x + 28, targetY: target.y + 20,
                progress: 0,
              }]);
            }
          }

          return { ...c, x, y, vx, vy, direction, speechTimer, speechBubble };
        });
      });

      // Tick pets
      setPets(prev => prev.map(p => {
        let { x, y, vx, vy, direction } = p;
        x += vx; y += vy;
        if (x < 10) { x = 10; vx = Math.abs(vx); direction = "right"; }
        if (x > W - 50) { x = W - 50; vx = -Math.abs(vx); direction = "left"; }
        if (y < GROUND_Y + 10) { y = GROUND_Y + 10; vy = Math.abs(vy); }
        if (y > MAX_Y + 20) { y = MAX_Y + 20; vy = -Math.abs(vy); }
        if (Math.random() < 0.006) { vx = randSign() * rand(0.5, 1.5); vy = randSign() * rand(0.1, 0.4); direction = vx > 0 ? "right" : "left"; }
        if (p.type === "cat" && Math.random() < 0.002) { vx = 0; vy = 0; }
        return { ...p, x, y, vx, vy, direction };
      }));

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return {
    characters, pets, lavaBalls, snowballs,
    addCharacter, removeCharacter, updateCharacterFace,
    startFight, startChase, startFly, startCartwheel,
    startDance, startNap, startMeeting, startPanic, startPromote,
    sayPhrase, allCartwheel, allFight, chaosMode,
  };
}
