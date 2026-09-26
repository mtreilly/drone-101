import { DRONE, DroneSim, HOVER_THRUST as MG, defaultDroneConfig } from '../../sim/drone-model';
import { LIMITED, hoverStep, pid, pidPoles, runDrone, takeoff } from './pid-tools';
import { plays } from './plays';
import { jitterOf, noiseRun } from './scenarios';

const t = (k: string) => k;
const out = (id: string, name: string, v: Record<string, number>) => plays[id].outputs[name](v, t, t);

/** Hover at the P droop with an empty pile; time for Ki·∫e to reach `frac` of mg. */
function climb(ki: number, frac: number, kp = 20, kd = 0): number {
  const sim = new DroneSim(defaultDroneConfig({ params: LIMITED, pid: pid(kp, ki, kd), setpoint: () => 2, h0: 2 - MG / kp }));
  let at = NaN;
  sim.advance(60, () => {
    if (Number.isNaN(at) && ki * sim.integral >= frac * MG) at = sim.t;
  }, 10);
  return at;
}

describe('Chapter 9 plays', () => {
  it('pile: Ki = 10 adds 2.45 N/s from the 24.5 cm droop; τ = Kp/Ki = 2.0 s; 98 % after about 8.0 s', () => {
    expect(MG / 20).toBeCloseTo(0.245, 3);
    expect(out('pile', 'rate', { ki: 10 })).toBe('2.45');
    expect(out('pile', 'tau', { ki: 10 })).toBe('2.0');
    expect(out('pile', 'ts', { ki: 10 })).toBe('8.0');
    // the simulated climb: 63 % at 1.96 s, 98 % at 7.67 s
    expect(climb(10, 0.632)).toBeCloseTo(1.96, 1);
    expect(climb(10, 0.98)).toBeGreaterThan(7.4);
    expect(climb(10, 0.98)).toBeLessThan(8.0);
  }, 20000);
  it('pile: across its range (Ki 2–12) the τ ≈ Kp/Ki estimate stays within 15 % of the sim', () => {
    for (const ki of [2, 4, 6, 8, 10, 12]) {
      expect(Math.abs(climb(ki, 0.632) / (20 / ki) - 1)).toBeLessThan(0.15);
      expect(Math.abs(climb(ki, 0.98) / (80 / ki) - 1)).toBeLessThan(0.15);
    }
    // and why it is capped: at Ki = 20 (Kd 4) the 63 % point is 0.77 s, not 1 s
    expect(climb(20, 0.632, 20, 4)).toBeCloseTo(0.77, 1);
    // the slow pole sits near −Ki/Kp = −0.5
    expect(Math.max(...pidPoles(20, 10, 0).map((p) => p.re))).toBeCloseTo(-0.51, 2);
    expect(Math.max(...pidPoles(20, 10, 4).map((p) => p.re))).toBeCloseTo(-0.58, 2);
  }, 30000);
  it('area: at rest the pile alone holds mg, so the net area is mg/Ki = 0.49 m·s', () => {
    expect(out('area', 'area', { ki: 10 })).toBe('0.49');
    const tr = runDrone(takeoff(pid(20, 10, 0)), 12);
    expect(tr.integral.at(-1)!).toBeCloseTo(0.489, 2);
    expect(10 * tr.integral.at(-1)!).toBeCloseTo(4.89, 1);
    expect(10 * runDrone(takeoff(pid(20, 10, 0)), 30).integral.at(-1)!).toBeCloseTo(MG, 3);
  });
  it('zeta: Kd 0/2/3/4/5 → ζ 0.16/0.47/0.63/0.79/0.95; critical at Kd = 5.32', () => {
    const want: [number, string][] = [[0, '0.16'], [2, '0.47'], [3, '0.63'], [4, '0.79'], [5, '0.95']];
    for (const [kd, z] of want) expect(out('zeta', 'zeta', { kd })).toBe(z);
    expect(out('zeta', 'damp', { kd: 4 })).toBe('5.0');
    expect(out('zeta', 'regime', { kd: 4 })).toBe('regime.under');
    expect(out('zeta', 'regime', { kd: 6 })).toBe('regime.over');
    expect(2 * Math.sqrt(DRONE.m * 20) - DRONE.c).toBeCloseTo(5.32, 2);
    // PD poles at Kd = 4: −5 ± 3.873i, ζ = 5/√40
    const p = pidPoles(20, 0, 4);
    expect(-p[0].re / Math.hypot(p[0].re, p[0].im)).toBeCloseTo(0.791, 3);
  });
  it('cliff: 40 N/(m·s), ω 6.32 rad/s, a swing every 0.99 s; Kd 4 → 200, Kd 0.5 → 60, (10, 1) → 40', () => {
    expect(out('cliff', 'lim', { kp: 20, kd: 0 })).toBe('40');
    expect(out('cliff', 'w', { kp: 20, kd: 0 })).toBe('6.32');
    expect(out('cliff', 'T', { kp: 20, kd: 0 })).toBe('0.99');
    expect(out('cliff', 'lim', { kp: 20, kd: 4 })).toBe('200');
    expect(out('cliff', 'lim', { kp: 20, kd: 0.5 })).toBe('60');
    expect(out('cliff', 'lim', { kp: 10, kd: 1 })).toBe('40');
    // on that edge the poles are ±4.472i and −4
    const edge = pidPoles(10, 40, 1);
    expect(Math.max(...edge.map((p) => p.im))).toBeCloseTo(4.472, 3);
    expect(Math.min(...edge.map((p) => p.re))).toBeCloseTo(-4, 6);
    // Mika's yo-yo at Ki = 50 swings once per ≈ 1.0 s
    const tr = runDrone(takeoff(pid(20, 50, 0)), 30);
    const ups = tr.t.filter((tt, i) => tt > 20 && tr.h[i - 1] < 2 && tr.h[i] >= 2);
    expect((ups.at(-1)! - ups[0]) / (ups.length - 1)).toBeCloseTo(1.0, 1);
  });
  it('kick: half a metre through 0.01 s looks like 50 m/s, so D asks for about 200 N (the sim asks for 209 N in all)', () => {
    expect(out('kick', 'slope', { dr: 0.5, tf: 0.01 })).toBe('50');
    expect(out('kick', 'spike', { dr: 0.5, tf: 0.01 })).toBe('200');
    expect(out('kick', 'spike', { dr: 1, tf: 0.01 })).toBe('400');
    expect(out('kick', 'spike', { dr: 1, tf: 0.02 })).toBe('200');
    const ask = (dr: number, tf: number) => Math.max(...hoverStep(pid(15, 8, 4, { dTau: tf, dOnMeasurement: false }), 1, 1 + dr, 5).request);
    expect(ask(0.5, 0.01)).toBeCloseTo(209, 0);
    expect(ask(1, 0.01)).toBeGreaterThan(400);
    expect(ask(1, 0.01)).toBeLessThan(420);
    expect(ask(1, 0.02)).toBeCloseTo(218, 0);
  });
  it('jitter: 2 cm per 1 ms reading looks like 20 m/s; Kd σ/τf = 0.8 / 4 / 16 N at τf 0.1 / 0.02 / 0.005; P adds 0.3 N', () => {
    expect(0.02 / 0.001).toBeCloseTo(20, 9);
    expect(out('jitter', 'd', { tf: 0.1 })).toBe('0.8');
    expect(out('jitter', 'd', { tf: 0.02 })).toBe('4.0');
    expect(out('jitter', 'd', { tf: 0.005 })).toBe('16.0');
    expect(15 * 0.02).toBeCloseTo(0.3, 9);
    // the widget (real motors): P + D ≈ 1.1 N at τf 0.1
    expect(jitterOf(noiseRun(4, 0.1))).toBeCloseTo(1.05, 1);
  });
});
