import { CONFIG } from "../config";

const pad = (n: number) => String(n).padStart(2, "0");
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function parts(ms: number, tz: string) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(ms)) o[p.type] = p.value;
  return { y: +o.year, mo: +o.month, d: +o.day, h: +o.hour, mi: +o.minute };
}

/** test seam: ?test=1 can shift "now" (gsap runs on the real Date, so the clock can't be frozen) */
export const clock = { offset: 0 };

/** "now" in the booking timezone: YYYY-MM-DD + minutes since midnight */
export function now(ms = Date.now() + clock.offset, tz: string = CONFIG.timezone) {
  const p = parts(ms, tz);
  return { date: `${p.y}-${pad(p.mo)}-${pad(p.d)}`, minutes: p.h * 60 + p.mi };
}

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
export const fromMin = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);
export function addDays(iso: string, n: number) {
  const t = utc(iso);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}
export const weekday = (iso: string) => DAYS[utc(iso).getUTCDay()];
/** "Friday, 3 October" */
export function longDate(iso: string) {
  const t = utc(iso);
  return `${DAYS[t.getUTCDay()]}, ${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]}`;
}
/** "4:30 PM" */
export function time12(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
}

/** wall-clock date + time in tz -> the real instant */
export function zonedToUtc(date: string, time: string, tz: string = CONFIG.timezone) {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const p = parts(guess, tz);
  const offset = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi) - guess;
  return new Date(guess - offset);
}

/** "right now (emergency)": now + 15 min, rounded up to 5 */
export const emergencyMinutes = (nowMin: number) => Math.ceil((nowMin + 15) / 5) * 5;
