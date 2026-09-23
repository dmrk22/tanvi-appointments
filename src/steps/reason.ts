import type { Step } from "./types";
import { gsap, REDUCED, rand } from "../motion/gsap";
import { EASE } from "../motion/tokens";
import { burstFrom } from "../motion/burst";
import { fx } from "../motion/particles";
import { sfx } from "../motion/sfx";
import { haptics } from "../motion/haptics";
import { store } from "../lib/state";
import { h, qs } from "../lib/dom";

export const REASONS = ["Missing you", "Food date", "Walk and talk", "Hug emergency", "Study date (we won't study)", "Just because", "I have gossip"];
const MAX_NOTE = 140;

export const missWords = (v: number) =>
  v >= 100 ? "∞" : v > 80 ? "unreasonably" : v > 50 ? "a lot a lot" : v > 20 ? "quite a lot" : "a little";

export const reasonStep: Step = {
  key: "reason",
  title: "What's the occasion?",
  hint: "Pick a reason, or write one.",
  valid: (b) => b.reasons.length > 0 || b.note.trim().length > 0,
  render(api) {
    const b = store.get();
    const chips = REASONS.map((r, i) => {
      const fill = h("span", { class: "fill", "aria-hidden": "true" });
      const chip = h(
        "button",
        { class: "chip reason", type: "button", testid: `reason-${i}`, "aria-pressed": String(b.reasons.includes(r)) },
        fill,
        h("span", { class: "label" }, r),
      );
      if (b.reasons.includes(r)) gsap.set(fill, { clipPath: "circle(150% at 50% 50%)" });
      chip.addEventListener("click", (e) => {
        const cur = store.get().reasons;
        const on = !cur.includes(r);
        store.set({ reasons: on ? [...cur, r] : cur.filter((x) => x !== r) });
        chip.setAttribute("aria-pressed", String(on));
        // liquid fill grows from the tap point
        const rc = chip.getBoundingClientRect();
        const pe = e as PointerEvent;
        const x = pe.clientX ? ((pe.clientX - rc.left) / rc.width) * 100 : 50;
        const y = pe.clientY ? ((pe.clientY - rc.top) / rc.height) * 100 : 50;
        gsap.fromTo(
          fill,
          { clipPath: `circle(${on ? 0 : 150}% at ${x}% ${y}%)` },
          { clipPath: `circle(${on ? 150 : 0}% at ${x}% ${y}%)`, duration: on ? 0.6 : 0.35, ease: on ? "power2.out" : "power2.in" },
        );
        gsap.fromTo(chip, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: EASE.bouncy });
        if (on) burstFrom(e, chip, 10);
        else sfx.pluck(1);
        api.changed();
      });
      return chip;
    });

    const count = h("span", { class: "pixel note-count", testid: "note-count" }, `${b.note.length}/${MAX_NOTE}`);
    const note = h("textarea", {
      id: "note",
      class: "note",
      testid: "note",
      maxlength: MAX_NOTE,
      rows: 3,
      placeholder: "Anything else he should know?",
    });
    note.value = b.note;
    note.addEventListener("input", () => {
      store.set({ note: note.value });
      count.textContent = `${note.value.length}/${MAX_NOTE}`;
      const r = note.getBoundingClientRect();
      fx.spawn({ kind: "heart", mode: "burst", x: r.right - 16, y: r.bottom - 14, vx: rand(-20, 10), vy: rand(-260, -160), size: rand(8, 13), life: 0.9 });
      api.changed();
    });

    // miss-o-meter: native range for a11y, a heart that grows with the value on top
    const range = h("input", { type: "range", id: "miss", class: "miss", testid: "miss", min: 1, max: 100, value: b.missMeter, "aria-valuetext": missWords(b.missMeter) });
    const thumb = h("span", { class: "miss-thumb", "aria-hidden": "true" });
    const words = h("output", { class: "miss-words", for: "miss", testid: "miss-words" }, missWords(b.missMeter));
    let wasMax = b.missMeter >= 100;
    const paint = (v: number) => {
      thumb.style.setProperty("--p", String((v - 1) / 99));
      gsap.to(thumb, { scale: 1 + 0.8 * ((v - 1) / 99), duration: 0.25, ease: EASE.pop });
    };
    range.addEventListener("input", () => {
      const v = Number(range.value);
      store.set({ missMeter: v });
      words.textContent = missWords(v);
      range.setAttribute("aria-valuetext", missWords(v));
      paint(v);
      if (v >= 100 && !wasMax) {
        if (!REDUCED) gsap.fromTo(qs("#app"), { x: 0 }, { keyframes: { x: [-8, 8, -6, 5, -3, 0] }, duration: 0.5, ease: "none" });
        fx.rain(1.5, ["heart", "heart", "petal"]);
        sfx.fanfare(true);
        haptics.success();
        gsap.fromTo(words, { scale: 2.2 }, { scale: 1, duration: 0.6, ease: EASE.bouncy });
      }
      wasMax = v >= 100;
    });
    paint(b.missMeter);

    gsap.from(chips, { scale: 0, opacity: 0, duration: 0.5, ease: EASE.bouncy, stagger: 0.05, delay: 0.2 });

    return h(
      "div",
      { class: "reason-step" },
      h("div", { class: "chips" }, ...chips),
      h("label", { class: "field-label", for: "note" }, "A note (optional)"),
      h("div", { class: "note-wrap" }, note, count),
      h("label", { class: "field-label", for: "miss" }, "How much do you miss me?"),
      h("div", { class: "miss-wrap" }, h("div", { class: "miss-track" }, range, thumb), words),
    );
  },
};
