import { h } from "../lib/dom";
import { makeScene } from "../lib/router";
// phase 6 replaces this stub
export const success = () => makeScene("success", (el) => void el.append(h("h1", {}, "Appointment booked")));
