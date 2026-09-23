import { addTick, fitCanvas, DPR } from "./loop";
import { COARSE, REDUCED, rand, pick } from "./gsap";

export type Kind = "heart" | "petal" | "sparkle" | "pixel";
type Mode = "ambient" | "burst" | "rain" | "target";

type P = {
  on: boolean;
  kind: Kind;
  mode: Mode;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  age: number;
  life: number;
  phase: number;
  rise: number;
  tx: number;
  ty: number;
  a: number;
};

export const PALETTE = ["#FF5FA2", "#FFD1E3", "#CFE6FF", "#5B9BFF"];
const TAU = Math.PI * 2;

/** heart from two arcs + a triangle, centred on x,y, width s */
export function heartPath(c: CanvasRenderingContext2D | Path2D, x: number, y: number, s: number) {
  const r = s / 4;
  const cy = y - r * 0.5;
  c.moveTo(x, cy);
  c.arc(x - r, cy, r, 0, TAU);
  c.moveTo(x + 2 * r, cy);
  c.arc(x + r, cy, r, 0, TAU);
  // triangle tangent-ish to both lobes
  c.moveTo(x - 2 * r + 0.3 * r, cy + 0.55 * r);
  c.lineTo(x + 2 * r - 0.3 * r, cy + 0.55 * r);
  c.lineTo(x, y + s * 0.5);
  c.closePath();
}

const sprites = new Map<string, HTMLCanvasElement>();
function heartSprite(color: string) {
  let c = sprites.get(color);
  if (!c) {
    c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d")!;
    x.fillStyle = color;
    x.beginPath();
    heartPath(x, 32, 34, 58);
    x.fill();
    sprites.set(color, c);
  }
  return c;
}

export class Engine {
  pool: P[];
  ambientTarget = 0;
  private ctx: CanvasRenderingContext2D;
  private rainLeft = 0;
  private rainKinds: Kind[] = ["petal", "heart"];
  private drew = true;

  constructor(canvas: HTMLCanvasElement, cap: number) {
    this.ctx = fitCanvas(canvas);
    this.pool = Array.from({ length: cap }, () => ({ on: false }) as P);
    addTick((dt) => this.tick(dt));
  }

  get live() {
    return this.pool.reduce((n, p) => n + (p.on ? 1 : 0), 0);
  }

  spawn(o: Partial<P> & Pick<P, "kind" | "mode" | "x" | "y">): P | null {
    const p = this.pool.find((q) => !q.on);
    if (!p) return null;
    Object.assign(p, {
      on: true,
      vx: 0,
      vy: 0,
      rot: rand(-0.4, 0.4),
      vr: rand(-1, 1),
      size: 14,
      color: pick(PALETTE),
      age: 0,
      life: 1,
      phase: rand(0, TAU),
      rise: rand(22, 48),
      tx: 0,
      ty: 0,
      a: 1,
      ...o,
    });
    return p;
  }

