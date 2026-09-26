import { DRONE, DroneSim, type PID } from '../../sim/drone-model';
import { pid, runDrone } from '../ch09/pid-tools';
import { JUNE_TUNE, LIMITS, MISSION, WINDOWS, dSpike, evaluate, hintFor, missionConfig, missionMargins, missionPoles, neverBack, neverSettled, noiseLifted, runMission, starsOnSeeds } from './mission';
import { flyMission } from './page-hit';
import { SIX_STAR, plays } from './plays';

describe('Chapter 11 mission', () => {
  it('a sensible PID earns all six stars (several seeds)', () => {
    for (const seed of [1, 7, 42]) {
      expect(evaluate(runMission(pid(20, 15, 5, { dTau: 0.04 }), seed)).stars).toBe(6);
      expect(evaluate(runMission(pid(25, 20, 6, { dTau: 0.04 }), seed)).stars).toBe(6);
    }
  });

  it('the default starting tune fails (no integral: droops, and the gust/drop win)', () => {
    const r = evaluate(runMission(pid(10, 0, 1, { dTau: 0.02 })));
    expect(r.stars).toBeLessThan(6);
    expect(r.pass.rise).toBe(false);
  });

  // June's preset (kept in sync with JUNE_TUNE in widgets.ts)
  const june = pid(30, 15, 10, { dTau: 0.005 });

  it("June's high-Kd tune chatters and overshoots with the noisy sensor", () => {
    const r = evaluate(runMission(june));
    expect(r.pass.calm).toBe(false);
    expect(r.pass.overshoot).toBe(false);
    // the fix suggested in the text: longer filter, Kd down to about 7 (30 seeds: see below)
    expect(evaluate(runMission(pid(30, 15, 7, { dTau: 0.04 }))).stars).toBe(6);
  });

  it('…yet with a perfect sensor it earns all six stars ("flawless in calm air")', async () => {
    const { runDrone } = await import('../ch09/pid-tools');
    const { missionConfig } = await import('./mission');
    expect(evaluate(runDrone({ ...missionConfig(june), noiseStd: 0 }, 20)).stars).toBe(6);
  });

  it('nominal poles: good tune stable, huge Ki unstable', () => {
    expect(missionPoles(pid(20, 15, 5, { dTau: 0.04 })).every((p) => p.re < 0)).toBe(true);
    expect(missionPoles(pid(20, 400, 0, { dTau: 0.04 })).some((p) => p.re > 0)).toBe(true);
    // no-lag, no-filter limit reproduces the Chapter 9 cubic's pole count (plus motor)
    expect(missionPoles(pid(20, 10, 4, { dTau: 0 })).length).toBe(4);
    const pd = missionPoles(pid(20, 0, 4, { dTau: 0.04 }));
    expect(pd).toHaveLength(4);
    expect(pd.every((p) => p.re < 0)).toBe(true);
  });

  it('requires the take-off height to stay in band before the gust', () => {
    const tr = runMission(pid(20, 15, 5, { dTau: 0.04 }));
    const excursion = tr.t.findIndex((t) => t >= 4);
    tr.h[excursion] = 1.8;
    const result = evaluate(tr);
    expect(result.pass.rise).toBe(false);
    expect(result.rise).toBeGreaterThan(4);
  });
});

describe('extreme slider values stay finite', () => {
  it('mission and poles at the slider corners', () => {
    for (const kp of [0, 50]) for (const ki of [0, 50]) for (const kd of [0, 12]) for (const tf of [0.005, 0.2]) {
      const tr = runMission(pid(kp, ki, kd, { dTau: tf }));
      expect(tr.h.every(Number.isFinite)).toBe(true);
      expect(tr.thrust.every((x) => x >= 0 && x <= 20)).toBe(true);
      expect(missionPoles(pid(kp, ki, kd, { dTau: tf })).every((p) => Number.isFinite(p.re) && Number.isFinite(p.im))).toBe(true);
      evaluate(tr);
    }
  });
});

