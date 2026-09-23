import type { Step } from "./types";
import { gsap, REDUCED } from "../motion/gsap";
import { EASE } from "../motion/tokens";
import { sfx } from "../motion/sfx";
import { haptics } from "../motion/haptics";
import { heartBurst } from "../motion/burst";
import { store } from "../lib/state";
import { h, qs, centre } from "../lib/dom";
import { processPhoto, PhotoError } from "../lib/image";
import { polaroid, paidStamp } from "../components/polaroid";
import { toast } from "../components/toast";

export const paymentStep: Step = {
  key: "payment",
  title: "Appointment fee",
  hint: "Payment pending: one cute pic.",
  valid: (b) => !!b.photo,
  render(api) {
    const line = (item: string, price: string) =>
      h("p", { class: "r-line" }, h("span", {}, item), h("i", { "aria-hidden": "true" }), h("span", {}, price));
    const receipt = h(
      "div",
      { class: "receipt pixel" },
      line("appointment fee", "1 cute pic"),
      line("cards / UPI / cash", "not accepted"),
    );

    const input = (testid: string, capture: boolean) => {
      const i = h("input", { type: "file", accept: "image/*", class: "sr-only", tabindex: -1, testid, "aria-hidden": "true" });
      if (capture) i.setAttribute("capture", "user");
      i.addEventListener("change", () => {
        const f = i.files?.[0];
        i.value = "";
        if (f) void take(f);
      });
      return i;
    };
    const selfieIn = input("selfie-input", true);
    const galleryIn = input("gallery-input", false);
    const selfie = h("button", { class: "pill small", type: "button", testid: "take-selfie", onclick: () => selfieIn.click() }, "Take a selfie");
    const gallery = h("button", { class: "pill small ghost", type: "button", testid: "choose-gallery", onclick: () => galleryIn.click() }, "Choose from gallery");
    const pickers = h("div", { class: "pay-buttons" }, selfie, gallery, selfieIn, galleryIn);
    const drop = h("p", { class: "drop-hint" }, "or drop a photo here");
    const stage = h("div", { class: "pay-stage", "aria-live": "polite" });
    const wrap = h("div", { class: "pay-step" }, receipt, stage, pickers, drop);

    let busy = false;
    async function take(file: File) {
      if (busy) return;
      busy = true;
      wrap.classList.add("busy");
      try {
        const { blob, url, thumb } = await processPhoto(file);
        store.set({ photo: blob, photoUrl: url, thumb });
        reveal(url, true);
        api.changed();
      } catch (err) {
        haptics.error();
        sfx.buzz();
        toast(err instanceof PhotoError ? err.message : "Couldn't read that photo. Try a JPG or PNG.");
      } finally {
        busy = false;
        wrap.classList.remove("busy");
      }
    }

    function reveal(url: string, animate: boolean) {
      const pol = polaroid(url, "payment received", "pay-polaroid");
      const stamp = paidStamp();
      pol.append(stamp);
      const retake = h(
        "button",
        {
          class: "link",
          type: "button",
          testid: "retake",
          onclick: () => {
            store.set({ photo: null, photoUrl: null, thumb: null });
            stage.replaceChildren();
            pickers.hidden = false;
            drop.hidden = false;
            api.changed();
            selfie.focus();
          },
        },
        "Retake",
      );
      stage.replaceChildren(pol, retake);
      pickers.hidden = true;
      drop.hidden = true;
      if (!animate) {
        gsap.set(pol, { rotation: -4 });
        return;
      }
      gsap
        .timeline()
        .fromTo(pol, { y: -160, rotation: -20, opacity: 0 }, { y: 0, rotation: -4, opacity: 1, duration: 1, ease: EASE.bouncy })
        .fromTo(stamp, { scale: 3, rotation: -30, opacity: 0 }, { scale: 1, rotation: -12, opacity: 1, duration: 0.28, ease: "power4.in" }, 0.55)
        .add(() => {
          sfx.pop();
          haptics.tap();
          const c = centre(stamp);
          heartBurst(c.x, c.y, 14, { quiet: true });
          if (!REDUCED) gsap.fromTo(qs("#app"), { x: 0, y: 0 }, { keyframes: { x: [-4, 4, -2, 0], y: [2, -2, 1, 0] }, duration: 0.25, ease: "none" });
        })
        .from(retake, { opacity: 0, y: 10, duration: 0.3 });
    }

    // desktop drag and drop onto the card
    wrap.addEventListener("dragover", (e) => {
      e.preventDefault();
      wrap.classList.add("over");
    });
    wrap.addEventListener("dragleave", () => wrap.classList.remove("over"));
    wrap.addEventListener("drop", (e) => {
      e.preventDefault();
      wrap.classList.remove("over");
      const f = e.dataTransfer?.files[0];
      if (f) void take(f);
    });

    const { photoUrl } = store.get();
    if (photoUrl) reveal(photoUrl, false);
    gsap.from(receipt.children, { opacity: 0, x: -12, duration: 0.35, stagger: 0.12, delay: 0.25 });
    return wrap;
  },
};
