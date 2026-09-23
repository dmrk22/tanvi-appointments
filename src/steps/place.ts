import type { Step } from "./types";
import { gsap, COARSE, REDUCED } from "../motion/gsap";
import { EASE } from "../motion/tokens";
import { burstFrom } from "../motion/burst";
import { sfx } from "../motion/sfx";
import { store } from "../lib/state";
import { h, s } from "../lib/dom";
import { CONFIG } from "../config";
import { pixelSvg, PLACE_ICONS, PIN, PIX, heart } from "../components/pixelArt";

export const LINES: Record<string, string> = {
  "FOOD COURT": "Snacks are on me.",
  "SR BLOCK": "The classic spot.",
  "CV BLOCK": "Quiet corner, loud heart.",
  NAB: "Meet you at the top.",
};

export const placeStep: Step = {
  key: "place",
  title: "Where should we meet?",
  hint: "Pick a spot to meet.",
  valid: (b) => !!b.place,
  render(api) {
    const here = h("div", { class: "you-are-here", "aria-hidden": "true" }, heart(2), h("span", { class: "pixel" }, "you are here"));
    const path = s("svg", { class: "pixel-path", "aria-hidden": "true" });
    const grid = h("div", { class: "places" });
    const wrap = h("div", { class: "place-step" }, here, grid, path);
    const cards: HTMLButtonElement[] = [];

    for (const name of CONFIG.places) {
      const card = h(
        "button",
        { class: "place", type: "button", testid: `place-${name.replace(/ /g, "-")}`, "aria-pressed": String(store.get().place === name) },
        h("span", { class: "place-icon" }, pixelSvg(PLACE_ICONS[name] ?? PLACE_ICONS.NAB, PIX, 4)),
        h("span", { class: "place-name pixel" }, name),
        h("span", { class: "place-line" }, LINES[name] ?? "See you there."),
      );
      card.addEventListener("click", (e) => select(card, name, e));
      cards.push(card);
      grid.append(card);

      // desktop: tilt toward the pointer, max 10deg
      if (!COARSE && !REDUCED) {
        const rx = gsap.quickTo(card, "rotationX", { duration: 0.4, ease: "power3.out" });
        const ry = gsap.quickTo(card, "rotationY", { duration: 0.4, ease: "power3.out" });
        gsap.set(card, { transformPerspective: 600 });
        card.addEventListener("pointermove", (e) => {
          const r = card.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 20);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 20);
        });
        card.addEventListener("pointerleave", () => (rx(0), ry(0)));
      }
    }

    // mobile: tilt with the phone, only where no permission prompt is needed
    const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: unknown } | undefined;
    if (COARSE && !REDUCED && DOE && typeof DOE.requestPermission !== "function") {
      const onTilt = (e: DeviceOrientationEvent) => {
        if (!wrap.isConnected) return removeEventListener("deviceorientation", onTilt);
        const clamp = (v: number) => Math.max(-10, Math.min(10, v));
        gsap.to(cards, { rotationY: clamp((e.gamma ?? 0) / 3), rotationX: clamp(((e.beta ?? 45) - 45) / -4), transformPerspective: 600, duration: 0.5, overwrite: "auto" });
      };
      addEventListener("deviceorientation", onTilt);
    }

    function select(card: HTMLButtonElement, name: string, e: Event) {
      store.set({ place: name });
      cards.forEach((c) => {
        const on = c === card;
        c.setAttribute("aria-pressed", String(on));
        c.classList.toggle("picked", on);
        gsap.to(c, { scale: on ? 1.05 : 0.96, y: on ? -6 : 0, opacity: on ? 1 : 0.62, duration: 0.45, ease: on ? EASE.bouncy : EASE.smooth });
        c.querySelector(".pin")?.remove();
      });
      const pin = h("span", { class: "pin", "aria-hidden": "true" }, pixelSvg(PIN, PIX, 4));
      card.append(pin);
      gsap.fromTo(pin, { y: -70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "bounce.out" });
      drawPath(card);
      burstFrom(e, card, 12);
      sfx.pluck(cards.indexOf(card) + 2);
      api.changed();
    }

    // dashed pixel path: "you are here" -> down -> across -> down onto the card
    function drawPath(card: HTMLElement) {
      path.replaceChildren();
      const box = wrap.getBoundingClientRect();
      const a = here.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      const x0 = Math.round(a.left + a.width / 2 - box.left);
      const y0 = Math.round(a.bottom - box.top + 2);
      const x1 = Math.round(c.left + c.width / 2 - box.left);
      const y1 = Math.round(c.top - box.top + 4);
      const g = grid.getBoundingClientRect();
      const pts: [number, number][] = [];
      const seg = (xa: number, ya: number, xb: number, yb: number) => {
        const n = Math.max(1, Math.round(Math.hypot(xb - xa, yb - ya) / 9));
        for (let k = 0; k < n; k++) pts.push([xa + ((xb - xa) * k) / n, ya + ((yb - ya) * k) / n]);
      };
      // walk the gaps, never across another card: down the middle, then along the row gap above the card
      const gx = Math.round(g.left + g.width / 2 - box.left);
      const rowGap = Math.round(c.top - box.top - 12);
      seg(x0, y0, gx, y0);
      seg(gx, y0, gx, rowGap);
      seg(gx, rowGap, x1, rowGap);
      seg(x1, rowGap, x1, y1);
      const rects = pts.map(([x, y]) => s("rect", { x: Math.round(x) - 2, y: Math.round(y) - 2, width: 4, height: 4, fill: "#FF5FA2" }));
      path.append(...rects);
      gsap.from(rects, { opacity: 0, scale: 0, transformOrigin: "50% 50%", duration: 0.12, stagger: 0.02 });
    }

    gsap.from(cards, { y: 40, opacity: 0, scale: 0.8, rotation: (i) => (i % 2 ? 4 : -4), duration: 0.6, ease: EASE.pop, stagger: 0.08, delay: 0.2 });
    return wrap;
  },
};
