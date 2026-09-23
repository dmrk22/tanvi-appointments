import type { Step } from "../scenes/wizard";
import { h } from "../lib/dom";
// phase 5 replaces this stub
export const paymentStep: Step = {
  key: "payment",
  title: "Appointment fee",
  hint: "Payment pending: one cute pic.",
  valid: (b) => !!b.photo,
  render: () => h("div", {}, "payment"),
};
