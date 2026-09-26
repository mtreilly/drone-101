import { DRONE, DroneSim, HOVER_THRUST as MG, defaultDroneConfig } from '../../sim/drone-model';
import { overshootOf } from '../../ui/s-plane';
import { hoverStep, kiLimit, pid, pidPoles, runDrone, scoreTrace, stars, takeoff } from './pid-tools';
import { runUnderCeiling, stayDown } from './page-ceiling';
import { damperRun, heightTop, integralRun, jitterOf, kickRun, meanHeight, nearlyCancels, noiseRun, piZero, polesStep, slowestPole, stepOf } from './scenarios';
import { damperStatus, integralStatus, kdCritical, lateSwing, noiseStatus, zetaPD } from './status';


const growth = (kp: number, ki: number, kd: number) => {
  const tr = hoverStep(pid(kp, ki, kd), 1.95, 2, 40);
  const dev = (a: number, b: number) => Math.max(...tr.h.filter((_, i) => tr.t[i] >= a && tr.t[i] < b).map((h) => Math.abs(h - 2)));
  return dev(30, 40) / dev(5, 15);
};

describe('Chapter 9 claims', () => {
  it('Routh edge values quoted in the text', () => {
    expect(kiLimit(20, 0)).toBeCloseTo(40);
    expect(kiLimit(20, 4)).toBeCloseTo(200);
    expect(kiLimit(20, 0.5)).toBeCloseTo(60);
    expect(kiLimit(10, 1)).toBeCloseTo(40);
  });

  it('poles agree with the Routh test', () => {
    for (const [kp, ki, kd] of [[20, 39, 0], [20, 41, 0], [10, 39, 1], [10, 41, 1], [30, 100, 2], [5, 3, 0.2]]) {
      const stable = pidPoles(kp, ki, kd).every((p) => p.re < 0);
      expect(stable).toBe(ki < kiLimit(kp, kd));
    }
  });

  it('removes the unused integrator pole when Ki is zero', () => {
    const ps = pidPoles(20, 0, 4);
    expect(ps).toHaveLength(2);
    expect(ps.every((p) => p.re < 0)).toBe(true);
  });

  it('simulation agrees: Kp=20, Kd=0 settles below Ki=40 and grows above', () => {
    expect(growth(20, 36, 0)).toBeLessThan(1);
    expect(growth(20, 44, 0)).toBeGreaterThan(1);
  });

  it("Mika's Ki=50 never settles; D restores stability; calm needs smaller Ki", () => {
    const wild = runDrone(takeoff(pid(20, 50, 0)), 30);
    const late = Math.max(...wild.h.filter((_, i) => wild.t[i] > 20).map((h) => Math.abs(h - 2)));
    expect(late).toBeGreaterThan(0.2); // a permanent ±28 cm yo-yo, limited by the motors
    expect(late).toBeLessThan(0.35);
    const rescued = runDrone(takeoff(pid(20, 50, 0.5)), 30);
    expect(Math.max(...rescued.h.filter((_, i) => rescued.t[i] > 25).map((h) => Math.abs(h - 2)))).toBeLessThan(0.01);
    expect(scoreTrace(runDrone(takeoff(pid(20, 50, 4)), 12)).overshoot).toBeGreaterThan(20);
    for (const kd of [3, 4, 5]) expect(scoreTrace(runDrone(takeoff(pid(20, 10, kd)), 12)).overshoot).toBeLessThan(5);
  });

  it('a modest Ki removes the droop within 12 s', () => {
    const tr = runDrone(takeoff(pid(20, 10, 0)), 12);
    expect(Math.abs(2 - tr.h[tr.h.length - 1])).toBeLessThan(0.01);
    const p = runDrone(takeoff(pid(20, 0, 0)), 12);
    expect(2 - p.h[p.h.length - 1]).toBeCloseTo(0.245, 2);
  });

  it('playground: P-only fails, 20/10/4 earns all stars', () => {
    const bad = stars(scoreTrace(runDrone(takeoff(pid(20, 0, 0)), 15)));
    expect(Object.values(bad).every(Boolean)).toBe(false);
    const good = stars(scoreTrace(runDrone(takeoff(pid(20, 10, 4)), 15)));
    expect(Object.values(good).every(Boolean)).toBe(true);
  });

  it('derivative kick saturates on error but not on measurement', () => {
    const onErr = hoverStep(pid(15, 8, 4, { dTau: 0.01, dOnMeasurement: false }), 1, 2, 5);
    const onMeas = hoverStep(pid(15, 8, 4, { dTau: 0.01, dOnMeasurement: true }), 1, 2, 5);
    expect(Math.max(...onErr.thrust)).toBeCloseTo(20, 6);
    expect(Math.max(...onMeas.thrust)).toBeLessThan(20);
  });

  it('noise: short filter chatters, long filter is calm', () => {
    const jitter = (tau: number, noise: number) => {
      const xs = hoverStep(pid(15, 8, 4, { dTau: tau }), 2, 2, 5, noise).thrust.slice(50);
      const m = xs.reduce((a, b) => a + b, 0) / xs.length;
      return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
    };
    expect(jitter(0.005, 0.02)).toBeGreaterThan(1.5);
    expect(jitter(0.1, 0.02)).toBeLessThan(1.5);
    expect(jitter(0.005, 0)).toBeLessThan(0.01);
  });
});

