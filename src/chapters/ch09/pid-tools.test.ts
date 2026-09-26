import { DRONE, DroneSim, defaultDroneConfig } from '../../sim/drone-model';
import { runUnderCeiling } from './page-ceiling';
import { LIMITED, emptyTrace, hoverStep, pid, runDrone, takeoff } from './pid-tools';

const clip = (x: number) => Math.min(LIMITED.tMax, Math.max(LIMITED.tMin, x));
const MG = DRONE.m * DRONE.g;

describe('traces record what was asked for and what the motors were told', () => {
  it('every array has one entry per sample', () => {
    const tr = runDrone(takeoff(pid(20, 10, 4)), 3);
    const n = tr.t.length;
    expect(n).toBe(301);
    for (const k of ['h', 'thrust', 'command', 'request', 'integral', 'r', 'wind', 'pkg', 'measured'] as const) expect(tr[k]).toHaveLength(n);
    expect(Object.keys(emptyTrace()).sort()).toEqual(Object.keys(tr).sort());
  });

  it('take-off: Kp·2 m asks for 40 N, the command is clipped to 20 N, and without limits nothing is clipped', () => {
    const tr = runDrone(takeoff(pid(20, 10, 4)), 3);
    // at t = 0: Kp·e = 20·2 = 40 N (no integral yet, the ideal D sees no speed)
    expect(tr.request[0]).toBeCloseTo(40, 9);
    expect(tr.command[0]).toBe(20);
    // the request leaves [0, 20]; the command stays inside, only because it is the clipped request
    expect(Math.max(...tr.request)).toBeGreaterThan(20);
    expect(tr.command.every((c) => c >= 0 && c <= 20)).toBe(true);
    tr.request.forEach((r, i) => expect(tr.command[i]).toBe(clip(r)));
    // no motor lag here: the delivered thrust is the command
    expect(tr.thrust).toEqual(tr.command);
    const free = runDrone(defaultDroneConfig({ pid: pid(20, 10, 4) }), 3);
    expect(free.command).toEqual(free.request);
    expect(Math.max(...free.command)).toBeGreaterThan(20);
  });

  it('Chapter 9 kick (1 → 2 m, D on the error, τf 0.01 s): D asks for about 413 N, the motors get 20 N', () => {
    const tr = hoverStep(pid(15, 8, 4, { dTau: 0.01, dOnMeasurement: false }), 1, 2, 5);
    const peak = Math.max(...tr.request);
    // Kd·Δr/τf = 400 N, plus Kp·Δr and the hover thrust the pile holds
    expect(peak).toBeGreaterThan(400);
    expect(peak).toBeLessThan(420);
    expect(Math.max(...tr.command)).toBe(20);
    // from the measurement there is no kick: P alone asks Kp·Δr + mg = 19.9 N
    const me = hoverStep(pid(15, 8, 4, { dTau: 0.01, dOnMeasurement: true }), 1, 2, 5);
    expect(Math.max(...me.request)).toBeCloseTo(15 + MG, 1);
  });

  it('hover start is in equilibrium from the very first sample (hover thrust, not a stale 0 N)', () => {
    for (const p of [pid(15, 8, 4, { dTau: 0.01 }), pid(20, 0, 4)]) {
      const tr = hoverStep(p, 1, 2, 2);
      expect(tr.thrust[0]).toBeCloseTo(MG, 6);
      expect(tr.request[0]).toBeCloseTo(MG, 6);
      expect(tr.thrust[1]).toBeCloseTo(MG, 6);
    }
  });

  it('with motor lag the thrust follows the clipped command, never the raw request', () => {
    const cfg = defaultDroneConfig({ params: { ...LIMITED, motorTau: 0.05 }, pid: pid(30, 15, 10, { dTau: 0.005 }), noiseStd: 0.02, seed: 7 });
    const tr = runDrone(cfg, 6);
    expect(tr.command.every((c) => c >= 0 && c <= 20)).toBe(true);
    expect(tr.thrust.every((c) => c >= 0 && c <= 20)).toBe(true);
    // the noisy D term asks for far more (and less) than the motors can give
    expect(Math.min(...tr.request)).toBeLessThan(-20);
    expect(Math.max(...tr.request)).toBeGreaterThan(40);
  });

  it('the sim exposes the same pair live', () => {
    const sim = new DroneSim(takeoff(pid(20, 10, 4)));
    expect(sim.request).toBeCloseTo(40, 9);
    expect(sim.command).toBe(20);
  });

  it('the page-ceiling runner records them too', () => {
    const cfg = takeoff(pid(30, 60, 2, { antiWindup: false }));
    const tr = runUnderCeiling(cfg, 3, 3.9);
    const plain = runDrone(cfg, 3);
    expect(tr.command).toHaveLength(tr.t.length);
    expect(tr.request.slice(0, 50)).toEqual(plain.request.slice(0, 50));
  });
});
