import { pid } from '../ch09/pid-tools';
import { evaluate, missionPoles, runMission } from './mission';

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
    // the fix suggested in the text: longer filter, Kd down to about 6
    expect(evaluate(runMission(pid(30, 15, 6, { dTau: 0.04 }))).stars).toBe(6);
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
