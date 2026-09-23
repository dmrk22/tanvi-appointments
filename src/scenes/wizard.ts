import { h } from "../lib/dom";
import { makeScene } from "../lib/router";
// phase 4 replaces this stub
export const wizard = () => makeScene("wizard", (el) => void el.append(h("h1", {}, "Wizard")));
