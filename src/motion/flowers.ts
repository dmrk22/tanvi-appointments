import { gsap, REDUCED, rand } from "./gsap";
import { EASE } from "./tokens";
import { s, qs } from "../lib/dom";

type FlowerOpts = { x: number; y: number; scale: number; petals: 5 | 6 | 8; color: string; center: string };

const STEM = 90;

/** SVG flower rooted at (x, y): stem, two leaves, petals, centre */
export function createFlower(o: FlowerOpts) {
  const root = s("g", { class: "flower", transform: `translate(${o.x} ${o.y}) scale(${o.scale})` });
  const sway = s("g", { class: "sway" });
  const stem = s("path", {
    class: "stem",
    d: `M0 0 C -10 -30 10 -60 0 -${STEM}`,
    fill: "none",
    stroke: "#5B9BFF",
    "stroke-width": 3.5,
    "stroke-linecap": "round",
  });
  const leaf = (dir: 1 | -1, y: number) =>
    s(
      "g",
      { transform: `translate(${dir * 1} ${y})` },
      s("path", {
        class: "leaf",
        d: `M0 0 C ${dir * 12} -2 ${dir * 22} -12 ${dir * 26} -24 C ${dir * 12} -22 ${dir * 3} -12 0 0Z`,
        fill: "#CFE6FF",
        stroke: "#5B9BFF",
        "stroke-width": 1.5,
      }),
    );
  const petals = s("g", { class: "petals" });
  const pr = o.petals === 8 ? 9 : 11;
  for (let i = 0; i < o.petals; i++)
    petals.append(
      s(
        "g",
        { transform: `rotate(${(360 / o.petals) * i})` },
        s("ellipse", {
          class: "petal",
          cx: 0,
          cy: -pr,
          rx: o.petals === 8 ? 5.5 : 7.5,
          ry: pr,
          fill: o.color,
          stroke: "#FFD1E3",
          "stroke-width": 1.5,
        }),
      ),
    );
  const centre = s("circle", { class: "centre", r: 6, fill: o.center, stroke: "#FFD1E3", "stroke-width": 1.5 });
  const head = s("g", { transform: `translate(0 -${STEM})` }, petals, centre);
  sway.append(stem, leaf(-1, -34), leaf(1, -52), head);
  root.append(sway);
  return root;
}

const swayOf = new WeakMap<Element, gsap.core.Tween>();

export function bloom(flower: SVGGElement, delay = 0) {
  const q = (sel: string) => flower.querySelectorAll(sel);
  const tl = gsap.timeline({ delay });
  // origins are measured from the bbox, so set them while everything is still full size
  gsap.set(q(".leaf"), { transformOrigin: (i: number) => (i === 0 ? "100% 100%" : "0% 100%") });
  gsap.set(q(".petal"), { transformOrigin: "50% 100%" });
  gsap.set(q(".petals, .centre"), { transformOrigin: "50% 50%" });
  tl.fromTo(q(".stem"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.9, ease: "power2.out" })
    .fromTo(q(".leaf"), { scale: 0 }, { scale: 1, duration: 0.9, ease: EASE.bouncy, stagger: 0.12 }, 0.3)
    .fromTo(q(".petal"), { scale: 0 }, { scale: 1, duration: 0.5, ease: EASE.pop, stagger: 0.06 }, 0.7)
    .fromTo(q(".petals"), { rotation: -70 }, { rotation: 0, duration: 0.9, ease: EASE.smooth }, 0.7)
    .fromTo(q(".centre"), { scale: 0 }, { scale: 1, duration: 0.4, ease: EASE.pop }, 0.9)
    .to(q(".centre"), { scale: 1.35, duration: 0.15, yoyo: true, repeat: 1 });
  if (!REDUCED) {
    // rotate() in local space pivots on the stem base (0,0)
    const sw = flower.querySelector(".sway")!;
    const a = { deg: -3 };
    swayOf.set(flower, gsap.to(a, {
      deg: 3,
      duration: rand(2.2, 3.4),
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: rand(0, 1.5),
      onUpdate: () => sw.setAttribute("transform", `rotate(${a.deg.toFixed(2)})`),
    }));
  }
  return tl;
}

// ---- the corner garden: 6 to start, one more per completed step, max 12 ----

