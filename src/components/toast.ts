import { gsap } from "../motion/gsap";
import { EASE } from "../motion/tokens";
import { h, qs } from "../lib/dom";

const live = () => qs("#live");

/** screen-reader announcement only */
export function announce(msg: string) {
  const el = live();
  el.textContent = "";
  // re-set on the next frame so repeated messages are re-announced
  requestAnimationFrame(() => (el.textContent = msg));
}

let current: HTMLElement | null = null;

export function toast(msg: string) {
  announce(msg);
  current?.remove();
  const el = h("div", { class: "toast", testid: "toast", role: "status" }, msg);
  current = el;
  qs("#overlay").append(el);
  gsap.fromTo(el, { y: -40, scale: 0.6, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.45, ease: EASE.pop });
  // real-time wait (not gsap time) so toasts stay readable in ?test=1 too
  setTimeout(() => gsap.to(el, { y: -30, opacity: 0, duration: 0.3, ease: "power2.in", onComplete: () => el.remove() }), 2600);
}
