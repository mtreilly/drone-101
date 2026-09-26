import { criticalGain, delayMargin, lagTF, logspace, loopMargins, lowFreqPhase, margins, mulTF, pidTF, sweep, evalTF } from './bode';
import { abs } from './complex';

const deg = (r: number) => (r * 180) / Math.PI;

describe('transfer-function building blocks', () => {
  it('mulTF multiplies in series; lagTF is 1/(τs + 1)', () => {
    const g = mulTF(lagTF(1), lagTF(0.5), { num: [2], den: [1, 0] });
    expect(g.num).toEqual([2]);
    expect(g.den).toEqual([0.5, 1.5, 1, 0]);
    expect(mulTF()).toEqual({ num: [1], den: [1] });
  });

  it('pidTF(kp, ki, kd, τf) equals Kp + Ki/s + Kd·s/(τf·s + 1) at every speed', () => {
    const [kp, ki, kd, tf] = [20, 15, 5, 0.04];
    const C = pidTF(kp, ki, kd, tf);
    for (const w of [0.1, 1, 10, 100]) {
      const g = evalTF(C.num, C.den, 0, w);
      // Kd·iω/(1 + iωτf) = Kd·(ω²τf + iω)/(1 + ω²τf²)
      const d = 1 + w * w * tf * tf;
      expect(g.re).toBeCloseTo(kp + (kd * w * w * tf) / d, 9);
      expect(g.im).toBeCloseTo(-ki / w + (kd * w) / d, 9);
    }
    // τf = 0: the ideal derivative
    const ideal = pidTF(kp, ki, kd);
    const g = evalTF(ideal.num, ideal.den, 0, 3);
    expect(g.re).toBeCloseTo(kp, 12);
    expect(g.im).toBeCloseTo(-ki / 3 + kd * 3, 12);
  });
});

describe('phase unwrapping starts on the right branch', () => {
  it('low-frequency asymptote: −90° per integrator, +90° per differentiator, −180° for a negative gain', () => {
    expect(lowFreqPhase([1], [1, 1])).toBe(0);
    expect(lowFreqPhase([1], [1, 0])).toBe(-90);
    expect(lowFreqPhase([1], [0.5, 1, 0, 0])).toBe(-180);
    expect(lowFreqPhase([1, 0], [1, 1])).toBe(90);
    expect(lowFreqPhase([-1], [1, 1])).toBe(-180);
  });

  it('a double integrator starts at −180°, never +180°', () => {
    const [p] = sweep([1], [1, 1, 0, 0], 0, [1e-3]);
    expect(p.phase).toBeCloseTo(-180, 0);
    expect(p.phase).toBeLessThan(-180);
  });

  it('a sweep that starts at a high speed still finds its branch (three lags: −3·arctan ω)', () => {
    const g = mulTF(lagTF(1), lagTF(1), lagTF(1));
    for (const w of [0.5, 3, 20]) {
      const [p] = sweep(g.num, g.den, 0, [w]);
      expect(p.phase).toBeCloseTo(-3 * deg(Math.atan(w)), 6);
    }
  });
});

