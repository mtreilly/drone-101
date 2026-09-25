import { DRONE, HOVER_THRUST, type PID } from '../../sim/drone-model';

/** Chapter 1's feedback law: hover thrust plus 8 N for every metre too low. */
export const CH1_GAIN = 8;
export const CH1_PID: PID = { kp: CH1_GAIN, ki: 0, kd: 0, ff: HOVER_THRUST, dTau: 0, dOnMeasurement: true, antiWindup: false };
export const PACKAGE_KG = 0.2;
/** A downward gust: 1 N for 1 s. */
export const GUST_N = -1;
export const GUST_S = 1;

/** Theo's formula: final height = (T − mg)/c × t, so t = 2 m · c / (T − mg). */
export const theoTime = (thrust: number, target = 2): number => (target * DRONE.c) / (thrust - HOVER_THRUST);