describe('Chapter 9: the kick widget shows the kick (1 m → 1.5 m)', () => {
  const err = kickRun('error');
  const meas = kickRun('measurement');
  it('delivered peaks differ by more than 5 N: 20 N pinned vs 12.4 N', () => {
    expect(Math.max(...err.thrust)).toBeCloseTo(20, 6);
    expect(Math.max(...meas.thrust)).toBeCloseTo(12.41, 1);
    expect(Math.max(...err.thrust) - Math.max(...meas.thrust)).toBeGreaterThan(5);
  });
  it('asked for: about 209 N on the error (≈ Kd·Δr/τf = 200 N of D), 12.4 N on the measurement', () => {
    expect(Math.max(...err.request)).toBeGreaterThan(200);
    expect(Math.max(...err.request)).toBeLessThan(215);
    expect(Math.max(...err.request)).toBeCloseTo(209, 0);
    expect((4 * 0.5) / 0.01).toBe(200);
    // P alone asks Kp·Δr + mg = 7.5 + 4.9 N
    expect(Math.max(...meas.request)).toBeCloseTo(15 * 0.5 + MG, 0);
    expect(Math.max(...meas.request)).toBeLessThan(20);
  });
  it('the original 1 → 2 m jump asks for about 413 N', () => {
    const tr = hoverStep(pid(15, 8, 4, { dTau: 0.01, dOnMeasurement: false }), 1, 2, 5);
    expect(Math.max(...tr.request)).toBeGreaterThan(400);
    expect(Math.max(...tr.request)).toBeLessThan(420);
  });
});

