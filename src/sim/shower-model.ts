import { DelayLine } from './delay-line';

/**
 * The shower: the knob sets the mixing-valve temperature instantly, the water then
 * travels down the pipe (pure delay L) and mixes/warms the pipe and head (first-order lag τ).
 *   T_mix = cold + (hot − cold)·u,     τ·dT/dt = T_mix(t − L) − T
 * Simplifications (stated in the course): constant flow, perfect mixing, no heat loss.
 */
export interface ShowerParams {
  cold: number;
  hot: number;
  /** transport delay, s */
  delay: number;
  /** thermal lag time constant, s */
  tau: number;
  target: number;
  /** half-width of the comfort band, °C */
  band: number;
}

export const SHOWER: ShowerParams = {
  cold: 15,
  hot: 60,
  delay: 2.5,
  tau: 1,
  target: 38,
  band: 1,
};

/** Knob position that gives exactly the target temperature in steady state. */
export const knobFor = (temp: number, p: ShowerParams = SHOWER): number =>
  (temp - p.cold) / (p.hot - p.cold);

/** How the knob is being moved. `rate` policies add to the knob; `position` policies set it. */
export type ShowerPolicy =
  | { kind: 'manual' }
  | { kind: 'rate'; rate: (t: number, felt: number, u: number) => number }
  | { kind: 'position'; position: (t: number, felt: number, integ: number) => number };

export class ShowerSim {
  readonly dt = 0.005;
  t = 0;
  /** temperature at the shower head, °C */
  temp: number;
  /** knob position 0..1 */
  u = 0;
  /** integral of error, °C·s (for PI controllers) */
  integral = 0;
  private line: DelayLine;
  private stepIndex = 0;

  constructor(
    public p: ShowerParams = SHOWER,
    public policy: ShowerPolicy = { kind: 'manual' },
    public u0 = 0,
  ) {
    this.line = new DelayLine(p.delay, this.dt, u0);
    this.temp = this.mix(u0);
    this.u = u0;
  }

  mix(u: number): number {
    return this.p.cold + (this.p.hot - this.p.cold) * u;
  }

  reset(u0 = this.u0): void {
    this.u0 = u0;
    this.t = 0;
    this.stepIndex = 0;
    this.u = u0;
    this.integral = 0;
    this.line = new DelayLine(this.p.delay, this.dt, u0);
    this.temp = this.mix(u0);
  }

  /** Water mix currently arriving at the head (the delayed knob). */
  get arriving(): number {
    return this.mix(this.line.peek());
  }

  step(): void {
    const { policy, dt, p } = this;
    const err = p.target - this.temp;
    if (policy.kind === 'rate') {
      this.u += dt * policy.rate(this.t, this.temp, this.u);
    } else if (policy.kind === 'position') {
      this.integral += dt * err;
      this.u = policy.position(this.t, this.temp, this.integral);
    }
    this.u = Math.min(1, Math.max(0, this.u));
    const delayed = this.line.push(this.u);
    // exact update of the first-order lag for an input held over the step
    const a = Math.exp(-dt / p.tau);
    this.temp = this.mix(delayed) + (this.temp - this.mix(delayed)) * a;
    this.stepIndex++;
    this.t = this.stepIndex * dt;
  }

  advance(seconds: number, onSample?: () => void, every = 4): void {
    const n = Math.round(seconds / this.dt);
    for (let i = 0; i < n; i++) {
      this.step();
      if (onSample && this.stepIndex % every === 0) onSample();
    }
  }
}
