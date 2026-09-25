import { RK4 } from './integrator';
import { gaussian, mulberry32 } from './random';

/**
 * One-dimensional (vertical) drone. Honest simplifications, stated in the course:
 * linear drag, no attitude dynamics, instantaneous motors unless `motorTau > 0`,
 * and (until Chapter 8) motors with no thrust limits.
 */
export interface DroneParams {
  /** mass without package, kg */
  m: number;
  /** gravity, m/s² */
  g: number;
  /** linear vertical drag / rotor inflow damping, N·s/m */
  c: number;
  /** thrust limits in N, applied only when `saturate` is true */
  tMin: number;
  tMax: number;
  saturate: boolean;
  /** first-order motor lag, s (0 = instantaneous) */
  motorTau: number;
}

export const DRONE: DroneParams = {
  m: 0.5,
  g: 9.81,
  c: 1.0,
  tMin: 0,
  tMax: 20,
  saturate: false,
  motorTau: 0,
};

export const HOVER_THRUST = DRONE.m * DRONE.g;

export interface PID {
  kp: number;
  ki: number;
  kd: number;
  /** constant feedforward thrust, N (e.g. hover thrust) */
  ff: number;
  /** derivative filter time constant, s (0 = ideal derivative using true speed) */
  dTau: number;
  /** take the derivative of the measurement instead of the error (no kick) */
  dOnMeasurement: boolean;
  /** stop integrating while the output is saturated */
  antiWindup: boolean;
}

export const P_ONLY = (kp: number): PID => ({
  kp,
  ki: 0,
  kd: 0,
  ff: 0,
  dTau: 0,
  dOnMeasurement: true,
  antiWindup: false,
});

export interface DroneConfig {
  params: DroneParams;
  mode: 'open' | 'closed';
  /** open-loop thrust schedule, N */
  openThrust: (t: number) => number;
  pid: PID;
  setpoint: (t: number) => number;
  /** external vertical force (wind), N, positive = up */
  wind: (t: number) => number;
  /** extra mass (package), kg; may be negative after a drop */
  extraMass: (t: number) => number;
  /** sensor noise standard deviation, m */
  noiseStd: number;
  h0: number;
  v0: number;
  seed: number;
}

export const defaultDroneConfig = (over: Partial<DroneConfig> = {}): DroneConfig => ({
  params: DRONE,
  mode: 'closed',
  openThrust: () => HOVER_THRUST,
  pid: P_ONLY(20),
  setpoint: () => 2,
  wind: () => 0,
  extraMass: () => 0,
  noiseStd: 0,
  h0: 0,
  v0: 0,
  seed: 1,
  ...over,
});

/** state indices */
const H = 0;
const V = 1;
const I = 2; // integral of error
const F = 3; // derivative-filter state
const TM = 4; // motor thrust

export class DroneSim {
  readonly dt = 0.001;
  t = 0;
  x = new Float64Array(5);
  /** values from the most recent derivative evaluation at the start of a step */
  thrust = 0;
  command = 0;
  error = 0;
  measured = 0;
  crashed = false;
  landed = true;
  private noise = 0;
  private rand: () => number;
  private rk: RK4;
  private stepIndex = 0;

  constructor(public cfg: DroneConfig) {
    this.rand = mulberry32(cfg.seed);
    this.rk = new RK4(5, (t, x, dx) => this.deriv(t, x, dx));
    this.reset();
  }

  reset(): void {
    const { cfg } = this;
    this.t = 0;
    this.stepIndex = 0;
    this.crashed = false;
    this.rand = mulberry32(cfg.seed);
    this.x.fill(0);
    this.x[H] = cfg.h0;
    this.x[V] = cfg.v0;
    this.x[F] = cfg.pid.dOnMeasurement ? cfg.h0 : cfg.setpoint(0) - cfg.h0;
    const w0 = cfg.params.m * cfg.params.g;
    this.x[TM] = cfg.mode === 'open' ? cfg.openThrust(0) : Math.max(0, Math.min(w0, cfg.pid.ff));
    this.landed = cfg.h0 <= 0;
    this.sampleOutputs();
  }

