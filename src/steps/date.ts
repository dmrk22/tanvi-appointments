import type { Step } from "../scenes/wizard";
import { store } from "../lib/state";
import { calendar } from "../components/calendar";
import { burstFrom } from "../motion/burst";
import { timeOk } from "./time";

export const dateStep: Step = {
  key: "date",
  title: "Pick a day",
  hint: "Pick a day first. Any future one.",
  valid: (b) => !!b.date,
  render(api) {
    return calendar(store.get().date, (date, el, e) => {
      const { time } = store.get();
      // a time picked earlier may now be in the past (switched to today)
      store.set({ date, time: time && timeOk(date, time) ? time : null });
      burstFrom(e, el, 10);
      api.changed();
    });
  },
};
