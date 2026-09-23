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
 * The OS share sheet is the *only* way the photo itself can travel into WhatsApp already
 * attached — there is no link or API that pre-attaches a file to a WhatsApp message, so this
 * has to be tried first whenever the browser supports it, even though it means she picks
 * WhatsApp from a menu rather than landing there directly. Only browsers with no file-sharing
 * support at all fall back to a direct link to his number, where she attaches the photo herself.
 * `png` should already be rendered: iOS drops the user gesture across slow awaits.
 */
export async function sendPass(png: Blob, text: string, name: string): Promise<"shared" | "cancelled" | "fallback"> {
  const file = new File([png], name, { type: "image/png" });
  const data: ShareData = { files: [file], title: "Appointment booked", text };
  if (navigator.canShare?.(data)) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return "cancelled";
    }
  }
  download(png, name);
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
