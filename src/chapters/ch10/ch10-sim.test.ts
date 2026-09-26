import { loopMargins, sweep } from '../../math/bode';
import { knobFor, SHOWER, ShowerSim, type ShowerPolicy } from '../../sim/shower-model';
import { HAND_GAIN, policies } from '../ch00/hands';
import { comfortTime, criticalHandGain, handLoop, handPolicy, JUNE_PI, piLoop, piPolicy, runShower, swingPeriod, THEO_PI } from './shower-tools';

const deg = (r: number) => (r * 180) / Math.PI;

/**
 * Near the edge the knob must not hit its ends, or the swing is squashed and hides the linear
 * behaviour: start at 38 °C with a small kick and measure the swing early and late.
 */
function kickRun(policy: ShowerPolicy, T: number, kick = 0.02) {
  const sim = new ShowerSim({ ...SHOWER }, policy, knobFor(SHOWER.target) + kick);
  const t: number[] = [];
  const y: number[] = [];
  let umin = 1;
  let umax = 0;
  sim.advance(T, () => {
    t.push(sim.t);
    y.push(sim.temp);
    umin = Math.min(umin, sim.u);
    umax = Math.max(umax, sim.u);
  }, 4);
  const amp = (a: number, b: number) => Math.max(...y.filter((_, i) => t[i] >= a && t[i] < b).map((v) => Math.abs(v - SHOWER.target)));
  const late = t.map((x, i) => [x, y[i]] as const).filter(([x]) => x > 20);
  return {
    early: amp(30, 60),
    late: amp(T - 30, T),
    umin,
    umax,
    period: swingPeriod({ t: late.map(([x]) => x), T: late.map(([, v]) => v), u: [] }),
  };
}

describe('Chapter 10: the edge in the real shower simulation', () => {
  it('the Ch 0 hands are the ones this chapter models: speed hands with k = 0.8 % (normal) and 1.6 % (harder)', () => {
    expect(HAND_GAIN).toBe(0.008);
    expect(policies.normal.kind).toBe('rate');
    expect(policies.harder.kind).toBe('rate');
  });

  it('speed (I) hand: 0.97 × the edge decays, 1.03 × grows, hunting every 13.75 ± 0.5 s', () => {
    const kc = criticalHandGain().k;
    const below = kickRun(handPolicy(0.97 * kc), 300);
    const above = kickRun(handPolicy(1.03 * kc), 300);
    expect(below.late).toBeLessThan(below.early);
    expect(above.late).toBeGreaterThan(above.early);
    for (const r of [below, above]) {
      expect(Math.abs(r.period - 13.75)).toBeLessThan(0.5);
      expect(r.umin).toBeGreaterThan(0);
      expect(r.umax).toBeLessThan(1);
    }
  });

  it('position (P) hand: 0.97 × the edge decays, 1.03 × grows, hunting every 6.6 ± 0.3 s', () => {
    const Kc = criticalHandGain(2.5, 1, 'position').k;
    const pHand = (K: number): ShowerPolicy => ({ kind: 'position', position: (_t, felt) => knobFor(SHOWER.target) + K * (SHOWER.target - felt) });
    const below = kickRun(pHand(0.97 * Kc), 200);
    const above = kickRun(pHand(1.03 * Kc), 200);
    expect(below.late).toBeLessThan(below.early);
    expect(above.late).toBeGreaterThan(above.early);
    for (const r of [below, above]) expect(Math.abs(r.period - 6.6)).toBeLessThan(0.3);
  });

  it('the normal robot hand swings every 15.5 s from cold and after a small kick: not a knob-limit effect', () => {
    expect(swingPeriod(runShower(handPolicy(0.008), 60))).toBeCloseTo(15.5, 0);
    const r = kickRun(handPolicy(0.008), 200, 0.01);
    expect(r.period).toBeCloseTo(15.5, 0);
    expect(r.umax).toBeLessThan(1);
  });

  it('the harder hand (1.6 %) swings every 11.6 s with the knob slamming 0 ↔ 1', () => {
    const tr = runShower(handPolicy(0.016), 60);
    expect(swingPeriod(tr)).toBeCloseTo(11.6, 0);
    const late = tr.u.filter((_, i) => tr.t[i] > 20);
    expect(Math.min(...late)).toBe(0);
    expect(Math.max(...late)).toBe(1);
  });

  it('"most of a minute": the normal hand is first comfortable from 50.5 s, so never within 60 s', () => {
    expect(comfortTime(runShower(handPolicy(0.008), 60))).toBeNaN();
    expect(comfortTime(runShower(handPolicy(0.008), 90))).toBeCloseTo(50.5, 1);
  });

  it('q4: reacting 1.5 × harder (k = 1.2 %) is 1.075 × the edge (past the 1.4 margin): small swings grow', () => {
    const k = 1.5 * 0.008;
    expect(k / criticalHandGain().k).toBeCloseTo(1.075, 3);
    expect(loopMargins(handLoop(k), 2.5).gm).toBeLessThan(1);
    const r = kickRun(handPolicy(k), 300);
    expect(r.late).toBeGreaterThan(r.early);
    expect(comfortTime(runShower(handPolicy(k), 120))).toBeNaN();
  });
});

