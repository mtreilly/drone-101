import { stepMetrics } from '../../math/metrics';
import { roots } from '../../math/poly';
import { DRONE, DroneSim, HOVER_THRUST, defaultDroneConfig } from '../../sim/drone-model';
import { RK4 } from '../../sim/integrator';
import { limitRun, pd } from './limit';
import { plays, zeroOvershoot } from './plays';
import { budgetRadius, gainsFromPoles, noZeroResponse, recipeGain, stepFromPoles, zeroResponse } from './poles';

const { m } = DRONE;
/** a translator that shows keys, and fills the percent template */
const t = (k: string, vars?: Record<string, string | number>) => (k === 'pct' ? `${vars?.v}%` : k);
const out = (id: string, name: string, v: Record<string, number>) => plays[id].outputs[name](v, t, t);
const grid = (T: number, dt = 0.0005) => Array.from({ length: Math.round(T / dt) + 1 }, (_, i) => i * dt);
const metricsPoles = (re: number, im: number, T = 40) => {
  const x = grid(T);
  return stepMetrics(x, x.map(stepFromPoles(re, im)), 1, 2);
};

describe('chapter 8 text: the recipe', () => {
  it('hover thrust 4.9 N; the motors give about four times the weight', () => {
    expect(HOVER_THRUST).toBeCloseTo(4.905, 9);
    expect(20 / HOVER_THRUST).toBeCloseTo(4.08, 2);
  });

  it('the Kp = 20 drone: step peak 2.60 m, gentle step 2.03 m, a 0.5 m wave comes out 0.55 m', () => {
    const peak = (sp: (x: number) => number) => {
      const sim = new DroneSim(defaultDroneConfig({ pid: pd(20, 0), h0: 1, setpoint: sp }));
      let p = sim.h;
      sim.advance(8, () => (p = Math.max(p, sim.h)), 1);
      return p;
    };
    expect(peak(() => 2)).toBeCloseTo(2.6047, 3);
    expect(peak((x) => 2 - Math.exp(-2 * x))).toBeCloseTo(2.0255, 3);
    expect(recipeGain(2)).toBeCloseTo(1.104, 3);
    // measured: the steady wave's half-swing after the start has died away
    const sim = new DroneSim(defaultDroneConfig({ pid: pd(20, 0), h0: 1, setpoint: (x) => 1 + 0.5 * Math.sin(2 * x) }));
    const hs: number[] = [];
    sim.advance(30, () => sim.t > 25 && hs.push(sim.h), 1);
    expect((Math.max(...hs) - Math.min(...hs)) / 2).toBeCloseTo(0.552, 3);
  });
});

