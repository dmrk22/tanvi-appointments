import { fx } from "./particles";
import { REDUCED, pick, rand } from "./gsap";

export function startTrail() {
  if (REDUCED) return;
  let lx = -1;
  let ly = -1;
  let acc = 0;
  addEventListener(
    "pointermove",
    (e) => {
      if (lx >= 0) acc += Math.hypot(e.clientX - lx, e.clientY - ly);
      lx = e.clientX;
      ly = e.clientY;
      if (acc < 24) return;
      acc = 0;
      fx.spawn({
        kind: Math.random() < 0.55 ? "sparkle" : "heart",
        mode: "burst",
        x: e.clientX,
        y: e.clientY,
        vx: rand(-30, 30),
        vy: rand(-80, -30),
        size: rand(7, 12),
        life: 0.5,
        color: pick(["#FF5FA2", "#5B9BFF", "#FFD1E3"]),
      });
    },
    { passive: true },
  );
  addEventListener("pointerup", () => (lx = -1), { passive: true });
}
