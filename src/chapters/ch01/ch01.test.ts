import { DroneSim, HOVER_THRUST, defaultDroneConfig } from '../../sim/drone-model';
import { CH1_PID, GUST_N, GUST_S, PACKAGE_KG, theoTime } from './model';

const run = (over: Parameters<typeof defaultDroneConfig>[0], seconds: number) => {
  const sim = new DroneSim(defaultDroneConfig(over));
  let minH = Infinity;
  sim.advance(seconds, () => (minH = Math.min(minH, sim.h)), 1);
  return { sim, minH };
};

describe('chapter 1 numbers', () => {
  it("Theo's schedule (6 N for 1.83 s) ends at 2 m in calm air", () => {
    expect(theoTime(6)).toBeCloseTo(1.826, 3);
    const { sim } = run({ mode: 'open', openThrust: (t) => (t < 1.83 ? 6 : HOVER_THRUST) }, 12);
    expect(Math.abs(sim.h - 2)).toBeLessThan(0.01);
  });

  it('the default schedule (7 N for 0.5 s) ends near 1.05 m', () => {
    const { sim } = run({ mode: 'open', openThrust: (t) => (t < 0.5 ? 7 : HOVER_THRUST) }, 12);
    expect(sim.h).toBeCloseTo(1.05, 1);
  });

  it('open loop + package: sinks ≈ 2 m/s and crashes', () => {
    const { sim } = run({ mode: 'open', h0: 2, extraMass: (t) => (t >= 1 ? PACKAGE_KG : 0) }, 5);
    expect(sim.crashed).toBe(true);
    const far = run({ mode: 'open', h0: 100, extraMass: () => PACKAGE_KG }, 8).sim;
    expect(far.v).toBeCloseTo(-1.96, 2);
  });

  it('open loop + gust: drops about a metre and never comes back', () => {
    const { sim } = run({ mode: 'open', h0: 2, wind: (t) => (t >= 1 && t < 1 + GUST_S ? GUST_N : 0) }, 12);
    expect(sim.h).toBeGreaterThan(0.9);
    expect(sim.h).toBeLessThan(1.1);
  });

  it('feedback + package: stays up, settles about 25 cm low', () => {
    const { sim, minH } = run({ mode: 'closed', h0: 2, pid: CH1_PID, extraMass: (t) => (t >= 1 ? PACKAGE_KG : 0) }, 20);
    expect(sim.crashed).toBe(false);
    expect(minH).toBeGreaterThan(1.4);
    expect(2 - sim.h).toBeCloseTo((PACKAGE_KG * 9.81) / 8, 3);
  });

  it('feedback + gust: dips less than 20 cm and returns to 2 m', () => {
    const { sim, minH } = run({ mode: 'closed', h0: 2, pid: CH1_PID, wind: (t) => (t >= 1 && t < 1 + GUST_S ? GUST_N : 0) }, 15);
    expect(2 - minH).toBeLessThan(0.2);
    expect(sim.h).toBeCloseTo(2, 3);
  });
});