describe("Chapter 10: June's drone-style gains and Theo's gentle ones", () => {
  it("June's PI (5 %, 5 %): GM 0.28, on paper −180° at π/5 (a 10 s swing); in the shower the knob slams and it hunts every 6.3 ± 0.2 s", () => {
    const j = loopMargins(piLoop(0.05, 0.05), 2.5);
    expect(j.gm).toBeCloseTo(0.279, 3);
    expect(j.w180).toBeCloseTo(Math.PI / 5, 6);
    expect((2 * Math.PI) / j.w180).toBeCloseTo(10, 6);
    // "Big gains pushed the gain-of-1 speed past the −180° speed"
    expect(j.wc).toBeGreaterThan(j.w180);
    expect(j.wc).toBeCloseTo(2.25, 2);
    for (const T of [40, 90]) expect(Math.abs(swingPeriod(runShower(piPolicy(0.05, 0.05), T)) - 6.3)).toBeLessThan(0.2);
    const tr = runShower(piPolicy(0.05, 0.05), 40);
    const late = tr.u.filter((_, i) => tr.t[i] > 10);
    expect(Math.min(...late)).toBe(0);
    expect(Math.max(...late)).toBe(1);
  });

  it('phase lead: PI (1 %, 0.6 %) gives back 37° at the old −180° speed (0.457 rad/s), = arctan(Kp·ω/Ki)', () => {
    const w = criticalHandGain().w;
    const pi = sweep(piLoop(0.01, 0.006).num, piLoop(0.01, 0.006).den, 2.5, [w])[0].phase;
    const i = sweep(handLoop(0.006).num, handLoop(0.006).den, 2.5, [w])[0].phase;
    expect(pi - i).toBeCloseTo(37.3, 1);
    expect(deg(Math.atan((0.01 * w) / 0.006))).toBeCloseTo(37.3, 1);
  });

  it("the designer's presets: it opens on June's (5 %, 5 %, over the cliff); Theo's (1 %, 0.6 %) meets the goal", () => {
    expect(JUNE_PI).toEqual({ kp: 0.05, ki: 0.05 });
    expect(loopMargins(piLoop(JUNE_PI.kp, JUNE_PI.ki), 2.5).gm).toBeLessThan(1);
    const m = loopMargins(piLoop(THEO_PI.kp, THEO_PI.ki), 2.5);
    expect(m.gm).toBeGreaterThan(1);
    expect(m.pm).toBeGreaterThan(45);
    expect(comfortTime(runShower(piPolicy(THEO_PI.kp, THEO_PI.ki), 40))).toBeLessThan(12);
    // the normal hand as a PI: stable but only 22° of margin
    expect(loopMargins(piLoop(0, 0.008), 2.5).pm).toBeCloseTo(22, 0);
  });

  it('the designer goal is reachable: Kp 0.9 %, Ki 0.5 % → comfortable at 6.7 s with PM 66°', () => {
    const m = loopMargins(piLoop(0.009, 0.005), 2.5);
    expect(m.gm).toBeGreaterThan(1);
    expect(m.pm).toBeCloseTo(66, 0);
    expect(comfortTime(runShower(piPolicy(0.009, 0.005), 40))).toBeCloseTo(6.7, 1);
    // and the gentle hint itself (1 %, 0.6 %) wins too: PM 58°, comfortable by about 9.4 s
    expect(comfortTime(runShower(piPolicy(0.01, 0.006), 40))).toBeLessThan(12);
  });
});

