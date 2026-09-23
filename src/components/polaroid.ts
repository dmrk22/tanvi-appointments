import { h } from "../lib/dom";

/** white frame, thicker bottom, pink washi tape on top */
export function polaroid(url: string, caption = "", cls = "") {
  return h(
    "figure",
    { class: `polaroid ${cls}` },
    h("span", { class: "tape", "aria-hidden": "true" }),
    h("img", { src: url, alt: "Her photo: the appointment fee", draggable: "false" }),
    caption ? h("figcaption", {}, caption) : "",
  );
}

export const paidStamp = () => h("span", { class: "stamp paid", "aria-hidden": "true" }, "PAID");
