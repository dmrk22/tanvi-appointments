type Tick = (dt: number, now: number) => void;

const ticks = new Set<Tick>();
let raf = 0;
let last = 0;

function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  ticks.forEach((f) => f(dt, now));
  raf = ticks.size ? requestAnimationFrame(frame) : 0;
}

function start() {
  if (raf || document.hidden || !ticks.size) return;
  last = performance.now();
  raf = requestAnimationFrame(frame);
}

/** one shared rAF loop for all canvas work; returns remove() */
export function addTick(f: Tick) {
  ticks.add(f);
  start();
  return () => void ticks.delete(f);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelAnimationFrame(raf);
    raf = 0;
  } else start();
});

export const DPR = Math.min(2, window.devicePixelRatio || 1);

/** size a fixed full-screen canvas to the viewport at capped DPR */
export function fitCanvas(c: HTMLCanvasElement) {
  const ctx = c.getContext("2d")!;
  const fit = () => {
    c.width = Math.round(innerWidth * DPR);
    c.height = Math.round(innerHeight * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };
  fit();
  addEventListener("resize", fit);
  return ctx;
}