type Slot = { side: "l" | "r"; dx: number; scale: number; petals: 5 | 6 | 8; color: string; center: string };
const PINK = { color: "#FF5FA2", center: "#FFD1E3" };
const BLUE = { color: "#5B9BFF", center: "#FFFFFF" };
const WHITE = { color: "#FFFFFF", center: "#FF5FA2" };

const SLOTS: Slot[] = [
  { side: "l", dx: 26, scale: 1.15, petals: 6, ...PINK },
  { side: "l", dx: 62, scale: 0.8, petals: 8, ...WHITE },
  { side: "l", dx: 92, scale: 0.62, petals: 5, ...BLUE },
  { side: "r", dx: 28, scale: 1.05, petals: 5, ...BLUE },
  { side: "r", dx: 64, scale: 0.72, petals: 6, ...PINK },
  { side: "r", dx: 96, scale: 0.9, petals: 8, ...WHITE },
  // grown while booking
  { side: "l", dx: 124, scale: 0.55, petals: 8, ...PINK },
  { side: "r", dx: 130, scale: 0.6, petals: 5, ...WHITE },
  { side: "l", dx: 8, scale: 0.7, petals: 5, ...WHITE },
  { side: "r", dx: 8, scale: 0.66, petals: 6, ...PINK },
  { side: "l", dx: 150, scale: 0.48, petals: 6, ...BLUE },
  { side: "r", dx: 158, scale: 0.5, petals: 8, ...BLUE },
];
export const GARDEN_MAX = SLOTS.length;

// wide screens only: taller flowers standing along the sides of the centre column
const SIDES: Slot[] = [
  { side: "l", dx: 200, scale: 1.7, petals: 8, ...PINK },
  { side: "r", dx: 210, scale: 1.55, petals: 6, ...BLUE },
  { side: "l", dx: 90, scale: 2, petals: 5, ...WHITE },
  { side: "r", dx: 96, scale: 1.9, petals: 8, ...PINK },
];

const svg = qs<SVGSVGElement>("#flowers");
const planted: { el: SVGGElement; slot: Slot }[] = [];

// bloom() is called from inside whichever scene is currently entering (hello, or the wizard's
// goTo()), so gsap.context would file the flower's *infinite* sway tween under that scene and
// kill it the moment the scene changes. `free.ignore` keeps every flower's tweens outside any
// scene's context so they keep swaying for the life of the garden, not just the life of a scene.
const free = gsap.context(() => {});

const wide = () => innerWidth > 900;

function place(slot: Slot) {
  // wide screens: spread the garden out along the sides of the centre column
  const spread = wide() && !SIDES.includes(slot) ? 2.4 : 1;
  const x = slot.side === "l" ? slot.dx * spread : innerWidth - slot.dx * spread;
  return { x, y: innerHeight + 4 };
}

function plant(i: number, delay = 0) {
  planted.push(make(SLOTS[i], delay));
}

function make(slot: Slot, delay: number) {
  const el = createFlower({ ...place(slot), ...slot });
  svg.append(el);
  free.ignore(() => bloom(el, delay));
  return { el, slot };
}
const sides: { el: SVGGElement; slot: Slot }[] = [];

addEventListener("resize", () => {
  for (const { el, slot } of [...planted, ...sides]) {
    const p = place(slot);
    el.setAttribute("transform", `translate(${p.x} ${p.y}) scale(${slot.scale})`);
  }
});

export const garden = {
  get count() {
    return planted.length;
  },
  /** first six, both corners */
  start() {
    for (let i = planted.length; i < 6; i++) plant(i, (i % 3) * 0.18 + (i >= 3 ? 0.1 : 0));
    if (wide() && !sides.length) SIDES.forEach((s, i) => sides.push(make(s, 0.3 + i * 0.15)));
  },
  /** one new flower, up to the max */
  grow() {
    if (planted.length < GARDEN_MAX) plant(planted.length);
  },
  full() {
    for (let i = planted.length, k = 0; i < GARDEN_MAX; i++, k++) plant(i, k * 0.12);
  },
  /** back to the six corner flowers */
  reset() {
    while (planted.length > 6) {
      const { el } = planted.pop()!;
      gsap.killTweensOf(el.querySelectorAll("*"));
      swayOf.get(el)?.kill();
      el.remove();
    }
  },
};