const REF = pid(20, 15, 5, { dTau: 0.04 });
const JUNE = pid(30, 15, 10, { dTau: 0.005 });
/** the fix the mission text suggests: filter about 0.04 s, Kd about 7 */
const FIX = pid(30, 15, 7, { dTau: 0.04 });
const ev = (p: PID, seed = 7, over = {}) => evaluate(runDrone({ ...missionConfig(p, seed), ...over }, MISSION.duration));

/** standard deviation of motor thrust and of the command over [a, b), every 1 ms step (seed 7) */
function spread(p: PID, over = {}, a = 3, b = 6): { thrust: number; command: number } {
  const sim = new DroneSim({ ...missionConfig(p, 7), ...over });
  const T: number[] = [];
  const C: number[] = [];
  while (sim.t < b - 1e-9) {
    sim.step();
    if (sim.t >= a) {
      T.push(sim.thrust);
      C.push(sim.command);
    }
  }
  const sd = (x: number[]) => {
    const m = x.reduce((s, v) => s + v, 0) / x.length;
    return Math.sqrt(x.reduce((s, v) => s + (v - m) ** 2, 0) / x.length);
  };
  return { thrust: sd(T), command: sd(C) };
}

describe('briefing numbers', () => {
  it('the timeline and the grit list are the code (20 s, 0.05 s, 2 cm, 6–9 s, 1.5 N down, 0.2 kg, 12 s, 2 m, 0–20 N)', () => {
    expect(MISSION).toMatchObject({ duration: 20, motorTau: 0.05, noiseStd: 0.02, gust: { start: 6, end: 9, force: -1.5 }, pkgMass: 0.2, dropAt: 12, setpoint: 2 });
    expect(LIMITS).toEqual({ rise: 3, overshoot: 10, gust: 0.2, recover: 2, calm: 0.5, band: 0.05 });
    expect([DRONE.tMin, DRONE.tMax]).toEqual([0, 20]);
  });

  it('hover thrust 6.9 N with the package, 4.9 N without: the integral must unlearn 1.96 N', () => {
    expect((DRONE.m + MISSION.pkgMass) * DRONE.g).toBeCloseTo(6.867, 3);
    expect(DRONE.m * DRONE.g).toBeCloseTo(4.905, 3);
    expect(MISSION.pkgMass * DRONE.g).toBeCloseTo(1.962, 3);
  });

  it('20 N is only about three times (2.9×) the loaded weight; the bare drone had about four (4.1×)', () => {
    expect(20 / ((DRONE.m + MISSION.pkgMass) * DRONE.g)).toBeCloseTo(2.91, 2);
    expect(20 / (DRONE.m * DRONE.g)).toBeCloseTo(4.08, 2);
  });

  it('a first-order lag is 63 % of the way after one time constant', () => {
    expect(1 - Math.exp(-1)).toBeCloseTo(0.632, 3);
  });

  it('take-off: Kp 20 times the 2 m error asks for 40 N; the motors are told 20 N, for about 0.27 s', () => {
    const sim = new DroneSim(missionConfig(REF));
    expect(sim.request).toBeCloseTo(40, 6);
    expect(sim.command).toBeCloseTo(20, 6);
    let pinned = 0;
    while (sim.t < 3) {
      sim.step();
      if (sim.command >= 20 - 1e-9) pinned += sim.dt;
    }
    expect(pinned).toBeCloseTo(0.268, 2);
  });

  it('the drop: at rest the pile alone holds the weight, so it moves by 0.2·g = 1.96 N; ∫e = 1.96/15 = 0.131 m·s (no gust, no noise)', () => {
    const sim = new DroneSim({ ...missionConfig(REF), noiseStd: 0, wind: () => 0 });
    let before = 0;
    let area = 0;
    while (sim.t < MISSION.duration - 1e-9) {
      sim.step();
      if (Math.abs(sim.t - MISSION.dropAt) < 5e-4) before = sim.integral;
      if (sim.t > MISSION.dropAt) area += (sim.h - MISSION.setpoint) * sim.dt;
    }
    expect(15 * (before - sim.integral)).toBeCloseTo(1.962, 2);
    expect(area).toBeCloseTo(0.1308, 2);
    expect(0.1308 / 0.05).toBeCloseTo(2.6, 1);
  });

  it('P alone after the drop settles at a different droop: 0.2·g/Kp = 9.8 cm higher (predict option P)', () => {
    const tr = runDrone({ ...missionConfig(pid(20, 0, 5, { dTau: 0.04 })), noiseStd: 0 }, MISSION.duration);
    const i = tr.t.findIndex((t) => t >= 11.99);
    expect(tr.h[tr.h.length - 1] - tr.h[i]).toBeCloseTo(0.0981, 3);
  });
});

