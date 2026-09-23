import { test, expect } from "@playwright/test";
import { addDays, longDate, time12, zonedToUtc, now, emergencyMinutes, fromMin } from "../src/lib/when";
import { ticketId } from "../src/lib/id";

test("date + time helpers", () => {
  expect(addDays("2026-02-27", 2)).toBe("2026-03-01");
  expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  expect(longDate("2026-10-02")).toBe("Friday, 2 October");
  expect(time12("16:30")).toBe("4:30 PM");
  expect(time12("00:05")).toBe("12:05 AM");
  expect(time12("12:00")).toBe("12:00 PM");
  // IST is UTC+5:30: 16:30 IST == 11:00Z
  expect(zonedToUtc("2026-10-02", "16:30", "Asia/Kolkata").toISOString()).toBe("2026-10-02T11:00:00.000Z");
  // 23:10Z is already the next day in Kolkata
  expect(now(Date.UTC(2026, 9, 2, 23, 10), "Asia/Kolkata")).toEqual({ date: "2026-10-03", minutes: 4 * 60 + 40 });
  expect(fromMin(emergencyMinutes(16 * 60 + 2))).toBe("16:20");
  expect(fromMin(emergencyMinutes(16 * 60 + 5))).toBe("16:20");
  expect(fromMin(emergencyMinutes(16 * 60 + 6))).toBe("16:25");
});

test("ticket ids use the unambiguous alphabet", () => {
  for (let i = 0; i < 200; i++) expect(ticketId()).toMatch(/^LOVE-[2-9A-HJ-NP-Z]{4}$/);
});
