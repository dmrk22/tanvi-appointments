import { h, s } from "../lib/dom";
import type { Booking } from "../lib/state";
import { CONFIG } from "../config";
import { longDate, time12 } from "../lib/when";
import { seeded } from "../motion/gsap";
import { missWords } from "../steps/reason";
import { polaroid, paidStamp } from "./polaroid";
import { HEART_D } from "./pixelArt";

export const missLabel = (v: number) => (v >= 100 ? "∞" : `${v}/100, ${missWords(v)}`);

/** the rows every pass shows; step = the wizard step that edits it */
export function fields(b: Booking) {
  return [
    { label: "guest", value: CONFIG.herName, step: -1 },
    { label: "date", value: b.date ? longDate(b.date) : "", step: 0 },
    { label: "time", value: b.time ? time12(b.time) : "", step: 1 },
    { label: "place", value: b.place ?? "", step: 2 },
    { label: b.reasons.length > 1 ? "reasons" : "reason", value: b.reasons.join(", ") || "See note", note: b.note.trim(), step: 3 },
    { label: "miss-o-meter", value: missLabel(b.missMeter), step: 3 },
  ];
}

const hash = (id: string) => [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);

/** thin bars, some of them tiny hearts; deterministic per ticket id */
export function barcodeBars(id: string, n = 46) {
  const r = seeded(hash(id));
  return Array.from({ length: n }, () => ({ w: r() < 0.3 ? 3 : r() < 0.6 ? 2 : 1, heart: r() < 0.14, h: 0.75 + r() * 0.25 }));
}

export function barcode(id: string) {
  const bars = barcodeBars(id);
  const svg = s("svg", { class: "barcode", viewBox: "0 0 160 34", preserveAspectRatio: "none", "aria-hidden": "true" });
  let x = 0;
  const step = 160 / bars.length;
  for (const b of bars) {
    if (b.heart)
      svg.append(s("path", { d: HEART_D, fill: "#FF5FA2", transform: `translate(${x - 1} 12) scale(0.5)` }));
    else svg.append(s("rect", { x, y: 0, width: b.w * 0.9, height: 34 * b.h, fill: "#3A2A4D" }));
    x += step;
  }
  return svg;
}

/** boarding-pass ticket; with onEdit, rows are buttons that jump back to their step */
export function ticketView(b: Booking, onEdit?: (step: number) => void) {
  const rows = fields(b).map((f) => {
    const kids = [
      h("span", { class: "t-label pixel" }, f.label),
      h("span", { class: "t-value" }, f.value),
      f.note ? h("span", { class: "t-note" }, `“${f.note}”`) : "",
    ];
    if (!onEdit || f.step < 0) return h("div", { class: "t-row" }, ...kids);
    return h(
      "button",
      { class: "t-row edit", type: "button", testid: `edit-${f.label}`, "aria-label": `${f.label}: ${f.value}. Edit`, onclick: () => onEdit(f.step) },
      ...kids,
    );
  });
  const photo = b.photoUrl ? polaroid(b.photoUrl, "", "mini") : h("div", { class: "polaroid mini empty" });
  if (b.photoUrl) photo.append(paidStamp());
  if (onEdit && b.photoUrl) {
    const edit = h("button", { class: "t-photo", type: "button", testid: "edit-photo", "aria-label": "Photo. Change it", onclick: () => onEdit(4) }, photo);
    return shell(edit);
  }
  return shell(photo);

  function shell(left: HTMLElement) {
    return h(
      "div",
      { class: "ticket", testid: "ticket" },
      h("div", { class: "t-main" }, h("div", { class: "t-left" }, left), h("div", { class: "t-perf", "aria-hidden": "true" }), h("div", { class: "t-right" }, ...rows)),
      h("div", { class: "t-foot" }, barcode(b.id ?? "LOVE-0000"), h("span", { class: "t-id pixel", testid: "ticket-id" }, b.id ?? "")),
    );
  }
}
