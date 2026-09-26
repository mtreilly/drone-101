import { SHOWER, knobFor, type ShowerPolicy } from '../../sim/shower-model';

/** Robot hands: turn the knob at a speed proportional to how wrong it feels. */
export const HAND_GAIN = 0.008;
export const policies: Record<'normal' | 'harder' | 'patient', ShowerPolicy> = {
  normal: { kind: 'rate', rate: (_t, felt) => HAND_GAIN * (SHOWER.target - felt) },
  harder: { kind: 'rate', rate: (_t, felt) => 2 * HAND_GAIN * (SHOWER.target - felt) },
  patient: { kind: 'position', position: () => knobFor(SHOWER.target) },
};
