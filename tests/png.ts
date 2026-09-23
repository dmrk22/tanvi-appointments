import { deflateSync, crc32 } from "node:zlib";

/** tiny in-memory PNG (pink->blue gradient with a white heart-ish blob) for upload tests */
export function testPng(w = 240, h = 300) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const i = y * (w * 3 + 1) + 1 + x * 3;
      const t = y / h;
      const dx = (x - w / 2) / (w / 4);
      const dy = (y - h / 2.4) / (h / 5);
      const blob = dx * dx + dy * dy < 1;
      raw[i] = blob ? 255 : Math.round(255 * (1 - t) + 91 * t);
      raw[i + 1] = blob ? 255 : Math.round(95 * (1 - t) + 155 * t);
      raw[i + 2] = blob ? 255 : Math.round(162 * (1 - t) + 255 * t);
    }
  }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
