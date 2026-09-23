export type SavedBooking = {
  id: string;
  date: string;
  time: string;
  place: string;
  reasons: string[];
  note: string;
  missMeter: number;
  thumb: string | null;
  at: number;
};

const KEY = "tanvi.history.v1";
const MAX = 20;

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
}

export const history = {
  all: () => readJSON<SavedBooking[]>(KEY, []).filter((b) => b && b.id && b.date),
  add(b: SavedBooking) {
    const next = [b, ...history.all().filter((x) => x.id !== b.id)].slice(0, MAX);
    // thumbnails can blow the quota: retry without them rather than lose the booking
    if (!writeJSON(KEY, next)) writeJSON(KEY, next.map((x) => ({ ...x, thumb: null })));
  },
};
