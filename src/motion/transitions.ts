import { gsap } from "./gsap";
import { EASE, DUR } from "./tokens";
import { h, qs } from "../lib/dom";

/** scene change: old scene shrinks + blurs away under a diagonal wipe of pink and blue circles */
export function sceneSwap(from: HTMLElement | null, mount: () => HTMLElement) {
  return new Promise<HTMLElement>((done) => {
    const wipe = h(
      "div",
      { class: "wipe", "aria-hidden": "true" },
      ...["var(--blush)", "var(--sky)", "var(--bubblegum)"].map((bg) => h("i", { style: `background:${bg}` })),
    );
    qs("#overlay").append(wipe);
    const layers = [...wipe.children];
    let next!: HTMLElement;
    const tl = gsap.timeline({
      onComplete: () => {
        wipe.remove();
        done(next);
      },
    });
    if (from)
      tl.to(from, { scale: 0.96, filter: "blur(6px)", opacity: 0, duration: DUR.m, ease: EASE.squish }, 0);
    tl.fromTo(
      layers,
      { clipPath: "circle(0% at 0% 100%)" },
      { clipPath: "circle(150% at 0% 100%)", duration: 0.7, ease: EASE.swoop, stagger: 0.09 },
      0,
    )
      .add(() => {
        from?.remove();
        next = mount();
        gsap.from(next, { y: 50, opacity: 0, duration: DUR.l, ease: EASE.smooth, delay: 0.25 });
      })
      .set(layers, { clipPath: "circle(150% at 100% 0%)" })
      .to(layers, {
        clipPath: "circle(0% at 100% 0%)",
        duration: 0.7,
        ease: EASE.swoop,
        stagger: { each: 0.09, from: "end" },
      });
  });
}

/** wizard deck: forward = old card flies up-left, new slides up from under it; back = reversed */
export function deckSwap(stage: HTMLElement, old: HTMLElement | null, next: HTMLElement, dir: 1 | -1) {
  stage.append(next);
  if (!old) {
    gsap.from(next, { y: 60, scale: 0.94, opacity: 0, duration: DUR.m, ease: EASE.pop });
    return;
  }
  gsap.killTweensOf(old);
  old.style.pointerEvents = "none";
  old.setAttribute("aria-hidden", "true");
  old.inert = true;
  const gone = () => old.remove();
  if (dir > 0) {
    old.style.zIndex = "2";
    gsap.to(old, { xPercent: -115, yPercent: -25, rotation: -8, opacity: 0, duration: DUR.m, ease: "power2.in", onComplete: gone });
    gsap.fromTo(
      next,
      { y: 70, scale: 0.9, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: DUR.m, ease: EASE.pop, delay: 0.12 },
    );
  } else {
    next.style.zIndex = "2";
    gsap.to(old, { y: 80, scale: 0.9, opacity: 0, duration: DUR.s, ease: "power2.in", onComplete: gone });
    gsap.fromTo(
      next,
      { xPercent: -115, yPercent: -25, rotation: -8, opacity: 0 },
      {
        xPercent: 0,
        yPercent: 0,
        rotation: 0,
        opacity: 1,
        duration: DUR.m,
        ease: EASE.pop,
        onComplete: () => void (next.style.zIndex = ""),
      },
    );
  }
}