describe('side trip: a short lag is almost a delay (missionMargins)', () => {
  it('reference tune: crossover about 10 rad/s (9.85), lag 26°, phase margin 59° → 33°', () => {
    const real = missionMargins(REF);
    expect(real.wc).toBeCloseTo(9.85, 1);
    expect(real.lag).toBeCloseTo(26.2, 0);
    expect(real.pm).toBeCloseTo(33.4, 0);
    expect(Math.round(missionMargins(REF, 0).pm)).toBe(59);
    // a 0.05 s delay at the same crossover would cost ωτ = 28°
    expect(Math.round((real.wc * 0.05 * 180) / Math.PI)).toBe(28);
    // the motor lag costs about 25° of margin
    expect(missionMargins(REF, 0).pm - real.pm).toBeCloseTo(25.1, 0);
  });

  it('quiz q5: slower motors (0.1 s) squeeze the margin from about 33° to about 21°', () => {
    expect(Math.round(missionMargins(REF, 0.1).pm)).toBe(21);
    expect(Math.round(missionMargins(REF, 0.05).pm)).toBe(33);
  });
});

describe('mission numbers (30 noise seeds where noise matters)', () => {
  it('the reference tune (20, 15, 5, τf 0.04) arrives in 1.26 s, dips 6.8 cm in the gust, recovers in 1.46 s, 0.22 N of chatter', () => {
    const r = ev(REF);
    expect(r.rise).toBeCloseTo(1.26, 2);
    expect(r.gust * 100).toBeCloseTo(6.8, 0);
    expect(r.recover).toBeCloseTo(1.46, 2);
    expect(r.calm).toBeCloseTo(0.217, 2);
  });

  it('"Stuck?" start (20, 10, 4) gets five stars at τf 0.04 (arrival fails); the reference gets six', () => {
    const r = ev(pid(20, 10, 4, { dTau: 0.04 }));
    expect(r.stars).toBe(5);
    expect(r.pass.rise).toBe(false);
    expect(ev(REF).stars).toBe(6);
  });

  it("June's tune: noise-free it arrives in 1.27 s with six stars; with the real sensor it fails, overshooting about 28 % (seed 7) and never settling on any seed", () => {
    const calm = ev(JUNE, 7, { noiseStd: 0 });
    expect(calm.stars).toBe(6);
    expect(calm.rise).toBeCloseTo(1.27, 2);
    const r = ev(JUNE);
    expect(r.stars).toBe(2);
    expect(r.overshoot).toBeCloseTo(27.9, 0);
    expect(r.calm).toBeCloseTo(0.643, 2);
    const s = starsOnSeeds(JUNE);
    expect(s.passes.overshoot).toBe(0);
    expect(s.passes.rise).toBe(0);
    // "the motors buzz" is true on 28 of 30 seeds, and in the widget's own flight (seed 7)
    expect(s.passes.calm).toBe(2);
    expect(r.pass.calm).toBe(false);
  });

  it('the fix (30, 15, ≈7, τf ≈ 0.04) earns six stars on all 30 seeds, arriving in about 1.9 s; Kd 6 misses seed 5, Kd 8 misses the drop 7 times', () => {
    const s = starsOnSeeds(FIX);
    expect(s.gold).toBe(30);
    expect(ev(FIX).rise).toBeCloseTo(1.87, 1);
    expect(s.range.rise[0]).toBeGreaterThan(1.75);
    // on other jitter it arrives between 1.8 and 2.2 s: "about" in the prose, the widget (seed 7) shows 1.87 s
    expect(s.range.rise[1]).toBeLessThan(2.25);
    const kd6 = starsOnSeeds(pid(30, 15, 6, { dTau: 0.04 }));
    expect(kd6.misses).toEqual([{ seed: 5, failed: ['rise'] }]);
    expect(starsOnSeeds(pid(30, 15, 8, { dTau: 0.04 })).gold).toBe(23);
    // "June's dream of 1.3 s": her noise-free arrival
    expect(Math.round(ev(JUNE, 7, { noiseStd: 0 }).rise * 10) / 10).toBe(1.3);
  });

  it('false-obvious: lengthening only the filter (Kd stays 10) fails the drop (2.76 s; noise-free 1.22 s)', () => {
    const p = pid(30, 15, 10, { dTau: 0.04 });
    expect(ev(p).pass.recover).toBe(false);
    expect(ev(p).recover).toBeCloseTo(2.76, 1);
    expect(ev(p, 7, { noiseStd: 0 }).recover).toBeCloseTo(1.22, 1);
  });

  it('side trip "why not just more D?": at τf 0.04 chatter grows 0.22 N (Kd 5) → 0.41 N (Kd 10); noise-free Kd 10 is near silent', () => {
    const at = (kd: number) => spread(pid(20, 15, kd, { dTau: 0.04 })).thrust;
    expect(at(5)).toBeCloseTo(0.218, 2);
    expect(at(10)).toBeCloseTo(0.407, 2);
    expect(spread(pid(20, 15, 10, { dTau: 0.04 }), { noiseStd: 0 }).thrust).toBeLessThan(0.04);
    // holds on 30 seeds: more D, more buzz
    const kd5 = starsOnSeeds(pid(20, 15, 5, { dTau: 0.04 }));
    const kd10 = starsOnSeeds(pid(20, 15, 10, { dTau: 0.04 }));
    kd5.results.forEach((r, i) => expect(kd10.results[i].calm).toBeGreaterThan(r.calm));
  });

  it('D turns σ into about Kd·σ/τf of command: 40 N for June, 3.5 N at Kd 7, τf 0.04 (drone parked, no limits; the 1 ms noise hold makes τf 0.005 about 15 % low)', () => {
    expect((10 * 0.02) / 0.005).toBeCloseTo(40, 9);
    expect((7 * 0.02) / 0.04).toBeCloseTo(3.5, 9);
    const run = (kd: number, tf: number) => {
      const sim = new DroneSim({ ...missionConfig(pid(0, 0, kd, { dTau: tf })), params: { ...DRONE, saturate: false, motorTau: MISSION.motorTau } });
      const c: number[] = [];
      while (sim.t < 3) {
        sim.step();
        if (sim.t >= 1) c.push(sim.command);
      }
      const m = c.reduce((a, b) => a + b, 0) / c.length;
      return Math.sqrt(c.reduce((a, b) => a + (b - m) ** 2, 0) / c.length);
    };
    expect(run(7, 0.04) / 3.5).toBeGreaterThan(0.95);
    expect(run(7, 0.04) / 3.5).toBeLessThan(1.05);
    expect(run(10, 0.005) / 40).toBeGreaterThan(0.8);
    expect(run(10, 0.005) / 40).toBeLessThan(0.9);
  });

  it('the gust under P (plus a little D): 1.5 N / Kp = 15, 7.5, 5 cm at Kp 10, 20, 30; pure P with motor lag does not show it', () => {
    const dev = (p: PID, T = 25) => {
      const tr = runDrone({ ...missionConfig(p), noiseStd: 0, extraMass: () => 0, wind: (t: number) => (t >= 10 ? -1.5 : 0) }, T);
      const i = tr.t.findIndex((t) => t >= 9.99);
      return tr.h[i] - tr.h[tr.h.length - 1];
    };
    for (const [kp, d] of [[10, 0.15], [20, 0.075], [30, 0.05]]) expect(dev(pid(kp, 0, 5, { dTau: 0.04 }))).toBeCloseTo(d, 3);
    expect(Math.abs(dev(pid(20, 0, 0, { dTau: 0.04 }), 30) - 0.075)).toBeGreaterThan(0.03);
  });
});

