import { gsap, rand } from "../motion/gsap";
import { ambient, fx } from "../motion/particles";
import { sfx } from "../motion/sfx";
import { h } from "../lib/dom";
import { HEART, pixelCells, PIX } from "../components/pixelArt";
import { makeScene } from "../lib/router";

/** white screen, pixel heart fills bottom-up, then its pixels explode into the ambient particles */
export function boot(done: () => void) {
  return makeScene("boot", (el) => {
    const art = pixelCells(HEART, { X: PIX.X, O: PIX.B }, 4);
    art.classList.add("boot-heart");
    const label = h("p", { class: "pixel boot-label", "aria-live": "polite" }, "loading love… 0%");
    el.append(h("div", { class: "boot-wrap" }, art, label));

    const rects = [...art.querySelectorAll<SVGRectElement>("rect")];
    const rows = HEART.length;
    gsap.set(rects, { opacity: 0 });
    return () => {
      const tl = gsap.timeline({ onComplete: explode });
      const counter = { v: 0 };
      for (let r = rows - 1, k = 0; r >= 0; r--, k++) {
        const row = rects.filter((x) => x.dataset.row === String(r));
        tl.fromTo(row, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.08, ease: "power2.out" }, k * 0.1).add(
          () => sfx.tick(k),
          k * 0.1,
        );
      }
      tl.to(counter, { v: 100, duration: tl.duration(), ease: "none", onUpdate: () => void (label.textContent = `loading love… ${Math.round(counter.v)}%`) }, 0);
      tl.to(art, { scale: 1.12, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" });

      function explode() {
        const cx = innerWidth / 2;
        const cy = innerHeight / 2;
        for (const r of rects) {
          const b = r.getBoundingClientRect();
          const x = b.left + b.width / 2;
          const y = b.top + b.height / 2;
          const ang = Math.atan2(y - cy, x - cx) + rand(-0.3, 0.3);
          const v = rand(260, 620);
          const o = { x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, size: Math.round(b.width), color: r.getAttribute("fill")! };
          // hand each pixel to the ambient engine where it stands; overflow bursts on the fx layer
          if (!ambient.spawn({ ...o, kind: "pixel", mode: "ambient" }))
            fx.spawn({ ...o, kind: "pixel", mode: "burst", life: rand(0.6, 1.2) });
        }
        art.style.visibility = "hidden";
        gsap.to(label, { opacity: 0, y: 10, duration: 0.3 });
        sfx.pop();
        // setTimeout, not delayedCall: gsap callbacks run inside this scene's context
        setTimeout(done, 250);
      }
    };
  });
}
