import { droneBoxes, estWidth, overlaps, pickSpot, targetSpots } from './drone-view';

// view geometry (drone-view.ts): ground line at 305, heights mapped from 295 (0 m) to 25 (hMax)
const y = (m: number, hMax = 3): number => 295 - (m / hMax) * 270;

describe('DroneView label placement', () => {
  const a = { x: 0, y: 0, w: 10, h: 10 };

  it('detects overlaps, with a margin', () => {
    expect(overlaps(a, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(overlaps(a, { x: 11, y: 0, w: 5, h: 5 })).toBe(false);
    expect(overlaps(a, { x: 11, y: 0, w: 5, h: 5 }, 2)).toBe(true);
  });

  it('keeps the current spot while it is free, so the label does not jump about', () => {
    const cands = [a, { x: 50, y: 0, w: 10, h: 10 }, { x: 100, y: 0, w: 10, h: 10 }];
    // the usual spot is only a little clear: stay on the alternative
    expect(pickSpot(cands, [{ x: 15, y: 0, w: 4, h: 4 }], 1)).toBe(1);
    // clear by a wide margin: back to the usual spot
    expect(pickSpot(cands, [{ x: 30, y: 0, w: 4, h: 4 }], 1)).toBe(0);
    // a last-resort spot is left as soon as a better one is free
    expect(pickSpot(cands, [{ x: 15, y: 0, w: 4, h: 4 }], 2, 2, 10, 2)).toBe(0);
    expect(pickSpot(cands, [{ x: 48, y: 0, w: 4, h: 4 }], 1)).toBe(0);
    // nowhere free: stay put
    expect(pickSpot(cands, [{ x: -5, y: -5, w: 130, h: 30 }], 1)).toBe(1);
    // skips missing candidates
    expect(pickSpot([null, a], [], 0)).toBe(1);
  });

  it('never leaves "target" under the drone when it hovers near the line (the Chapter 10 "targe…" bug)', () => {
    const r = 2;
    const fs = 16;
    for (const word of ['target', 'obiettivo', 'wysokość', '目標値']) {
      const w = estWidth(word, fs);
      let spot = 0;
      for (let h = r - 0.6; h <= r + 0.6; h += 0.01) {
        const gy = y(h) - 6;
        const cands = targetSpots(y(r), w, fs);
        const obstacles = droneBoxes(gy);
        spot = pickSpot(cands, obstacles, spot);
        expect(obstacles.some((o) => overlaps(cands[spot], o)), `${word} at h = ${h.toFixed(2)} m`).toBe(false);
      }
    }
  });
});