describe('Chapter 9: honest status lines', () => {
  it('integral: Ki 30 and 38 are ringing (still swinging > 7 cm after 8 s), not slow; Ki 10 is gone', () => {
    for (const ki of [30, 38]) {
      const tr = integralRun(ki);
      expect(Math.abs(2 - tr.h.at(-1)!)).toBeGreaterThan(0.01);
      expect(lateSwing(tr)).toBeGreaterThan(0.07);
      expect(integralStatus(ki, tr)).toBe('ringing');
    }
    expect(integralStatus(10, integralRun(10))).toBe('gone');
    expect(integralStatus(0, integralRun(0))).toBe('none');
    expect(integralStatus(2, integralRun(2))).toBe('slow');
    expect(integralStatus(45, integralRun(45))).toBe('unstable');
  });
  const os = (ki: number, kd: number) => scoreTrace(damperRun(ki, kd)).overshoot;
  const damper = (ki: number, kd: number) => damperStatus(ki, kd, os(ki, kd), kd > 0 ? os(ki, kd - 0.5) : os(ki, kd));
  it('damper: too much D at 20/10/8 and 20/10/10 (5.35 %, 7.88 %), calm at 3–5, bouncy at 0', () => {
    expect(os(10, 8)).toBeCloseTo(5.35, 1);
    expect(os(10, 10)).toBeCloseTo(7.88, 1);
    expect(damper(10, 8)).toBe('tooMuch');
    expect(damper(10, 10)).toBe('tooMuch');
    for (const kd of [3, 4, 5]) expect(damper(10, kd)).toBe('calm');
    expect(damper(10, 0)).toBe('bouncy');
    expect(damper(50, 0)).toBe('unstable');
    expect(damper(50, 4)).toBe('bigPile');
  });
  it('damper: no Kd setting gives advice that makes things worse', () => {
    for (const ki of [10, 50]) {
      for (let kd = 0; kd <= 10; kd += 0.5) {
        const st = damper(ki, kd);
        // "add more Kd" must help (or cure the instability); "try less Kd" must help
        if (st === 'bouncy') expect(os(ki, kd + 0.5)).toBeLessThan(os(ki, kd));
        if (st === 'unstable') expect(ki < kiLimit(20, kd + 0.5)).toBe(true);
        if (st === 'tooMuch') expect(os(ki, kd - 0.5)).toBeLessThan(os(ki, kd));
        // Mika's pile never gets below about a quarter, whatever D does
        if (ki === 50 && st !== 'unstable') expect(os(ki, kd)).toBeGreaterThan(24);
      }
    }
  }, 20000);
  it('noise: at the longest filter the jitter left is still mostly D (0.67 N vs 0.29 N with P only)', () => {
    expect(jitterOf(noiseRun(4, 0.2))).toBeCloseTo(0.668, 2);
    expect(jitterOf(noiseRun(0, 0.2))).toBeCloseTo(0.285, 2);
    expect(15 * 0.02).toBeCloseTo(0.3, 6);
    expect(noiseStatus(true, 4, jitterOf(noiseRun(4, 0.2)))).toBe('calm');
    expect(noiseStatus(true, 4, jitterOf(noiseRun(4, 0.005)))).toBe('chatter');
    expect(noiseStatus(true, 0, jitterOf(noiseRun(0, 0.005)))).toBe('noD');
  });
});

describe('Chapter 9: the droop and the pile in numbers', () => {
  it('stuck: mg = 4.905 N; at Kp = 20 the droop is 4.9/20 ≈ 24.5 cm', () => {
    expect(MG).toBeCloseTo(4.905, 3);
    expect(MG / 20).toBeCloseTo(0.245, 3);
    expect(2 - integralRun(0).h.at(-1)!).toBeCloseTo(0.245, 2);
  });
  it('integral widget default Ki = 10: droop gone, pile 4.89 N, net red area 0.49 m·s', () => {
    const tr = integralRun(10);
    expect(integralStatus(10, tr)).toBe('gone');
    expect(10 * tr.integral.at(-1)!).toBeCloseTo(4.89, 1);
    expect(tr.integral.at(-1)!).toBeCloseTo(0.49, 2);
  });
  it("Mika's Ki = 50 yo-yo is about half a metre peak to peak", () => {
    const tr = runDrone(takeoff(pid(20, 50, 0)), 30);
    const hs = tr.h.filter((_, i) => tr.t[i] > 20);
    expect(Math.max(...hs) - Math.min(...hs)).toBeCloseTo(0.52, 1);
  });
});

describe("Chapter 9: June's too-much-D mistake", () => {
  it('Ki = 10: Kd 4 → 10 takes the overshoot from 0 to about 8 % and the settling time from 0.83 s to about 5 s', () => {
    const s4 = scoreTrace(damperRun(10, 4));
    const s10 = scoreTrace(damperRun(10, 10));
    expect(s4.overshoot).toBeLessThan(0.01);
    expect(s10.overshoot).toBeCloseTo(7.88, 1);
    expect(s4.settling).toBeCloseTo(0.83, 2);
    expect(s4.settling).toBeLessThan(1);
    expect(s10.settling).toBeCloseTo(5.03, 1);
    expect(kdCritical(20)).toBeCloseTo(5.32, 2);
    // the fast pole runs off to −20 while the slow pair stays near −1
    expect(Math.min(...pidPoles(20, 10, 10).map((p) => p.re))).toBeCloseTo(-20.06, 1);
  });
  it("Mika's Ki = 50 overshoots by at least a quarter for every stable Kd (min 24.4 % at Kd 4)", () => {
    const os = [0.5, 1, 2, 3, 4, 5, 6, 8, 10].map((kd) => scoreTrace(damperRun(50, kd)).overshoot);
    expect(Math.min(...os)).toBeGreaterThan(24);
    expect(Math.min(...os)).toBeLessThan(25);
    expect(scoreTrace(damperRun(50, 4)).overshoot).toBeCloseTo(24.4, 0);
  });
});

