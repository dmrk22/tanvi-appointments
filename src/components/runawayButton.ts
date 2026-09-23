import { gsap, COARSE, rand } from "../motion/gsap";
import { EASE } from "../motion/tokens";
import { sfx } from "../motion/sfx";
import { h } from "../lib/dom";
import { announce } from "./toast";

const LINES = ["maybe later", "are you sure?", "think again", "nope", "ok fine, book it"];

/**
 * "maybe later": jumps away on hover/tap and changes its text; on the fifth
 * attempt it gives up and books. Keyboard presses only advance the text.
 */
export function runawayButton(avoid: () => HTMLElement, onGiveUp: (e: MouseEvent) => void) {
  let n = 0;
  let tamedAt = 0;
  const btn = h("button", { class: "link runaway", testid: "maybe-later", type: "button" }, LINES[0]);
  const tame = () => n >= LINES.length - 1;

  function advance() {
    n = Math.min(n + 1, LINES.length - 1);
    btn.textContent = LINES[n];
    announce(LINES[n]);
    if (tame()) {
      btn.classList.add("tame");
      tamedAt = performance.now();
    }
  }

  function jump() {
    if (tame()) return;
    const r = btn.getBoundingClientRect();
    const cur = { x: Number(gsap.getProperty(btn, "x")), y: Number(gsap.getProperty(btn, "y")) };
    const home = { x: r.left - cur.x, y: r.top - cur.y };
    const a = avoid().getBoundingClientRect();
    let tx = 0;
    let ty = 0;
    for (let i = 0; i < 12; i++) {
      tx = rand(16, innerWidth - r.width - 16);
      ty = rand(80, innerHeight - r.height - 40);
      const hit = tx < a.right + 12 && tx + r.width > a.left - 12 && ty < a.bottom + 12 && ty + r.height > a.top - 12;
      if (!hit && Math.hypot(tx - r.left, ty - r.top) > 90) break;
    }
    gsap.to(btn, { x: tx - home.x, y: ty - home.y, rotation: rand(-8, 8), duration: 0.45, ease: EASE.pop });
    sfx.pop();
    advance();
  }

  if (!COARSE) btn.addEventListener("pointerenter", jump);
  btn.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") jump();
  });
  btn.addEventListener("click", (e) => {
    // already tame before this press (and not the same tap that tamed it) -> book
    if (tame() && performance.now() - tamedAt > 300) return onGiveUp(e);
    // keyboard (detail 0) just advances the text, never moves or traps focus
    if (e.detail === 0) advance();
  });
  return btn;
}
