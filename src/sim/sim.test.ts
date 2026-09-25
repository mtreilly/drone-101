import { DelayLine } from './delay-line';
import { DroneSim, DRONE, P_ONLY, defaultDroneConfig, HOVER_THRUST } from './drone-model';
import { MassSpringDamper } from './msd-model';
import { SHOWER, ShowerSim, knobFor } from './shower-model';
import { simulate } from './integrator';
import { secondOrderSolution, stepResponse } from '../math/second-order';

describe('RK4 integrator', () => {
  it('matches exp decay to 1e-10', () => {
    const x = simulate(1, (_t, s, d) => void (d[0] = -2 * s[0]), [1], 1, 0.001, () => {});
    expect(Math.abs(x[0] - Math.exp(-2))).toBeLessThan(1e-10);
  });

  it.each([
    [0.1, 'under'],
    [1, 'critical'],
    [2.5, 'over'],
  ])('mass-spring-damper matches exact solution (zeta=%s, %s)', (zeta) => {
    const m = 0.5;
    const k = 8;
    const wn = Math.sqrt(k / m);
    const cc = 2 * zeta * wn * m;
    const F = 3;
    const sim = new MassSpringDamper(m, cc, k, () => F, 0.4, -1);
    const exact = secondOrderSolution(m, cc, k, F, 0.4, -1);
    let maxErr = 0;
    sim.advance(10, () => (maxErr = Math.max(maxErr, Math.abs(sim.pos - exact(sim.t)))), 1);
    expect(maxErr).toBeLessThan(1e-6);
  });

  it('standard step response reaches 1', () => {
    expect(stepResponse(3, 0.5)(20)).toBeCloseTo(1, 8);
  });
});

describe('DelayLine', () => {
  it('delays by exactly the requested steps', () => {
    const d = new DelayLine(0.03, 0.01, -1);
    const out = [1, 2, 3, 4, 5].map((v) => d.push(v));
    expect(out).toEqual([-1, -1, -1, 1, 2]);
  });
});

describe('Drone', () => {
  it('P control from the ground matches the exact 2nd-order solution', () => {
    const kp = 20;
    const sim = new DroneSim(defaultDroneConfig({ pid: P_ONLY(kp) }));
    const { m, c, g } = DRONE;
    const exact = secondOrderSolution(m, c, kp, kp * 2 - m * g, 0, 0);
    let maxErr = 0;
    sim.advance(10, () => (maxErr = Math.max(maxErr, Math.abs(sim.h - exact(sim.t)))), 1);
    expect(maxErr).toBeLessThan(1e-6);
  });

  it('droops by mg/Kp under P control', () => {
    for (const kp of [5, 10, 20, 50]) {
      const sim = new DroneSim(defaultDroneConfig({ pid: P_ONLY(kp) }));
      sim.advance(40);
      expect(sim.h).toBeCloseTo(2 - HOVER_THRUST / kp, 4);
    }
  });

  it('never leaves the ground if Kp*2 < mg', () => {
    const sim = new DroneSim(defaultDroneConfig({ pid: P_ONLY(2) }));
    sim.advance(5);
    expect(sim.h).toBe(0);
  });

  it('open loop with a package sinks at terminal speed Δm·g/c', () => {
    const sim = new DroneSim(
      defaultDroneConfig({ mode: 'open', h0: 50, extraMass: () => 0.2, openThrust: () => HOVER_THRUST }),
    );
    sim.advance(10);
    expect(sim.v).toBeCloseTo((-0.2 * 9.81) / DRONE.c, 3);
  });

  it('PID removes the droop and the integral equals mg/Ki', () => {
    const sim = new DroneSim(defaultDroneConfig({ pid: { ...P_ONLY(20), ki: 10, kd: 4 } }));
    sim.advance(60);
    expect(sim.h).toBeCloseTo(2, 5);
    expect(sim.integral * 10).toBeCloseTo(HOVER_THRUST, 3);
  });

  it('PID stability boundary (c+Kd)·Kp = m·Ki', () => {
    const { m, c } = DRONE;
    const kp = 10;
    const kd = 1;
    const kiCrit = ((c + kd) * kp) / m; // 40
    const amp = (ki: number) => {
      const sim = new DroneSim(defaultDroneConfig({ pid: { ...P_ONLY(kp), ki, kd, ff: HOVER_THRUST }, h0: 1.99 }));
      let early = 0;
      let late = 0;
      sim.advance(60, () => {
        const e = Math.abs(sim.h - 2);
        if (sim.t > 10 && sim.t < 20) early = Math.max(early, e);
        if (sim.t > 50) late = Math.max(late, e);
      });
      return late / early;
    };
    expect(amp(kiCrit * 0.9)).toBeLessThan(1);
    expect(amp(kiCrit * 1.1)).toBeGreaterThan(1);
  });

  it('saturates thrust when enabled', () => {
    const sim = new DroneSim(defaultDroneConfig({ params: { ...DRONE, saturate: true }, pid: P_ONLY(50) }));
    expect(sim.thrust).toBe(DRONE.tMax);
  });
});

describe('Shower', () => {
  it('settles at the target when the knob is set right and left alone', () => {
    const sim = new ShowerSim(SHOWER, { kind: 'manual' }, 0);
    sim.u = knobFor(38);
    sim.advance(20);
    expect(sim.temp).toBeCloseTo(38, 3);
  });

  it('nothing changes at the head until the delay has passed', () => {
    const sim = new ShowerSim(SHOWER, { kind: 'manual' }, 0);
    sim.u = 1;
    sim.advance(2.49);
    expect(sim.temp).toBeCloseTo(15, 6);
    sim.advance(1.01);
    expect(sim.temp).toBeCloseTo(15 + 45 * (1 - Math.exp(-1)), 1);
  });
});