  get h(): number {
    return this.x[H];
  }
  get v(): number {
    return this.x[V];
  }
  get integral(): number {
    return this.x[I];
  }

  /** Controller output (before motor lag) for a given state. */
  private controller(t: number, x: Float64Array): { cmd: number; e: number; hm: number; sat: -1 | 0 | 1 } {
    const { cfg } = this;
    const p = cfg.params;
    if (cfg.mode === 'open') {
      return { cmd: cfg.openThrust(t), e: cfg.setpoint(t) - x[H], hm: x[H], sat: 0 };
    }
    const pid = cfg.pid;
    const hm = x[H] + this.noise;
    const r = cfg.setpoint(t);
    const e = r - hm;
    let d: number;
    if (pid.dTau > 0) {
      // derivative of a first-order-filtered signal: (u - u_f) / tau
      d = pid.dOnMeasurement ? -(hm - x[F]) / pid.dTau : (e - x[F]) / pid.dTau;
    } else {
      // ideal derivative from the true vertical speed (setpoint changes produce no kick)
      d = -x[V];
    }
    let cmd = pid.ff + pid.kp * e + pid.ki * x[I] + pid.kd * d;
    let sat: -1 | 0 | 1 = 0;
    if (p.saturate) {
      if (cmd > p.tMax) {
        cmd = p.tMax;
        sat = 1;
      } else if (cmd < p.tMin) {
        cmd = p.tMin;
        sat = -1;
      }
    }
    return { cmd, e, hm, sat };
  }

  private deriv(t: number, x: Float64Array, dx: Float64Array): void {
    const { cfg } = this;
    const p = cfg.params;
    const { cmd, e, hm, sat } = this.controller(t, x);
    const thrust = p.motorTau > 0 ? x[TM] : cmd;
    const m = p.m + cfg.extraMass(t);
    let a = (thrust - m * p.g - p.c * x[V] + cfg.wind(t)) / m;
    let hDot = x[V];
    if (x[H] <= 0 && x[V] <= 0 && a <= 0) {
      // resting on the ground: the ground pushes back
      a = 0;
      hDot = 0;
    }
    dx[H] = hDot;
    dx[V] = a;
    // conditional integration as anti-windup: freeze while saturated and pushing further
    const freeze = cfg.pid.antiWindup && ((sat === 1 && e > 0) || (sat === -1 && e < 0));
    dx[I] = freeze ? 0 : e;
    const tau = cfg.pid.dTau > 0 ? cfg.pid.dTau : 1;
    dx[F] = cfg.pid.dOnMeasurement ? (hm - x[F]) / tau : (e - x[F]) / tau;
    dx[TM] = p.motorTau > 0 ? (cmd - x[TM]) / p.motorTau : 0;
  }

  private sampleOutputs(): void {
    const { cmd, hm } = this.controller(this.t, this.x);
    const p = this.cfg.params;
    this.command = cmd;
    this.thrust = p.motorTau > 0 ? this.x[TM] : cmd;
    this.error = this.cfg.setpoint(this.t) - this.x[H];
    this.measured = hm;
  }

  step(): void {
    const { cfg } = this;
    // sensor noise is held constant over each 1 ms step (zero-order hold)
    this.noise = cfg.noiseStd > 0 ? cfg.noiseStd * gaussian(this.rand) : 0;
    this.rk.step(this.t, this.x, this.dt);
    this.stepIndex++;
    this.t = this.stepIndex * this.dt;
    if (this.x[H] < 0) {
      if (this.x[V] < -1.5) this.crashed = true;
      this.x[H] = 0;
      this.x[V] = 0;
    }
    this.landed = this.x[H] <= 1e-6;
    this.sampleOutputs();
  }

  /** Advances by `seconds`, invoking `onSample` after every `every` steps. */
  advance(seconds: number, onSample?: () => void, every = 10): void {
    const n = Math.round(seconds / this.dt);
    for (let i = 0; i < n; i++) {
      this.step();
      if (onSample && this.stepIndex % every === 0) onSample();
    }
  }
}
