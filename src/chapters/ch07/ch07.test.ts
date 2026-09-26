import { c, abs, add, div, mul, sub } from '../../math/complex';
import { laplaceNumeric, laplaceReal, table } from '../../math/laplace';
import { DRONE, DroneSim, P_ONLY, defaultDroneConfig } from '../../sim/drone-model';
import { plays } from './plays';
import { dampedCos, derivativeRule, fromFunction, fromPoints, solveDrone, spreadCount, unspinExtent, unspinIntegral, unspinLimit } from './tools';
import { autoRange } from '../../ui/plot-layout';

const P = (kp: number, h0: number) => ({ m: DRONE.m, c: DRONE.c, g: DRONE.g, kp, r: 2, h0, v0: 0 });
const { m, c: cd } = DRONE;
const mg = DRONE.m * DRONE.g;

describe('chapter 7', () => {
  it('table rows used in the widgets match the numerical probe', () => {
    for (const s of [0.5, 1.5, 3]) {
      expect(laplaceReal(() => 1, s, 80, 40000)).toBeCloseTo(1 / s, 4);
      expect(laplaceReal((t) => Math.exp(-t), s, 60, 30000)).toBeCloseTo(1 / (s + 1), 5);
      expect(laplaceReal((t) => Math.exp(0.5 * t), s + 0.6, 200, 80000)).toBeCloseTo(1 / (s + 0.1), 3);
      expect(laplaceReal((t) => Math.sin(2 * t), s, 60, 30000)).toBeCloseTo(2 / (s * s + 4), 4);
      const dc = dampedCos(0.5, 2)(c(s));
      expect(laplaceNumeric((t) => Math.exp(-0.5 * t) * Math.cos(2 * t), c(s), 60, 30000).re).toBeCloseTo(dc.re, 5);
      expect(abs(sub(table.dampedSin(0.5, 2)(c(s)), laplaceNumeric((t) => Math.exp(-0.5 * t) * Math.sin(2 * t), c(s), 60, 30000)))).toBeLessThan(1e-5);
    }
  });

  it('partial-fraction solution matches the RK4 drone from a 1 m ledge', () => {
    for (const [kp, h0] of [[20, 1], [5, 3], [60, 0.5], [12, 0]]) {
      const sol = solveDrone(P(kp, h0));
      const sim = new DroneSim(defaultDroneConfig({ pid: P_ONLY(kp), h0 }));
      let maxErr = 0;
      sim.advance(6, () => (maxErr = Math.max(maxErr, Math.abs(sim.h - sol.f(sim.t)))), 1);
      expect(maxErr).toBeLessThan(1e-6);
    }
  });

  it('forgetting the h(0) terms starts the formula at 0 instead of h0', () => {
    const wrong = solveDrone(P(20, 1), false);
    expect(wrong.f(0)).toBeCloseTo(0, 12);
    expect(solveDrone(P(20, 1)).f(0)).toBeCloseTo(1, 12);
  });

  it('partial fraction pieces recombine to the full H(s)', () => {
    const p = P(20, 1);
    const { A, B, C } = solveDrone(p);
    for (const s of [0.7, 2, 5]) {
      const D = p.m * s * s + p.c * s + p.kp;
      const full = (p.m * p.h0 * s * s + p.c * p.h0 * s + (p.kp * p.r - p.m * p.g)) / (s * D);
      expect(A / s + (B * s + C) / D).toBeCloseTo(full, 12);
    }
    expect(A).toBeCloseTo(2 - (0.5 * 9.81) / 20, 12);
  });

  it('unspinning: running integral converges to 1/(s - i w0), grows ~t when matched', () => {
    const s = c(0.4, 1);
    const lim = unspinLimit(2, s);
    const far = unspinIntegral(2, s, 80);
    expect(abs(sub(far, lim))).toBeLessThan(1e-9);
    const num = laplaceNumeric((t) => Math.cos(2 * t), s, 80, 40000);
    const numI = laplaceNumeric((t) => Math.sin(2 * t), s, 80, 40000);
    // ∫ e^{i2t} e^{-st} = L{cos} + i L{sin}
    expect(num.re - numI.im).toBeCloseTo(lim.re, 5);
    expect(unspinIntegral(2, c(0, 2), 5).re).toBeCloseTo(5, 9);
    expect(abs(unspinLimit(2, c(0.1, 2)))).toBeCloseTo(10, 9);
  });

  it('derivative rule holds for drawn signals', () => {
    const smoothFn = fromFunction((t) => 1 + 0.8 * Math.exp(-0.6 * t) * Math.cos(1.8 * t));
    const wiggly = fromPoints([
      { x: 0, y: 0.2 },
      { x: 1.3, y: 1.9 },
      { x: 2.1, y: -0.4 },
      { x: 4.5, y: 1.1 },
      { x: 6, y: 0.5 },
      { x: 7.4, y: 1.4 },
    ]);
    for (const d of [smoothFn, wiggly]) {
      for (const s of [0.3, 1, 2.5]) {
        const r = derivativeRule(d, s);
        expect(Math.abs(r.lhs - r.rhs)).toBeLessThan(5e-3);
      }
    }
  });
});

