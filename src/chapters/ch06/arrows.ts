import { type C, abs, arg, c, div } from '../../math/complex';

/** An arrow's length and angle (degrees, anticlockwise from the positive real axis). Pure maths for 6e. */
export const lengthOf = (z: C): number => abs(z);
export const angleOf = (z: C): number => (arg(z) * 180) / Math.PI;
/** Dividing 1 by an arrow: its length is 1 ÷ the length, its angle is minus the angle. */
export const inverse = (z: C): C => div(c(1), z);
/** The shower's smoother from Chapter 3 for a wiggle at ωτ: 1 / (1 + iωτ). */
export const smoother = (wt: number): C => inverse(c(1, wt));
