import type { Booking } from "./state";
import { CONFIG, him } from "../config";
import { zonedToUtc } from "./when";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** RFC 5545 folding: max 75 octets per line, never splitting a code point */
export function fold(line: string) {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export function icsFor(b: Booking, nowMs = Date.now()) {
  const start = zonedToUtc(b.date!, b.time!, CONFIG.timezone);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const why = [b.reasons.join(", "), b.note.trim()].filter(Boolean).join(" — ");
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Tanvi's Appointment Desk//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${b.id}@tanvi-appointments`,
      `DTSTAMP:${stamp(new Date(nowMs))}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(`Appointment with ${him}`)}`,
      `LOCATION:${esc(b.place ?? "")}`,
      `DESCRIPTION:${esc(`${why}\nPass: ${b.id}`)}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT30M",
      "ACTION:DISPLAY",
      "DESCRIPTION:Appointment in 30 minutes",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .map(fold)
      .join("\r\n") + "\r\n"
  );
}
