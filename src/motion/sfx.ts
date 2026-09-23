import { readJSON, writeJSON } from "../lib/storage";

let ctx: AudioContext | null = null;
let enabled = readJSON("tanvi.sound", true);

function ac() {
  if (!enabled) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// AudioContext may only start after a user gesture
addEventListener("pointerdown", () => ac(), { once: true, capture: true });

function tone(freq: number, type: OscillatorType, at: number, dur: number, gain = 0.15, to?: number) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function shimmer(at: number, dur: number) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + at;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  const hp = a.createBiquadFilter();
  const g = a.createGain();
  hp.type = "highpass";
  hp.frequency.value = 6000;
  g.gain.value = 0.06;
  src.buffer = buf;
  src.connect(hp).connect(g).connect(a.destination);
  src.start(t);
}

const note = (semis: number) => 1046.5 * 2 ** (semis / 12); // C6 = 0
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]; // pentatonic

export const sfx = {
  get on() {
    return enabled;
  },
  toggle() {
    enabled = !enabled;
    writeJSON("tanvi.sound", enabled);
    return enabled;
  },
  pop: () => tone(880, "sine", 0, 0.12, 0.18, 330),
  pluck: (i = 0) => tone(note(SCALE[Math.abs(i) % SCALE.length] - 12), "triangle", 0, 0.25, 0.14),
  tick: (i = 0) => tone(note(SCALE[i % SCALE.length] - 12), "square", 0, 0.05, 0.04),
  chime: () => [0, 4, 7, 12].forEach((s, i) => tone(note(s), "sine", i * 0.08, 0.5, 0.12)),
  fanfare(lite = false) {
    const seq = lite ? [0, 4, 7, 12] : [-12, -5, 0, 4, 7, 12, 16];
    seq.forEach((s, i) => tone(note(s), "triangle", i * 0.07, 0.6, 0.13));
    if (!lite) tone(note(12), "sine", seq.length * 0.07, 1.2, 0.12);
    shimmer(0.1, lite ? 0.5 : 1.2);
  },
  buzz: () => tone(160, "square", 0, 0.15, 0.05, 120),
};
