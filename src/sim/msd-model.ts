import { RK4 } from './integrator';

/** Mass–spring–damper: m·x'' + c·x' + k·x = F(t). State [x, v]. */
export class MassSpringDamper {
  readonly dt = 0.001;
  t = 0;
  x = new Float64Array(2);
  private rk: RK4;
  private stepIndex = 0;

  constructor(
    public m: number,
    public c: number,
    public k: number,
    public force: (t: number) => number = () => 0,
    public x0 = 0,
    public v0 = 0,
  ) {
    this.rk = new RK4(2, (t, s, ds) => {
      ds[0] = s[1];
      ds[1] = (this.force(t) - this.c * s[1] - this.k * s[0]) / this.m;
    });
    this.reset();
  }

  reset(): void {
    this.t = 0;
    this.stepIndex = 0;
    this.x[0] = this.x0;
    this.x[1] = this.v0;
  }

  get pos(): number {
    return this.x[0];
  }

  step(): void {
    this.rk.step(this.t, this.x, this.dt);
    this.stepIndex++;
    this.t = this.stepIndex * this.dt;
  }

  advance(seconds: number, onSample?: () => void, every = 10): void {
    const n = Math.round(seconds / this.dt);
    for (let i = 0; i < n; i++) {
      this.step();
      if (onSample && this.stepIndex % every === 0) onSample();
    }
  }
}
