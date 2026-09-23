import type { Step } from "./types";
import { store } from "../lib/state";
import { dateStep } from "./date";
import { timeStep } from "./time";
import { placeStep } from "./place";
import { reasonStep } from "./reason";
import { paymentStep } from "./payment";

/** every content step, in order — review is deliberately excluded (it has no state of its own) */
export const CONTENT_STEPS: Step[] = [dateStep, timeStep, placeStep, reasonStep, paymentStep];

/** the first content step that's gone stale since it was completed (e.g. an edited date
 * cleared the time, or a picked slot has since passed), or -1 if the booking still holds up */
export function firstInvalidStep() {
  const b = store.get();
  return CONTENT_STEPS.findIndex((s) => !s.valid(b));
}