  burst(
    x: number,
    y: number,
    n = 10,
    o: { kinds?: Kind[]; colors?: string[]; speed?: number; size?: [number, number] } = {},
  ) {
    const kinds = o.kinds ?? ["heart", "heart", "sparkle"];
    const speed = o.speed ?? 320;
    const [s0, s1] = o.size ?? [10, 20];
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU + rand(-0.3, 0.3);
      const v = speed * rand(0.45, 1);
      this.spawn({
        kind: pick(kinds),
        mode: "burst",
        x,
        y,
        vx: Math.cos(ang) * v,
        vy: Math.sin(ang) * v - speed * 0.35,
        size: rand(s0, s1),
        color: pick(o.colors ?? PALETTE),
        life: rand(0.8, 1.6),
        vr: rand(-6, 6),
      });
    }
  }

  rain(seconds: number, kinds: Kind[] = ["petal", "petal", "heart"]) {
    this.rainLeft = Math.max(this.rainLeft, seconds);
    this.rainKinds = kinds;
  }

  /** targets fly home to tx,ty and wait; release() flings them outward */
  release(speed = 380) {
    for (const p of this.pool)
      if (p.on && p.mode === "target") {
        const ang = Math.atan2(p.y - innerHeight / 2, p.x - innerWidth / 2) + rand(-0.4, 0.4);
        Object.assign(p, {
          mode: "burst",
          vx: Math.cos(ang) * speed * rand(0.5, 1),
          vy: Math.sin(ang) * speed * rand(0.5, 1),
          life: rand(0.6, 1.1),
          age: 0,
        });
      }
  }

  clear(mode?: Mode) {
    for (const p of this.pool) if (!mode || p.mode === mode) p.on = false;
  }

  private respawnAmbient(p: P) {
    Object.assign(p, {
      kind: Math.random() < 0.6 ? "heart" : "petal",
      x: rand(0, innerWidth),
      y: innerHeight + rand(10, 60),
      vx: 0,
      vy: -rand(22, 48),
      size: rand(8, 18),
      color: pick(PALETTE),
      age: 0,
      phase: rand(0, TAU),
      rise: rand(22, 48),
    });
  }

  private tick(dt: number) {
    const W = innerWidth;
    const H = innerHeight;

    // top up ambient population, a few per frame so it fades in
    let amb = 0;
    for (const p of this.pool) if (p.on && p.mode === "ambient") amb++;
    for (let i = 0; amb < this.ambientTarget && i < 2; i++, amb++) {
      const p = this.spawn({ kind: "heart", mode: "ambient", x: 0, y: 0 });
      if (p) this.respawnAmbient(p);
    }
    if (this.rainLeft > 0) {
      this.rainLeft -= dt;
      const n = Math.random() < dt * (REDUCED ? 6 : 40) ? 1 : 0;
      for (let i = 0; i < n; i++)
        this.spawn({
          kind: pick(this.rainKinds),
          mode: "rain",
          x: rand(0, W),
          y: -20,
          vy: rand(90, 170),
          size: rand(10, 20),
          vr: rand(-2, 2),
          life: 99,
        });
    }

    const c = this.ctx;
    let drawing = false;
    for (const p of this.pool) if (p.on) drawing = true;
    if (!drawing && !this.drew) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, c.canvas.width, c.canvas.height);
    this.drew = drawing;

    for (const p of this.pool) {
      if (!p.on) continue;
      p.age += dt;
      switch (p.mode) {
        case "ambient": {
          const drag = Math.pow(0.9, dt * 60);
          p.vx *= drag;
          p.vy += (-p.rise - p.vy) * Math.min(1, dt * 1.2);
          p.x += p.vx * dt + Math.cos(p.age * 1.3 + p.phase) * 20 * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt * 0.4;
          const fadeIn = Math.min(1, (H - p.y) / (H * 0.15));
          const fadeOut = Math.min(1, p.y / (H * 0.3));
          p.a = Math.max(0, Math.min(fadeIn, fadeOut)) * 0.6;
          if (p.y < -30 || p.x < -60 || p.x > W + 60) {
            if (amb > this.ambientTarget) {
              p.on = false;
              amb--;
            } else this.respawnAmbient(p);
          }
          break;
        }
        case "burst": {
          const drag = Math.pow(0.94, dt * 60);
          p.vx *= drag;
          p.vy = p.vy * drag + 700 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          const k = p.age / p.life;
          p.a = 1 - k * k;
          if (k >= 1) p.on = false;
          break;
        }
        case "rain":
          p.x += Math.sin(p.age * 1.6 + p.phase) * 50 * dt + 12 * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          p.a = Math.min(1, (H + 30 - p.y) / 80);
          if (p.y > H + 30) p.on = false;
          break;
        case "target": {
          const k = Math.min(1, dt * 7);
          p.x += (p.tx - p.x) * k;
          p.y += (p.ty - p.y) * k;
          p.a = Math.min(1, p.age * 4);
          break;
        }
      }
      if (!p.on) continue;
      this.draw(c, p);
    }
  }

  private draw(c: CanvasRenderingContext2D, p: P) {
    c.globalAlpha = p.a;
    if (p.kind === "pixel") {
      c.setTransform(DPR, 0, 0, DPR, 0, 0);
      c.fillStyle = p.color;
      const g = p.mode === "target" ? 1 : 4;
      c.fillRect(Math.round(p.x / g) * g, Math.round(p.y / g) * g, p.size, p.size);
      return;
    }
    const cos = Math.cos(p.rot);
    const sin = Math.sin(p.rot);
    const sx = p.kind === "petal" ? Math.cos(p.age * 3 + p.phase) : 1; // flip on the long axis
    c.setTransform(cos * sx * DPR, sin * sx * DPR, -sin * DPR, cos * DPR, p.x * DPR, p.y * DPR);
    const s = p.size;
    if (p.kind === "heart") {
      c.drawImage(heartSprite(p.color), -s / 2, -s / 2, s, s);
      return;
    }
    c.fillStyle = p.color;
    c.beginPath();
    if (p.kind === "petal") c.ellipse(0, 0, s * 0.3, s * 0.5, 0, 0, TAU);
    else {
      // 4-point sparkle
      const r = s / 2;
      const q = r * 0.28;
      c.moveTo(0, -r);
      c.quadraticCurveTo(q, -q, r, 0);
      c.quadraticCurveTo(q, q, 0, r);
      c.quadraticCurveTo(-q, q, -r, 0);
      c.quadraticCurveTo(-q, -q, 0, -r);
    }
    c.fill();
  }
}

const AMBIENT_CAP = REDUCED ? 8 : COARSE ? 60 : 110;

/** z1: floating hearts + petals behind the app */
export const ambient = new Engine(document.querySelector<HTMLCanvasElement>("#ambient")!, AMBIENT_CAP);
/** z4: bursts, rain, trail and the success pixels, above the app */
export const fx = new Engine(document.querySelector<HTMLCanvasElement>("#trail")!, REDUCED ? 40 : COARSE ? 260 : 320);

export function setAmbientDensity(k: number) {
  ambient.ambientTarget = REDUCED ? Math.min(8, AMBIENT_CAP) : Math.round(AMBIENT_CAP * k);
}
