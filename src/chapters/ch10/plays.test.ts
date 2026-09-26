import { plays } from './plays';

const t = (k: string, vars?: Record<string, string | number>) => (vars ? `${k}(${Object.values(vars).join('|')})` : k);
const out = (id: string, name: string, v: Record<string, number>) => plays[id].outputs[name](v, t);

describe('Chapter 10 playable sentences', () => {
  it('P1 delaylag: 2.5 s on a 10 s wiggle is 0.25 of a wiggle, 90°, 1.57 rad; 30 s → 30°, 5 s → 180°, q1 2 s on 8 s → 90°', () => {
    const v = { L: 2.5, T: 10 };
    expect(plays.delaylag.inputs.L.value).toBe(2.5);
    expect(plays.delaylag.inputs.T.value).toBe(10);
    expect(out('delaylag', 'frac', v)).toBe('0.25');
    expect(out('delaylag', 'deg', v)).toBe('90');
    expect(out('delaylag', 'rad', v)).toBe('1.57');
    expect(out('delaylag', 'deg', { L: 2.5, T: 30 })).toBe('30');
    expect(out('delaylag', 'deg', { L: 2.5, T: 5 })).toBe('180');
    expect(out('delaylag', 'deg', { L: 2, T: 8 })).toBe('90');
  });

  it('P2 smoother: at ω = 1 it keeps 0.71 and lags 45°; at 10 it keeps 0.0995 (shown 0.10) and lags 84°', () => {
    expect(out('smoother', 'g', { w: 1 })).toBe('0.71');
    expect(out('smoother', 'lag', { w: 1 })).toBe('45');
    expect(out('smoother', 'g', { w: 10 })).toBe('0.10');
    expect(out('smoother', 'lag', { w: 10 })).toBe('84');
    expect(out('smoother', 'g', { w: 0.1 })).toBe('1.00');
  });

  it('P3 total: 0.5 rad/s → 72° + 27° = 98° (not yet); 0.95 → 136° + 44° = 180° (flip); 2 → past', () => {
    expect(out('total', 'pipe', { w: 0.5 })).toBe('72');
    expect(out('total', 'lag', { w: 0.5 })).toBe('27');
    expect(out('total', 'total', { w: 0.5 })).toBe('98');
    expect(out('total', 'verdict', { w: 0.5 })).toBe('before');
    expect(out('total', 'pipe', { w: 0.95 })).toBe('136');
    expect(out('total', 'lag', { w: 0.95 })).toBe('44');
    expect(out('total', 'total', { w: 0.95 })).toBe('180');
    expect(out('total', 'verdict', { w: 0.95 })).toBe('flip');
    expect(out('total', 'verdict', { w: 2 })).toBe('past');
  });

  it('P4 handloop: 0.30 → 17°, 43°, 150°, 1.15; 0.46 → 25°, 66°, 181°, 0.71; the total passes 180° between 0.45 and 0.46', () => {
    expect(out('handloop', 'lag', { w: 0.3 })).toBe('17');
    expect(out('handloop', 'pipe', { w: 0.3 })).toBe('43');
    expect(out('handloop', 'total', { w: 0.3 })).toBe('150');
    expect(out('handloop', 'g', { w: 0.3 })).toBe('1.15');
    expect(out('handloop', 'lag', { w: 0.46 })).toBe('25');
    expect(out('handloop', 'pipe', { w: 0.46 })).toBe('66');
    expect(out('handloop', 'total', { w: 0.46 })).toBe('181');
    expect(out('handloop', 'g', { w: 0.46 })).toBe('0.71');
    expect(out('handloop', 'total', { w: 0.45 })).toBe('179');
    // the fixed sentence after it: at the exact crossing, 0.457 rad/s, 0.72 and 1 ÷ 0.72 ≈ 1.4
    expect(out('handloop', 'g', { w: 0.4569 })).toBe('0.72');
    expect(out('handloop', 'total', { w: 0.4569 })).toBe('180');
  });

  it('P5 pgain: K 0.020 / 0.031 / 0.040 → 0.65 dies / 1.01 edge / 1.30 grows', () => {
    expect(out('pgain', 'g', { K: 0.02 })).toBe('0.65');
    expect(out('pgain', 'verdict', { K: 0.02 })).toBe('dies');
    expect(out('pgain', 'g', { K: 0.031 })).toBe('1.01');
    expect(out('pgain', 'verdict', { K: 0.031 })).toBe('edge');
    expect(out('pgain', 'g', { K: 0.04 })).toBe('1.30');
    expect(out('pgain', 'verdict', { K: 0.04 })).toBe('grows');
  });

  it('P6 double: pipes 1, 2, 2.5, 3, 4, 5 s → edges 2.52, 1.36, 1.12, 0.95, 0.74, 0.60 %/(°C·s); 13.8 s and 23.9 s swings at 2.5 and 5', () => {
    const rows: [number, string][] = [[1, '2.52'], [2, '1.36'], [2.5, '1.12'], [3, '0.95'], [4, '0.74'], [5, '0.60']];
    for (const [L, k] of rows) expect(out('double', 'k', { L })).toBe(k);
    expect(out('double', 'T', { L: 2.5 })).toBe('13.8');
    expect(out('double', 'T', { L: 5 })).toBe('23.9');
  });

  it("P7 delaymargin: Theo's (1, 0.6) → 58° at 0.29 rad/s, 3.5 s more pipe; the normal hand (0, 0.8) → 22°, 0.34, 1.1 s; June's → none", () => {
    expect(out('delaymargin', 'verdict', { kp: 1, ki: 0.6 })).toBe('margin(58|0.29|3.5)');
    expect(out('delaymargin', 'verdict', { kp: 0, ki: 0.8 })).toBe('margin(22|0.34|1.1)');
    expect(out('delaymargin', 'verdict', { kp: 5, ki: 5 })).toBe('none');
    expect(out('delaymargin', 'verdict', { kp: 3, ki: 1.5 })).toBe('none');
  });
});
