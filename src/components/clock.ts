import { gsap } from "../motion/gsap";
import { EASE } from "../motion/tokens";
import { s } from "../lib/dom";
import { HEART_D } from "./pixelArt";

/** 180px analog clock: blush face, heart ticks, cornflower hands, bubblegum centre heart */
export function clock(initial: string | null) {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    const x = 90 + Math.sin(a) * 68;
    const y = 90 - Math.cos(a) * 68;
    const k = i % 3 === 0 ? 1 : 0.65;
    return s("path", {
      d: HEART_D,
      fill: i % 3 === 0 ? "#FF5FA2" : "#FFFFFF",
      transform: `translate(${x - 5.5 * k} ${y - 5 * k}) scale(${k})`,
    });
  });
  const hour = s("line", { x1: 90, y1: 94, x2: 90, y2: 52, stroke: "#5B9BFF", "stroke-width": 7, "stroke-linecap": "round" });
  const minute = s("line", { x1: 90, y1: 96, x2: 90, y2: 34, stroke: "#5B9BFF", "stroke-width": 4.5, "stroke-linecap": "round" });
  const el = s(
    "svg",
    { class: "clock", viewBox: "0 0 180 180", width: 180, height: 180, "aria-hidden": "true" },
    s("circle", { cx: 90, cy: 90, r: 86, fill: "#FFFFFF" }),
    s("circle", { cx: 90, cy: 90, r: 80, fill: "#FFD1E3" }),
    s("circle", { cx: 72, cy: 60, r: 34, fill: "#FFFFFF", opacity: 0.35 }),
    ...ticks,
    hour,
    minute,
    s("path", { d: HEART_D, fill: "#FF5FA2", stroke: "#FFFFFF", "stroke-width": 0.8, transform: "translate(80.1 81) scale(1.8)" }),
  );

  const angles = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return { h: (h % 12) * 30 + m * 0.5, m: m * 6 };
  };
  // svgOrigin is in this svg's own coordinates, so 90 90 is the centre
  const a0 = angles(initial ?? "10:10");
  gsap.set(hour, { rotation: a0.h, svgOrigin: "90 90" });
  gsap.set(minute, { rotation: a0.m, svgOrigin: "90 90" });

  function set(hhmm: string) {
    const a = angles(hhmm);
    gsap.to(hour, { rotation: `${a.h}_short`, svgOrigin: "90 90", duration: 1.1, ease: EASE.bouncy });
    gsap.to(minute, { rotation: `${a.m}_short`, svgOrigin: "90 90", duration: 1.1, ease: EASE.bouncy });
    gsap.fromTo(el, { y: 0 }, { y: -12, duration: 0.14, yoyo: true, repeat: 1, ease: "power2.out" });
  }
  return { el, set };
}
