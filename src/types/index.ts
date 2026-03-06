export type EnvId = "beach" | "forest" | "mountains" | "racetrack" | "city" | "garden";
export type CharacterState = "running" | "tripping" | "getting-up" | "wobble" | "fighting" | "flying" | "carried" | "chasing" | "cartwheel" | "dancing" | "napping" | "meeting" | "panic" | "promote" | "knocked-out" | "melting";
export type WeatherState = "clear" | "rain" | "snow" | "lava" | "wind" | "fog";
export type Direction = "left" | "right";

export interface Character {
  id: string;
  name: string;
  faceUrl: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  direction: Direction;
  state: CharacterState;
  stateTimer: number;
  color: string;
  skinTone: string;
  targetId?: string;
  carriedById?: string;
  speechBubble?: string;
  speechTimer?: number;
  isFlying?: boolean;
  meetingX?: number;
  meetingY?: number;
  shelterX?: number;
  shelterY?: number;
}

export interface LavaBall {
  id: number;
  x: number;
  y: number;
  vy: number;
}

export interface Snowball {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
}

export const SHELTER_ZONES: Record<string, {x: number; y: number}[]> = {
  garden:     [{x: 440, y: 320}, {x: 155, y: 278}, {x: 750, y: 300}],
  beach:      [{x: 94, y: 260}, {x: 400, y: 330}, {x: 792, y: 260}],
  forest:     [{x: 205, y: 290}, {x: 450, y: 285}, {x: 675, y: 295}],
  mountains:  [{x: 130, y: 330}, {x: 450, y: 330}, {x: 730, y: 330}],
  racetrack:  [{x: 150, y: 300}, {x: 450, y: 300}, {x: 750, y: 300}],
  city:       [{x: 120, y: 290}, {x: 460, y: 290}, {x: 760, y: 290}],
};

export interface Pet {
  id: string;
  type: "dog" | "cat";
  x: number;
  y: number;
  vx: number;
  vy: number;
  direction: Direction;
  color: string;
}

export const ENVIRONMENTS: { id: string; name: string; emoji: string }[] = [
  { id: "beach",      name: "Ocean / Beach", emoji: "🌊" },
  { id: "forest",     name: "Forest",        emoji: "🌲" },
  { id: "mountains",  name: "Mountains",     emoji: "⛰️" },
  { id: "racetrack",  name: "Racetrack",     emoji: "🏎️" },
  { id: "city",       name: "City / Rooftop",emoji: "🌆" },
  { id: "garden",     name: "Garden",        emoji: "🌸" },
];

export const SHIRT_COLORS = [
  "#ff6b6b","#ffa502","#2ed573","#1e90ff",
  "#a29bfe","#fd79a8","#00cec9","#fdcb6e",
  "#e17055","#74b9ff",
];

export const SKIN_TONES = [
  "#FDDBB4","#F5C28A","#E8A96A","#C68642","#8D5524",
  "#FDDBB4","#F5C28A","#E8A96A","#C68642","#8D5524",
];

export const WORK_PHRASES = [
  "per my last email...",
  "let's circle back",
  "quick sync?",
  "can you hear me?",
  "you're on mute!",
  "move fast 🚀",
  "great question!",
  "taking this offline",
  "low-hanging fruit",
  "bandwidth issues",
  "let's align on this",
  "synergy!!",
  "ship it 🚢",
  "LGTM 👍",
  "this is fine 🔥",
  "where's the doc?",
  "EOD Friday pls",
  "brb bio break",
  "blocking issue 🚧",
  "out of office 🏖️",
];