describe('chapter 8 text: poles and gains', () => {
  it('the gains sentence: −2 ± 4i needs Kp 10, c + Kd 2, Kd 1; the Chapter 2 drone needs no Kd', () => {
    expect(out('gains', 'kp', { sig: 2, w: 4 })).toBe('10.0');
    expect(out('gains', 'damp', { sig: 2, w: 4 })).toBe('2.00');
    expect(out('gains', 'kd', { sig: 2, w: 4 })).toBe('1.00');
    expect(out('gains', 'note', { sig: 2, w: 4 })).toBe('');
    expect(gainsFromPoles(-1, Math.sqrt(39)).kp).toBeCloseTo(20, 9);
    expect(out('gains', 'kd', { sig: 1, w: 6.2 })).toBe('0.00');
    expect(out('gains', 'kp', { sig: 4, w: 2 })).toBe('10.0');
    expect(out('gains', 'kd', { sig: 4, w: 2 })).toBe('3.00');
    // below σ = 1 the drag alone is more damping than the poles want
    expect(out('gains', 'kd', { sig: 0.5, w: 5 })).toBe('−0.50');
    expect(out('gains', 'note', { sig: 0.5, w: 5 })).toBe('negKd');
    // the roots really are there
    const g = gainsFromPoles(-2, 4);
    const r = roots([m, DRONE.c + g.kd, g.kp]);
    expect(r[0].re).toBeCloseTo(-2, 9);
    expect(Math.abs(r[0].im)).toBeCloseTo(4, 9);
  });

  it('poleRead at −2 ± 4i: settles about 2.0 s (really 1.87), wiggle 1.57 s, peak 0.79 s, 21 %', () => {
    const v = { sig: 2, w: 4 };
    expect(out('poleRead', 'ts', v)).toBe('2.0');
    expect(out('poleRead', 'period', v)).toBe('1.57');
    expect(out('poleRead', 'tp', v)).toBe('0.79');
    expect(out('poleRead', 'os', v)).toBe('21%');
    const mm = metricsPoles(-2, 4, 20);
    expect(mm.settlingTime).toBeCloseTo(1.868, 2);
    expect(mm.peakTime).toBeCloseTo(0.785, 2);
    expect(mm.overshoot).toBeCloseTo(20.79, 1);
    expect(out('poleRead', 'period', { sig: 2, w: 0 })).toBe('noWiggle');
    expect(out('poleRead', 'os', { sig: 2, w: 0 })).toBe('noOvershoot');
    // straight up to −2 ± 8i, and the Chapter 2 drone
    expect(out('poleRead', 'tp', { sig: 2, w: 8 })).toBe('0.39');
    expect(out('poleRead', 'os', { sig: 2, w: 8 })).toBe('46%');
    expect(100 * Math.exp(-Math.PI / Math.sqrt(39))).toBeCloseTo(60.47, 2);
  });

  it('predict "straight up": 1.87 s → 1.72 s, 21 % → 46 %, one wiggle 1.57 s → 0.79 s', () => {
    const a = metricsPoles(-2, 4, 20);
    const b = metricsPoles(-2, 8, 20);
    expect(a.settlingTime).toBeCloseTo(1.868, 2);
    expect(b.settlingTime).toBeCloseTo(1.718, 2);
    expect(a.overshoot).toBeCloseTo(20.79, 1);
    expect(b.overshoot).toBeCloseTo(45.59, 1);
    expect((2 * Math.PI) / 4).toBeCloseTo(1.571, 3);
    expect((2 * Math.PI) / 8).toBeCloseTo(0.785, 3);
  });

  it('the rules: 4/|σ| is ln 50 ≈ 3.9 rounded; ζ = cos θ; the ray labels 53 / 16 / 5 %', () => {
    expect(Math.log(50)).toBeCloseTo(3.912, 3);
    const osz = (z: number) => 100 * Math.exp((-Math.PI * z) / Math.sqrt(1 - z * z));
    expect(Math.round(osz(0.2))).toBe(53);
    expect(Math.round(osz(0.5))).toBe(16);
    expect(Math.round(osz(0.7))).toBe(5);
    // the 45° line of the limit widget is ζ ≈ 0.71
    expect(Math.cos(Math.PI / 4)).toBeCloseTo(0.71, 2);
  });

  it('side trip "How good is 4/|σ|?": real |σ|·T at σ = −1 (2 % band), from 3.0 to 5.8 s', () => {
    const at = (z: number) => metricsPoles(-1, z >= 1 ? 0 : Math.sqrt(1 - z * z) / z, 60).settlingTime;
    const table: [number, number][] = [
      [0.3, 3.37],
      [0.5, 4.04],
      [0.8, 3.01],
      [0.95, 5.0],
      [1, 5.83],
    ];
    for (const [z, ts] of table) expect(Math.abs(at(z) - ts)).toBeLessThan(0.01);
    // and in between, never outside what Mika quotes
    for (const z of [0.2, 0.4, 0.6, 0.7, 0.9]) {
      expect(at(z)).toBeGreaterThan(3.0);
      expect(at(z)).toBeLessThan(5.83);
    }
    // the extremes quoted by Mika
    expect(at(0.8)).toBeCloseTo(3.0, 1);
    expect(at(1)).toBeCloseTo(5.834, 2);
  });

  it('dominant pole: fast/slow shares and the settling of the pair (about 20 s)', () => {
    expect(out('dominant', 'fast', { time: 1 })).toBe('0.67%');
    expect(out('dominant', 'slow', { time: 1 })).toBe('82%');
    expect(out('dominant', 'fast', { time: 0.5 })).toBe('8%');
    expect(out('dominant', 'slow', { time: 0.5 })).toBe('90%');
    expect(out('dominant', 'fast', { time: 2 })).toBe('almostNothing');
    expect(100 * Math.exp(-10)).toBeCloseTo(0.0045, 4);
    expect(out('dominant', 'slow', { time: 2 })).toBe('67%');
    expect(out('dominant', 'fast', { time: 5 })).toBe('almostNothing');
    expect(out('dominant', 'slow', { time: 5 })).toBe('37%');
    // the pair's own step response settles in 19.76 s; the rule 4/0.2 says 20 s
    const x = grid(40, 0.001);
    const f = (tt: number) => 1 - (5 / 4.8) * Math.exp(-0.2 * tt) + (0.2 / 4.8) * Math.exp(-5 * tt);
    expect(stepMetrics(x, x.map(f), 0, 1).settlingTime).toBeCloseTo(19.76, 1);
    expect(4 / 0.2).toBe(20);
  });
});

