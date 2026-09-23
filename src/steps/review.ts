import type { Step } from "./types";
import { CONTENT_STEPS, firstInvalidStep } from "./list";
import { gsap } from "../motion/gsap";
import { sfx } from "../motion/sfx";
import { store } from "../lib/state";
import { h, centre } from "../lib/dom";
import { show } from "../lib/router";
import { ticketId } from "../lib/id";
import { ticketView } from "../components/ticketView";
import { holdButton } from "../components/holdButton";
import { toast } from "../components/toast";
import { success } from "../scenes/success";

export const reviewStep: Step = {
  key: "review",
  title: "Your appointment pass",
  hint: "Payment pending: one cute pic.",
  valid: (b) => !!b.photo && !!b.date && !!b.time && !!b.place,
  render(api) {
    if (!store.get().id) store.set({ id: ticketId() });
    const ticket = ticketView(store.get(), (step) => api.goTo(step));
    const slot = h("div", { class: "printer-slot", "aria-hidden": "true" });
    const paper = h("div", { class: "paper" }, ticket);
    const wrap = h(
      "div",
      { class: "review-step" },
      slot,
      paper,
      h("p", { class: "small-print" }, "Tap any line to change it."),
      h("p", { class: "small-print" }, "Cancellation policy: cancellations are not accepted."),
    );
    // receipt printer: the pass feeds down out of the slot, then its lines appear one by one
    const rows = ticket.querySelectorAll(".t-row, .t-left, .t-foot");
    gsap
      .timeline({ delay: 0.3 })
      .fromTo(ticket, { yPercent: -100 }, { yPercent: 0, duration: 1.1, ease: "steps(14)" })
      .add(() => sfx.tick(3), 0)
      .from(rows, { opacity: 0, x: 8, duration: 0.2, stagger: 0.08, onStart: () => sfx.tick(5) }, 0.35);
    return wrap;
  },
  footer(api) {
    const btn = holdButton("Hold to confirm", () => {
      // enforced again at the last moment, for every step, not just the photo:
      // an edit made from this pass (e.g. a new date) can leave an earlier step stale
      const bad = firstInvalidStep();
      if (bad >= 0) {
        toast(CONTENT_STEPS[bad].hint);
        api.goTo(bad);
        return;
      }
      const at = centre(btn);
      gsap.delayedCall(0.35, () => show(() => success(at), "over"));
    });
    return btn;
  },
};
