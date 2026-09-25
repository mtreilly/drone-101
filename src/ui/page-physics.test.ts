import { ceilingHit, type Solid } from './page-physics';

describe('ceilingHit', () => {
  const para: Solid = { x: -50, y: 0, w: 200, h: 40 };

  it('finds the underside of a block a rising box runs into', () => {
    expect(ceilingHit({ x: 0, y: 30, w: 40, h: 20 }, 60, 30, [para])).toBe(para);
  });

  it('ignores blocks that are not overhead, or not reached yet', () => {
    expect(ceilingHit({ x: 300, y: 30, w: 40, h: 20 }, 60, 30, [para])).toBeNull();
    expect(ceilingHit({ x: 0, y: 50, w: 40, h: 20 }, 80, 50, [para])).toBeNull();
  });

  it('ignores blocks the box was already past', () => {
    expect(ceilingHit({ x: 0, y: 10, w: 40, h: 20 }, 20, 10, [para])).toBeNull();
  });

  it('picks the lowest ceiling when several are crossed in one step', () => {
    const low: Solid = { x: -50, y: 50, w: 200, h: 20 };
    expect(ceilingHit({ x: 0, y: 0, w: 40, h: 20 }, 100, 0, [para, low])).toBe(low);
  });
});