describe('chapter 8 text: zeros', () => {
  const os = (g: (x: number) => number) => {
    const x = grid(6, 0.001);
    return stepMetrics(x, x.map(g), 0, 1).overshoot;
  };

  it('no zero: 12 % (12.31); the kick table', () => {
    expect(os(noZeroResponse)).toBeCloseTo(12.31, 1);
    const table: [number, number][] = [
      [0.3, 568.8],
      [0.5, 320.7],
      [1, 137.5],
      [2, 52.6],
      [3, 29.8],
      [5, 17.6],
      [8, 14.1],
      [12, 13.0],
    ];
    for (const [z, o] of table) {
      expect(zeroOvershoot(z)).toBeCloseTo(o, 0);
      expect(out('zeroKick', 'os', { z })).toBe(`${Math.round(o)}%`);
    }
    expect(out('zeroKick', 'gain', { z: 3 })).toBe('0.33');
    expect(out('zeroKick', 'gain', { z: 0.3 })).toBe('3.33');
  });

  it('PD on the error puts a zero at −Kp/Kd = −6.5 for −2 ± 3i, 15 % overshoot instead of 12 %', () => {
    const g = gainsFromPoles(-2, 3);
    expect(g.kp).toBeCloseTo(6.5, 12);
    expect(g.kd).toBeCloseTo(1, 12);
    expect(-g.kp / g.kd).toBeCloseTo(-6.5, 12);
    expect(os(zeroResponse(-6.5))).toBeCloseTo(15.2, 0);
    // the drone with derivative on the error really follows the zero formula
    const sim = new DroneSim(defaultDroneConfig({ pid: { kp: 6.5, ki: 0, kd: 1, ff: HOVER_THRUST, dTau: 0.0005, dOnMeasurement: false, antiWindup: false }, h0: 1, setpoint: (x) => (x < 0.1 ? 1 : 2) }));
    const f = zeroResponse(-6.5);
    let err = 0;
    sim.advance(6.1, () => {
      if (sim.t > 0.12) err = Math.max(err, Math.abs(sim.h - 1 - f(sim.t - 0.1)));
    }, 1);
    expect(err).toBeLessThan(0.02);
  });

  it('a zero at −3 blocks e^{−3t}: the output is (13/9) e^{−2t} sin 3t; without it 1.3 e^{−3t} comes through', () => {
    const rk = new RK4(2, (tt, x, dx) => {
      dx[0] = x[1];
      dx[1] = -13 * x[0] - 4 * x[1] + Math.exp(-3 * tt);
    });
    const x = new Float64Array(2);
    let err = 0;
    for (let i = 1; i <= 4000; i++) {
      rk.step((i - 1) * 0.001, x, 0.001);
      const tt = i * 0.001;
      err = Math.max(err, Math.abs((13 / 3) * (3 * x[0] + x[1]) - (13 / 9) * Math.exp(-2 * tt) * Math.sin(3 * tt)));
    }
    expect(err).toBeLessThan(1e-8);
    expect(13 / (9 - 12 + 13)).toBeCloseTo(1.3, 12);
  });
});

