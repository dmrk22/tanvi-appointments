import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/pixel.css";
import "./styles/components.css";
import { gsap } from "./motion/gsap";
import { setAmbientDensity } from "./motion/particles";
import { garden } from "./motion/flowers";
import { startTrail } from "./motion/trail";
import { heartBurst } from "./motion/burst";
import { loveBar } from "./components/loveBar";
import { toast } from "./components/toast";
import { sceneSwap } from "./motion/transitions";
import { h, qs } from "./lib/dom";

// temporary playground (removed in phase 7)
gsap.to(".b1", { x: "12vw", y: "8vh", duration: 22, yoyo: true, repeat: -1, ease: "sine.inOut" });
setAmbientDensity(0.4);
garden.start();
startTrail();
const bar = loveBar();
const app = qs("#app");
const scene = h("div", { style: "padding:80px 24px;display:grid;gap:24px" },
  bar.el,
  h("button", { class: "pill", onclick: (e: MouseEvent) => { heartBurst(e.clientX, e.clientY); bar.fillTo(Math.min(100, bar.pct + 17)); garden.grow(); } }, "Burst + fill"),
  h("button", { class: "pill ghost", onclick: () => toast("Payment pending: one cute pic.") }, "Toast"),
  h("button", { class: "pill ghost", onclick: () => sceneSwap(scene, () => app.appendChild(h("h1", { style: "padding:80px 24px" }, "Wiped"))) }, "Wipe"),
);
app.append(scene);
