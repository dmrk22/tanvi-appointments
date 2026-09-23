import { gsap, REDUCED, rand } from "../motion/gsap";
import { EASE } from "../motion/tokens";
import { sfx } from "../motion/sfx";
import { haptics } from "../motion/haptics";
import { h, s } from "../lib/dom";
import { CONFIG } from "../config";
import { now, addDays, longDate, toMin, MONTHS } from "../lib/when";
import { toast } from "./toast";
import { heart, pixelSvg, PIX } from "./pixelArt";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const arrow = (dir: 1 | -1) =>
  s(
    "svg",
    { viewBox: "0 0 24 24", "aria-hidden": "true", fill: "none", stroke: "currentColor", "stroke-width": 2.6, "stroke-linecap": "round", "stroke-linejoin": "round" },
    s("path", { d: dir < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7" }),
  );

export function calendar(selected: string | null, onSelect: (iso: string, el: HTMLElement, e: Event) => void) {
  const t = now();
  const today = t.date;
  const todayOpen = t.minutes < toMin(CONFIG.lastSlot);
  const last = addDays(today, CONFIG.bookingWindowDays);
  const [ty, tm] = today.split("-").map(Number);
  const [ly, lm] = last.split("-").map(Number);
  const start = (selected ?? today).split("-").map(Number);
  let vy = start[0];
  let vm = start[1] - 1;
  let focusIso = selected ?? (todayOpen ? today : addDays(today, 1));

  const status = (d: string) =>
    d < today || (d === today && !todayOpen) ? "past" : d > last ? "far" : "open";

  const title = h("h3", { class: "cal-title", "aria-live": "polite" });
  const prev = h("button", { class: "round cal-nav", type: "button", testid: "cal-prev", "aria-label": "Previous month" }, arrow(-1));
  const next = h("button", { class: "round cal-nav", type: "button", testid: "cal-next", "aria-label": "Next month" }, arrow(1));
  const flip = h("div", { class: "cal-flip" });
  const label = h("p", { class: "cal-label", testid: "date-label" }, selected ? longDate(selected) : "Tap a day. Any day. Well, a future one.");
  const el = h(
    "div",
    { class: "calendar" },
    h("div", { class: "cal-head" }, prev, title, next),
    h("div", { class: "cal-week", "aria-hidden": "true" }, ..."SMTWTFS".split("").map((c) => h("span", {}, c))),
    flip,
    label,
  );

  let grid: HTMLElement | null = null;
  let flipTl: gsap.core.Timeline | null = null;

  function build() {
    const first = new Date(Date.UTC(vy, vm, 1)).getUTCDay();
    const days = new Date(Date.UTC(vy, vm + 1, 0)).getUTCDate();
    title.replaceChildren(MONTHS[vm], h("span", { class: "cal-year" }, ` ${vy}`));
    prev.disabled = vy * 12 + vm <= ty * 12 + tm - 1;
    next.disabled = vy * 12 + vm >= ly * 12 + lm - 1;
    const g = h("div", { class: "cal-grid", role: "group", "aria-label": `${MONTHS[vm]} ${vy}` });
    for (let i = 0; i < first; i++) g.append(h("span", { class: "blank" }));
    for (let d = 1; d <= days; d++) {
      const id = iso(vy, vm, d);
      const st = status(id);
      const col = (first + d - 1) % 7;
      const b = h(
        "button",
        {
          class: `day ${st}${id === today ? " today" : ""}${col === 0 || col === 6 ? " weekend" : ""}`,
          type: "button",
          testid: `day-${id}`,
          "data-iso": id,
          "data-col": col,
          "data-row": Math.floor((first + d - 1) / 7),
          "aria-label": longDate(id),
          "aria-pressed": String(id === selected),
          "aria-disabled": st !== "open" ? "true" : null,
          tabindex: id === focusIso ? 0 : -1,
        },
        h("span", { class: "num" }, d),
      );
      if (id === today) b.append(h("span", { class: "ring", "aria-hidden": "true" }));
      if (col === 0 || col === 6) b.append(pixelSvg([".X.", "XBX", ".X."], { X: PIX.X, B: PIX.B }, 2, "px wk"));
      if (st !== "open") b.append(h("span", { class: "z", "aria-hidden": "true", style: `animation-delay:${rand(0, 3).toFixed(2)}s` }, "z"));
      if (id === selected) b.append(stamp());
      g.append(b);
    }
    if (!g.querySelector('[tabindex="0"]')) g.querySelector<HTMLElement>(".day")?.setAttribute("tabindex", "0");
    return g;
  }

  function stamp() {
    return h("span", { class: "stamp-heart", "aria-hidden": "true" }, heart(3));
  }

  function show(dir: 0 | 1 | -1) {
    flipTl?.progress(1); // finish a running flip first so at most two grids are ever mounted
    const old = grid;
    grid = build();
    // the new grid is mounted at once (stacked in the same cell) so focus can move into it immediately
    flip.append(grid);
    const cells = grid.querySelectorAll(".day");
    if (!old) {
      gsap.from(cells, {
        scale: 0,
        opacity: 0,
        duration: 0.4,
        ease: EASE.pop,
        stagger: (_i, c: HTMLElement) => (Number(c.dataset.row) + Number(c.dataset.col)) * 0.03,
      });
      return;
    }
    old.inert = true;
    flipTl = gsap
      .timeline()
      .to(old, { rotationX: 90 * dir, opacity: 0, duration: 0.22, ease: "power2.in", onComplete: () => old.remove() })
      .fromTo(grid, { rotationX: -90 * dir, opacity: 0 }, { rotationX: 0, opacity: 1, duration: 0.4, ease: EASE.pop });
  }

  function month(dir: 1 | -1) {
    vm += dir;
    if (vm < 0) (vm = 11), vy--;
    if (vm > 11) (vm = 0), vy++;
    sfx.pluck(dir > 0 ? 4 : 1);
    show(dir);
  }

  prev.addEventListener("click", () => !prev.disabled && month(-1));
  next.addEventListener("click", () => !next.disabled && month(1));

  el.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".day");
    if (!b || !grid?.contains(b)) return;
    const id = b.dataset.iso!;
    if (b.getAttribute("aria-disabled")) {
      gsap.fromTo(b, { rotation: 0 }, { keyframes: { rotation: [-12, 10, -6, 4, 0] }, duration: 0.45, ease: "none" });
      haptics.error();
      sfx.buzz();
      toast(status(id) === "far" ? `That's a bit far. Pick a day in the next ${CONFIG.bookingWindowDays} days.` : "That day already happened. Pick a future one.");
      return;
    }
    grid.querySelectorAll(".day[aria-pressed=true]").forEach((x) => {
      x.setAttribute("aria-pressed", "false");
      x.querySelector(".stamp-heart")?.remove();
    });
    b.setAttribute("aria-pressed", "true");
    selected = focusIso = id;
    roving(b);
    const st = stamp();
    b.append(st);
    // drop + squash and stretch
    gsap
      .timeline()
      .fromTo(st, { y: -46, opacity: 0, scaleY: 1.3, scaleX: 0.8 }, { y: 0, opacity: 1, duration: 0.22, ease: "power2.in" })
      .to(st, { scaleY: 0.8, scaleX: 1.2, duration: 0.07, ease: "power1.out" })
      .to(st, { scaleY: 1, scaleX: 1, duration: 0.5, ease: EASE.bouncy });
    // the rest of the week does a little wave
    const row = [...grid.querySelectorAll<HTMLElement>(`.day[data-row="${b.dataset.row}"]`)].filter((x) => x !== b);
    if (!REDUCED)
      gsap.fromTo(
        row,
        { y: 0 },
        {
          y: -7,
          duration: 0.16,
          yoyo: true,
          repeat: 1,
          ease: "power1.out",
          delay: 0.12,
          stagger: (_i, c: HTMLElement) => Math.abs(Number(c.dataset.col) - Number(b.dataset.col)) * 0.05,
        },
      );
    label.textContent = longDate(id);
    gsap.fromTo(label, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: EASE.pop });
    sfx.pluck(Number(id.slice(8)));
    onSelect(id, b, e);
  });

  function roving(b: HTMLElement) {
    grid?.querySelectorAll('.day[tabindex="0"]').forEach((x) => x.setAttribute("tabindex", "-1"));
    b.setAttribute("tabindex", "0");
  }

  // arrow keys move focus through the grid; crossing a month edge flips the month
  el.addEventListener("keydown", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>(".day");
    if (!b) return;
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const target = addDays(b.dataset.iso!, delta);
    const [y, m] = target.split("-").map(Number);
    if (y * 12 + m - 1 !== vy * 12 + vm) {
      const dir = delta > 0 ? 1 : -1;
      if ((dir > 0 && next.disabled) || (dir < 0 && prev.disabled)) return;
      focusIso = target;
      month(dir);
    } else focusIso = target;
    const cell = grid!.querySelector<HTMLElement>(`[data-iso="${focusIso}"]`);
    if (cell) {
      roving(cell);
      cell.focus();
    }
  });

  show(0);
  return el;
}