describe('chapter 8 text: motor limits', () => {
  it('first push on the 45° line: 4.9 + σ², over 20 N past σ = 3.885', () => {
    for (const s of [1, 2, 3, 4, 6, 8]) {
      const I = limitRun(s, false, 3, 1);
      expect(Math.max(...I.th)).toBeCloseTo(HOVER_THRUST + s * s, 6);
    }
    expect(Math.sqrt(20 - HOVER_THRUST)).toBeCloseTo(3.885, 3);
    // the play: kp, peak and verdict at every slider value, and "4.9 + kp = peak" adds up as printed
    const table: [number, string, string, string][] = [
      [4, '16.0', '20.9', 'justOver'],
      [2, '4.0', '8.9', 'canDo'],
      [3, '9.0', '13.9', 'canDo'],
      [6, '36.0', '40.9', 'farBeyond'],
      [8, '64.0', '68.9', 'farBeyond'],
    ];
    for (const [s, kp, peak, verdict] of table) {
      expect(out('push', 'sum', { sig: s })).toBe(`4.9 + ${kp} = ${peak}`);
      expect(out('push', 'verdict', { sig: s })).toBe(verdict);
    }
    for (let s = 1; s <= 8; s += 0.5) {
      const [a, kp, peak] = out('push', 'sum', { sig: s }).split(/ [+=] /).map(Number);
      expect(a + kp).toBeCloseTo(peak, 9);
    }
  });

  it('the maths wants to pull down from about −6 ± 6i (−0.32 N there)', () => {
    expect(Math.min(...limitRun(5.5, false, 3, 1).th)).toBeGreaterThan(0);
    expect(Math.min(...limitRun(6, false, 3, 1).th)).toBeCloseTo(-0.32, 1);
    expect(Math.min(...limitRun(8, false, 3, 1).th)).toBeCloseTo(-5.3, 1);
  });

  it("June's run: −8 ± 8i settles in 0.53 s in the maths, 0.77 s for real, overshoot 4 % → 16 %", () => {
    const I = limitRun(8, false, 3, 1);
    const R = limitRun(8, true, 3, 1);
    expect(I.m.settlingTime).toBeCloseTo(0.528, 2);
    expect(R.m.settlingTime).toBeCloseTo(0.768, 2);
    expect(R.m.settlingTime).toBeGreaterThan(limitRun(6.5, true, 3, 1).m.settlingTime);
    expect(limitRun(6.5, true, 3, 1).m.settlingTime).toBeCloseTo(0.718, 2);
    expect(limitRun(2, true, 3, 1).m.overshoot).toBeCloseTo(4.32, 1);
    expect(R.m.overshoot).toBeCloseTo(16.03, 1);
  });

  it('the thrust budget is a circle: radius 5.49 (1 m), 7.77 (0.5 m), 3.89 (2 m), whatever the angle', () => {
    expect(budgetRadius(1)).toBeCloseTo(5.4945, 3);
    expect(budgetRadius(0.5)).toBeCloseTo(7.7705, 3);
    expect(budgetRadius(2)).toBeCloseTo(3.8852, 3);
    expect(out('budget', 'r', { dr: 1 })).toBe('5.49');
    expect(out('budget', 'r', { dr: 0.5 })).toBe('7.77');
    expect(out('budget', 'r', { dr: 2 })).toBe('3.89');
    expect(out('budget', 'r', { dr: 0.25 })).toBe('10.99');
    for (const ang of [Math.PI / 4, Math.PI / 3, 0.2]) {
      const r = budgetRadius(1);
      const g = gainsFromPoles(-r * Math.cos(ang), r * Math.sin(ang));
      const sim = new DroneSim(defaultDroneConfig({ pid: pd(g.kp, g.kd), h0: 1 }));
      let pk = sim.thrust;
      sim.advance(3, () => (pk = Math.max(pk, sim.thrust)), 1);
      expect(pk).toBeCloseTo(20, 3);
    }
  });

  it('with the limit on from now on, the Kp = 20 drone saturates for 0.13 s and overshoots 74.9 % (not 60.5 %)', () => {
    const run = (sat: boolean) => {
      const sim = new DroneSim(defaultDroneConfig({ params: { ...DRONE, saturate: sat }, pid: pd(20, 0), h0: 1 }));
      const x: number[] = [];
      const hs: number[] = [];
      let satT = 0;
      sim.advance(8, () => {
        x.push(sim.t);
        hs.push(sim.h);
        if (sim.thrust >= 20 - 1e-9) satT += sim.dt;
      }, 1);
      return { m: stepMetrics(x, hs, 1, 2), satT };
    };
    const I = run(false);
    const R = run(true);
    expect(I.m.overshoot).toBeCloseTo(60.47, 1);
    expect(R.m.overshoot).toBeCloseTo(74.95, 1);
    expect(R.satT).toBeCloseTo(0.133, 2);
  });
});

