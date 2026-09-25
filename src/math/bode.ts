import { type C, abs, arg, c, div, polyval } from './complex';

export interface FreqPoint {
  w: number;
  mag: number;
  /** phase in degrees, continuous (unwrapped) across a sweep */
  phase: number;
}

/** G(iω) = num(iω)/den(iω)·e^(−iωL). */
export function evalTF(num: readonly number[], den: readonly number[], delay: number, w: number): C {
  const s = c(0, w);
  const g = div(polyval(num, s), polyval(den, s));
  const ph = -w * delay;
  return {
    re: g.re * Math.cos(ph) - g.im * Math.sin(ph),
    im: g.re * Math.sin(ph) + g.im * Math.cos(ph),
  };
}

/**
 * Frequency response over a sweep. Phase = rational part (unwrapped) − ωL,
 * so the delay's ever-growing lag is represented exactly.
 */
export function sweep(num: readonly number[], den: readonly number[], delay: number, ws: readonly number[]): FreqPoint[] {
  const out: FreqPoint[] = [];
  let prev = 0;
  let offset = 0;
  ws.forEach((w, i) => {
    const s = c(0, w);
    const g = div(polyval(num, s), polyval(den, s));
    let ph = (arg(g) * 180) / Math.PI;
    if (i > 0) {
      while (ph + offset - prev > 180) offset -= 360;
      while (ph + offset - prev < -180) offset += 360;
    }
    prev = ph + offset;
    out.push({ w, mag: abs(g), phase: prev - (w * delay * 180) / Math.PI });
  });
  return out;
}

export const logspace = (a: number, b: number, n: number): number[] =>
  Array.from({ length: n }, (_, i) => 10 ** (a + ((b - a) * i) / (n - 1)));

export interface Margins {
  /** gain margin (×), Infinity if phase never reaches −180° */
  gm: number;
  /** frequency where phase = −180°, rad/s */
  w180: number;
  /** phase margin, degrees (NaN if |L| never crosses 1) */
  pm: number;
  /** gain crossover frequency, rad/s */
  wc: number;
}

/** Gain and phase margins of an open-loop transfer function via a dense sweep + bisection. */
export function margins(num: readonly number[], den: readonly number[], delay: number, wMin = 1e-3, wMax = 1e3): Margins {
  const ws = logspace(Math.log10(wMin), Math.log10(wMax), 4000);
  const pts = sweep(num, den, delay, ws);
  let w180 = NaN;
  let gm = Infinity;
  let wc = NaN;
  let pm = NaN;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (Number.isNaN(w180) && (a.phase + 180) * (b.phase + 180) <= 0) {
      const f = (a.phase + 180) / (a.phase - b.phase);
      w180 = a.w * (b.w / a.w) ** f;
      gm = 1 / abs(evalTF(num, den, delay, w180));
    }
    if (Number.isNaN(wc) && (a.mag - 1) * (b.mag - 1) <= 0) {
      const f = Math.log(a.mag) / (Math.log(a.mag) - Math.log(b.mag));
      wc = a.w * (b.w / a.w) ** f;
      const phase = a.phase + (b.phase - a.phase) * f;
      pm = 180 + phase;
    }
  }
  return { gm, w180, pm, wc };
}
