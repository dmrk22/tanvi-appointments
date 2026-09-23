import type { Booking } from "../lib/state";

export type StepApi = {
  /** re-check validity after the booking changed */
  changed(): void;
  next(e?: Event): void;
  goTo(i: number): void;
};
export type Step = {
  key: string;
  title: string;
  /** toast when Next is pressed too early */
  hint: string;
  valid(b: Booking): boolean;
  render(api: StepApi): HTMLElement;
  /** replaces the Next button (review: hold to confirm) */
  footer?(api: StepApi): HTMLElement;
};
