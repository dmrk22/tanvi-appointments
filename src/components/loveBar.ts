import { gsap, REDUCED } from "../motion/gsap";
import { EASE } from "../motion/tokens";
import { sfx } from "../motion/sfx";
import { fx } from "../motion/particles";
import { h } from "../lib/dom";
import { heart } from "./pixelArt";

const SEGS = 12;
const MOODS: [number, string][] = [
  [100, "full"],
  [83, "almost there"],
  [67, "can't stop smiling"],
  [50, "heart racing"],
  [33, "blushing"],
  [17, "getting cute"],
  [0, "warming up"],
];
export const mood = (pct: number) => MOODS.find(([t]) => pct >= t)![1];

export function loveBar(big = false) {
  const segs = Array.from({ length: SEGS }, () => h("i", { class: "seg" }));
  const rider = h("span", { class: "rider" }, heart(big ? 3 : 2));
  const rail = h("span", { class: "rail" }, rider);
  const track = h("div", { class: "track" }, ...segs, rail);
  const label = h("span", { class: "pct pixel", testid: "love-pct" }, "0%");
  const caption = h("p", { class: "mood", testid: "love-mood" }, mood(0));
  const el = h(
    "div",
    { class: `lovebar${big ? " big" : ""}`, role: "progressbar", "aria-label": "Love bar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": 0 },
    h("div", { class: "row" }, track, label),
    caption,
  );
  let filled = 0;
  let pct = 0;

  if (!REDUCED) gsap.to(rider, { y: -3, duration: 0.4, yoyo: true, repeat: -1, ease: "sine.inOut" });

  function fillTo(target: number) {
    pct = Math.round(target);
    const n = Math.round((target / 100) * SEGS);
    const tl = gsap.timeline();
    const step = n >= filled ? 1 : -1;
    let k = 0;
    for (let i = filled; i !== n; i += step, k++) {
      const seg = segs[step > 0 ? i : i - 1];
      const idx = step > 0 ? i : i - 1;
      tl.add(() => {
        seg.classList.toggle("on", step > 0);
        if (step > 0) sfx.tick(idx);
      }, k * 0.07);
      if (step > 0) tl.fromTo(seg, { y: 0 }, { y: -5, duration: 0.08, yoyo: true, repeat: 1, ease: "power1.out" }, k * 0.07);
    }
    tl.to(rail, { x: 0, xPercent: (n / SEGS) * 100, duration: Math.max(0.2, k * 0.07), ease: "power1.inOut" }, 0);
    const counter = { v: parseInt(label.textContent!) || 0 };
    tl.to(counter, { v: pct, duration: Math.max(0.2, k * 0.07), onUpdate: () => void (label.textContent = `${Math.round(counter.v)}%`) }, 0);
    filled = n;
    caption.textContent = mood(pct);
    el.setAttribute("aria-valuenow", String(pct));
    return tl;
  }

  /** success only: the bar stretches past the screen, cracks, spills hearts, label glitches to ∞ */
  function overflow() {
    const tl = gsap.timeline();
    tl.to(track, { scaleX: 2.6, duration: 0.5, ease: EASE.bouncy })
      .add(() => {
        segs.forEach((s) => {
          const r = s.getBoundingClientRect();
          fx.burst(r.left + r.width / 2, r.top + r.height / 2, 3, { kinds: ["heart", "pixel"], speed: 240, size: [8, 14] });
        });
        sfx.fanfare(true);
      })
      .to(segs, {
        rotation: () => gsap.utils.random(-25, 25),
        y: () => gsap.utils.random(-10, 14),
        duration: 0.35,
        ease: EASE.pop,
        stagger: 0.02,
      }, "<")
      .to(label, { duration: 0.35, scrambleText: { text: "999%", chars: "0123456789%", speed: 1 } })
      .to(label, { duration: 0.45, scrambleText: { text: "∞", chars: "0123456789%♥", speed: 1 } })
      .add(() => {
        label.classList.add("inf"); // Silkscreen has no ∞ glyph
        caption.textContent = "love bar: full. overflowing.";
        el.setAttribute("aria-valuetext", "overflowing");
      })
      .fromTo(label, { scale: 1.8 }, { scale: 1, duration: 0.5, ease: EASE.bouncy });
    return tl;
  }

  return { el, fillTo, overflow, get pct() { return pct; } };
}
