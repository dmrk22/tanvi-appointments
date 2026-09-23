import type { Booking } from "./state";
import { CONFIG } from "../config";
import { decode } from "./image";
import { fields, barcodeBars } from "../components/ticketView";
import { seeded } from "../motion/gsap";
import { heartPath } from "../motion/particles";
import { HEART } from "../components/pixelArt";

const W = 1080;
const H = 1920;
const C = {
  milk: "#FFFFFF",
  cloud: "#FFF6FA",
  blush: "#FFD1E3",
  pink: "#FF5FA2",
  rose: "#E23E86",
  sky: "#CFE6FF",
  blue: "#5B9BFF",
  ink: "#3A2A4D",
  soft: "#7B6A8E",
};
const SOFT = (w: number, px: number) => `${w} ${px}px Fredoka, ui-rounded, system-ui, sans-serif`;
const PIXEL = (px: number) => `400 ${px}px Silkscreen, ui-monospace, monospace`;

function roundRect(x: CanvasRenderingContext2D, l: number, t: number, w: number, h: number, r: number) {
  x.beginPath();
  x.roundRect(l, t, w, h, r);
}

/** word-wrap to at most `lines` lines, ellipsis on the last */
function wrap(x: CanvasRenderingContext2D, text: string, maxW: number, lines: number) {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (x.measureText(next).width <= maxW || !cur) cur = next;
    else {
      out.push(cur);
      cur = w;
    }
  }
  if (cur) out.push(cur);
  if (out.length > lines) {
    out.length = lines;
    let last = out[lines - 1];
    while (last.length && x.measureText(`${last}…`).width > maxW) last = last.slice(0, -1);
    out[lines - 1] = `${last}…`;
  }
  return out;
}