describe('Chapter 9: the poles section', () => {
  /** unlimited motors, small step from hover: envelope ratio late/early (> 1 grows) */
  const linGrowth = (kp: number, ki: number, kd: number) => {
    const sim = new DroneSim(defaultDroneConfig({ params: DRONE, pid: pid(kp, ki, kd), setpoint: (tt) => (tt < 1 ? 1.9 : 2), h0: 1.9 }));
    sim.x[2] = MG / ki;
    const hs: number[] = [];
    const ts: number[] = [];
    sim.advance(40, () => {
      hs.push(sim.h);
      ts.push(sim.t);
    }, 10);
    const dev = (a: number, b: number) => Math.max(...hs.filter((_, i) => ts[i] >= a && ts[i] < b).map((h) => Math.abs(h - 2)));
    return dev(30, 40) / dev(10, 20);
  };
  it('the Routh edge matches the simulation 5 % either side, for five (Kp, Kd) pairs', () => {
    for (const [kp, kd] of [[20, 0], [20, 0.5], [20, 4], [10, 1], [30, 2]]) {
      const L = kiLimit(kp, kd);
      expect(linGrowth(kp, 0.95 * L, kd)).toBeLessThan(0.5);
      expect(linGrowth(kp, 1.05 * L, kd)).toBeGreaterThan(2);
    }
  }, 30000);
  it('on the edge s = iω: real part Ki − (c+Kd)ω² = 0 and sideways part ω(Kp − mω²) = 0', () => {
    for (const [kp, kd] of [[20, 0], [10, 1], [30, 2]]) {
      const w2 = kp / DRONE.m;
      expect(kiLimit(kp, kd) - (DRONE.c + kd) * w2).toBeCloseTo(0, 9);
      // the cubic has a pair exactly on the axis there
      const ps = pidPoles(kp, kiLimit(kp, kd), kd);
      expect(Math.max(...ps.map((p) => p.re))).toBeCloseTo(0, 6);
      expect(Math.max(...ps.map((p) => p.im))).toBeCloseTo(Math.sqrt(w2), 6);
    }
    // s = 0 is a root only when Ki = 0: the cubic at s = 0 is just Ki
    expect(pidPoles(20, 1e-3, 2).every((p) => p.re < 0)).toBe(true);
  });
  it('defaults 20/10/2: slowest pole −0.54, zero −0.5 nearly cancels; step settles in 2.71 s (not 7.4 s), overshoots 28.7 %', () => {
    const ps = pidPoles(20, 10, 2);
    const slow = slowestPole(ps);
    expect(slow.re).toBeCloseTo(-0.54, 2);
    expect(piZero(20, 10)).toBeCloseTo(-0.5, 9);
    expect(nearlyCancels(slow, piZero(20, 10))).toBe(true);
    expect(4 / 0.54).toBeCloseTo(7.4, 1);
    const m = stepOf(polesStep(20, 10, 2, 20));
    expect(m.settling).toBeCloseTo(2.71, 1);
    expect(m.settling).toBeLessThan(3);
    expect(m.overshoot).toBeCloseTo(28.7, 0);
    // the fast pair alone (ζ = 0.47) would overshoot about 19 %
    expect(zetaPD(20, 2)).toBeCloseTo(0.47, 2);
    expect(overshootOf(zetaPD(20, 2))).toBeCloseTo(18.5, 0);
    // what the widget shows (15 s run) agrees
    expect(stepOf(polesStep(20, 10, 2, 15)).overshoot).toBeCloseTo(28.7, 0);
  });
  it('20/10/4: ζ of the pair is 0.79, yet the step still overshoots 13.1 %', () => {
    expect(stepOf(polesStep(20, 10, 4, 20)).overshoot).toBeCloseTo(13.1, 0);
  });
  it('no zero without I', () => {
    expect(piZero(20, 0)).toBeNull();
    expect(nearlyCancels(slowestPole(pidPoles(20, 0, 2)), piZero(20, 0))).toBe(false);
  });
});

