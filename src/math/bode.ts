import { type C, abs, arg, c, div, polyval } from './complex';
import { polymul } from './poly';

export interface FreqPoint {
  w: number;
  mag: number;
  /** phase in degrees, continuous (unwrapped) across a sweep */
  phase: number;
}

/** A rational transfer function num(s)/den(s), coefficients highest power first. */
export interface TF {
  num: readonly number[];
  den: readonly number[];
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

/** Number of trailing zero coefficients (roots at s = 0). */
const originRoots = (p: readonly number[]): number => {
  let n = 0;
  while (n < p.length - 1 && p[p.length - 1 - n] === 0) n++;
  return n;
};

/**
 * Phase of num/den as ω → 0, degrees: −90° per net integrator, −180° more if the low-frequency gain
 * is negative. Anchors the unwrapped phase, so a double integrator starts at −180°, not +180°.
 */
export function lowFreqPhase(num: readonly number[], den: readonly number[]): number {
  const zn = originRoots(num);
  const zd = originRoots(den);
  const k = num[num.length - 1 - zn] / den[den.length - 1 - zd];
  return -90 * (zd - zn) - (k < 0 ? 180 : 0) + 0;
}

/** Shifts a phase (degrees) by whole turns to the branch closest to `ref`. */
const nearBranch = (ph: number, ref: number): number => ph - 360 * Math.round((ph - ref) / 360);

/**
 * Frequency response over a sweep. Phase = rational part (unwrapped, starting on the branch of its
 * low-frequency asymptote) − ωL, so the delay's ever-growing lag is represented exactly.
 */
export function sweep(num: readonly number[], den: readonly number[], delay: number, ws: readonly number[]): FreqPoint[] {
  const out: FreqPoint[] = [];
  const rational = (w: number) => div(polyval(num, c(0, w)), polyval(den, c(0, w)));
  let prev = lowFreqPhase(num, den);
  // walk up from (nearly) zero speed to the first point, so a sweep that starts high is on the right branch
  const w0 = ws[0] ?? 0;
  if (w0 > 1e-8) for (const w of logspace(-9, Math.log10(w0), Math.ceil(50 * (Math.log10(w0) + 9)) + 2)) prev = nearBranch((arg(rational(w)) * 180) / Math.PI, prev);
  ws.forEach((w) => {
    const g = rational(w);
    prev = nearBranch((arg(g) * 180) / Math.PI, prev);
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

/** Bisects g on [a, b] (log-spaced, a sign change assumed) for 60 steps. */
function bisectLog(g: (w: number) => number, a: number, b: number): number {
  let ga = g(a);
  for (let i = 0; i < 60; i++) {
    const m = Math.sqrt(a * b);
    const gm = g(m);
    if (ga * gm <= 0) b = m;
    else {
      a = m;
      ga = gm;
    }
  }
  return Math.sqrt(a * b);
}

/**
 * Gain and phase margins of an open-loop transfer function: a dense sweep finds the first
 * crossings (lowest ω) of −180° and of |L| = 1, then bisection pins them down exactly.
 */
export function margins(num: readonly number[], den: readonly number[], delay: number, wMin = 1e-3, wMax = 1e3): Margins {
  const ws = logspace(Math.log10(wMin), Math.log10(wMax), 4000);
  const pts = sweep(num, den, delay, ws);
  /** unwrapped phase at w, on the branch of the neighbouring sweep point */
  const phaseAt = (w: number, ref: number) => nearBranch((arg(evalTF(num, den, 0, w)) * 180) / Math.PI, ref + (w * delay * 180) / Math.PI) - (w * delay * 180) / Math.PI;
  let w180 = NaN;
  let gm = Infinity;
  let wc = NaN;
  let pm = NaN;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (Number.isNaN(w180) && (a.phase + 180) * (b.phase + 180) <= 0) {
      w180 = bisectLog((w) => phaseAt(w, a.phase) + 180, a.w, b.w);
      gm = 1 / abs(evalTF(num, den, delay, w180));
    }
    if (Number.isNaN(wc) && (a.mag - 1) * (b.mag - 1) <= 0) {
      wc = bisectLog((w) => Math.log(abs(evalTF(num, den, 0, w))), a.w, b.w);
      pm = 180 + phaseAt(wc, a.phase);
    }
  }
  return { gm, w180, pm, wc };
}

/** Product of transfer functions (in series). */
export function mulTF(...tfs: readonly TF[]): TF {
  return tfs.reduce<TF>((acc, g) => ({ num: polymul(acc.num, g.num), den: polymul(acc.den, g.den) }), { num: [1], den: [1] });
}

/** First-order lag 1/(τs + 1): Chapter 3's smoother, a motor, a sensor filter. */
export const lagTF = (tau: number): TF => ({ num: [1], den: [tau, 1] });

/**
 * PID with a filtered derivative, C(s) = Kp + Ki/s + Kd·s/(τf·s + 1)
 * = ((Kp·τf + Kd)s² + (Kp + Ki·τf)s + Ki) / (s(τf·s + 1)). τf = 0 is the ideal derivative.
 */
export const pidTF = (kp: number, ki: number, kd: number, tf = 0): TF => ({ num: [kp * tf + kd, kp + ki * tf, ki], den: [tf, 1, 0] });

/** What else sits in the loop besides the controller and the plant. */
export interface LoopExtras {
  /** pure delay, s (the shower's pipe) */
  delay?: number;
  /** time constants of first-order lags in series, s (a motor, a sensor) */
  lags?: readonly number[];
  /** any other transfer functions in series */
  tfs?: readonly TF[];
  /** sweep range, rad/s (default 1e-3 … 1e3) */
  wMin?: number;
  wMax?: number;
}

export interface LoopMargins extends Margins {
  /** delay margin: how many more seconds of delay before the loop hunts (see `delayMargin`) */
  dm: number;
}

/**
 * How much extra delay the loop tolerates before it starts to hunt: the phase margin (in radians)
 * divided by the crossover frequency, because a delay L lags a wave of speed ω by ωL. Returns 0
 * when the loop is already over the edge (phase margin ≤ 0 or gain margin ≤ 1), NaN if |L| never
 * crosses 1.
 */
export function delayMargin(m: Margins): number {
  if (!Number.isFinite(m.wc) || Number.isNaN(m.pm)) return NaN;
  if (m.pm <= 0 || m.gm <= 1) return 0;
  return (m.pm * Math.PI) / 180 / m.wc;
}

/**
 * Crossover, phase margin, gain margin and delay margin of a feedback loop. Either the whole loop
 * L(s) and its delay, `loopMargins(L, delay)`, or its parts, `loopMargins(C, plant, extras)`, which
 * multiplies C(s)·plant(s)·(lags and extra transfer functions)·e^(−delay·s).
 */
export function loopMargins(loop: TF, delay?: number): LoopMargins;
export function loopMargins(C: TF, plant: TF, extras?: LoopExtras): LoopMargins;
export function loopMargins(a: TF, b?: number | TF, extras: LoopExtras = {}): LoopMargins {
  const ex: LoopExtras = typeof b === 'object' ? extras : { delay: b ?? 0 };
  const parts = typeof b === 'object' ? [a, b] : [a];
  const L = mulTF(...parts, ...(ex.lags ?? []).map(lagTF), ...(ex.tfs ?? []));
  const m = margins(L.num, L.den, ex.delay ?? 0, ex.wMin, ex.wMax);
  return { ...m, dm: delayMargin(m) };
}

/**
 * The edge of a loop K·e^(−Ls) / (sⁿ·(τs + 1)) with n = 1 (an integrator: a hand that turns the knob
 * at a speed ∝ error) or n = 0 (a hand that sets the knob ∝ error): the wiggle speed ω where the lags
 * add up to 180° (n·90° + arctan ωτ + ωL), the loop gain K = ωⁿ·√(1 + ω²τ²) that returns that wiggle
 * at full size, and its period 2π/ω. Without a delay the phase never reaches 180°: gain Infinity.
 */
export function criticalGain(n: 0 | 1, delay: number, tau: number): { gain: number; w: number; period: number } {
  if (!(delay > 0)) return { gain: Infinity, w: NaN, period: NaN };
  const f = (w: number) => (n * Math.PI) / 2 + Math.atan(w * tau) + w * delay - Math.PI;
  let a = 0;
  let b = Math.PI / delay;
  for (let i = 0; i < 100; i++) {
    const m = (a + b) / 2;
    if (f(m) < 0) a = m;
    else b = m;
  }
  const w = (a + b) / 2;
  return { gain: w ** n * Math.hypot(1, w * tau), w, period: (2 * Math.PI) / w };
}
