import { followPlay } from './play';
import { createBus } from './types';

describe('followPlay: widgets follow a playable sentence', () => {
  it('a subscriber receives the values the sentence emits, until it unsubscribes', () => {
    const bus = createBus();
    const got: Record<string, number>[] = [];
    const off = followPlay(bus, 'cliff', (v) => got.push(v));
    bus.emit('play:cliff', { kp: 20, kd: 3 });
    bus.emit('play:other', { kp: 99 });
    bus.emit('play:cliff', { kp: 25, kd: 3 });
    off();
    bus.emit('play:cliff', { kp: 30, kd: 3 });
    expect(got).toEqual([
      { kp: 20, kd: 3 },
      { kp: 25, kd: 3 },
    ]);
  });

  it('hands each subscriber its own copy and ignores empty events', () => {
    const bus = createBus();
    const a: Record<string, number>[] = [];
    const b: Record<string, number>[] = [];
    followPlay(bus, 'x', (v) => {
      v.k = -1;
      a.push(v);
    });
    followPlay(bus, 'x', (v) => b.push(v));
    bus.emit('play:x', { k: 2 });
    bus.emit('play:x');
    expect(a).toEqual([{ k: -1 }]);
    expect(b).toEqual([{ k: 2 }]);
  });
});