describe('chapter 7 numbers stated in the prose and quiz', () => {
  it('probe: step area 1/s, and an endless area of e^{-t} that stops growing (1 − e^{-T})', () => {
    for (const [s, want] of [[1, 1], [2, 0.5], [4, 0.25], [0.5, 2]] as const) expect(laplaceReal(() => 1, s, 80, 40000)).toBeCloseTo(want, 5);
    for (const [T, want] of [[1, 0.632], [3, 0.95], [5, 0.993], [8, 0.99966]] as const) {
      expect(laplaceReal((t) => Math.exp(-t), 0, T, 20000)).toBeCloseTo(want, 3);
      expect(1 - Math.exp(-T)).toBeCloseTo(want, 3);
    }
    // e^{0.5t}: finite for s > 0.5 (2 at s = 1); below that the partial area keeps growing
    expect(laplaceReal((t) => Math.exp(0.5 * t), 1, 120, 60000)).toBeCloseTo(2, 4);
    expect(laplaceReal((t) => Math.exp(0.5 * t), 0.4, 40, 20000)).toBeGreaterThan(2 * laplaceReal((t) => Math.exp(0.5 * t), 0.4, 20, 20000));
  });

  it('FALSE-OBVIOUS: sin 2t at s = 0 is not "infinite": its running area sloshes between 0 and 1', () => {
    let lo = Infinity;
    let hi = -Infinity;
    for (let T = 5; T <= 60; T += 0.05) {
      const v = (1 - Math.cos(2 * T)) / 2;
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    expect(lo).toBeCloseTo(0, 3);
    expect(hi).toBeCloseTo(1, 3);
    expect(laplaceReal((t) => Math.sin(2 * t), 0, Math.PI / 2, 2000)).toBeCloseTo(1, 6);
    // s < 0: the swings grow and keep flipping sign
    const x1 = laplaceReal((t) => Math.sin(2 * t), -0.2, 20, 40000);
    const x2 = laplaceReal((t) => Math.sin(2 * t), -0.2, 21.5, 40000);
    expect(Math.sign(x1)).not.toBe(Math.sign(x2));
  });

  it('explode: defaults, the 10 s window, the "close" threshold and the half-life', () => {
    expect(laplaceReal((t) => Math.exp(-0.5 * t), 1.5, 40, 20000)).toBeCloseTo(0.5, 6);
    expect(laplaceReal((t) => Math.exp(0.5 * t), 0.6, 400, 200000)).toBeCloseTo(10, 3);
    expect((1 - Math.exp(-1)) / 0.1).toBeCloseTo(6.32, 2);
    expect(1 / 0.3).toBeCloseTo(3.333, 3);
    expect(Math.log(2) / 1).toBeCloseTo(0.693, 3);
    expect(Math.log(2) / 0.1).toBeCloseTo(6.93, 2);
    for (const [s, want] of [[1, 2], [0.6, 10], [0.51, 100]] as const) expect(1 / (s - 0.5)).toBeCloseTo(want, 9);
  });

  it('unspin: default |F| 0.644, matched |F| = 1/σ, running total 9.18 at 25 s, and it equals L{cos} + i L{sin}', () => {
    expect(abs(unspinLimit(2, c(0.4, 0.5)))).toBeCloseTo(0.644, 3);
    expect(abs(unspinLimit(2, c(0.1, 2)))).toBeCloseTo(10, 9);
    expect(abs(unspinLimit(2, c(0.05, 2)))).toBeCloseTo(20, 9);
    expect(unspinIntegral(2, c(0.1, 2), 25).re).toBeCloseTo(9.179, 3);
    const s = c(0.4, 0.5);
    const sum = add(laplaceNumeric((t) => Math.cos(2 * t), s, 100, 60000), mul(c(0, 1), laplaceNumeric((t) => Math.sin(2 * t), s, 100, 60000)));
    expect(abs(sub(sum, unspinLimit(2, s)))).toBeLessThan(1e-6);
  });

  it("derivative rule: the e^{at} identity, the presets, the jump's spike and L{f''}", () => {
    for (const [a, s] of [[-1, 1], [0.5, 2], [-2, 0.3]]) {
      expect(laplaceReal((t) => a * Math.exp(a * t), s, 60, 40000)).toBeCloseTo(a / (s - a), 5);
      expect(s / (s - a) - 1).toBeCloseTo(a / (s - a), 12);
    }
    const presets = [
      (tt: number) => 1 + 0.8 * Math.exp(-0.6 * tt) * Math.cos(1.8 * tt),
      (tt: number) => (tt < 2 ? 0.1 : 1.5) + 0.3 * Math.sin(3 * tt),
      (tt: number) => 2 * Math.exp(-0.4 * tt) - 0.5,
    ];
    for (const p of presets) {
      const d = fromFunction(p);
      let worst = 0;
      for (let s = 0.2; s <= 3.001; s += 0.05) {
        const r = derivativeRule(d, s);
        worst = Math.max(worst, Math.abs(r.lhs - r.rhs));
      }
      expect(worst).toBeLessThan(1e-3);
    }
    expect(derivativeRule(fromFunction(presets[0]), 1).lhs).toBeCloseTo(-0.579, 2);
    // FALSE-OBVIOUS: the jump matches only because the slope counts the spike; without it the gap is 1.4e^{-2s}
    const lhsNoSpike = laplaceReal((tt) => 0.9 * Math.cos(3 * tt), 1, 60, 60000);
    const F = 0.1 + 1.4 * Math.exp(-2) + 0.9 / 10;
    expect(F - 0.1 - lhsNoSpike).toBeCloseTo(1.4 * Math.exp(-2), 4);
    expect(1.4 * Math.exp(-2)).toBeCloseTo(0.19, 2);
    // L{f''} = s²F − s f(0) − f'(0) for cos 2t at s = 1
    expect(laplaceReal((t) => -4 * Math.cos(2 * t), 1, 60, 40000)).toBeCloseTo(-0.8, 5);
    expect(1 * (1 / 5) - 1 * 1 - 0).toBeCloseTo(-0.8, 12);
  });

  it('table rows at s = 1, the twin spinners and linearity', () => {
    const cases: [(t: number) => number, number][] = [
      [() => 1, 1],
      [(t) => Math.exp(-t), 0.5],
      [(t) => Math.sin(2 * t), 0.4],
      [(t) => Math.cos(2 * t), 0.2],
      [(t) => Math.exp(-0.5 * t) * Math.sin(2 * t), 0.32],
      [(t) => Math.exp(-0.5 * t) * Math.cos(2 * t), 0.24],
    ];
    for (const [f, want] of cases) expect(laplaceReal(f, 1, 80, 40000)).toBeCloseTo(want, 5);
    for (const s of [c(1), c(0.3, 0.7), c(2, -1)]) {
      const twin = div(sub(div(c(1), c(s.re, s.im - 2)), div(c(1), c(s.re, s.im + 2))), c(0, 2));
      expect(abs(sub(twin, table.sin(2)(s)))).toBeLessThan(1e-12);
    }
    // subtracting the twins: e^{iωt} − e^{−iωt} = 2i sin ωt (the along parts cancel)
    for (const t of [0.3, 1.7]) {
      const d = sub(c(Math.cos(2 * t), Math.sin(2 * t)), c(Math.cos(2 * t), -Math.sin(2 * t)));
      expect(d.re).toBeCloseTo(0, 12);
      expect(d.im).toBeCloseTo(2 * Math.sin(2 * t), 12);
    }
    // linearity: 3e^{-2t} → 3/(s+2) (quiz 1), 5e^{-4t} → 5/(s+4) (quiz 2)
    for (const s of [0.5, 1, 3]) expect(laplaceReal((t) => 3 * Math.exp(-2 * t), s, 40, 20000)).toBeCloseTo(3 / (s + 2), 6);
    for (const s of [0.5, 2]) expect(laplaceReal((t) => 5 * Math.exp(-4 * t), s, 30, 20000)).toBeCloseTo(5 / (s + 4), 6);
    expect(laplaceReal((t) => 5 * Math.exp(4 * t), 5, 60, 60000)).toBeCloseTo(5 / (5 - 4), 3);
    expect(3 / (1 + 2)).toBe(1);
    expect(5 / (1 + 4)).toBe(1);
  });

  it("quiz 3 (x' + 2x = 0, x(0) = 1 → X = 1/(s+2)) and quiz 5 (L{(e^{-t})'} = −1/(s+1))", () => {
    for (const s of [0.5, 1, 4]) expect(s * (1 / (s + 2)) - 1 + 2 / (s + 2)).toBeCloseTo(0, 12);
    let x = 1;
    const dt = 1e-3;
    const f = (y: number) => -2 * y;
    for (let i = 0; i < 2000; i++) {
      const k1 = f(x);
      const k2 = f(x + (dt / 2) * k1);
      const k3 = f(x + (dt / 2) * k2);
      const k4 = f(x + dt * k3);
      x += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    }
    expect(x).toBeCloseTo(Math.exp(-4), 10);
    for (const s of [0.5, 1, 2]) {
      expect(laplaceReal((t) => -Math.exp(-t), s, 60, 30000)).toBeCloseTo(-1 / (s + 1), 6);
      expect(s / (s + 1) - 1).toBeCloseTo(-1 / (s + 1), 12);
    }
  });

  it('solve default (Kp 20, h0 1): 35.095, A 1.755, droop 0.245, B, C, σ = 1, ωd = √39, K1, K2', () => {
    const p = P(20, 1);
    const sol = solveDrone(p);
    expect(20 * 2 - mg).toBeCloseTo(35.095, 3);
    expect(sol.A).toBeCloseTo(1.75475, 5);
    expect(2 - sol.A).toBeCloseTo(0.24525, 5);
    expect(sol.B).toBeCloseTo(-0.377375, 6);
    expect(sol.C).toBeCloseTo(-0.75475, 5);
    expect(sol.sigma).toBe(1);
    expect(sol.wd).toBeCloseTo(Math.sqrt(39), 12);
    expect(sol.K1).toBeCloseTo(-0.75475, 5);
    expect(sol.K2).toBeCloseTo(-0.12085, 4);
    // coefficient matching: s² → B = m(h0 − A), s → C = m h'(0) + c(h0 − A), constants → A Kp = 2Kp − mg
    expect(sol.A * m + sol.B).toBeCloseTo(m * p.h0, 12);
    expect(sol.A * cd + sol.C).toBeCloseTo(m * p.v0 + cd * p.h0, 12);
    expect(sol.A * p.kp).toBeCloseTo(p.kp * p.r - mg, 12);
    expect(cd / (2 * Math.sqrt(m * 20))).toBeCloseTo(0.158, 3); // Ch 6's ζ at Kp = 20
  });

  it('completing the square, the numerator split and the cover-up / final value s·H(s) → A', () => {
    for (const kp of [5, 20, 60]) {
      for (const s of [0.3, 2, 7]) {
        const sig = cd / (2 * m);
        expect(m * ((s + sig) ** 2 + (kp / m - sig * sig))).toBeCloseTo(m * s * s + cd * s + kp, 10);
        expect(0.5 * ((s + 1) ** 2 + (2 * kp - 1))).toBeCloseTo(0.5 * s * s + s + kp, 10);
      }
    }
    expect(Math.sqrt(5 / 0.5 - 1)).toBeCloseTo(3, 12);
    expect(Math.sqrt(60 / 0.5 - 1)).toBeCloseTo(10.909, 3);
    const p = P(20, 1);
    const sol = solveDrone(p);
    const Hs = (s: number) => (m * p.h0 * s * s + cd * p.h0 * s + (p.kp * p.r - mg)) / (s * (m * s * s + cd * s + p.kp));
    expect(1e-7 * Hs(1e-7)).toBeCloseTo(sol.A, 5);
    expect((2 * 20 - mg) / 20).toBeCloseTo(sol.A, 12);
    for (const s of [0.4, 3]) expect(sol.B * (s + 1) + (sol.C - sol.B)).toBeCloseTo(sol.B * s + sol.C, 12);
  });

  it('the ledge mistake: wrong B, C, K2; apart early, together late; invisible from the ground', () => {
    const w = solveDrone(P(20, 1), false);
    const r = solveDrone(P(20, 1));
    expect(w.f(0)).toBeCloseTo(0, 12);
    expect(w.B).toBeCloseTo(-0.877375, 6);
    expect(w.C).toBeCloseTo(-1.75475, 5);
    expect(w.K2).toBeCloseTo(-0.28098, 4);
    let gap05 = 0;
    for (let t = 0.3; t <= 0.7; t += 0.001) gap05 = Math.max(gap05, Math.abs(r.f(t) - w.f(t)));
    expect(gap05).toBeGreaterThan(0.4);
    expect(Math.abs(r.f(10) - w.f(10))).toBeLessThan(1e-4);
    expect(r.A).toBe(w.A);
    const w0 = solveDrone(P(20, 0), false);
    const r0 = solveDrone(P(20, 0));
    for (const t of [0, 0.5, 2]) expect(w0.f(t)).toBeCloseTo(r0.f(t), 12);
  });

  it('whole slider grid: gap below a millionth of a metre, never touches the ground', () => {
    let worst = 0;
    let lowest = Infinity;
    for (let kp = 5; kp <= 60; kp += 5) {
      for (let h0 = 0; h0 <= 3.0001; h0 += 0.5) {
        const sol = solveDrone(P(kp, h0));
        const sim = new DroneSim(defaultDroneConfig({ pid: P_ONLY(kp), h0 }));
        sim.advance(6, () => {
          worst = Math.max(worst, Math.abs(sim.h - sol.f(sim.t)));
          if (sim.t > 0.01) lowest = Math.min(lowest, sim.h);
        }, 10);
      }
    }
    expect(worst).toBeLessThan(1e-6);
    expect(lowest).toBeGreaterThan(0);
  });

  it('droop callbacks and quiz 6: Kp 5 → 0.981, 60 → 0.082, 10 → settles at 1.51 m', () => {
    expect(mg / 5).toBeCloseTo(0.981, 3);
    expect(mg / 60).toBeCloseTo(0.0818, 4);
    const s = solveDrone(P(10, 0));
    expect(s.A).toBeCloseTo(1.5095, 4);
    expect(s.f(30)).toBeCloseTo(1.5095, 4);
    expect(2 - s.A).toBeCloseTo(0.4905, 4);
  });
});

describe('chapter 7 widget helpers', () => {
  it('probe: the formula unlocks on 5 spread-out dots, not 5 neighbouring arrow presses', () => {
    // five keyboard steps of 0.05 from s = 1 are one spread-out measurement, not five
    expect(spreadCount([1, 1.05, 1.1, 1.15, 1.2])).toBe(1);
    expect(spreadCount([1, 1.05, 1.1, 1.15, 1.2, 1.25])).toBe(2);
    expect(spreadCount([0.5, 1, 1.5, 2, 3])).toBe(5);
    expect(spreadCount([3, 0.5, 2, 1, 1.5])).toBe(5);
  });
});

describe('chapter 7 unspin frame', () => {
  it('auto-scaling keeps the final total (and the whole 25 s run) in the frame for every σ and ω', () => {
    let worst = 0;
    for (let sig = 0.05; sig <= 2.0001; sig += 0.05) {
      for (let om = 0; om <= 4.0001; om += 0.05) {
        const s = c(sig, om);
        const e = unspinExtent(2, s, 25);
        const L = unspinLimit(2, s);
        const fx = autoRange([-0.5, 1.5], [-0.5, 1.5], e.x, { max: true, min: true, capMax: 24, capMin: -24 });
        const fy = autoRange([-1, 1], [-1, 1], e.y, { max: true, min: true, capMax: 24, capMin: -24 });
        expect(L.re).toBeGreaterThanOrEqual(fx[0]);
        expect(L.re).toBeLessThanOrEqual(fx[1]);
        expect(L.im).toBeGreaterThanOrEqual(fy[0]);
        expect(L.im).toBeLessThanOrEqual(fy[1]);
        expect(e.x[1]).toBeLessThanOrEqual(fx[1]);
        worst = Math.max(worst, Math.abs(L.re), Math.abs(L.im));
      }
    }
    expect(worst).toBeCloseTo(20, 6); // matched at σ = 0.05: 1/σ
  });
});

describe('chapter 7 plays', () => {
  const t = (k: string) => k;
  const out = (id: string, name: string, v: Record<string, number>) => plays[id].outputs[name]({ ...Object.fromEntries(Object.entries(plays[id].inputs).map(([k, i]) => [k, i.value])), ...v }, t, t);

  it('stepArea: 1/s at 1, 2, 4', () => {
    expect(out('stepArea', 'F', {})).toBe('0.500');
    expect(out('stepArea', 'F', { s: 1 })).toBe('1.000');
    expect(out('stepArea', 'F', { s: 4 })).toBe('0.250');
  });

  it('longArea: 1 − e^{−T} at 1, 3, 5 and what is left', () => {
    expect(out('longArea', 'A', { T: 1 })).toBe('0.632');
    expect(out('longArea', 'A', {})).toBe('0.950');
    expect(out('longArea', 'left', {})).toBe('0.050');
    expect(out('longArea', 'A', { T: 5 })).toBe('0.993');
    expect(out('longArea', 'left', { T: 5 })).toBe('0.00674');
  });

  it('scream: a = 0.5 with s = 1, 0.6, 0.55 → 2, 10, 20; at or below a there is no area', () => {
    expect(out('scream', 'gap', {})).toBe('0.50');
    expect(out('scream', 'F', {})).toBe('2.00');
    expect(out('scream', 'verdict', {})).toBe('calm');
    expect(out('scream', 'F', { s: 0.6 })).toBe('10.00');
    expect(out('scream', 'verdict', { s: 0.6 })).toBe('loud');
    expect(out('scream', 'F', { s: 0.55 })).toBe('20.00');
    expect(out('scream', 'F', { s: 0.5 })).toBe('∞');
    expect(out('scream', 'verdict', { s: 0.5 })).toBe('none');
    expect(out('scream', 'verdict', { s: 0.8 })).toBe('calm'); // exactly 0.3 away is no longer "close"
    // the model is exact at finer s too: 0.51 → 100
    expect(plays.scream.outputs.F({ a: 0.5, s: 0.51 }, t)).toBe('100.00');
  });

  it('ruleExp: a = −1, s = 1 → both sides −0.500; they agree on the whole grid', () => {
    expect(out('ruleExp', 'lhs', {})).toBe('−0.500');
    expect(out('ruleExp', 'rhs', {})).toBe('0.500 − 1 = −0.500');
    for (const a of [-2, -1.5, -1, -0.5, 0]) {
      for (const s of [0.5, 1, 2, 3]) {
        const rhs = out('ruleExp', 'rhs', { a, s }).split(' = ')[1];
        expect(rhs).toBe(out('ruleExp', 'lhs', { a, s }));
        expect(laplaceReal((t) => a * Math.exp(a * t), s, 60, 30000)).toBeCloseTo(a / (s - a), 4);
      }
    }
  });

  it('scale: 3e^{−2t} at s = 1 → 1 (quiz 1); 5e^{−4t} at s = 1 → 1 (quiz 2); the area really scales', () => {
    expect(out('scale', 'eq', {})).toBe('3 ÷ (1.0 + 2.0) = 1.000');
    expect(out('scale', 'eq', { k: 5, r: 4 })).toBe('5 ÷ (1.0 + 4.0) = 1.000');
    for (const [k, r, s] of [[3, 2, 1], [5, 4, 1], [2, 0, 0.5], [4, 1.5, 2.5]]) {
      expect(laplaceReal((t) => k * Math.exp(-r * t), s, 80, 40000)).toBeCloseTo(k / (s + r), 4);
      // and a sum's area is the sum of the areas
      const sum = laplaceReal((t) => Math.exp(-r * t) + k, s, 80, 40000);
      expect(sum).toBeCloseTo(1 / (s + r) + k / s, 4);
    }
  });

  it('square: Kp 20 → ωd² 39, s = −1 ± 6.24i; Kp 5 → 9, ± 3.00i; Kp 60 → 119, ± 10.91i', () => {
    expect(out('square', 'wd2', {})).toBe('39');
    expect(out('square', 'roots', {})).toBe('−1 ± 6.24i');
    expect(out('square', 'wd2', { kp: 5 })).toBe('9');
    expect(out('square', 'roots', { kp: 5 })).toBe('−1 ± 3.00i');
    expect(out('square', 'wd2', { kp: 60 })).toBe('119');
    expect(out('square', 'roots', { kp: 60 })).toBe('−1 ± 10.91i');
    // those really are the zeros of the bottom 0.5 s² + s + Kp
    for (const k of [5, 20, 60]) {
      const w = Math.sqrt(2 * k - 1);
      const s = c(-1, w);
      const q = add(add(mul(c(0.5), mul(s, s)), s), c(k));
      expect(abs(q)).toBeLessThan(1e-9);
    }
  });

  it('residues: Kp 20 from 1 m → A 1.755, droop 0.245, −0.755 cos − 0.121 sin at 6.24; Kp 5 → droop 0.981; the ledge does not change A', () => {
    expect(out('residues', 'A', {})).toBe('1.755');
    expect(out('residues', 'droop', {})).toBe('0.245');
    expect(out('residues', 'wiggle', {})).toBe('−0.755 cos 6.24t − 0.121 sin 6.24t');
    expect(out('residues', 'A', { kp: 5 })).toBe('1.019');
    expect(out('residues', 'droop', { kp: 5 })).toBe('0.981');
    expect(out('residues', 'droop', { kp: 60 })).toBe('0.082');
    expect(out('residues', 'A', { kp: 10 })).toBe('1.509'); // quiz 6 says about 1.51 (1.5095)
    for (const h0 of [0, 1, 2.5]) expect(out('residues', 'A', { h0 })).toBe('1.755');
    // the droop is Chapter 2's mg/Kp
    expect(2 - solveDrone(P(20, 1)).A).toBeCloseTo(mg / 20, 12);
  });

  it('the wrong Step 1 gives B = −mA, C = −cA; the right one B = m(h0 − A), C = m h\'(0) + c(h0 − A)', () => {
    for (const [kp, h0] of [[20, 1], [5, 3], [60, 0.5]]) {
      const w = solveDrone(P(kp, h0), false);
      expect(w.B).toBeCloseTo(-m * w.A, 12);
      expect(w.C).toBeCloseTo(-cd * w.A, 12);
      const r = solveDrone(P(kp, h0));
      expect(r.B).toBeCloseTo(m * (h0 - r.A), 12);
      expect(r.C).toBeCloseTo(cd * (h0 - r.A), 12);
    }
    // the predict card: they start apart (0 vs 1 m) and both settle at 1.755 m
    expect(solveDrone(P(20, 1), false).f(0)).toBeCloseTo(0, 12);
    expect(solveDrone(P(20, 1)).f(0)).toBeCloseTo(1, 12);
    expect(solveDrone(P(20, 1)).A).toBeCloseTo(1.755, 3);
  });
});