/** 1080x1920 story-sized pass with her photo on it */
export async function renderTicketPng(b: Booking): Promise<Blob> {
  await Promise.all([
    document.fonts.load(SOFT(600, 44)),
    document.fonts.load(SOFT(500, 30)),
    document.fonts.load(PIXEL(26)),
  ]).catch(() => undefined);
  await document.fonts.ready;

  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const x = cv.getContext("2d")!;
  const rnd = seeded([...(b.id ?? "LOVE")].reduce((a, c) => a * 33 + c.charCodeAt(0), 5381) | 0);

  // background: white, blush -> sky, scattered hearts
  x.fillStyle = C.milk;
  x.fillRect(0, 0, W, H);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(255,209,227,0.9)");
  g.addColorStop(0.55, "rgba(255,246,250,0.6)");
  g.addColorStop(1, "rgba(207,230,255,0.95)");
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  for (let i = 0; i < 38; i++) {
    x.globalAlpha = 0.25 + rnd() * 0.45;
    x.fillStyle = [C.pink, C.blush, C.blue, C.milk][Math.floor(rnd() * 4)];
    x.beginPath();
    heartPath(x, rnd() * W, rnd() * H, 18 + rnd() * 38);
    x.fill();
  }
  x.globalAlpha = 1;

  // header
  x.textAlign = "center";
  x.textBaseline = "alphabetic";
  x.fillStyle = C.ink;
  x.font = SOFT(600, 76);
  x.fillText("Appointment booked", W / 2, 150);
  x.fillStyle = C.rose;
  x.font = SOFT(500, 40);
  x.fillText(`See you there, ${CONFIG.herName}.`, W / 2, 212);

  // polaroid, cover-cropped, tape, rotated -4deg, PAID stamp
  const px = W / 2;
  const py = 600;
  const pw = 520;
  const ph = 620;
  x.save();
  x.translate(px, py);
  x.rotate((-4 * Math.PI) / 180);
  x.shadowColor = "rgba(58,42,77,0.28)";
  x.shadowBlur = 40;
  x.shadowOffsetY = 18;
  x.fillStyle = C.milk;
  x.fillRect(-pw / 2, -ph / 2, pw, ph);
  x.shadowColor = "transparent";
  const inset = 26;
  const side = pw - inset * 2;
  if (b.photo) {
    const img = await decode(b.photo);
    const s = Math.min(img.width, img.height);
    x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, -pw / 2 + inset, -ph / 2 + inset, side, side);
    if ("close" in img) img.close();
  }
  x.fillStyle = C.soft;
  x.font = SOFT(500, 36);
  x.fillText("payment received", 0, ph / 2 - 34);
  // washi tape
  x.save();
  x.translate(0, -ph / 2 + 4);
  x.rotate((-3 * Math.PI) / 180);
  x.globalAlpha = 0.85;
  x.fillStyle = C.blush;
  x.fillRect(-110, -26, 220, 52);
  x.fillStyle = "rgba(255,95,162,0.45)";
  for (let i = -110; i < 110; i += 22) {
    x.beginPath();
    x.moveTo(i, 26);
    x.lineTo(i + 10, 26);
    x.lineTo(i + 30, -26);
    x.lineTo(i + 20, -26);
    x.fill();
  }
  x.restore();
  // stamp
  x.save();
  x.translate(pw / 2 - 90, ph / 2 - 170);
  x.rotate((-12 * Math.PI) / 180);
  x.fillStyle = C.ink;
  x.fillRect(-100 + 8, -38 + 8, 200, 76);
  x.fillStyle = C.milk;
  x.fillRect(-100, -38, 200, 76);
  x.strokeStyle = C.rose;
  x.lineWidth = 7;
  x.strokeRect(-100 + 3.5, -38 + 3.5, 193, 69);
  x.fillStyle = C.rose;
  x.font = `700 44px Silkscreen, monospace`;
  x.textBaseline = "middle";
  x.fillText("PAID", 0, 3);
  x.restore();
  x.restore();

  // details panel
  const rows = fields(b);
  const L = 90;
  const panelW = W - L * 2;
  const top = 965;
  x.textAlign = "left";
  x.textBaseline = "alphabetic";
  const laid: { label: string; lines: string[] }[] = [];
  x.font = SOFT(600, 42);
  for (const r of rows) {
    const value = r.note ? `${r.value} “${r.note}”` : r.value;
    laid.push({ label: r.label, lines: wrap(x, value, panelW - 80, r.label.startsWith("reason") ? 2 : 1) });
  }
  // worst case (two-line reason) is 700px tall, which keeps the love bar caption inside 1920
  const panelH = 30 + laid.reduce((a, r) => a + 34 + r.lines.length * 48, 0) + 130;
  x.shadowColor = "rgba(58,42,77,0.15)";
  x.shadowBlur = 30;
  x.shadowOffsetY = 12;
  x.fillStyle = C.cloud;
  roundRect(x, L, top, panelW, panelH, 44);
  x.fill();
  x.shadowColor = "transparent";
  x.strokeStyle = C.blush;
  x.lineWidth = 4;
  x.stroke();

  let y = top + 30;
  for (const r of laid) {
    x.fillStyle = C.soft;
    x.font = PIXEL(24);
    x.fillText(r.label.toUpperCase(), L + 40, y + 26);
    x.fillStyle = C.ink;
    x.font = SOFT(600, 42);
    r.lines.forEach((ln, i) => x.fillText(ln, L + 40, y + 70 + i * 48));
    y += 34 + r.lines.length * 48;
  }

  // perforation + heart barcode + id
  y += 20;
  x.setLineDash([14, 10]);
  x.strokeStyle = C.blush;
  x.beginPath();
  x.moveTo(L + 20, y);
  x.lineTo(L + panelW - 20, y);
  x.stroke();
  x.setLineDash([]);
  const bars = barcodeBars(b.id ?? "LOVE-0000");
  const bw = 520;
  const step = bw / bars.length;
  bars.forEach((bar, i) => {
    const bx = L + 40 + i * step;
    if (bar.heart) {
      x.fillStyle = C.pink;
      x.beginPath();
      heartPath(x, bx + 4, y + 70, 16);
      x.fill();
    } else {
      x.fillStyle = C.ink;
      x.fillRect(bx, y + 30, bar.w * 3, 80 * bar.h);
    }
  });
  x.fillStyle = C.rose;
  x.font = PIXEL(40);
  x.textAlign = "right";
  x.fillText(b.id ?? "", L + panelW - 40, y + 86);

  // pixel love bar at 100% with ∞
  const by = Math.max(top + panelH + 60, 1700);
  const segs = 12;
  const barW = 760;
  const bx0 = (W - barW) / 2 - 50;
  x.fillStyle = C.ink;
  x.fillRect(bx0 + 8, by + 8, barW, 70);
  x.fillStyle = C.milk;
  x.fillRect(bx0, by, barW, 70);
  x.lineWidth = 6;
  x.strokeStyle = C.ink;
  x.strokeRect(bx0 + 3, by + 3, barW - 6, 64);
  const sw = (barW - 24 - (segs - 1) * 8) / segs;
  for (let i = 0; i < segs; i++) {
    const sx = bx0 + 12 + i * (sw + 8);
    x.fillStyle = C.pink;
    x.fillRect(sx, by + 12, sw, 46);
    x.fillStyle = C.blush;
    x.fillRect(sx, by + 12, sw, 8);
  }
  x.textAlign = "left";
  x.fillStyle = C.ink;
  x.font = SOFT(600, 84);
  x.fillText("∞", bx0 + barW + 30, by + 64);
  // pixel heart rider at the end of the bar
  const cell = 7;
  HEART.forEach((row, ry) =>
    [...row].forEach((ch, rx) => {
      if (ch === ".") return;
      x.fillStyle = ch === "O" ? C.milk : C.pink;
      x.fillRect(bx0 + barW - 44 + rx * cell, by - 58 + ry * cell, cell, cell);
    }),
  );
  x.fillStyle = C.soft;
  x.font = PIXEL(24);
  x.textAlign = "center";
  x.fillText("LOVE BAR: FULL. OVERFLOWING.", W / 2, by + 124);

  return new Promise<Blob>((ok, fail) => cv.toBlob((bl) => (bl ? ok(bl) : fail(new Error("toBlob failed"))), "image/png"));
}
