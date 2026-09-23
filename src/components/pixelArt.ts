import { s } from "../lib/dom";

export const PIX = {
  X: "#FF5FA2",
  R: "#E23E86",
  B: "#FFD1E3",
  S: "#CFE6FF",
  C: "#5B9BFF",
  W: "#FFFFFF",
  K: "#3A2A4D",
};

/** crisp <svg> of <rect>s; one rect per horizontal run */
export function pixelSvg(map: string[], palette: Record<string, string> = PIX, cell = 4, cls = "px") {
  const w = Math.max(...map.map((r) => r.length));
  const svg = s("svg", {
    class: cls,
    viewBox: `0 0 ${w * cell} ${map.length * cell}`,
    width: w * cell,
    height: map.length * cell,
    "shape-rendering": "crispEdges",
    "aria-hidden": "true",
  });
  map.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const ch = row[x];
      let run = 1;
      while (row[x + run] === ch) run++;
      if (palette[ch])
        svg.append(s("rect", { x: x * cell, y: y * cell, width: run * cell, height: cell, fill: palette[ch] }));
      x += run;
    }
  });
  return svg;
}

/** one rect per pixel, so each can be animated on its own (boot heart) */
export function pixelCells(map: string[], palette: Record<string, string> = PIX, cell = 4) {
  const w = Math.max(...map.map((r) => r.length));
  const svg = s("svg", {
    viewBox: `0 0 ${w * cell} ${map.length * cell}`,
    "shape-rendering": "crispEdges",
    "aria-hidden": "true",
  });
  map.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (palette[ch])
        svg.append(s("rect", { x: x * cell, y: y * cell, width: cell, height: cell, fill: palette[ch], "data-row": y }));
    }),
  );
  return svg;
}

export const HEART = [
  "..XX...XX..",
  ".XXOO.XXXX.",
  "XXXOXXXXXXX",
  "XXXXXXXXXXX",
  "XXXXXXXXXXX",
  ".XXXXXXXXX.",
  "..XXXXXXX..",
  "...XXXXX...",
  "....XXX....",
  ".....X.....",
];
export const HEART_PAL = { X: PIX.X, O: PIX.W };
export const heart = (cell = 4, pal: Record<string, string> = HEART_PAL) => pixelSvg(HEART, pal, cell, "px heart");

export const PLACE_ICONS: Record<string, string[]> = {
  "FOOD COURT": [
    "...S..S..S..",
    "..S..S..S...",
    "...S..S..S..",
    "............",
    "BBBBBBBBBBBB",
    "KXXXXXXXXXXK",
    "KXXXWXWXXXXK",
    ".KXXWWWXXXK.",
    ".KXXXWXXXXK.",
    "..KXXXXXXK..",
    "...KKKKKK...",
    "..KKKKKKKK..",
  ],
  "SR BLOCK": [
    ".CCCCCCCCCC.",
    ".CWWWCCWWCC.",
    ".CWCCCCWCWC.",
    ".CWWWCCWWCC.",
    ".CCCWCCWCWC.",
    ".CWWWCCWCWC.",
    ".CCCCCCCCCC.",
    "...K....K...",
    ".XXXXXXXXXX.",
    ".BSSBBBBSSB.",
    ".BSSBBBBSSB.",
    ".BBBBKKBBBB.",
  ],
  "CV BLOCK": [
    ".....KXXX...",
    ".....KXXXX..",
    ".....KXX....",
    ".....K......",
    "..XXXXXXXX..",
    ".XXXXXXXXXX.",
    ".SSSSCCSSSS.",
    ".SSSCCCCSSS.",
    ".SSSCWCCSSS.",
    ".SSSSCCSSSS.",
    ".SSSSSSSSSS.",
    ".SSSSKKSSSS.",
  ],
  NAB: [
    ".....KK.....",
    "...XXXXXX...",
    "...CCCCCC...",
    "...CXCXCC...",
    "...CXXXCC...",
    "...CCXCCC...",
    "...BBBBBB...",
    "..BBSBBSBB..",
    "..BBBBBBBB..",
    "..BBSBBSBB..",
    "..BBBBBBBB..",
    "..BBBKKBBB..",
  ],
};

export const PIN = [".XXX.", "XXXXX", "XXWXX", "XXXXX", ".XXX.", "..X.."];
export const LOCK = ["..KKK..", ".K...K.", ".K...K.", "KKKKKKK", "KXXXXXK", "KXXWXXK", "KXXWXXK", "KKKKKKK"];
export const STAR = ["..X..", ".XXX.", "XXXXX", ".XXX.", "..X.."];
