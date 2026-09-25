import { runP, droopOf, overshootOf, challengeBounds, LIFTOFF_KP } from './model';

describe('chapter 2 numbers', () => {
  it('droop = mg/Kp for the values quoted in the text', () => {
    expect(runP(5, 30).h.at(-1)).toBeCloseTo(1.019, 2);
    expect(droopOf(10)).toBeCloseTo(0.49, 2);
    expect(droopOf(20)).toBeCloseTo(0.245, 3);
    expect(runP(20, 30).h.at(-1)).toBeCloseTo(2 - 0.245, 3);
    expect(droopOf(60)).toBeCloseTo(0.082, 3);
  });

  it('Kp = 2 never takes off; lift-off needs Kp > 2.45', () => {
    expect(LIFTOFF_KP).toBeCloseTo(2.45, 2);
    expect(runP(2).tookOff).toBe(false);
    expect(runP(0).tookOff).toBe(false);
    expect(runP(2.6).tookOff).toBe(true);
  });

  it('simulated overshoot matches the formula (takes off from the ground)', () => {
    for (const kp of [5, 10, 20, 40, 60]) {
      const r = runP(kp, 20);
      expect(r.overshoot).toBeCloseTo(overshootOf(kp), 0);
    }
  });

  it('Kp = 60 shoots up past 3.3 m', () => {
    const r = runP(60);
    expect(r.peak).toBeGreaterThan(3.3);
    expect(r.peak).toBeLessThan(3.45);
  });

  it('the mini-challenge is impossible: droop < 20 cm needs Kp > 24.5, overshoot < 30 % needs Kp < 3.9', () => {
    const b = challengeBounds();
    expect(b.droopNeedsAbove).toBeCloseTo(24.5, 1);
    expect(b.overshootNeedsBelow).toBeCloseTo(3.9, 1);
    // brute force over the slider range, with the simulator
    for (let kp = 0.5; kp <= 60; kp += 0.5) {
      const r = runP(kp, 25);
      const ok = r.tookOff && r.droop < 0.2 && r.overshoot < 30;
      expect(ok).toBe(false);
    }
  });
});
