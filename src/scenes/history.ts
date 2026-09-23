import { gsap } from "../motion/gsap";
import { EASE } from "../motion/tokens";
import { h, qs } from "../lib/dom";
import { history, type SavedBooking } from "../lib/storage";
import { longDate, time12 } from "../lib/when";
import { shareText, shareTextOnly } from "../lib/share";
import { store } from "../lib/state";
import { heart } from "../components/pixelArt";

const asBooking = (b: SavedBooking) => ({ ...store.get(), ...b, photo: null, photoUrl: null });

/** bottom sheet of past bookings, soonest first, each re-shareable */
export function openHistory() {
  const items = history.all().sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const opener = document.activeElement as HTMLElement | null;
  const close = () => {
    removeEventListener("keydown", onKey);
    gsap.to(sheet, { yPercent: 100, duration: 0.35, ease: "power2.in" });
    gsap.to(backdrop, { opacity: 0, duration: 0.35, onComplete: () => root.remove() });
    opener?.focus();
  };
  const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();

  const list = h(
    "ul",
    { class: "history-list" },
    ...items.map((b) =>
      h(
        "li",
        { class: "mini-ticket" },
        b.thumb ? h("img", { src: b.thumb, alt: "", class: "mini-thumb" }) : h("span", { class: "mini-thumb empty" }, heart(2)),
        h(
          "div",
          { class: "mini-info" },
          h("span", { class: "mini-when" }, `${longDate(b.date)}, ${time12(b.time)}`),
          h("span", { class: "mini-where pixel" }, b.place),
          h("span", { class: "mini-id pixel" }, b.id),
        ),
        h("button", { class: "pill small ghost", type: "button", testid: `history-share-${b.id}`, onclick: () => shareTextOnly(shareText(asBooking(b))) }, "Share"),
      ),
    ),
  );
  const title = h("h2", { class: "sheet-title", tabindex: -1 }, "Your appointments");
  const sheet = h(
    "div",
    { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": "Your appointments", testid: "history-sheet" },
    h("div", { class: "sheet-head" }, title, h("button", { class: "link", type: "button", testid: "history-close", onclick: close }, "Close")),
    list,
  );
  const backdrop = h("div", { class: "sheet-backdrop", onclick: close });
  const root = h("div", { class: "sheet-root" }, backdrop, sheet);
  qs("#overlay").append(root);
  addEventListener("keydown", onKey);
  gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.3 });
  gsap.fromTo(sheet, { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: EASE.pop });
  gsap.from(list.children, { y: 30, opacity: 0, duration: 0.4, ease: EASE.pop, stagger: 0.06, delay: 0.2 });
  title.focus({ preventScroll: true });
}