describe('Chapter 9: the playground', () => {
  const flight = (kp: number, ki: number, kd: number, aw = true) => runDrone(takeoff(pid(kp, ki, kd, { antiWindup: aw })), 15);
  it('the hint path Kp 20, Kd 4: Ki 0 → 2 stars, 5 → 3, 10 → 4, 15 → 4, 20 → 2; Kd 4 is ζ ≈ 0.8', () => {
    const n = (ki: number) => Object.values(stars(scoreTrace(flight(20, ki, 4)))).filter(Boolean).length;
    expect([0, 5, 10, 15, 20].map(n)).toEqual([2, 3, 4, 4, 2]);
    expect(zetaPD(20, 4)).toBeCloseTo(0.8, 1);
    expect(zetaPD(20, 4)).toBeGreaterThan(0.7);
    expect(zetaPD(20, 4)).toBeLessThan(1);
  });
  it('windup: 20/20/4 overshoots about 7 % with anti-windup and 17 % without', () => {
    expect(scoreTrace(flight(20, 20, 4)).overshoot).toBeCloseTo(6.73, 1);
    expect(scoreTrace(flight(20, 20, 4, false)).overshoot).toBeCloseTo(17.13, 1);
  });
  it("June's 30/60/2 without anti-windup peaks at about 4 m (2.8 m with it) and reaches the page at 1280 px", () => {
    expect(Math.max(...flight(30, 60, 2).h)).toBeCloseTo(2.77, 2);
    expect(Math.max(...flight(30, 60, 2, false).h)).toBeCloseTo(4.05, 2);
    const bump = runUnderCeiling(takeoff(pid(30, 60, 2, { antiWindup: false })), 15, 3.9);
    expect(bump.hitAt).not.toBeNull();
    // the height plot grows to 4.5 m so the peak stays on it
    expect(heightTop(bump.h.slice(0, 601))).toBe(4.5);
    // no page above (or a taller one, as at 375 px): the 4.05 m peak still fits
    expect(heightTop(flight(30, 60, 2, false).h.slice(0, 601))).toBe(4.5);
    expect(heightTop(flight(20, 10, 4).h.slice(0, 601))).toBe(3);
  });
  it('every take-off with Kp ≥ 10 peaks at exactly 20 N (why there is no peak-thrust star)', () => {
    for (const kp of [10, 20, 40]) expect(scoreTrace(flight(kp, 10, 4)).peakThrust).toBeCloseTo(20, 6);
  });
  it('P only: settles 24.5 cm low, so its settling time reads "never (droops)"', () => {
    const s = scoreTrace(flight(20, 0, 0));
    expect(Number.isFinite(s.settling)).toBe(false);
    expect(s.sse).toBeGreaterThan(0.04);
    expect(s.saturated).toBeCloseTo(1.22, 2);
    expect(scoreTrace(flight(20, 10, 4)).saturated).toBeCloseTo(0.14, 2);
  });
  it('page physics rule 7: no Ki = 0 flight reaches the page (max 3.41 m < 3.9 m)', () => {
    let mx = 0;
    for (let kp = 0; kp <= 40; kp += 1) for (let kd = 0; kd <= 10; kd += 0.5) mx = Math.max(mx, ...runDrone(takeoff(pid(kp, 0, kd)), 6).h);
    expect(mx).toBeCloseTo(3.41, 2);
  }, 60000);
});

