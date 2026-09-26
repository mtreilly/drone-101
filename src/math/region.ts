/** A point in the plane of the two knobs being judged (e.g. σ and ω of a pole, or Kp and Kd). */
export type Pt = [number, number];

export interface RegionGrid {
  /** [min, max] of the horizontal coordinate */
  x: [number, number];
  /** [min, max] of the vertical coordinate */
  y: [number, number];
  /** grid spacing (both directions), e.g. 0.05 */
  step: number;
  /** bisection steps that move each boundary point onto the true edge between two grid points (default 8) */
  refine?: number;
}

/**
 * The region where a yes/no judgement `inside(x, y)` holds (a challenge zone judged by the real
 * `stepMetrics`, not a rule of thumb), as closed polygons in the same coordinates. Marching squares
 * on the grid, then every boundary point is bisected onto the true edge of the region along its grid
 * edge, so each grid point is on the same side of the drawn outline as the judgement puts it. The
 * region is clipped to the grid rectangle. Rings run counter-clockwise (y up) around what is inside;
 * holes and separate islands are separate rings, so draw them with `fill-rule: evenodd`
 * (`regionPath`). Saddle cells (two opposite corners inside) keep the corners apart.
 */
export function regionFromMetric(inside: (x: number, y: number) => boolean, grid: RegionGrid): Pt[][] {
  const [x0, x1] = grid.x;
  const [y0, y1] = grid.y;
  const nx = Math.round((x1 - x0) / grid.step);
  const ny = Math.round((y1 - y0) / grid.step);
  const dx = (x1 - x0) / nx;
  const dy = (y1 - y0) / ny;
  const refine = grid.refine ?? 8;
  const X = (i: number) => (i === nx ? x1 : x0 + i * dx);
  const Y = (j: number) => (j === ny ? y1 : y0 + j * dy);
  const vals: boolean[][] = [];
  for (let j = 0; j <= ny; j++) {
    const row: boolean[] = [];
    for (let i = 0; i <= nx; i++) row.push(inside(X(i), Y(j)));
    vals.push(row);
  }
  // outside the grid counts as outside, so every outline closes (along the grid's border)
  const at = (i: number, j: number) => i >= 0 && j >= 0 && i <= nx && j <= ny && vals[j][i];
  const points = new Map<string, Pt>();
  /** the boundary point on the grid edge from corner (i, j) to its neighbour (i2, j2) */
  const cross = (i: number, j: number, i2: number, j2: number): string => {
    const key = `${Math.min(i, i2)},${Math.min(j, j2)},${i === i2 ? 'v' : 'h'}`;
    if (points.has(key)) return key;
    const pIn = at(i, j);
    const [ii, ij, oi, oj] = pIn ? [i, j, i2, j2] : [i2, j2, i, j];
    const offGrid = oi < 0 || oj < 0 || oi > nx || oj > ny;
    let a: Pt = [X(ii), Y(ij)];
    if (!offGrid) {
      let b: Pt = [X(oi), Y(oj)];
      for (let k = 0; k < refine; k++) {
        const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        if (inside(m[0], m[1])) a = m;
        else b = m;
      }
      a = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    }
    points.set(key, a);
    return key;
  };
  const next = new Map<string, string>();
  for (let j = -1; j <= ny; j++) {
    for (let i = -1; i <= nx; i++) {
      const code = (at(i, j) ? 1 : 0) | (at(i + 1, j) ? 2 : 0) | (at(i + 1, j + 1) ? 4 : 0) | (at(i, j + 1) ? 8 : 0);
      if (code === 0 || code === 15) continue;
      const B = () => cross(i, j, i + 1, j);
      const R = () => cross(i + 1, j, i + 1, j + 1);
      const T = () => cross(i, j + 1, i + 1, j + 1);
      const L = () => cross(i, j, i, j + 1);
      // directed segments with the inside on the left (y up)
      const segs: [() => string, () => string][] = (
        {
          1: [[B, L]],
          2: [[R, B]],
          3: [[R, L]],
          4: [[T, R]],
          5: [[B, L], [T, R]],
          6: [[T, B]],
          7: [[T, L]],
          8: [[L, T]],
          9: [[B, T]],
          10: [[R, B], [L, T]],
          11: [[R, T]],
          12: [[L, R]],
          13: [[B, R]],
          14: [[L, B]],
        } as Record<number, [() => string, () => string][]>
      )[code];
      for (const [from, to] of segs) next.set(from(), to());
    }
  }
  const rings: Pt[][] = [];
  const seen = new Set<string>();
  for (const start of next.keys()) {
    if (seen.has(start)) continue;
    const ring: Pt[] = [];
    let k: string | undefined = start;
    while (k !== undefined && !seen.has(k)) {
      seen.add(k);
      ring.push(points.get(k)!);
      k = next.get(k);
    }
    if (ring.length >= 3) rings.push(ring);
  }
  return rings;
}

/** Even-odd point-in-region test for the rings of `regionFromMetric`. */
export function inRegion(rings: readonly (readonly Pt[])[], x: number, y: number): boolean {
  let odd = false;
  for (const ring of rings) {
    for (let a = 0, b = ring.length - 1; a < ring.length; b = a++) {
      const [xa, ya] = ring[a];
      const [xb, yb] = ring[b];
      if (ya > y !== yb > y && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) odd = !odd;
    }
  }
  return odd;
}

/** SVG path data for the rings, mapped to pixels by `sx`/`sy` (draw with `fill-rule="evenodd"`). */
export const regionPath = (rings: readonly (readonly Pt[])[], sx: (x: number) => number, sy: (y: number) => number): string =>
  rings.map((r) => `M${r.map(([x, y]) => `${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('L')}Z`).join('');
