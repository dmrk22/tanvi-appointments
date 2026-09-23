import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/pixel.css";
import "./styles/components.css";
import "./styles/scenes.css";
import { gsap, TEST, REDUCED, rand } from "./motion/gsap";
import { setAmbientDensity } from "./motion/particles";
import { startTrail } from "./motion/trail";
import { sfx } from "./motion/sfx";
import { h, s, qs } from "./lib/dom";
import { show } from "./lib/router";
import { boot } from "./scenes/boot";
import { hello } from "./scenes/hello";

// drifting mesh: the page is never still
if (!REDUCED)
  [".b1", ".b2", ".b3"].forEach((sel, i) =>
    gsap.to(sel, {
      x: `${rand(-14, 14)}vw`,
      y: `${rand(-10, 10)}vh`,
      scale: rand(0.9, 1.15),
      duration: 18 + i * 4,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    }),
  );

setAmbientDensity(0.4);
startTrail();

// global sound toggle, top right: speaker <-> speaker with a heart
const speaker = "M4 9h4l5-4v14l-5-4H4z";
const icon = () =>
  s(
    "svg",
    { viewBox: "0 0 24 24", "aria-hidden": "true", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linejoin": "round" },
    s("path", { d: speaker, fill: "currentColor" }),
    sfx.on
      ? s("path", { d: "M18.5 9.2c-.9-1-2.5-.4-2.5.9 0 1.4 2.5 3 2.5 3s2.5-1.6 2.5-3c0-1.3-1.6-1.9-2.5-.9z", fill: "currentColor", stroke: "none" })
      : s("path", { d: "M16 10l4 4m0-4l-4 4" }),
  );
const sound = h("button", {
  class: "round sound",
  testid: "sound",
  type: "button",
  "aria-label": "Sound",
  "aria-pressed": String(sfx.on),
});
sound.append(icon());
sound.addEventListener("click", () => {
  const on = sfx.toggle();
  sound.setAttribute("aria-pressed", String(on));
  sound.replaceChildren(icon());
  gsap.fromTo(sound, { scale: 0.85 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
  if (on) sfx.pop();
});
qs("#overlay").append(sound);

if (TEST) void show(hello, "cut");
else void show(() => boot(() => void show(hello, "cut")), "cut");
