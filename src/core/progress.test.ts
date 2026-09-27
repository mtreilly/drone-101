import { migrate } from './progress';

const saved = (visited: number[], completed: number[], course?: number) => ({ visited, completed, predictions: {}, quiz: { 'ch7-q1': 0 }, saved: { 'ch10.robot': 1 }, course });

describe('progress migration', () => {
  it('moves 12-chapter progress onto the 14 chapters: 5 and 7 each became two', () => {
    const p = migrate(saved([0, 4, 5, 6, 7, 8, 11], [5, 7, 9]));
    expect(p.visited).toEqual([0, 4, 5, 6, 7, 8, 9, 10, 13]);
    expect(p.completed).toEqual([5, 6, 8, 9, 11]);
    expect(p.course).toBe(2);
  });

  it('keeps answers and saved widget data, and leaves current progress alone', () => {
    const old = migrate(saved([7], [7]));
    expect(old.quiz).toEqual({ 'ch7-q1': 0 });
    expect(old.saved).toEqual({ 'ch10.robot': 1 });
    const now = saved([6, 12], [6], 2);
    expect(migrate(now)).toBe(now);
    expect(migrate(migrate(saved([11], [])))).toEqual(migrate(saved([11], [])));
  });
});
