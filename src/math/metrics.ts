export interface StepMetrics {
  /** percent overshoot relative to the step size (0 if none) */
  overshoot: number;
  /** time of the peak, s */
  peakTime: number;
  /** time after which the output stays within `band` of the final value, s (NaN if never) */
  settlingTime: number;
  /** final value (mean of the last 5% of samples) */
  final: number;
  /** setpoint − final */
  steadyStateError: number;
}

/**
 * Step-response metrics from sampled data.
 * @param band fraction of the step size (default 2%)
 */
export function stepMetrics(
  t: ArrayLike<number>,
  y: ArrayLike<number>,
  y0: number,
  setpoint: number,
  band = 0.02,
): StepMetrics {
  const n = y.length;
  const tail = Math.max(1, Math.floor(n * 0.05));
  let final = 0;
  for (let i = n - tail; i < n; i++) final += y[i];
  final /= tail;
  const size = setpoint - y0;
  let peak = y[0];
  let peakTime = t[0];
  for (let i = 0; i < n; i++) {
    const beyond = size >= 0 ? y[i] > peak : y[i] < peak;
    if (beyond) {
      peak = y[i];
      peakTime = t[i];
    }
  }
  const overshoot = size === 0 ? 0 : Math.max(0, (100 * (peak - setpoint)) / size);
  const tol = Math.abs(size) * band;
  let settlingTime = NaN;
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(y[i] - setpoint) > tol) {
      settlingTime = i === n - 1 ? NaN : t[i + 1];
      break;
    }
    if (i === 0) settlingTime = t[0];
  }
  return { overshoot, peakTime, settlingTime, final, steadyStateError: setpoint - final };
}
