import { gsap, TEST } from "../motion/gsap";
import { heartBurst } from "../motion/burst";
import { sfx } from "../motion/sfx";
import { haptics } from "../motion/haptics";
import { centre, h, s } from "../lib/dom";
import { HEART_D } from "./pixelArt";

const HOLD = 1.2;

/**
 * "Hold to confirm": holding fills a heart with pink liquid bottom-up, letting go drains it.
 * Keyboard (Enter/Space) and ?test=1 confirm on a single press.
 */
export function holdButton(label: string, onDone: () => void) {
  const clipId = `hold-${Math.random().toString(36).slice(2, 8)}`;
  const level = s("rect", { x: -1, y: 11, width: 13, height: 12 });
  const icon = s(
    "svg",
    { class: "hold-heart", viewBox: "-1 -1 13 12", width: 30, height: 28, "aria-hidden": "true" },
    s("defs", {}, s("clipPath", { id: clipId }, level)),
    s("path", { d: HEART_D, fill: "#E23E86", "clip-path": `url(#${clipId})` }),
    s("path", { d: HEART_D, fill: "none", stroke: "#FFFFFF", "stroke-width": 1.3, "stroke-linejoin": "round" }),
  );
  const btn = h("button", { class: "pill hold", type: "button", testid: "confirm" }, icon, h("span", {}, label));
  const p = { v: 0 };
  let tween: gsap.core.Tween | null = null;
  let done = false;

  const render = () => level.setAttribute("y", String(11 - p.v * 12));
  function finish() {
    if (done) return;
    done = true;
    tween?.kill();
    p.v = 1;
    render();
    const c = centre(btn);
    heartBurst(c.x, c.y, 30);
    haptics.success();
    gsap.fromTo(btn, { scale: 1.12 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" });
    onDone();
  }
  function press(e: PointerEvent) {
    if (done || e.button > 0) return;
    btn.setPointerCapture?.(e.pointerId);
    sfx.pluck(0);
    tween?.kill();
    tween = gsap.to(p, { v: 1, duration: HOLD * (1 - p.v), ease: "none", onUpdate: render, onComplete: finish });
    gsap.to(btn, { scale: 0.96, duration: 0.15 });
  }
  function release() {
    if (done || !tween) return;
    tween.kill();
    tween = gsap.to(p, { v: 0, duration: 0.4, ease: "power2.out", onUpdate: render });
    gsap.to(btn, { scale: 1, duration: 0.3, ease: "back.out(3)" });
  }

  btn.addEventListener("pointerdown", press);
  btn.addEventListener("pointerup", release);
  btn.addEventListener("pointercancel", release);
  btn.addEventListener("lostpointercapture", release);
  btn.addEventListener("contextmenu", (e) => e.preventDefault());
  btn.addEventListener("click", (e) => {
    // detail 0 = keyboard activation
    if (TEST || e.detail === 0) finish();
  });
  return btn;
}
