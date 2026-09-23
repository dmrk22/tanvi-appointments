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

/** swap scenes; wipe=false mounts directly (the boot explosion is its own transition) */
export async function show(make: () => Scene, wipe = true) {
  const prev = current;
  const app = qs("#app");
  const mount = () => {
    // revert the old scene first: its context must not undo anything the new one builds
    prev?.el.remove();
    prev?.ctx.revert();
    current = make();
    app.append(current.el);
    current.enter?.();
    return current.el;
  };
  if (wipe) await sceneSwap(prev?.el ?? null, mount);
  else mount();
  const focusable = current!.el.querySelector<HTMLElement>("[data-autofocus]");
  focusable?.focus({ preventScroll: true });
}