describe('Chapter 9: the noise widget', () => {
  it('more D, more noise: jitter at τf = 0.02 is 0.29 / 1.20 / 2.10 / 3.51 / 5.28 N for Kd 0 / 1 / 2 / 4 / 8', () => {
    const want: [number, number][] = [[0, 0.285], [1, 1.202], [2, 2.101], [4, 3.513], [8, 5.277]];
    for (const [kd, v] of want) expect(jitterOf(noiseRun(kd, 0.02))).toBeCloseTo(v, 2);
    // Kd = 0: about 0.3 N, whatever the filter (P alone)
    expect(jitterOf(noiseRun(0, 0.005))).toBeCloseTo(0.3, 1);
  }, 20000);
  it('default τf = 0.005: ±6.3 N, clipped at 0 N 55 % of the time and at 20 N 5 %; the average height drifts to about 2.20 m', () => {
    const tr = noiseRun(4, 0.005);
    const xs = tr.thrust.slice(50);
    expect(jitterOf(tr)).toBeCloseTo(6.29, 1);
    expect(xs.filter((x) => x <= 1e-9).length / xs.length).toBeCloseTo(0.55, 1);
    expect(xs.filter((x) => x >= 20 - 1e-9).length / xs.length).toBeCloseTo(0.05, 1);
    expect(meanHeight(tr)).toBeCloseTo(2.2, 1);
    expect(meanHeight(noiseRun(4, 0.01))).toBeCloseTo(2.05, 1);
    expect(meanHeight(noiseRun(4, 0.02))).toBeCloseTo(2.01, 1);
  });
  it('the calm threshold (1.5 N) is crossed between τf = 0.05 (1.79 N) and 0.1 (1.05 N)', () => {
    expect(jitterOf(noiseRun(4, 0.05))).toBeCloseTo(1.79, 1);
    expect(jitterOf(noiseRun(4, 0.1))).toBeCloseTo(1.05, 1);
  });
});

describe('Chapter 9: recap and quiz numbers', () => {
  const os = (ki: number, kd: number) => scoreTrace(runDrone(takeoff(pid(20, ki, kd)), 15)).overshoot;
  it('q5: Kd 4 → 10 raises the overshoot 0 → 7.88 %; Kd 0 → 4 lowers it 53.7 → 0 %; Ki 10 → 5 (Kd 4) stays at 0 %', () => {
    expect(os(10, 4)).toBeLessThan(0.01);
    expect(os(10, 10)).toBeCloseTo(7.88, 1);
    expect(os(10, 0)).toBeCloseTo(53.7, 0);
    expect(os(5, 4)).toBeLessThan(0.01);
  });
});

describe('Chapter 9: a crashed drone stays down (playground)', () => {
  const run = (ceiling: number | null) => stayDown(runUnderCeiling(takeoff(pid(30, 60, 2, { antiWindup: false })), 15, ceiling));
  it("June's windup flight with no page above crashes on the way down, then stays on the ground", () => {
    const tr = run(null);
    expect(tr.crashAt).not.toBeNull();
    expect(tr.crashAt!).toBeGreaterThan(1.5);
    expect(tr.crashAt!).toBeLessThan(3);
    const after = tr.h.filter((_, i) => tr.t[i] >= tr.crashAt!);
    expect(Math.max(...after)).toBe(0);
    expect(Math.max(...tr.thrust.filter((_, i) => tr.t[i] >= tr.crashAt!))).toBe(0);
    // it never settles, so the status uses the "never settles" verdict, and it gets no settling star
    expect(Number.isFinite(scoreTrace(tr).settling)).toBe(false);
  });
  it('"motors pinned" stops counting at the crash: the motors are off on the ground, not pinned', () => {
    const tr = run(null);
    const before = { ...tr, t: tr.t.filter((t) => t < tr.crashAt! - 1e-9), crashAt: null };
    before.thrust = tr.thrust.slice(0, before.t.length);
    expect(scoreTrace(tr).saturated).toBeCloseTo(scoreTrace(before).saturated, 6);
    expect(scoreTrace(tr).saturated).toBeLessThan(tr.crashAt!);
  });
  it('with the page at 3.9 m the bump caps the peak and it does not crash', () => {
    const tr = run(3.9);
    expect(tr.hitAt).not.toBeNull();
    expect(tr.crashAt).toBeNull();
    expect(stayDown(tr)).toBe(tr);
  });
  it('the tuned drones never crash', () => {
    for (const [kp, ki, kd] of [[20, 10, 4], [20, 0, 0], [20, 20, 4]]) expect(runUnderCeiling(takeoff(pid(kp, ki, kd)), 15, null).crashAt).toBeNull();
  });
});