describe('the mission widget tells the truth', () => {
  it('a failed arrival or drop is a verdict ("not settled by 6 s", "not back by 20 s"), not the 6.00 s / 8.00 s fallbacks', () => {
    const june = ev(JUNE);
    expect(june.rise).toBeCloseTo(6, 1);
    expect(neverSettled(june)).toBe(true);
    expect(june.recover).toBeCloseTo(8, 1);
    expect(neverBack(june)).toBe(true);
    // real measurements stay measurements, even late ones
    const late = ev(pid(20, 10, 4, { dTau: 0.04 }));
    expect(late.rise).toBeCloseTo(3.53, 2);
    expect(neverSettled(late)).toBe(false);
    expect(neverBack(ev(REF))).toBe(false);
    expect(neverSettled(ev(REF))).toBe(false);
  });

  it('the "D from measurement" switch was a no-op here (the target never jumps), so removing it changes no flight', () => {
    const a = runMission(pid(20, 15, 5, { dTau: 0.04, dOnMeasurement: true }));
    const b = runMission(pid(20, 15, 5, { dTau: 0.04, dOnMeasurement: false }));
    expect(Math.max(...a.h.map((v, i) => Math.abs(v - b.h[i])))).toBeLessThan(1e-9);
    expect(JUNE_TUNE).toEqual({ kp: 30, ki: 15, kd: 10, dTau: 0.005 });
  });

  it('hints point at the failure to fix first, each backed by a real case', () => {
    const hint = (p: PID) => hintFor(ev(p), p);
    // the default tune (no Ki) hangs low: droop
    expect(hint(pid(10, 0, 1, { dTau: 0.02 }))).toBe('droop');
    // June: the noise, before anything else it spoils (Kd·σ/τf = 40 N)
    expect(dSpike(JUNE)).toBeCloseTo(40, 9);
    expect(hint(JUNE)).toBe('noise');
    // lengthening only the filter: the drop fails
    expect(hint(pid(30, 15, 10, { dTau: 0.04 }))).toBe('recover');
    // (20, 10, 4) creeps up; a little more Ki lights the arrival star on every seed
    expect(hint(pid(20, 10, 4, { dTau: 0.04 }))).toBe('rise');
    expect(starsOnSeeds(pid(20, 12, 4, { dTau: 0.04 })).gold).toBe(30);
    // too little damping overshoots; the motors can't even lift it at Kp 0
    expect(hint(pid(20, 15, 1, { dTau: 0.04 }))).toBe('overshoot');
    expect(hint(pid(0, 0, 0, { dTau: 0.02 }))).toBe('ground');
    expect(hint(REF)).toBeNull();
  });

  it('every checklist window is inside the mission, and the calm window is 3–6 s', () => {
    expect(WINDOWS.calm).toEqual([3, 6]);
    for (const [a, b] of Object.values(WINDOWS)) {
      expect(a).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(MISSION.duration);
      expect(b).toBeGreaterThan(a);
    }
  });
});

