import { pid } from '../ch09/pid-tools';
import { MISSION, evaluate, runMission } from './mission';
import { flyMission } from './page-hit';

/** open page above the picture (from DroneView.ceilingHeight at 1280 px and 375 px) */
const DESK = 4.9;
const PHONE = 6.4;
const peak = (h: number[]) => Math.max(...h);

describe('Chapter 11 mission under the page', () => {
  it('with open sky it is exactly the mission trace', () => {
    const p = pid(20, 15, 5, { dTau: 0.04 });
    const { tr, sim } = flyMission(p, null);
    expect(tr).toEqual(runMission(p));
    expect(sim.ceilingAt).toBeNull();
  });

  it('good and strong-Kp tunes never reach the page, so their mission is unchanged', () => {
    for (const kp of [10, 25, 50]) for (const ki of [0, 50]) for (const kd of [0, 12]) for (const tf of [0.005, 0.2]) {
      const { tr, sim } = flyMission(pid(kp, ki, kd, { dTau: tf }), DESK);
      expect(sim.ceilingAt).toBeNull();
      expect(peak(tr.h)).toBeLessThan(DESK);
    }
    expect(evaluate(flyMission(pid(20, 15, 5, { dTau: 0.04 }), DESK).tr).stars).toBe(6);
  });

  // weak Kp with a strong integral swings metres past the target (peaks 5.2 m at 1.4 s, 9.0 m at 10.6 s)
  const cases = [
    { name: 'desktop', h: DESK, p: pid(5, 20, 0, { dTau: 0.04 }) },
    { name: 'phone', h: PHONE, p: pid(0, 10, 0, { dTau: 0.04 }) },
  ];
  for (const { name, h, p } of cases) {
    it(`${name}: it really gets there without the page, and with it the hit stalls the motors and it crashes`, () => {
      expect(peak(runMission(p).h)).toBeGreaterThan(h);
      const { tr, sim } = flyMission(p, h);
      expect(sim.ceilingAt).not.toBeNull();
      expect(sim.stalled).toBe(true);
      expect(peak(tr.h)).toBeLessThanOrEqual(h);
      // no thrust from the hit on, and once down it stays down until the next flight
      const hit = tr.t.findIndex((t) => t >= sim.ceilingAt!);
      expect(tr.thrust.slice(hit + 1).every((x) => x === 0)).toBe(true);
      const down = tr.h.findIndex((x, i) => i > hit && x <= 1e-6);
      expect(down).toBeGreaterThan(hit);
      expect(tr.h.slice(down).every((x) => x <= 1e-6)).toBe(true);
      expect(tr.crashed).toBe(true);
      expect(tr.t[tr.t.length - 1]).toBeCloseTo(MISSION.duration, 5);
      // the checklist's existing failure: it touched the ground after take-off
      const r = evaluate(tr);
      expect(r.ground).toBe(true);
      expect(r.pass.ground).toBe(false);
    });
  }

  it('a crash never earns "motors calm in hover": stalled or grounded thrust is steady, but it is not hovering', () => {
    // every page-reaching tune in both layouts: the calm star needs the whole 3–6 s window airborne on running motors
    let stalledInWindow = 0;
    for (const kp of [0, 2, 5]) for (const ki of [10, 20, 50]) {
      for (const h of [DESK, PHONE]) {
        const { tr, sim } = flyMission(pid(kp, ki, 0, { dTau: 0.04 }), h);
        if (sim.stalled && tr.stalledAt! < 6) {
          stalledInWindow++;
          expect(evaluate(tr).pass.calm).toBe(false);
        }
      }
    }
    expect(stalledInWindow).toBeGreaterThan(3);
    // and a drone that never takes off does not earn it either
    const grounded = runMission(pid(0, 0, 0));
    expect(peak(grounded.h)).toBeLessThan(0.01);
    expect(evaluate(grounded).pass.calm).toBe(false);
  });

  it('hitting the page never earns stars: with the page you score at most what open sky scores', () => {
    let hits = 0;
    for (const kp of [0, 1, 3, 5, 7]) for (const ki of [0, 10, 30, 50]) for (const kd of [0, 3, 12]) for (const tf of [0.005, 0.04]) {
      const p = pid(kp, ki, kd, { dTau: tf });
      const sky = evaluate(runMission(p));
      for (const h of [DESK, PHONE]) {
        const { tr, sim } = flyMission(p, h);
        if (sim.ceilingAt === null) continue;
        hits++;
        const page = evaluate(tr);
        expect(page.stars).toBeLessThanOrEqual(sky.stars);
        expect(page.pass.ground).toBe(false);
      }
    }
    expect(hits).toBeGreaterThan(20);
  });
});
