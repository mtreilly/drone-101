import { pid, runDrone } from '../ch09/pid-tools';
import { MISSION, evaluate, missionConfig, runMission } from './mission';
import { flyMission, pageCeiling } from './page-hit';

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

  it('the sensor noise alone can lift a weak-Kp, huge-Kd tune into the page (5, 0, 12, τf 0.005): 5.97 m, noise-free below 2 m', () => {
    const p = pid(5, 0, 12, { dTau: 0.005 });
    expect(peak(runMission(p).h)).toBeCloseTo(5.97, 1);
    expect(peak(runMission(p).h)).toBeGreaterThan(DESK);
    expect(peak(runDrone({ ...missionConfig(p), noiseStd: 0 }, MISSION.duration).h)).toBeLessThan(2);
    expect(flyMission(p, DESK).sim.stalled).toBe(true);
  });
});

describe('the page ceiling is re-measured when the layout settles, scroll included (rule 6)', () => {
  // a minimal page: window events, a ResizeObserver and fonts, all driven by hand
  let listeners: Map<string, Set<() => void>>;
  let observers: (() => void)[];
  beforeEach(() => {
    vi.useFakeTimers();
    listeners = new Map();
    observers = [];
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('addEventListener', (type: string, fn: () => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    });
    vi.stubGlobal('removeEventListener', (type: string, fn: () => void) => listeners.get(type)?.delete(fn));
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private fn: () => void) {}
        observe() {
          observers.push(this.fn);
        }
        disconnect() {
          observers = observers.filter((f) => f !== this.fn);
        }
      },
    );
    vi.stubGlobal('document', { documentElement: {}, fonts: undefined });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  const fire = (type: string) => listeners.get(type)?.forEach((fn) => fn());

  it('a scroll that moves the ceiling calls onChange once (debounced) with the old height; one that does not, never', () => {
    const view = { h: 4.9 as number | null, ceilingHeight: () => view.h };
    const onChange = vi.fn();
    const ceil = pageCeiling(view, onChange, 200);
    expect(ceil.measure()).toBe(4.9);
    // scrolling with nothing overhead changing: an unchanged replay keeps going
    fire('scroll');
    vi.advanceTimersByTime(250);
    expect(onChange).not.toHaveBeenCalled();
    // the sticky top bar slides over the content: many scroll events, one re-measure after they stop
    view.h = 4.2;
    for (let i = 0; i < 10; i++) {
      fire('scroll');
      vi.advanceTimersByTime(50);
    }
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(4.9);
    expect(ceil.h).toBe(4.2);
    // sub-centimetre jitter is the same ceiling
    view.h = 4.205;
    fire('scroll');
    vi.advanceTimersByTime(250);
    expect(onChange).toHaveBeenCalledTimes(1);
    // resize and layout changes still count, and so does reduced motion switching it off (null)
    view.h = null;
    observers.forEach((fn) => fn());
    vi.advanceTimersByTime(250);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(4.2);
    expect(ceil.h).toBeNull();
    // gone: nothing listens any more
    ceil.destroy();
    expect(listeners.get('scroll')!.size).toBe(0);
    expect(listeners.get('resize')!.size).toBe(0);
    expect(observers).toHaveLength(0);
    view.h = 5;
    fire('scroll');
    vi.advanceTimersByTime(250);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('destroy mid-wait cancels the pending re-measure', () => {
    const view = { h: 4.9, ceilingHeight: () => view.h };
    const onChange = vi.fn();
    const ceil = pageCeiling(view, onChange, 200);
    ceil.measure();
    view.h = 3;
    fire('scroll');
    ceil.destroy();
    vi.advanceTimersByTime(500);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('a crash ends the flight: the drone stays down', () => {
  // weak P, some I: it swings up to 4.05 m (under the page on any screen), slams into the ground at 3.86 s,
  // and the sim alone would fly it back up to 4.57 m on running motors
  const p = pid(2, 4, 0, { dTau: 0.04 });
  it.each([null, DESK])('ceiling %s: after the crash it stays on the ground with the motors off', (h) => {
    const { tr, sim } = flyMission(p, h);
    expect(sim.crashed).toBe(true);
    expect(sim.ceilingAt).toBeNull();
    expect(tr.stalledAt ?? null).toBeNull();
    const i0 = tr.h.findIndex((y, i) => tr.t[i] > 1 && y <= 1e-6);
    expect(tr.t[i0]).toBeCloseTo(3.86, 1);
    expect(Math.max(...tr.h.slice(0, i0))).toBeCloseTo(4.05, 1);
    expect(Math.max(...tr.h.slice(i0))).toBe(0);
    expect(Math.max(...tr.thrust.slice(i0 + 1))).toBe(0);
    const r = evaluate(tr);
    expect(r.pass.ground).toBe(false);
    expect(r.stars).toBe(0);
  });
  it('a tune that never crashes flies exactly as before', () => {
    const good = pid(20, 15, 5, { dTau: 0.04 });
    expect(flyMission(good, null).tr.h).toEqual(runMission(good).h);
  });
});
