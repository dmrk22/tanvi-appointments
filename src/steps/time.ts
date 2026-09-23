import type { Step } from "../scenes/wizard";
import { gsap } from "../motion/gsap";
import { EASE, STAGGER } from "../motion/tokens";
import { burstFrom } from "../motion/burst";
import { sfx } from "../motion/sfx";
import { store } from "../lib/state";
import { h, s } from "../lib/dom";
import { CONFIG } from "../config";
import { now, toMin, fromMin, time12, weekday, emergencyMinutes } from "../lib/when";
import { clock } from "../components/clock";
import { HEART_D } from "../components/pixelArt";
import { toast } from "../components/toast";

/** a time is fine unless it is today and already gone */
export function timeOk(date: string, time: string, t = now()) {
  return date !== t.date || toMin(time) > t.minutes;
}

const svgIcon = (cls: string, ...kids: SVGElement[]) =>
  s("svg", { class: `tod ${cls}`, viewBox: "0 0 24 24", width: 22, height: 22, "aria-hidden": "true" }, ...kids);
const ICONS = {
  sun: () =>
    svgIcon(
      "sun",
      s("g", { class: "rays", stroke: "#FF5FA2", "stroke-width": 2, "stroke-linecap": "round" }, ...[0, 45, 90, 135, 180, 225, 270, 315].map((a) =>
        s("line", { x1: 12, y1: 2.5, x2: 12, y2: 5, transform: `rotate(${a} 12 12)` }),
      )),
      s("circle", { cx: 12, cy: 12, r: 5, fill: "#FF5FA2" }),
    ),
  cloud: () =>
    svgIcon(
      "cloud",
      s("circle", { cx: 7, cy: 8, r: 3.5, fill: "#FF5FA2" }),
      s("path", { class: "puff", d: "M6 18h11a4 4 0 0 0 0-8 5 5 0 0 0-9.6 1.4A3.3 3.3 0 0 0 6 18z", fill: "#5B9BFF" }),
    ),
  sunset: () =>
    svgIcon(
      "sunset",
      s("defs", {}, s("clipPath", { id: "horizon" }, s("rect", { x: 0, y: 0, width: 24, height: 17 }))),
      s("circle", { class: "setting", cx: 12, cy: 15, r: 6, fill: "#FF5FA2", "clip-path": "url(#horizon)" }),
      s("line", { x1: 2, y1: 17.5, x2: 22, y2: 17.5, stroke: "#5B9BFF", "stroke-width": 2, "stroke-linecap": "round" }),
    ),
  moon: () =>
    svgIcon(
      "moon",
      s("path", { d: "M15 3.5a8.5 8.5 0 1 0 5.5 14.8A7 7 0 0 1 15 3.5z", fill: "#5B9BFF" }),
      s("path", { class: "twinkle", d: "M19 3l.9 2.1L22 6l-2.1.9L19 9l-.9-2.1L16 6l2.1-.9z", fill: "#FF5FA2" }),
    ),
};

const GROUPS: [string, keyof typeof ICONS, number, number][] = [
  ["Morning", "sun", 0, 12 * 60],
  ["Afternoon", "cloud", 12 * 60, 17 * 60],
  ["Evening", "sunset", 17 * 60, 20 * 60],
  ["Night", "moon", 20 * 60, 24 * 60],
];

export const timeStep: Step = {
  key: "time",
  title: "What time?",
  hint: "Pick a time. Any time you like.",
  valid: (b) => !!b.date && !!b.time && timeOk(b.date, b.time),
  render(api) {
    const b = store.get();
    const t = now();
    const isToday = b.date === t.date;
    const c = clock(b.time);
    const caption = h("p", { class: "clock-caption", testid: "time-caption", "aria-live": "polite" });
    const say = (time: string | null) =>
      (caption.textContent = time ? `${time12(time)} on ${weekday(b.date!)}. Noted.` : "Pick a slot. The clock will do the rest.");
    say(b.time);

    const chips: HTMLButtonElement[] = [];
    function pick(btn: HTMLButtonElement, time: string, e: Event) {
      // the page may have sat open while this slot went by
      if (!timeOk(b.date!, time)) {
        btn.disabled = true;
        toast("That time just passed. Pick a later one.");
        return;
      }
      chips.forEach((x) => x.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      store.set({ time });
      c.set(time);
      say(time);
      gsap.fromTo(btn, { scale: 0.85 }, { scale: 1, duration: 0.5, ease: EASE.bouncy });
      burstFrom(e, btn, 10);
      sfx.pluck(chips.indexOf(btn));
      api.changed();
    }

    // the clock stays in view while the slots scroll under it
    const body = h("div", { class: "time-step" }, h("div", { class: "clock-head" }, h("div", { class: "clock-wrap" }, c.el), caption));

    if (isToday && t.minutes < toMin(CONFIG.lastSlot)) {
      const siren = h(
        "span",
        { class: "siren", "aria-hidden": "true" },
        ...[0, 1, 2].map(() => s("svg", { viewBox: "0 0 11 10", width: 12, height: 11 }, s("path", { d: HEART_D, fill: "#FF5FA2" }))),
      );
      const now15 = h("button", { class: "chip emergency", type: "button", testid: "slot-now", "aria-pressed": "false" }, siren, "Right now (emergency)");
      now15.addEventListener("click", (e) => {
        const time = fromMin(Math.min(emergencyMinutes(now().minutes), 23 * 60 + 55));
        pick(now15, time, e);
        now15.lastChild!.textContent = `Right now (emergency) · ${time12(time)}`;
      });
      chips.push(now15);
      body.append(now15);
    }

    const first = toMin(CONFIG.firstSlot);
    const last = toMin(CONFIG.lastSlot);
    for (const [name, icon, from, to] of GROUPS) {
      const list = h("div", { class: "chips" });
      for (let m = Math.max(first, from); m < to && m <= last; m += CONFIG.slotMinutes) {
        const time = fromMin(m);
        const gone = isToday && m <= t.minutes;
        const chip = h(
          "button",
          { class: "chip", type: "button", testid: `slot-${time}`, "aria-pressed": String(b.time === time), disabled: gone },
          time12(time),
        );
        chip.addEventListener("click", (e) => pick(chip, time, e));
        chips.push(chip);
        list.append(chip);
      }
      if (!list.children.length) continue;
      body.append(h("section", { class: "slot-group" }, h("h3", {}, ICONS[icon](), name), list));
      gsap.from(list.children, { scale: 0.4, opacity: 0, duration: 0.4, ease: EASE.pop, stagger: STAGGER.tight, delay: 0.25 + GROUPS.findIndex((g) => g[0] === name) * 0.12 });
    }
    return body;
  },
};
