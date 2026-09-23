export const CONFIG = {
  herName: "Tanvi",
  myName: "", // shown as "with {myName}". Empty -> "with me"
  myWhatsApp: "", // digits only incl. country code, e.g. 919876543210. Empty -> WhatsApp opens its contact picker
  places: ["FOOD COURT", "SR BLOCK", "CV BLOCK", "NAB"],
  bookingWindowDays: 60,
  firstSlot: "08:00",
  lastSlot: "22:00",
  slotMinutes: 30,
  timezone: "Asia/Kolkata",
} as const;

export const me = CONFIG.myName || "me";
export const him = CONFIG.myName || "him";
