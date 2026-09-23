import { gsap } from "../motion/gsap";
import { EASE } from "../motion/tokens";
import { garden } from "../motion/flowers";
import { deckSwap } from "../motion/transitions";
import { burstFrom } from "../motion/burst";
import { sfx } from "../motion/sfx";
import { haptics } from "../motion/haptics";
import { h, s, on } from "../lib/dom";
import { makeScene, show } from "../lib/router";
import { store } from "../lib/state";
import { loveBar } from "../components/loveBar";
import { toast, announce } from "../components/toast";
import { pixelSvg, LOCK, HEART, PIX } from "../components/pixelArt";
import { CONTENT_STEPS, firstInvalidStep } from "../steps/list";
import { reviewStep } from "../steps/review";
import type { StepApi } from "../steps/types";
import { hello } from "./hello";

export type { Step, StepApi } from "../steps/types";
export const STEPS = [...CONTENT_STEPS, reviewStep];
export const REVIEW = STEPS.length - 1;

const sleepy = () =>
  h("span", { class: "sleepy", "aria-hidden": "true" }, pixelSvg(HEART, { X: PIX.R, O: PIX.B }, 2), h("i", { class: "pixel" }, "z"));

export function wizard() {
  return makeScene("wizard", (el) => {
    let i = -1;
    let reached = 0;
    let editing = false;
    let card: HTMLElement | null = null;

    const back = h(
      "button",
      { class: "round back", type: "button", testid: "back", "aria-label": "Back" },
      s(
        "svg",
        { viewBox: "0 0 24 24", "aria-hidden": "true", fill: "none", stroke: "currentColor", "stroke-width": 2.6, "stroke-linecap": "round", "stroke-linejoin": "round" },
        s("path", { d: "M19 12H5m6-7-7 7 7 7" }),
      ),
    );
    const counter = h("span", { class: "pixel step-count", testid: "step-count" });
    const bar = loveBar();
    const stage = h("div", { class: "deck" });
    const nextLabel = h("span", {}, "Next");
    const nextIcon = h("span", { class: "next-icon" });
    const next = h("button", { class: "pill next", type: "button", testid: "next" }, nextIcon, nextLabel);
    const foot = h("footer", { class: "wiz-foot" }, next);
    el.append(h("header", { class: "wiz-head" }, h("div", { class: "wiz-top" }, back, counter), bar.el), stage, foot);

    const api: StepApi = { changed: refresh, next: advance, goTo: (n) => ((editing = true), goTo(n)) };

    function refresh() {
      const step = STEPS[i];
      if (step.footer) return;
      const ok = step.valid(store.get());
      next.setAttribute("aria-disabled", String(!ok));
      nextIcon.replaceChildren(ok ? "" : step.key === "payment" ? pixelSvg(LOCK, PIX, 3, "px lock") : sleepy());
      nextLabel.textContent = editing && ok ? "Back to pass" : "Next";
    }

    function advance(e?: Event) {
      const step = STEPS[i];
      if (!step.valid(store.get())) {
        const icon = nextIcon.firstElementChild ?? next;
        gsap.fromTo(icon, { rotation: 0 }, { keyframes: { rotation: [-16, 14, -10, 6, 0] }, duration: 0.5, ease: "none" });
        gsap.fromTo(next, { x: 0 }, { keyframes: { x: [-6, 6, -4, 3, 0] }, duration: 0.4, ease: "none" });
        haptics.error();
        sfx.buzz();
        toast(step.hint);
        return;
      }
      if (e) burstFrom(e, next, 12);
      if (editing) {
        editing = false;
        // the edit itself was valid, but it may have made an *earlier* step stale
        // (e.g. changing the date can clear an already-picked time) - catch that here too
        const bad = firstInvalidStep();
        if (bad >= 0) {
          toast(CONTENT_STEPS[bad].hint);
          goTo(bad);
          return;
        }
        goTo(REVIEW);
      } else goTo(i + 1);
    }

    function goTo(n: number, push = true) {
      if (n === i || n < 0 || n > REVIEW) return;
      const dir = n > i ? 1 : -1;
      i = n;
      const step = STEPS[n];
      const title = h("h2", { class: "card-title", tabindex: -1 }, step.title);
      const c = h("article", { class: `card step-${step.key}`, "aria-label": step.title }, title, step.render(api));
      deckSwap(stage, card, c, dir);
      card = c;
      counter.textContent = `step ${n + 1}/${STEPS.length}`;
      gsap.fromTo(counter, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: EASE.pop });
      bar.fillTo((n / STEPS.length) * 100);
      // the garden grows once per newly completed step
      for (; reached < n; reached++) {
        garden.grow();
        sfx.pluck(reached + 3);
      }
      if (push) history.pushState({ step: n }, "");
      announce(`Step ${n + 1} of ${STEPS.length}: ${step.title}`);
      foot.replaceChildren(step.footer ? step.footer(api) : next);
      if (!step.footer) refresh();
      // synchronous, not delayed: a delayedCall here raced a fast keyboard Tab and stole focus back
      title.focus({ preventScroll: true });
    }

    next.addEventListener("click", (e) => advance(e));
    // the on-screen back arrow and Android's back button share one path
    back.addEventListener("click", () => history.back());
    const off = on(window, "popstate", (e) => {
      if (!el.isConnected) return off();
      const st = e.state as { step?: number } | null;
      if (st && typeof st.step === "number") {
        editing = false;
        goTo(st.step, false);
      } else {
        off();
        void show(hello);
      }
    });

    return () => {
      history.pushState({ step: 0 }, "");
      goTo(0, false);
    };
  });
}
