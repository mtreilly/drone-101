import { sameCeiling, runUnderCeiling } from './page-ceiling';
import { hoverStep, pid, runDrone, scoreTrace, takeoff } from './pid-tools';

const peak = (xs: number[]) => Math.max(...xs);

describe('Chapter 9 playground under the page', () => {
  it('with nothing overhead (or overhead but out of reach) the trace is exactly runDrone', () => {
    const cfg = takeoff(pid(20, 10, 4));
    const plain = runDrone(cfg, 6);
    for (const c of [null, 3.9]) {
      const tr = runUnderCeiling(cfg, 6, c);
      expect(tr.h).toEqual(plain.h);
      expect(tr.thrust).toEqual(plain.thrust);
      expect(tr.hitAt).toBeNull();
      expect(tr.hits).toBe(0);
    }
  });

  it('the chapter\'s other drones never reach the page (3.9 m at 1280 px, 4.4 m at 375 px), so they stay in their pictures', () => {
    // integral (Kp 20, Ki 0–60) and damper (Kp 20, Ki 10 or 50, Kd 0–10) peak at 3.3 m
    for (let ki = 0; ki <= 60; ki += 5) expect(peak(runDrone(takeoff(pid(20, ki, 0)), 12).h)).toBeLessThan(3.35);
    for (const ki of [10, 50]) for (let kd = 0; kd <= 10; kd += 0.5) expect(peak(runDrone(takeoff(pid(20, ki, kd)), 10).h)).toBeLessThan(3.35);
    // kick and noise hover near 2 m
    for (const m of [false, true]) expect(peak(hoverStep(pid(15, 8, 4, { dTau: 0.01, dOnMeasurement: m }), 1, 2, 5).h)).toBeLessThan(2.5);
    for (const tau of [0.005, 0.05, 0.2]) expect(peak(hoverStep(pid(15, 8, 4, { dTau: tau }), 2, 2, 5, 0.02).h)).toBeLessThan(2.5);
  });

  it('windup off: it hits the page, the motors keep running, and feedback brings it back to 2 m', () => {
    const cfg = takeoff(pid(30, 60, 2, { antiWindup: false }));
    expect(peak(runDrone(cfg, 6).h)).toBeGreaterThan(4);
    const tr = runUnderCeiling(cfg, 15, 3.9);
    expect(tr.hitAt).toBeGreaterThan(0.5);
    expect(tr.hitAt).toBeLessThan(1);
    expect(tr.hits).toBe(1);
    expect(peak(tr.h)).toBeLessThanOrEqual(3.9 + 1e-9);
    // not stalled: the motors still push after the hit
    const after = tr.thrust.filter((_, i) => tr.t[i] > tr.hitAt! + 0.5);
    expect(peak(after)).toBeGreaterThan(5);
    expect(tr.crashed).toBe(false);
    const s = scoreTrace(tr);
    expect(s.settling).toBeLessThan(6);
    expect(Math.abs(tr.h[tr.h.length - 1] - 2)).toBeLessThan(0.01);
  });

  it('every contact is a bump: a drone that climbs back is stopped by the page again', () => {
    // pure I control can't settle, so it keeps coming back up
    const cfg = takeoff(pid(0, 40, 0));
    const tr = runUnderCeiling(cfg, 15, 3.9);
    expect(tr.hits).toBeGreaterThan(1);
    expect(peak(tr.h)).toBeLessThanOrEqual(3.9 + 1e-9);
    expect(Number.isFinite(scoreTrace(tr).settling)).toBe(false);
  });

  it('sameCeiling ignores sub-centimetre layout jitter', () => {
    expect(sameCeiling(null, null)).toBe(true);
    expect(sameCeiling(3.9, null)).toBe(false);
    expect(sameCeiling(3.9, 3.905)).toBe(true);
    expect(sameCeiling(3.9, 4.0)).toBe(false);
  });
});
