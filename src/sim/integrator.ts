/** Right-hand side of a first-order ODE system: writes dx/dt into `dx`. */
export type Deriv = (t: number, x: Float64Array, dx: Float64Array) => void;

/** Fixed-step classic Runge–Kutta (RK4) integrator with preallocated scratch buffers. */
export class RK4 {
  private k1: Float64Array;
  private k2: Float64Array;
  private k3: Float64Array;
  private k4: Float64Array;
  private tmp: Float64Array;

  constructor(
    readonly dim: number,
    private f: Deriv,
  ) {
    this.k1 = new Float64Array(dim);
    this.k2 = new Float64Array(dim);
    this.k3 = new Float64Array(dim);
    this.k4 = new Float64Array(dim);
    this.tmp = new Float64Array(dim);
  }

  /** Advances `x` in place from t to t + h. */
  step(t: number, x: Float64Array, h: number): void {
    const { k1, k2, k3, k4, tmp, dim, f } = this;
    f(t, x, k1);
    for (let i = 0; i < dim; i++) tmp[i] = x[i] + 0.5 * h * k1[i];
    f(t + 0.5 * h, tmp, k2);
    for (let i = 0; i < dim; i++) tmp[i] = x[i] + 0.5 * h * k2[i];
    f(t + 0.5 * h, tmp, k3);
    for (let i = 0; i < dim; i++) tmp[i] = x[i] + h * k3[i];
    f(t + h, tmp, k4);
    for (let i = 0; i < dim; i++) {
      x[i] += (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    }
  }
}

/** Integrates from t0 to t1 with fixed step `h`, calling `sample` every `every` steps. */
export function simulate(
  dim: number,
  f: Deriv,
  x0: ArrayLike<number>,
  t1: number,
  h: number,
  sample: (t: number, x: Float64Array) => void,
  every = 1,
): Float64Array {
  const rk = new RK4(dim, f);
  const x = Float64Array.from(x0);
  const n = Math.round(t1 / h);
  sample(0, x);
  for (let i = 1; i <= n; i++) {
    rk.step((i - 1) * h, x, h);
    if (i % every === 0) sample(i * h, x);
  }
  return x;
}
