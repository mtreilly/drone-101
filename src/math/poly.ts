import { type C, add, c, div, mul, polyval, sub, abs } from './complex';

/**
 * Roots of a real polynomial (coefficients highest power first) using the
 * Durand–Kerner iteration. Returns roots sorted by imaginary part, with tiny
 * imaginary parts snapped to zero and conjugates made exactly symmetric.
 */
export function roots(coeffs: readonly number[]): C[] {
  let a = [...coeffs];
  while (a.length > 1 && Math.abs(a[0]) < 1e-14) a = a.slice(1);
  const n = a.length - 1;
  if (n < 1) return [];
  const lead = a[0];
  const p = a.map((k) => k / lead);
  if (n === 1) return [c(-p[1])];
  if (n === 2) return quadratic(p[1], p[2]);
  // initial guesses on a circle bounded by the Cauchy radius
  const radius = 1 + Math.max(...p.slice(1).map(Math.abs));
  let z: C[] = Array.from({ length: n }, (_, k) => {
    const th = (2 * Math.PI * k) / n + 0.4;
    return c(radius * Math.cos(th), radius * Math.sin(th));
  });
  for (let iter = 0; iter < 500; iter++) {
    let delta = 0;
    const next = z.map((zi, i) => {
      let den = c(1);
      for (let j = 0; j < n; j++) if (j !== i) den = mul(den, sub(zi, z[j]));
      const step = div(polyval(p, zi), den);
      delta = Math.max(delta, abs(step));
      return sub(zi, step);
    });
    z = next;
    if (delta < 1e-13) break;
  }
  return tidy(z);
}

function quadratic(b: number, cc: number): C[] {
  const disc = b * b - 4 * cc;
  if (disc >= 0) {
    const sq = Math.sqrt(disc);
    // numerically stable form
    const q = -0.5 * (b + Math.sign(b || 1) * sq);
    const r2 = q !== 0 ? cc / q : 0;
    return tidy([c(q), c(r2)]);
  }
  const re = -b / 2;
  const im = Math.sqrt(-disc) / 2;
  return [c(re, -im), c(re, im)];
}

function tidy(z: C[]): C[] {
  const out = z.map((r) => {
    const scaleMag = Math.max(1, abs(r));
    return Math.abs(r.im) < 1e-9 * scaleMag ? c(r.re) : r;
  });
  // enforce exact conjugate symmetry
  for (const r of out) {
    if (r.im > 0) {
      const partner = out.find((q) => q.im < 0 && Math.abs(q.re - r.re) < 1e-6 && Math.abs(q.im + r.im) < 1e-6);
      if (partner) {
        const re = (r.re + partner.re) / 2;
        const im = (r.im - partner.im) / 2;
        r.re = re;
        r.im = im;
        partner.re = re;
        partner.im = -im;
      }
    }
  }
  return out.sort((x, y) => x.im - y.im || x.re - y.re);
}

/** Multiplies polynomials (highest power first). */
export function polymul(a: readonly number[], b: readonly number[]): number[] {
  const out = new Array(a.length + b.length - 1).fill(0);
  a.forEach((x, i) => b.forEach((y, j) => (out[i + j] += x * y)));
  return out;
}

/** Builds a real monic polynomial from roots (conjugates must be included). */
export function fromRoots(rs: readonly C[]): number[] {
  let p: C[] = [c(1)];
  for (const r of rs) {
    const next: C[] = new Array(p.length + 1).fill(null).map(() => c(0));
    p.forEach((k, i) => {
      next[i] = add(next[i], k);
      next[i + 1] = sub(next[i + 1], mul(k, r));
    });
    p = next;
  }
  return p.map((k) => k.re);
}
