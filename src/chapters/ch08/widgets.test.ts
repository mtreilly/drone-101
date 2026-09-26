import { inRegion } from '../../math/region';
import { HOVER_THRUST } from '../../sim/drone-model';
import { bestRealSettling, limitRun } from './limit';
import {
  PLAY_T,
  budgetRadius,
  challengeOk,
  challengeZone,
  firstPush,
  gainsFromPoles,
  measuredMetrics,
  noZeroResponse,
  noZeroSlope,
  playgroundTrace,
  recipeGain,
  stateAt,
  stepFromPoles,
  zeroResponse,
} from './poles';

describe('chapter 8 playground: the challenge zone is the real judgement', () => {
  const rings = challengeZone(0.1);

  it('agrees with the measured metrics at the corner cases the rules of thumb get wrong', () => {
    // (−2.1, 0): the rule says 1.9 s, the real response takes 2.79 s: outside
    expect(measuredMetrics(-2.1, 0).settlingTime).toBeCloseTo(2.79, 1);
    expect(challengeOk(-2.1, 0)).toBe(false);
    expect(inRegion(rings, -2.1, 0)).toBe(false);
    // −1.6 ± 1.2i: the rule says 2.5 s, really 1.89 s with 1.5 % overshoot: inside
    expect(measuredMetrics(-1.6, 1.2).settlingTime).toBeCloseTo(1.89, 1);
    expect(measuredMetrics(-1.6, 1.2).overshoot).toBeCloseTo(1.5, 0);
    expect(challengeOk(-1.6, 1.2)).toBe(true);
    expect(inRegion(rings, -1.6, 1.2)).toBe(true);
    expect(inRegion(rings, -1.6, -1.2)).toBe(true);
    // the Kp = 20 drone is nowhere near
    expect(inRegion(rings, -1, Math.sqrt(39))).toBe(false);
  });

  it('every grid point sits on the side of the outline the judgement puts it', () => {
    let bad = 0;
    let inside = 0;
    for (let x = -9.95; x < 0; x += 0.25) {
      for (let y = -7.95; y < 8; y += 0.25) {
        const ok = challengeOk(x, Math.abs(y));
        if (ok) inside++;
        if (ok !== inRegion(rings, x, y)) bad++;
      }
    }
    expect(inside).toBeGreaterThan(100);
    // off-grid samples may fall in a sliver between a grid point and the refined edge
    expect(bad).toBeLessThan(6);
  });
});

describe('chapter 8 playground readouts', () => {
  it('first push = mg + Kp for a 1 m step; the budget circle is 5.49 from 0', () => {
    expect(HOVER_THRUST).toBeCloseTo(4.905, 9);
    expect(firstPush(-2, 4)).toBeCloseTo(14.905, 9);
    expect(firstPush(-1, Math.sqrt(39))).toBeCloseTo(24.905, 9);
    expect(budgetRadius(1)).toBeCloseTo(5.4945, 4);
    // the right-half predict move needs a negative Kd
    expect(gainsFromPoles(0.6, 3).kd).toBeCloseTo(-1.6, 9);
    expect(gainsFromPoles(-0.5, 5).kd).toBeCloseTo(-0.5, 9);
  });

  it('default drone: the rule says 4.0 s, the measured settling is about 3.66 s', () => {
    expect(measuredMetrics(-1, Math.sqrt(39)).settlingTime).toBeCloseTo(3.66, 1);
    expect(measuredMetrics(-1, Math.sqrt(39)).overshoot).toBeCloseTo(60.47, 0);
  });
});