describe('Chapter 10: side trips and wrap-up numbers', () => {
  it('side trip D: for Chapter 6\'s simple loop ωn²/(s(s + 2ζωn)), PM 43°/52°/59° go with ζ 0.4/0.5/0.6 (25 %/16 %/under 10 % overshoot)', () => {
    const rows: [number, number, number][] = [[0.4, 43.1, 25.4], [0.5, 51.8, 16.3], [0.6, 59.2, 9.5]];
    for (const [z, pm, os] of rows) {
      const m = loopMargins({ num: [1], den: [1, 2 * z, 0] }, 0);
      expect(m.pm).toBeCloseTo(pm, 1);
      expect(100 * Math.exp((-Math.PI * z) / Math.sqrt(1 - z * z))).toBeCloseTo(os, 1);
    }
  });

  it('side trips A and C: the smoother keeps 0.71 and lags 45° at ω = 1/τ; at ω = 10 it keeps 0.0995 ≈ 1/ω and lags 84°', () => {
    const [a, b, c] = sweep([1], [1, 1], 0, [1, 10, 0.1]);
    expect(a.mag).toBeCloseTo(Math.SQRT1_2, 6);
    expect(a.phase).toBeCloseTo(-45, 6);
    expect(b.mag).toBeCloseTo(0.0995, 4);
    expect(b.phase).toBeCloseTo(-84.3, 1);
    expect(c.mag).toBeCloseTo(0.995, 3);
    // the lag never passes a quarter-turn
    expect(sweep([1], [1, 1], 0, [1e4])[0].phase).toBeGreaterThan(-90);
  });

  it('side trip B: a pile (1/s) lags every wiggle 90° and is 1/ω as big', () => {
    for (const w of [0.2, 0.5, 2]) {
      const [p] = sweep([1], [1, 0], 0, [w]);
      expect(p.mag).toBeCloseTo(1 / w, 9);
      expect(p.phase).toBeCloseTo(-90, 9);
    }
  });

  it("slow wiggles lag by about L + τ = 3.5 s, Chapter 0's shift: 20.0° at ω = 0.1", () => {
    const [p] = sweep([1], [SHOWER.tau, 1], SHOWER.delay, [0.1]);
    expect(-p.phase).toBeCloseTo(20.0, 1);
    expect((360 * 3.5) / ((2 * Math.PI) / 0.1)).toBeCloseTo(20.1, 1);
  });

  it('side trip E / q5: halve the smoother (edge 1.12 → 1.21) or halve the pipe (→ 2.06); a P hand even loses (0.031 → 0.025)', () => {
    expect(criticalHandGain().k * 100).toBeCloseTo(1.12, 2);
    expect(criticalHandGain(2.5, 0.5).k * 100).toBeCloseTo(1.21, 2);
    expect(criticalHandGain(1.25, 1).k * 100).toBeCloseTo(2.06, 2);
    expect(criticalHandGain(2.5, 1, 'position').k).toBeCloseTo(0.031, 3);
    expect(criticalHandGain(2.5, 0.5, 'position').k).toBeCloseTo(0.025, 3);
    // q5: "at the edge the pipe contributes about 65°, the smoother about 25°"
    const w = criticalHandGain().w;
    expect(deg(w * 2.5)).toBeCloseTo(65, -0.5);
    expect(deg(Math.atan(w))).toBeCloseTo(25, -0.5);
  });

  it('q2: phase −180° where the loop gain is 0.25, and −130° where it is 1 → margins × 4 and 50°', () => {
    expect(1 / 0.25).toBe(4);
    expect(180 - 130).toBe(50);
  });

  it('margins b6: the normal hand reaches loop gain 1 at 0.34 rad/s, where its phase is −158° → PM 22°', () => {
    const m = loopMargins(handLoop(0.008), 2.5);
    expect(m.wc).toBeCloseTo(0.34, 2);
    const ph = sweep(handLoop(0.008).num, handLoop(0.008).den, 2.5, [m.wc])[0].phase;
    expect(ph).toBeCloseTo(-158, 0);
    expect(180 + ph).toBeCloseTo(m.pm, 9);
    expect(m.pm).toBeCloseTo(22, 0);
    expect(loopMargins(handLoop(0.016), 2.5).gm).toBeCloseTo(0.7, 1);
  });

  it("the smoother (τ = 1 s) closes 63 % of a step's gap after 1 s, in the real sim", () => {
    expect(1 - Math.exp(-1)).toBeCloseTo(0.632, 3);
    // no pipe, knob stepped from cold to half at t = 0: the head is 63 % of the way at 1 s
    const sim = new ShowerSim({ ...SHOWER, delay: 0.001 }, { kind: 'position', position: () => 0.5 }, 0);
    sim.advance(1 + 0.001);
    const target = SHOWER.cold + 0.5 * (SHOWER.hot - SHOWER.cold);
    expect((sim.temp - SHOWER.cold) / (target - SHOWER.cold)).toBeCloseTo(0.632, 2);
  });

  it('side trip C: halfway between 0.1 and 1 on the squashed ruler is about 0.3; a 100 s and a 3 s wiggle fit on 0.05–3 rad/s', () => {
    expect(Math.sqrt(0.1 * 1)).toBeCloseTo(0.316, 3);
    expect((2 * Math.PI) / 100).toBeGreaterThan(0.05);
    expect((2 * Math.PI) / 3).toBeLessThan(3);
  });
});
