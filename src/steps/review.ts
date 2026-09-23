import type { Step } from "../scenes/wizard";
import { h } from "../lib/dom";
// phase 5 replaces this stub
export const reviewStep: Step = {
  key: "review",
  title: "Your appointment pass",
  hint: "",
  valid: (b) => !!b.photo,
  render: () => h("div", {}, "review"),
};
