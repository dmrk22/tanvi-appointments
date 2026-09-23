import { gsap, SplitText, REDUCED, COARSE, rand } from "../motion/gsap";
import { EASE, STAGGER } from "../motion/tokens";
import { fx } from "../motion/particles";
import { garden } from "../motion/flowers";
import { burstFrom } from "../motion/burst";
import { sfx } from "../motion/sfx";
import { h, on } from "../lib/dom";
import { makeScene, show } from "../lib/router";
import { history } from "../lib/storage";
import { CONFIG, me } from "../config";
import { heart, pixelSvg, PIX } from "../components/pixelArt";
import { runawayButton } from "../components/runawayButton";
import { announce } from "../components/toast";
import { wizard } from "./wizard";
import { openHistory } from "./history";

export function hello() {
  return makeScene("hello", (el, ctx) => {
    const helloWord = h("span", { class: "hello-word" }, "Hello");
    const name = h("span", { class: "name-word", testid: "her-name" }, CONFIG.herName);
    const title = h("h1", { class: "hello-title", tabindex: -1, "data-autofocus": "", "aria-label": `Hello ${CONFIG.herName}` }, helloWord, name);

    const dots = pixelSvg(["X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X"], { X: PIX.B }, 4, "px underline-dots");
    const underline = h("div", { class: "underline", "aria-hidden": "true" }, dots, heart(3), dots.cloneNode(true));
    const sub = h("p", { class: "hello-sub" }, "Someone would like to see you. Officially.");

    const shine = h("span", { class: "shine", "aria-hidden": "true" });
    const book = h(
      "button",
      { class: "pill book", testid: "book", type: "button" },
      shine,
      "Book your appointment",
    );
    const bookWrap = h("div", { class: "book-wrap" }, book);
    const runaway = runawayButton(() => book, start);
    const fee = h("p", { class: "fee" }, `Appointments with ${me}. Fee: one cute pic.`);

    const count = history.all().length;
    const counter = count
      ? h(
          "button",
          { class: "history-count", testid: "history-count", type: "button", "aria-label": `${count} past bookings`, onclick: openHistory },
          heart(2),
          h("span", { class: "pixel" }, count),
        )
      : null;

    el.append(
      counter ?? "",
      h("div", { class: "hello-body" }, title, underline, sub, bookWrap, runaway, fee),
    );

    let leaving = false;
    function start(e: MouseEvent) {
      if (leaving) return;
      leaving = true;
      beat.kill();
      gsap.to(book, { scale: 0.94, duration: 0.08, yoyo: true, repeat: 1, ease: EASE.squish });
      burstFrom(e, book, 26, { quiet: true });
      sfx.chime();
      gsap.delayedCall(0.35, () => show(wizard));
    }
    book.addEventListener("click", start);

    // "Tanvi" x5 easter egg
    let taps = 0;
    name.addEventListener("click", () => {
      if (++taps % 5) return;
      const bubble = h("div", { class: "bubble egg", role: "status" }, "Caught you staring at your own name.");
      el.append(bubble);
      announce(bubble.textContent!);
      const r = name.getBoundingClientRect();
      gsap.set(bubble, { left: Math.max(16, Math.min(innerWidth - 276, r.left + r.width / 2 - 130)), top: r.top - 70 });
      gsap
        .timeline({ onComplete: () => bubble.remove() })
        .from(bubble, { scale: 0, opacity: 0, transformOrigin: "50% 100%", duration: 0.4, ease: EASE.pop })
        .to(bubble, { opacity: 0, y: -10, duration: 0.3 }, "+=2.2");
      fx.rain(2, ["heart", "heart", "petal"]);
      sfx.fanfare(true);
    });

    // desktop: the main button drifts toward the cursor within 80px
    if (!COARSE && !REDUCED) {
      const qx = gsap.quickTo(bookWrap, "x", { duration: 0.4, ease: "power3.out" });
      const qy = gsap.quickTo(bookWrap, "y", { duration: 0.4, ease: "power3.out" });
      const off = on(window, "pointermove", (e) => {
        if (!el.isConnected) return off();
        const r = book.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const near = Math.abs(dx) < r.width / 2 + 80 && Math.abs(dy) < r.height / 2 + 80;
        qx(near ? dx * 0.18 : 0);
        qy(near ? dy * 0.3 : 0);
      });
    }

    // heartbeat 1 -> 1.06 -> 1 -> 1.04 -> 1 every 1.2s
    const beat = gsap
      .timeline({ repeat: -1, paused: true })
      .to(book, { scale: 1.06, duration: 0.15, ease: "power2.out" })
      .to(book, { scale: 1, duration: 0.15, ease: "power2.in" })
      .to(book, { scale: 1.04, duration: 0.13, ease: "power2.out" })
      .to(book, { scale: 1, duration: 0.17, ease: "power2.in" })
      .to({}, { duration: 0.6 });

    return () => {
      garden.start();
      const hs = SplitText.create(helloWord, { type: "chars" });
      const ns = SplitText.create(name, { type: "chars" });
      ns.chars.forEach((c, i) => ((c as HTMLElement).style.color = i % 2 ? "var(--cornflower)" : "var(--bubblegum)"));
      const tl = gsap.timeline({ delay: 0.15 });
      tl.from(hs.chars, {
        y: -140,
        opacity: 0,
        rotation: () => rand(-35, 35),
        duration: 1,
        ease: EASE.bouncy,
        stagger: STAGGER.normal,
      })
        .from(ns.chars, { scale: 0, opacity: 0, duration: 0.5, ease: EASE.pop, stagger: 0.09 }, "-=0.6")
        .add(() => {
          if (REDUCED) return;
          // each letter floats on its own, forever (ctx.add so leaving the scene kills them)
          ctx.add(() => ns.chars.forEach((c) =>
            gsap.to(c, {
              y: rand(-3, 3) > 0 ? 3 : -3,
              rotation: rand(-2, 2),
              duration: rand(1.1, 1.8),
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            }),
          ));
        })
        .fromTo(underline, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: EASE.smooth })
        .from(sub, { y: 16, opacity: 0, duration: 0.6, ease: EASE.smooth }, "-=0.3")
        .from([bookWrap, runaway, fee], { y: 24, opacity: 0, scale: 0.9, duration: 0.6, ease: EASE.pop, stagger: 0.08 }, "-=0.3")
        .add(() => {
          if (REDUCED) return;
          beat.play();
          ctx.add(() => gsap.fromTo(shine, { xPercent: -120 }, { xPercent: 120, duration: 0.9, ease: "power2.inOut", repeat: -1, repeatDelay: 2.1 }));
        });
      if (counter) tl.from(counter, { scale: 0, duration: 0.5, ease: EASE.pop }, 0.4);
    };
  });
}