describe('page physics: the noise alone can lift a drone into the page (status hitNoise)', () => {
  it('Kp 5, Ki 0, Kd 12, τf 0.005 climbs to about 6 m on the jitter (desk headroom 4.9 m); noise-free it never reaches 2 m', () => {
    const p = pid(5, 0, 12, { dTau: 0.005 });
    expect(Math.max(...runMission(p).h)).toBeCloseTo(5.97, 1);
    expect(Math.max(...runDrone({ ...missionConfig(p), noiseStd: 0 }, MISSION.duration).h)).toBeLessThan(2);
    const { sim } = flyMission(p, 4.9);
    expect(sim.ceilingAt).not.toBeNull();
    expect(noiseLifted(p)).toBe(true);
    // the integral-driven page hits are not labelled as noise
    expect(noiseLifted(pid(5, 20, 0, { dTau: 0.04 }))).toBe(false);
  });
});

describe('playable sentences show the verified values at their starting numbers', () => {
  const t = (k: string) => k;
  const at = (id: string, over: Record<string, number> = {}) => {
    const m = plays[id];
    const v = { ...Object.fromEntries(Object.entries(m.inputs).map(([k, i]) => [k, i.value])), ...over };
    return Object.fromEntries(Object.entries(m.outputs).map(([k, f]) => [k, f(v, t, t)]));
  };

  it('limit: 6.87 N loaded, 2.9×, Kp 20 asks for 40 N and is clipped; Kp 10 asks for exactly 20 N', () => {
    expect(at('limit')).toEqual({ w: '6.87', ratio: '2.9', ask: '40', clip: 'clipped' });
    expect(at('limit', { kp: 10 }).clip).toBe('');
  });

  it('lag: about 9.8 rad/s, 26°, 33°; no lag keeps 59° (the sentence\'s "from 59°")', () => {
    expect(at('lag')).toEqual({ wc: '9.8', lag: '26', pm: '33' });
    expect(at('lag', { tm: 0 })).toEqual({ wc: '10.8', lag: '0', pm: '59' });
    expect(at('lag', { tm: 0.1 }).pm).toBe('21');
    expect(SIX_STAR).toEqual(REF);
    expect(starsOnSeeds(SIX_STAR).gold).toBe(30);
  });

  it('drop: 1.96 N, 0.131 m·s, about 2.6 s', () => {
    expect(at('drop')).toEqual({ dN: '1.96', area: '0.131', time: '2.6' });
  });

  it('spike: June 40 N, the fix 3.5 N', () => {
    expect(at('spike')).toEqual({ spike: '40' });
    expect(at('spike', { kd: 7, tf: 0.04 })).toEqual({ spike: '3.5' });
    // "about": the tiniest filter the sentence allows is the one whose sim value is checked above
    expect(plays.spike.inputs.tf.min).toBeGreaterThanOrEqual(0.005);
  });

  it('gust: 1.5 N against Kp 20 is 7.5 cm; the default push is the mission gust', () => {
    expect(at('gust')).toEqual({ dev: '7.5' });
    expect(plays.gust.inputs.F.value).toBe(1.5);
  });

  it('"about 7": Kd 6.5, 7 and 7.5 at τf 0.04 all hold on 30 seeds; τf 0.035 is already fragile at Kd 7', () => {
    for (const kd of [6.5, 7, 7.5]) expect(starsOnSeeds(pid(30, 15, kd, { dTau: 0.04 })).gold).toBe(30);
    expect(starsOnSeeds(pid(30, 15, 7, { dTau: 0.035 })).gold).toBeLessThan(30);
  });

  it('quiz q4: P passes the jitter straight through, Kp·σ = 0.4 N at Kp 20', () => {
    expect(20 * MISSION.noiseStd).toBeCloseTo(0.4, 9);
  });

  it('quiz q5: about 10 rad/s is a swing every 0.6 s', () => {
    expect((2 * Math.PI) / missionMargins(REF).wc).toBeCloseTo(0.64, 2);
  });
});
