import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(SplitText, DrawSVGPlugin, MorphSVGPlugin, ScrambleTextPlugin);

export const TEST = new URLSearchParams(location.search).get("test") === "1";
export const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const COARSE = matchMedia("(pointer: coarse)").matches;

/** mulberry32 — deterministic Math.random for tests */
export function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

if (TEST) {
  gsap.globalTimeline.timeScale(20);
  Math.random = seeded(1402);
} else if (REDUCED) {
  // every duration 60% shorter, in one place
  gsap.globalTimeline.timeScale(2.5);
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];

export { gsap, SplitText };