describe('chapter 8 playground: the ground is a real event', () => {
  it('0.6 ± 3i: the formula goes below 0 m at 1.756 s, the plot is cut there and stays at 0', () => {
    const tr = playgroundTrace(0.6, 3);
    expect(tr.at).not.toBeNull();
    expect(tr.at!).toBeCloseTo(1.756, 2);
    expect(tr.crashed).toBe(true);
    expect(Math.min(...tr.ys)).toBe(0);
    for (let i = 0; i < tr.xs.length; i++) if (tr.xs[i] >= tr.at!) expect(tr.ys[i]).toBe(0);
    // before the touchdown the plot is the formula
    const f = stepFromPoles(0.6, 3);
    expect(tr.ys[10]).toBeCloseTo(f(tr.xs[10]), 12);
  });

  it('stable pairs never reach the ground, and stay inside the 3 m picture', () => {
    for (const [re, im] of [[-1, Math.sqrt(39)], [-0.1, 8], [-2, 4], [-3, 0]]) {
      const tr = playgroundTrace(re, im);
      expect(tr.at).toBeNull();
      expect(Math.max(...tr.ys)).toBeLessThan(3);
    }
  });

  it('reduced motion: the picture shows the state at the end of the window, agreeing with the plot', () => {
    // crashed: down at 0 m, like the plot's last point
    const tr = playgroundTrace(0.6, 3);
    const st = stateAt(tr, PLAY_T, 0.6, 3);
    expect(st.h).toBe(0);
    expect(st.crashed).toBe(true);
    expect(st.h).toBe(tr.ys.at(-1));
    // stable: exactly the formula at T1
    const tr2 = playgroundTrace(-2, 4);
    const st2 = stateAt(tr2, PLAY_T, -2, 4);
    expect(st2.h).toBeCloseTo(stepFromPoles(-2, 4)(PLAY_T), 12);
    expect(st2.h).toBeCloseTo(tr2.ys.at(-1)!, 12);
    // an unstable real pole climbs off the picture: the readout stays true (the view clips it)
    const tr3 = playgroundTrace(0.5, 0);
    expect(tr3.at).toBeNull();
    expect(stateAt(tr3, PLAY_T, 0.5, 0).h).toBeGreaterThan(3);
  });
});

describe('chapter 8 recipe widget numbers', () => {
  it('the wave comes out 1.104 times bigger: 0.5 m → 0.55 m', () => {
    expect(recipeGain(2)).toBeCloseTo(1.104, 3);
    expect(0.5 * recipeGain(2)).toBeCloseTo(0.552, 3);
  });
});

describe('chapter 8 zero widget', () => {
  it('with the zero = no-zero curve + (1/|z|) × its slope', () => {
    for (const z of [-0.5, -3, -8]) {
      const f = zeroResponse(z);
      for (const t of [0.2, 0.5, 1]) {
        const d = (noZeroResponse(t + 1e-5) - noZeroResponse(t - 1e-5)) / 2e-5;
        expect(noZeroSlope(t)).toBeCloseTo(d, 6);
        expect(f(t)).toBeCloseTo(noZeroResponse(t) + noZeroSlope(t) / -z, 9);
      }
    }
  });
});

describe('chapter 8 limit widget', () => {
  it('real settling is best near −6.5 ± 6.5i (about 0.72 s), and worse further left', () => {
    const b = bestRealSettling();
    expect(b.sig).toBe(6.5);
    expect(b.ts).toBeCloseTo(0.718, 1);
    expect(Math.abs(b.ts - 0.718)).toBeLessThan(0.01);
    expect(limitRun(8, true).m.settlingTime).toBeCloseTo(0.768, 1);
    expect(limitRun(8, false).m.settlingTime).toBeCloseTo(0.528, 1);
  });

  it('real overshoot: below the gentle 4.32 % at σ = 6, above it from about 6.25 on', () => {
    const gentle = limitRun(2, true).m.overshoot;
    expect(gentle).toBeCloseTo(4.32, 1);
    expect(limitRun(6, true).m.overshoot).toBeLessThan(gentle);
    expect(limitRun(7, true).m.overshoot).toBeGreaterThan(gentle);
    expect(limitRun(7, true).m.overshoot).toBeCloseTo(8.6, 0);
    expect(limitRun(8, true).m.overshoot).toBeCloseTo(16.0, 0);
  });
});
