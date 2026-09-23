import { gsap, SplitText, REDUCED, rand, pick } from "../motion/gsap";
import { EASE } from "../motion/tokens";
import { fx, setAmbientDensity } from "../motion/particles";
import { garden } from "../motion/flowers";
import { sfx } from "../motion/sfx";
import { haptics } from "../motion/haptics";
import { h, s } from "../lib/dom";
import { makeScene, show, dropPrevious } from "../lib/router";
import { store } from "../lib/state";
import { history } from "../lib/storage";
import { renderTicketPng } from "../lib/ticketPng";
import { sendPass, shareText, download, passName } from "../lib/share";
import { icsFor } from "../lib/ics";
import { CONFIG, him } from "../config";
import { loveBar } from "../components/loveBar";
import { ticketView } from "../components/ticketView";
import { toast } from "../components/toast";
import { hello } from "./hello";

// 13x11, 91 pixels
const BIG_HEART = [
  "..XXX...XXX..",
  ".XOOXX.XXXXX.",
  "XXOXXXXXXXXXX",
  "XXXXXXXXXXXXX",
  "XXXXXXXXXXXXX",
  ".XXXXXXXXXXX.",
  "..XXXXXXXXX..",
  "...XXXXXXX...",
  "....XXXXX....",
  ".....XXX.....",
  "......X......",
];
const BIG_PIXEL_D = "M2 0H5V1H6V2H7V1H8V0H11V1H12V2H13V5H12V6H11V7H10V8H9V9H8V10H7V11H6V10H5V9H4V8H3V7H2V6H1V5H0V2H1V1H2Z";
const BIG_SMOOTH_D = "M6.5 11C2.4 7.9 0 5.9 0 3.4 0 1.4 1.7 0 3.5 0c1.3 0 2.4.7 3 1.8C7.1.7 8.2 0 9.5 0 11.3 0 13 1.4 13 3.4c0 2.5-2.4 4.5-6.5 7.6Z";

