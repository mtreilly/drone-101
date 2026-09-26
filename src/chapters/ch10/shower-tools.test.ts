import { loopMargins, sweep } from '../../math/bode';
import { SHOWER } from '../../sim/shower-model';
import { criticalHandGain, handLoop, lagStatus, piLoop } from './shower-tools';

const deg = (r: number) => (r * 180) / Math.PI;

describe('the edge for a hand on the shower (criticalHandGain)', () => {
  it('speed hand, 2.5 s pipe: k = 0.0112 knob/(°C·s) at 0.457 rad/s, hunting every 13.8 s', () => {
    const e = criticalHandGain();
    expect(e.k).toBeCloseTo(0.01116, 5);
    expect(e.w).toBeCloseTo(0.4569, 4);
    expect(e.period).toBeCloseTo(13.75, 2);
    // 90° (pile) + about 25° (smoother) + about 65° (pipe)
    expect(deg(Math.atan(e.w))).toBeCloseTo(24.56, 1);
    expect(deg(e.w * SHOWER.delay)).toBeCloseTo(65.44, 1);
    // the same edge from the loop's margins
    expect(e.k).toBeCloseTo(loopMargins(handLoop(1), SHOWER.delay).gm, 9);
  });

  it('position hand, 2.5 s pipe: K = 0.0307 knob/°C at 0.952 rad/s, hunting every 6.6 s', () => {
    const e = criticalHandGain(2.5, 1, 'position');
    expect(e.k).toBeCloseTo(0.030686, 6);
    expect(e.w).toBeCloseTo(0.9523, 4);
    expect(e.period).toBeCloseTo(6.598, 2);
    expect(e.k).toBeCloseTo(loopMargins({ num: [45], den: [1, 1] }, 2.5).gm, 9);
  });

  it('P6 "double": the speed hand edge in %/(°C·s) and its period for each pipe length', () => {
    const rows: [number, number][] = [[1, 2.52], [2, 1.36], [2.5, 1.12], [3, 0.95], [4, 0.74], [5, 0.6]];
    for (const [L, k] of rows) expect(criticalHandGain(L).k * 100).toBeCloseTo(k, 2);
    expect(criticalHandGain(2.5).period).toBeCloseTo(13.8, 1);
    expect(criticalHandGain(5).period).toBeCloseTo(23.9, 1);
    expect(criticalHandGain(5).k).toBeCloseTo(0.00604, 5);
  });

  it('side trip E: halving the smoother (1.21) buys less than halving the pipe (2.06)', () => {
    expect(criticalHandGain(2.5, 0.5).k * 100).toBeCloseTo(1.21, 2);
    expect(criticalHandGain(1.25, 1).k * 100).toBeCloseTo(2.06, 2);
    // the false-obvious case for the position hand: less smoothing lowers its edge
    expect(criticalHandGain(2.5, 0.5, 'position').k).toBeLessThan(criticalHandGain(2.5, 1, 'position').k);
  });
});

describe('loop margins of the shower loops (now in math/bode)', () => {
  it("the normal hand (k 0.008): PM 22.4° at ωc 0.341 rad/s; the loop returns the edge's wiggle 0.72 times as big", () => {
    const m = loopMargins(handLoop(0.008), 2.5);
    expect(m.pm).toBeCloseTo(22.4, 1);
    expect(m.wc).toBeCloseTo(0.3407, 3);
    expect(1 / m.gm).toBeCloseTo(0.7167, 3);
    expect(-sweep(handLoop(0.008).num, handLoop(0.008).den, 2.5, [m.wc])[0].phase).toBeCloseTo(157.6, 1);
  });

  it('P7 "delaymargin": (Kp 1 %, Ki 0.6 %) → 58°, 0.29 rad/s, 3.5 s; the normal hand (0, 0.8 %) → 22°, 0.34 rad/s, 1.1 s', () => {
    const gentle = loopMargins(piLoop(0.01, 0.006), 2.5);
    expect(gentle.pm).toBeCloseTo(58, 0);
    expect(gentle.wc).toBeCloseTo(0.29, 2);
    expect(gentle.dm).toBeCloseTo(3.5, 1);
    const hand = loopMargins(piLoop(0, 0.008), 2.5);
    expect(hand.pm).toBeCloseTo(22, 0);
    expect(hand.wc).toBeCloseTo(0.34, 2);
    expect(hand.dm).toBeCloseTo(1.1, 1);
    // adding exactly the delay margin drives PM to 0 and GM to 1
    for (const [l, m] of [[piLoop(0.01, 0.006), gentle], [piLoop(0, 0.008), hand]] as const) {
      const edge = loopMargins(l, 2.5 + m.dm);
      expect(Math.abs(edge.pm)).toBeLessThan(0.01);
      expect(edge.gm).toBeCloseTo(1, 2);
    }
  });

  it("June's drone-style PI (5 %, 5 %): the PI zero cancels the smoother, ω180 = π/5, GM 0.28, no delay margin", () => {
    const j = loopMargins(piLoop(0.05, 0.05), 2.5);
    expect(j.w180).toBeCloseTo(Math.PI / 5, 6);
    expect(j.gm).toBeCloseTo(Math.PI / 5 / 2.25, 6);
    expect(j.gm).toBeCloseTo(0.279, 3);
    expect(j.dm).toBe(0);
  });

  it('phase lead of PI (1, 0.6) over the pure pile at 0.457 rad/s: 37.3°', () => {
    const w = 0.45689;
    const pi = sweep(piLoop(0.01, 0.006).num, piLoop(0.01, 0.006).den, 2.5, [w])[0].phase;
    const i = sweep(handLoop(0.006).num, handLoop(0.006).den, 2.5, [w])[0].phase;
    expect(pi - i).toBeCloseTo(37.3, 1);
  });
});

describe('lagStatus: what a delay of so many degrees does to a wiggle', () => {
  it('the plan table: 45 → middle, 164 → middle, 180 → flipped, 360 → full, 450 → over', () => {
    expect(lagStatus(45)).toBe('middle');
    expect(lagStatus(164)).toBe('middle');
    expect(lagStatus(180)).toBe('flipped');
    expect(lagStatus(360)).toBe('full');
    expect(lagStatus(450)).toBe('over');
  });

  it('edges: small lags, the ±5° flip window, a whole wiggle', () => {
    expect(lagStatus(30)).toBe('small');
    expect(lagStatus(44.9)).toBe('small');
    expect(lagStatus(175.1)).toBe('flipped');
    expect(lagStatus(184.9)).toBe('flipped');
    expect(lagStatus(186)).toBe('middle');
    expect(lagStatus(359.99999)).toBe('full');
    expect(lagStatus(540)).toBe('flipped');
  });

  it('on the phase widget: a 2.5 s pipe and periods 2–30 s (the slider) give 30°…450°', () => {
    const lag = (T: number) => (360 * 2.5) / T;
    expect(lag(30)).toBeCloseTo(30, 10);
    expect(lag(5)).toBeCloseTo(180, 10);
    expect(lagStatus(lag(5))).toBe('flipped');
    expect(lagStatus(lag(2.5))).toBe('full');
    expect(lagStatus(lag(2))).toBe('over');
    expect(lagStatus(lag(20))).toBe('middle');
  });
});
