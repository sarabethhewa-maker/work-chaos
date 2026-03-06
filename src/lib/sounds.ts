// Sound engine — all sounds respect the global mute flag.
// Uses Web Audio API for tones/music and Web Speech API for voice effects.

let _muted = false;
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

export function setMuted(m: boolean) {
  _muted = m;
  if (m) {
    stopCucaracha();
    stopSnore();
    window.speechSynthesis?.cancel();
  }
}
export function isMuted() { return _muted; }

// Throttle helper — prevents the same sound from firing more than once per interval
const _lastPlayed = new Map<string, number>();
function throttle(key: string, ms: number): boolean {
  const now = Date.now();
  const last = _lastPlayed.get(key) ?? 0;
  if (now - last < ms) return false;
  _lastPlayed.set(key, now);
  return true;
}

// ─── FIGHT: Punch impact (Web Audio) ───
export function playPunch() {
  if (_muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {}
}

// ─── FIGHT: "Thwack" impact variation (Web Audio noise burst) ───
export function playThwack() {
  if (_muted) return;
  try {
    const ctx = getCtx();
    const bufLen = Math.floor(ctx.sampleRate * 0.08);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.15));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;
    const gain = ctx.createGain();
    gain.gain.value = 0.4;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } catch {}
}

// ─── FIGHT: "Oof!" voice (Web Speech API) ───
export function playOof() {
  if (_muted) return;
  if (!throttle("oof", 600)) return;
  try {
    const u = new SpeechSynthesisUtterance("oof!");
    u.rate = 1.6;
    u.pitch = 0.5;
    u.volume = 0.8;
    window.speechSynthesis.speak(u);
  } catch {}
}

// ─── FLY: Wind whoosh (Web Audio filtered noise) ───
export function playWhoosh() {
  if (_muted) return;
  if (!throttle("whoosh", 400)) return;
  try {
    const ctx = getCtx();
    const len = Math.floor(ctx.sampleRate * 0.6);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(300, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.15);
    filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.55);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + 0.6);
  } catch {}
}

// ─── CARTWHEEL: "Wahoo!" voice (Web Speech API) ───
export function playWahoo() {
  if (_muted) return;
  if (!throttle("wahoo", 500)) return;
  try {
    const u = new SpeechSynthesisUtterance("wahoo!");
    u.rate = 1.5;
    u.pitch = 1.8;
    u.volume = 0.9;
    window.speechSynthesis.speak(u);
  } catch {}
}

// ─── PANIC: Gasp / scream (Web Speech API) ───
export function playGasp() {
  if (_muted) return;
  if (!throttle("gasp", 500)) return;
  try {
    const phrases = ["ahhh!", "oh no!", "help!"];
    const u = new SpeechSynthesisUtterance(phrases[Math.floor(Math.random() * phrases.length)]);
    u.rate = 2.0;
    u.pitch = 2.0;
    u.volume = 0.9;
    window.speechSynthesis.speak(u);
  } catch {}
}

// ─── NAP: Snoring loop (Web Audio — low oscillator with LFO amplitude) ───
let _snoreOsc: OscillatorNode | null = null;
let _snoreLfo: OscillatorNode | null = null;
let _snoreGain: GainNode | null = null;

export function startSnore() {
  if (_muted || _snoreOsc) return;
  try {
    const ctx = getCtx();
    _snoreOsc = ctx.createOscillator();
    _snoreOsc.type = "sawtooth";
    _snoreOsc.frequency.value = 75;

    _snoreLfo = ctx.createOscillator();
    _snoreLfo.frequency.value = 0.6;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.07;

    _snoreGain = ctx.createGain();
    _snoreGain.gain.value = 0.05;

    _snoreLfo.connect(lfoGain);
    lfoGain.connect(_snoreGain.gain);

    _snoreOsc.connect(_snoreGain);
    _snoreGain.connect(ctx.destination);

    _snoreOsc.start();
    _snoreLfo.start();
  } catch {}
}

export function stopSnore() {
  try { _snoreOsc?.stop(); } catch {}
  try { _snoreLfo?.stop(); } catch {}
  _snoreOsc = null;
  _snoreLfo = null;
  _snoreGain = null;
}

// ─── DANCE: La Cucaracha melody loop (Web Audio synthesized notes) ───
let _cucaTimeout: ReturnType<typeof setTimeout> | null = null;
let _cucaPlaying = false;

// Notes as [frequency (0=rest), duration ms]
const CUCA_MELODY: [number, number][] = [
  // "La cu-ca-ra-cha, la cu-ca-ra-cha"
  [261.6, 100], [261.6, 100], [261.6, 100], [349.2, 280], [440, 180], [0, 60],
  [349.2, 280], [440, 380], [0, 120],
  [261.6, 100], [261.6, 100], [261.6, 100], [349.2, 280], [440, 180], [0, 60],
  [349.2, 550], [0, 160],
  // "ya no pue-de ca-mi-nar"
  [349.2, 100], [349.2, 100], [329.6, 100], [329.6, 100], [293.7, 100], [293.7, 100],
  [261.6, 380], [0, 160],
  [329.6, 100], [329.6, 100], [293.7, 100], [293.7, 100], [261.6, 100], [261.6, 100],
  [233.1, 380], [0, 350],
];

function playNote(freq: number, dur: number) {
  if (freq === 0) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;
    const d = dur / 1000;
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.setValueAtTime(0.1, t + d * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t + d);
    osc.start(t);
    osc.stop(t + d);
  } catch {}
}

function scheduleMelody(idx: number) {
  if (!_cucaPlaying || _muted) return;
  const [freq, dur] = CUCA_MELODY[idx];
  playNote(freq, dur);
  const next = (idx + 1) % CUCA_MELODY.length;
  _cucaTimeout = setTimeout(() => scheduleMelody(next), dur + 15);
}

export function startCucaracha() {
  if (_cucaPlaying) return;
  _cucaPlaying = true;
  scheduleMelody(0);
}

export function stopCucaracha() {
  _cucaPlaying = false;
  if (_cucaTimeout) {
    clearTimeout(_cucaTimeout);
    _cucaTimeout = null;
  }
}

export function isCucarachaPlaying() { return _cucaPlaying; }