describe('loop margins', () => {
  it('standard second-order loop ωn²/(s(s + 2ζωn)): PM = arctan(2ζ/√(√(1+4ζ⁴) − 2ζ²)), no −180° crossing', () => {
    const pmFormula = (z: number) => deg(Math.atan((2 * z) / Math.sqrt(Math.sqrt(1 + 4 * z ** 4) - 2 * z ** 2)));
    for (const [z, pm] of [[0.4, 43.1], [0.5, 51.8], [0.6, 59.2]]) {
      const m = loopMargins({ num: [1], den: [1, 2 * z, 0] });
      expect(pmFormula(z)).toBeCloseTo(pm, 1);
      expect(m.pm).toBeCloseTo(pmFormula(z), 6);
      expect(m.gm).toBe(Infinity);
      // crossover where ω²·(ω² + 4ζ²) = 1
      expect(m.wc ** 2 * (m.wc ** 2 + 4 * z * z)).toBeCloseTo(1, 9);
    }
  });

  it('the two call forms agree: loopMargins(L, delay) and loopMargins(C, plant, { delay, lags, tfs })', () => {
    const C = pidTF(2, 1, 0.5, 0.1);
    const plant = { num: [1], den: [1, 1, 0] };
    const whole = loopMargins(mulTF(C, plant, lagTF(0.2), lagTF(0.05)), 0.3);
    const parts = loopMargins(C, plant, { delay: 0.3, lags: [0.2], tfs: [lagTF(0.05)] });
    expect(parts).toEqual(whole);
    expect(Number.isFinite(whole.pm)).toBe(true);
    expect(Number.isFinite(whole.gm)).toBe(true);
  });

  it('crossings are exact: |L(iωc)| = 1 and ∠L(iω180) = −180°', () => {
    const L = mulTF({ num: [0.36], den: [1, 0] }, lagTF(1));
    const m = margins(L.num, L.den, 2.5);
    expect(abs(evalTF(L.num, L.den, 2.5, m.wc))).toBeCloseTo(1, 10);
    expect(Math.atan(m.w180) + m.w180 * 2.5).toBeCloseTo(Math.PI / 2, 10);
    // the phase margin read off at the crossover: 180° − (90° + arctan ωc + ωc·L)
    expect(m.pm).toBeCloseTo(90 - deg(Math.atan(m.wc)) - deg(m.wc * 2.5), 8);
  });

  it('delay margin = PM (rad) / ωc: adding exactly that delay puts the loop on the edge', () => {
    for (const L of [{ num: [0.36], den: [1, 1, 0] }, { num: [0.45, 0.27], den: [1, 1, 0] }]) {
      const m = loopMargins(L, 2.5);
      expect(m.dm).toBeCloseTo((m.pm * Math.PI) / 180 / m.wc, 12);
      expect(delayMargin(m)).toBe(m.dm);
      const edge = loopMargins(L, 2.5 + m.dm);
      expect(Math.abs(edge.pm)).toBeLessThan(1e-6);
      expect(edge.gm).toBeCloseTo(1, 6);
      // already over the edge: no margin left
      expect(loopMargins(L, 2.5 + 2 * m.dm).dm).toBe(0);
    }
    expect(delayMargin({ gm: 2, w180: 1, pm: NaN, wc: NaN })).toBeNaN();
  });
});

describe('critical gain of an (integrator +) lag + delay loop', () => {
  it('agrees with the margins of the same loop at gain 1, for speed (n = 1) and position (n = 0) hands', () => {
    for (const L of [1, 2.5, 5]) for (const tau of [0.5, 1]) {
      const i = criticalGain(1, L, tau);
      const mi = loopMargins({ num: [1], den: [tau, 1, 0] }, L);
      expect(i.gain).toBeCloseTo(mi.gm, 9);
      expect(i.w).toBeCloseTo(mi.w180, 9);
      expect(i.period).toBeCloseTo((2 * Math.PI) / i.w, 12);
      const p = criticalGain(0, L, tau);
      const mp = loopMargins({ num: [1], den: [tau, 1] }, L);
      expect(p.gain).toBeCloseTo(mp.gm, 9);
      expect(p.w).toBeCloseTo(mp.w180, 9);
    }
  });

  it('without a delay the lags never add up to 180°', () => {
    expect(criticalGain(1, 0, 1).gain).toBe(Infinity);
    expect(margins([1], [1, 1, 0], 0).gm).toBe(Infinity);
  });

  it('a pure delay never changes the gain, only the phase', () => {
    for (const w of logspace(-2, 2, 9)) expect(abs(evalTF([1], [1], 2.5, w))).toBeCloseTo(1, 12);
  });
});