/** the big moment: flood, pixel heart assembles, morphs, beats, explodes; love bar overflows; pass + actions */
export function success(origin?: { x: number; y: number }) {
  return makeScene("success", (el, ctx) => {
    const b = store.get();
    history.add({
      id: b.id!,
      date: b.date!,
      time: b.time!,
      place: b.place!,
      reasons: b.reasons,
      note: b.note,
      missMeter: b.missMeter,
      thumb: b.thumb,
      at: Date.now(),
    });
    // render the PNG now so the share tap never awaits (iOS drops the gesture on slow awaits)
    const png = renderTicketPng(b);
    png.catch(() => undefined);

    const heartPath = s("path", { d: BIG_PIXEL_D, fill: "#FF5FA2" });
    const heartSvg = s("svg", { class: "big-heart", viewBox: "-0.5 -0.5 14 12", "aria-hidden": "true" }, heartPath);
    const rings = h("div", { class: "rings", "aria-hidden": "true" }, h("i"), h("i"));
    const heartBox = h("div", { class: "heart-box" }, rings, heartSvg);
    const title = h("h1", { class: "success-title", tabindex: -1, "data-autofocus": "" }, "Appointment booked");
    const sub = h("p", { class: "success-sub" }, `See you there, ${CONFIG.herName}.`);
    const bar = loveBar(true);
    const pass = h("div", { class: "success-pass" }, ticketView(b));

    const busyWhile = async (btn: HTMLButtonElement, fn: () => Promise<unknown>) => {
      btn.setAttribute("aria-busy", "true");
      try {
        await fn();
      } catch {
        toast("Something went wrong making the pass. Try again.");
      } finally {
        btn.removeAttribute("aria-busy");
      }
    };
    const send = h("button", { class: "pill send", type: "button", testid: "send" }, `Send to ${him}`);
    send.addEventListener("click", () =>
      busyWhile(send, async () => {
        const r = await sendPass(await png, shareText(b), passName(b.id!));
        if (r === "shared") toast("Almost there — pick WhatsApp, then tap send.");
        if (r === "fallback") toast("Pass saved. Attach it in WhatsApp, then tap send.");
      }),
    );
    const save = h("button", { class: "pill small ghost", type: "button", testid: "save" }, "Save pass");
    save.addEventListener("click", () =>
      busyWhile(save, async () => {
        download(await png, passName(b.id!));
        toast("Pass saved.");
      }),
    );
    const cal = h("button", { class: "pill small ghost", type: "button", testid: "calendar" }, "Add to calendar");
    cal.addEventListener("click", () => {
      download(new Blob([icsFor(b)], { type: "text/calendar;charset=utf-8" }), `appointment-${b.id}.ics`);
      toast("Calendar file saved.");
    });
    const again = h("button", { class: "link again", type: "button", testid: "again" }, "Book another");
    again.addEventListener("click", () => {
      store.reset();
      garden.reset();
      setAmbientDensity(0.4);
      void show(hello);
    });
    const actions = h("div", { class: "actions" }, send, h("div", { class: "row" }, save, cal), again);

    el.append(h("div", { class: "success-body" }, heartBox, title, sub, bar.el, actions, pass));
    // the wizard stays visible underneath until the flood covers it
    return () => {
      const o = origin ?? { x: innerWidth / 2, y: innerHeight * 0.85 };
      const at = `${o.x}px ${o.y}px`;
      gsap.set(heartSvg, { opacity: 0 });
      gsap.set([title, sub, bar.el, ...actions.children, pass], { opacity: 0 });
      const tl = gsap.timeline();

      // 0.0 flood white from the confirm button
      tl.fromTo(el, { clipPath: `circle(0px at ${at})` }, { clipPath: `circle(150% at ${at})`, duration: 0.7, ease: "power2.in" }, 0);
      tl.add(() => {
        el.style.removeProperty("clip-path");
        dropPrevious(); // fully flooded: the wizard underneath can go
      }, 0.72)
        // then the white clears so the ambient hearts and the garden show through
        .to(el, { backgroundColor: "rgba(255,255,255,0)", duration: 1, ease: "power1.inOut" }, 1.5);

      // 0.2 pixel heart assembles from squares flying in from every edge
      tl.add(() => {
        const r = heartSvg.getBoundingClientRect();
        const cell = r.width / 14;
        if (REDUCED) return;
        BIG_HEART.forEach((row, y) =>
          [...row].forEach((ch, x) => {
            if (ch === ".") return;
            const edge = pick(["t", "b", "l", "r"]);
            fx.spawn({
              kind: "pixel",
              mode: "target",
              x: edge === "l" ? -20 : edge === "r" ? innerWidth + 20 : rand(0, innerWidth),
              y: edge === "t" ? -20 : edge === "b" ? innerHeight + 20 : rand(0, innerHeight),
              tx: r.left + (x + 0.5) * cell,
              ty: r.top + (y + 0.5) * cell,
              size: Math.ceil(cell),
              color: ch === "O" ? "#FFFFFF" : "#FF5FA2",
            });
          }),
        );
      }, 0.2);

      // 0.9 pixels become one vector heart, which morphs smooth and beats twice with shockwaves
      tl.add(() => {
        fx.clear("target");
        gsap.set(heartSvg, { opacity: 1 });
      }, 0.9)
        .to(heartPath, { morphSVG: BIG_SMOOTH_D, duration: 0.35, ease: EASE.squish }, 0.9)
        .add(beat(), 1.0)
        .add(beat(), 1.22);

      // 1.4 explosion
      tl.add(() => {
        const r = heartSvg.getBoundingClientRect();
        fx.burst(r.left + r.width / 2, r.top + r.height / 2, REDUCED ? 30 : 150, {
          kinds: ["heart", "heart", "petal", "sparkle"],
          speed: 720,
          size: [10, 24],
        });
        sfx.fanfare();
        haptics.success();
      }, 1.4);

      // 1.7 title drops in, then the subline
      tl.set(title, { opacity: 1 }, 1.7)
        .from(SplitText.create(title, { type: "words,chars" }).chars, { y: -70, opacity: 0, rotation: () => rand(-25, 25), duration: 0.7, ease: EASE.bouncy, stagger: 0.03 }, 1.7)
        .to(sub, { opacity: 1, duration: 0.01 }, 2.05)
        .from(sub, { y: 14, duration: 0.4, ease: EASE.smooth }, 2.05);

      // 2.2 big love bar fills to 100, then overflows to ∞
      tl.to(bar.el, { opacity: 1, duration: 0.2 }, 2.2)
        .add(() => void bar.fillTo(100).add(bar.overflow()), 2.25);

      // 3.4 flower rain + the full garden
      tl.add(() => {
        fx.rain(3.5, ["petal", "petal", "heart"]);
        garden.full();
      }, 3.4);

      // 3.8 the pass flutters up like paper
      tl.to(pass, { opacity: 1, duration: 0.01 }, 3.8).fromTo(
        pass,
        { y: 160, rotation: 6 },
        { y: 0, rotation: 0, duration: 1.1, ease: EASE.bouncy },
        3.8,
      );
      if (!REDUCED) tl.to(pass, { keyframes: { skewX: [0, -3, 2.5, -1.5, 0] }, duration: 1, ease: "none" }, 3.8);

      // 4.3 actions
      tl.to(actions.children, { opacity: 1, duration: 0.01, stagger: 0.1 }, 4.3).from(
        actions.children,
        { y: 30, scale: 0.8, duration: 0.5, ease: EASE.pop, stagger: 0.1 },
        4.3,
      );

      // idle: denser ambient hearts, the big heart beats every 2s
      tl.add(() => {
        setAmbientDensity(0.6);
        if (!REDUCED) ctx.add(() => gsap.timeline({ repeat: -1, repeatDelay: 1.45 }).add(beat(false)));
      }, 5);

      function beat(ring = true) {
        const t = gsap.timeline();
        t.to(heartSvg, { scale: 1.18, duration: 0.12, ease: "power2.out" }).to(heartSvg, { scale: 1, duration: 0.3, ease: EASE.bouncy });
        if (ring)
          t.fromTo(rings.children, { scale: 0.6, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 0.7, ease: "power2.out", stagger: 0.12 }, 0);
        else sfx.pop();
        return t;
      }
    };
  });
}