describe('chapter 8 text: recap and quiz', () => {
  it('q1: rule 4 / 1 / 8 s; real 3.74 / 1.04 / 7.65 s, same ranking', () => {
    expect(metricsPoles(-1, 2).settlingTime).toBeCloseTo(3.736, 2);
    expect(metricsPoles(-4, 2).settlingTime).toBeCloseTo(1.038, 2);
    expect(metricsPoles(-0.5, 5).settlingTime).toBeCloseTo(7.646, 2);
  });

  it('q2: s² + 2s + 10 has roots −1 ± 3i', () => {
    const r = roots([1, 2, 10]);
    expect(r[0].re).toBeCloseTo(-1, 12);
    expect(Math.abs(r[0].im)).toBeCloseTo(3, 12);
  });

  it('q3: keeping σ = −2 and shrinking ω lowers the overshoot; settling stays about the same', () => {
    expect(metricsPoles(-2, 4, 20).overshoot).toBeGreaterThan(metricsPoles(-2, 2, 20).overshoot);
    expect(metricsPoles(-2, 2, 20).overshoot).toBeGreaterThan(metricsPoles(-2, 1, 20).overshoot);
    // "about the same": 1.87 → 2.11 s, not the 2× a move to the right would cost
    expect(metricsPoles(-2, 2, 20).settlingTime).toBeCloseTo(2.109, 2);
  });

  it('q4: after 2 s the slow mode has 67 %, the fast 0.005 %; after 1 s 0.67 %; after 0.5 s 8 % / 90 %; 25 times faster', () => {
    expect(100 * Math.exp(-0.4)).toBeCloseTo(67.0, 1);
    expect(100 * Math.exp(-10)).toBeCloseTo(0.005, 3);
    expect(100 * Math.exp(-5)).toBeCloseTo(0.67, 2);
    expect(Math.round(100 * Math.exp(-2.5))).toBe(8);
    expect(Math.round(100 * Math.exp(-0.1))).toBe(90);
    expect(5 / 0.2).toBeCloseTo(25, 12);
  });

  it('recap: the first push of a 1 m step is mg + m|p|²', () => {
    for (const [re, im] of [[-2, 4], [-3, 3], [-6, 6]]) {
      const g = gainsFromPoles(re, im);
      const sim = new DroneSim(defaultDroneConfig({ pid: pd(g.kp, g.kd), h0: 1 }));
      expect(sim.thrust).toBeCloseTo(HOVER_THRUST + m * (re * re + im * im), 9);
    }
  });
});
