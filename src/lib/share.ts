import type { Booking } from "./state";
import { CONFIG } from "../config";
import { longDate, time12 } from "./when";

export function shareText(b: Booking) {
  const why = b.reasons.length ? b.reasons.join(", ") : b.note.trim();
  return [
    "New appointment booked 💌",
    `Guest: ${CONFIG.herName}`,
    `When: ${longDate(b.date!)} at ${time12(b.time!)}`,
    `Where: ${b.place}`,
    `Why: ${why}`,
    `Miss-o-meter: ${b.missMeter >= 100 ? "∞" : `${b.missMeter}/100`}`,
    `Pass: ${b.id}`,
    "Fee paid: 1 cute pic (attached)",
  ].join("\n");
}

export const passName = (id: string) => `${CONFIG.herName.toLowerCase()}-appointment-${id}.png`;

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export const waLink = (text: string) =>
  `https://wa.me/${CONFIG.myWhatsApp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

/**
 * With his number set, skip the OS share sheet and go straight to a WhatsApp chat with him —
 * "Send to him" should send *to him*, not open a menu of every app on the phone. Without a
 * number there's no one specific to deep-link to, so the share sheet (pick anyone) is the
 * fallback; browsers that support neither just get the PNG downloaded.
 * `png` should already be rendered: iOS drops the user gesture across slow awaits.
 */
export async function sendPass(png: Blob, text: string, name: string): Promise<"shared" | "cancelled" | "fallback"> {
  const file = new File([png], name, { type: "image/png" });
  const data: ShareData = { files: [file], title: "Appointment booked", text };
  if (!CONFIG.myWhatsApp && navigator.canShare?.(data)) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return "cancelled";
    }
  }
  download(png, name);
  // no number set -> waLink opens WhatsApp's own contact picker instead of a specific chat
  window.open(waLink(text), "_blank", "noopener");
  return "fallback";
}

/** text-only re-share (history has no full photo) */
export async function shareTextOnly(text: string) {
  if (!CONFIG.myWhatsApp && navigator.share) {
    try {
      await navigator.share({ title: "Appointment", text });
      return;
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return;
    }
  }
  window.open(waLink(text), "_blank", "noopener");
}
