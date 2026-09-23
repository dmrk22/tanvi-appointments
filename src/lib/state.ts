export type Booking = {
  date: string | null; // YYYY-MM-DD
  time: string | null; // HH:mm 24h
  place: string | null;
  reasons: string[];
  note: string;
  missMeter: number; // 1..100, 100 renders as ∞
  photo: Blob | null;
  photoUrl: string | null;
  thumb: string | null; // 160px data URL for history
  id: string | null;
};

const blank = (): Booking => ({
  date: null,
  time: null,
  place: null,
  reasons: [],
  note: "",
  missMeter: 50,
  photo: null,
  photoUrl: null,
  thumb: null,
  id: null,
});

let state = blank();
const subs = new Set<(b: Booking) => void>();

export const store = {
  get: () => state,
  set(patch: Partial<Booking>) {
    if (patch.photoUrl !== undefined && state.photoUrl && patch.photoUrl !== state.photoUrl)
      URL.revokeObjectURL(state.photoUrl);
    state = { ...state, ...patch };
    subs.forEach((f) => f(state));
  },
  subscribe(f: (b: Booking) => void) {
    subs.add(f);
    return () => void subs.delete(f);
  },
  reset() {
    if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
    state = blank();
    subs.forEach((f) => f(state));
  },
};
