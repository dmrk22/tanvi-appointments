import { gsap } from "../motion/gsap";
import { sceneSwap } from "../motion/transitions";
import { qs } from "./dom";

/** a scene is an element plus the gsap context that owns its (often infinite) tweens */
export type Scene = { el: HTMLElement; ctx: gsap.Context; enter?: () => void };

let current: Scene | null = null;

export function makeScene(cls: string, build: (el: HTMLElement, ctx: gsap.Context) => (() => void) | void): Scene {
  const el = document.createElement("section");
  el.className = `scene ${cls}`;
  const ctx = gsap.context(() => {});
  const box: { enter?: (() => void) | void } = {};
  ctx.add(() => void (box.enter = build(el, ctx)));
  const enter = box.enter;
  return { el, ctx, enter: enter ? () => void ctx.add(enter) : undefined };
}

/**
 * swap scenes. wipe: circles sweep across. cut: mount directly (boot's explosion is its own
 * transition). over: mount on top and drop the old scene once the new one has covered it.
 */
let underneath: (() => void) | null = null;

/** "over" scenes call this once they fully cover the old one */
export function dropPrevious() {
  underneath?.();
  underneath = null;
}

let swapping = false;

export async function show(make: () => Scene, mode: "wipe" | "cut" | "over" = "wipe") {
  // a second show() while one is still mounting (e.g. two fast Enter presses on the same
  // button) used to mount two scenes at once and leak the first one's tweens and listeners
  if (swapping) return;
  swapping = true;
  try {
    await run(make, mode);
  } finally {
    swapping = false;
  }
}

async function run(make: () => Scene, mode: "wipe" | "cut" | "over") {
  dropPrevious();
  const prev = current;
  const app = qs("#app");
  let dropped = false;
  const drop = () => {
    if (dropped) return;
    dropped = true;
    prev?.el.remove();
    prev?.ctx.revert();
  };
  const mount = () => {
    // revert the old scene first: its context must not undo anything the new one builds
    if (mode !== "over") drop();
    current = make();
    app.append(current.el);
    current.enter?.();
    return current.el;
  };
  if (mode === "wipe") await sceneSwap(prev?.el ?? null, mount);
  else mount();
  if (mode === "over") {
    underneath = drop;
    setTimeout(drop, 3000); // fallback if the new scene never reports covering it
  }
  const focusable = current!.el.querySelector<HTMLElement>("[data-autofocus]");
  focusable?.focus({ preventScroll: true });
}
