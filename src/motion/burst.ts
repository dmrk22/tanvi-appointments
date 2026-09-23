import { fx, type Kind } from "./particles";
import { sfx } from "./sfx";
import { haptics } from "./haptics";
import { centre } from "../lib/dom";

/** tiny heart burst from a point, with pop + haptic tap */
export function heartBurst(x: number, y: number, n = 10, o: { kinds?: Kind[]; colors?: string[]; quiet?: boolean } = {}) {
  fx.burst(x, y, n, { kinds: o.kinds, colors: o.colors, speed: 260, size: [9, 18] });
  if (!o.quiet) {
    sfx.pop();
    haptics.tap();
  }
}

/** burst from the tap point if there is one (keyboard: element centre) */
export function burstFrom(e: Event | null, el: Element, n = 10, o: Parameters<typeof heartBurst>[3] = {}) {
  const pe = e as PointerEvent | null;
  const p = pe && "clientX" in pe && pe.clientX ? { x: pe.clientX, y: pe.clientY } : centre(el);
  heartBurst(p.x, p.y, n, o);
}
