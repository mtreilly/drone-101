import { describe, expect, it } from 'vitest';
import { SHOWER, ShowerSim, knobFor, type ShowerPolicy } from '../../sim/shower-model';
import { comfortTime, runShower } from '../ch10/shower-tools';
import { policies } from './hands';

const peakAbove = (policy: ShowerPolicy, T = 60): number => Math.max(...runShower(policy, T).T) - SHOWER.target;

describe('Chapter 0 numbers', () => {
  it('38 °C needs the knob at about 51 %', () => {
    expect(SHOWER.target).toBe(38);
    expect(Math.round(knobFor(38) * 100)).toBe(51);
  });

  it('a snap at t = 5 s reaches the head at 7.5 s, then warms over about a second', () => {
    expect(SHOWER.delay).toBe(2.5);
    const sim = new ShowerSim(SHOWER, { kind: 'manual' }, 0);
    sim.advance(5);
    sim.u = knobFor(38);
    sim.advance(2.49);
    expect(sim.temp).toBeCloseTo(SHOWER.cold, 6);
    sim.advance(0.01 + SHOWER.tau);
    // one time constant (1 s) covers ~63 % of the rise
    expect((sim.temp - SHOWER.cold) / (38 - SHOWER.cold)).toBeCloseTo(1 - Math.exp(-1), 1);
  });

  it('broad wiggles look about 3½ s late: delay + lag at low frequency', () => {
    // phase delay of e^{-Ls}/(1+τs) at ω is L + atan(ωτ)/ω, which tends to L + τ as ω → 0
    const lateBy = (w: number) => SHOWER.delay + Math.atan(w * SHOWER.tau) / w;
    expect(SHOWER.delay + SHOWER.tau).toBe(3.5);
    expect(lateBy(0.1)).toBeCloseTo(3.5, 2);
    // sharp turns do not match: at 2 rad/s it is well under 3½ s
    expect(lateBy(2)).toBeLessThan(3.1);
  });

  it('knob set right and left alone: settles at 38 °C without swinging', () => {
    const tr = runShower(policies.patient, 30);
    expect(tr.T.at(-1)!).toBeCloseTo(38, 2);
    expect(Math.max(...tr.T)).toBeLessThanOrEqual(38 + 1e-9);
  });

  it('the patient hand wins easily; the harder hand never settles and hits the knob ends', () => {
    const patient = comfortTime(runShower(policies.patient, 60));
    const normal = comfortTime(runShower(policies.normal, 60));
    expect(patient).toBeLessThan(10);
    expect(Number.isNaN(normal) || patient < normal / 2).toBe(true);

    const harder = runShower(policies.harder, 60);
    expect(Number.isNaN(comfortTime(harder))).toBe(true);
    expect(harder.u.some((u) => u === 0) && harder.u.some((u) => u === 1)).toBe(true);
  });

  it('reacting too hard grows the swings; the normal hand swings less', () => {
    expect(peakAbove(policies.harder)).toBeGreaterThan(peakAbove(policies.normal));
  });
});
