type Kid = Node | string | number | null | undefined | false;
type Attrs = Record<string, unknown>;

const SVG_NS = "http://www.w3.org/2000/svg";

function apply(el: Element, attrs: Attrs, kids: Kid[]) {
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v as EventListener);
    else if (k === "text") el.textContent = String(v);
    else if (k === "testid") el.setAttribute("data-testid", String(v));
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of kids) if (c != null && c !== false) el.append(typeof c === "number" ? String(c) : c);
  return el;
}

/** h("button", { class: "pill", onclick, testid: "go" }, "Book") */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...kids: Kid[]) {
  return apply(document.createElement(tag), attrs, kids) as HTMLElementTagNameMap[K];
}

export function s<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, ...kids: Kid[]) {
  return apply(document.createElementNS(SVG_NS, tag), attrs, kids) as SVGElementTagNameMap[K];
}

export const qs = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel)!;

export function on<K extends keyof WindowEventMap>(
  el: EventTarget,
  type: K,
  fn: (e: WindowEventMap[K]) => void,
  opts?: AddEventListenerOptions,
) {
  el.addEventListener(type, fn as EventListener, opts);
  return () => el.removeEventListener(type, fn as EventListener, opts);
}

/** centre of an element in viewport px */
export function centre(el: Element) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
