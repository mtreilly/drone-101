export interface C {
  re: number;
  im: number;
}

export const c = (re: number, im = 0): C => ({ re, im });
export const add = (a: C, b: C): C => ({ re: a.re + b.re, im: a.im + b.im });
export const sub = (a: C, b: C): C => ({ re: a.re - b.re, im: a.im - b.im });
export const mul = (a: C, b: C): C => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});
export const div = (a: C, b: C): C => {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
export const abs = (a: C): number => Math.hypot(a.re, a.im);
export const arg = (a: C): number => Math.atan2(a.im, a.re);
export const expC = (a: C): C => {
  const r = Math.exp(a.re);
  return { re: r * Math.cos(a.im), im: r * Math.sin(a.im) };
};
export const scale = (a: C, k: number): C => ({ re: a.re * k, im: a.im * k });

/** Evaluates a real-coefficient polynomial (highest power first) at complex s. */
export function polyval(coeffs: readonly number[], s: C): C {
  let acc = c(0);
  for (const k of coeffs) acc = add(mul(acc, s), c(k));
  return acc;
}
