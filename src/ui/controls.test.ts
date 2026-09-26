import { onSettle } from './controls';

/** A stand-in for a range input: an event target with a value (no DOM in the test runner). */
function fakeInput(value = 0) {
  const t = new EventTarget() as EventTarget & { value: string };
  t.value = String(value);
  return t;
}
const key = (k: string): Event => Object.assign(new Event('keydown', { cancelable: true }), { key: k });

/** One arrow press on a native range input: keydown, then the value changes, then `change`. */
function press(input: ReturnType<typeof fakeInput>, k: string, next: number): void {
  input.dispatchEvent(key(k));
  input.value = String(next);
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('change'));
}

describe('onSettle: one result per deliberate slider choice', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('turns 60 arrow presses into one call, after the pause (Chapter 7 probe: 60 presses = 60 dots)', () => {
    const input = fakeInput(0);
    const got: number[] = [];
    onSettle(input as unknown as HTMLInputElement, (v) => got.push(v));
    for (let i = 1; i <= 60; i++) {
      if (i > 1) vi.advanceTimersByTime(100);
      press(input, 'ArrowRight', i / 20);
    }
    expect(got).toEqual([]);
    vi.advanceTimersByTime(599);
    expect(got).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(got).toEqual([3]);
  });

  it('fires at once on Enter, and does not fire again for the same pause', () => {
    const input = fakeInput(0);
    const got: number[] = [];
    onSettle(input as unknown as HTMLInputElement, (v) => got.push(v));
    press(input, 'ArrowUp', 1);
    const enter = key('Enter');
    input.dispatchEvent(enter);
    expect(got).toEqual([1]);
    expect(enter.defaultPrevented).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(got).toEqual([1]);
  });

  it('fires straight away when a pointer lets go', () => {
    const input = fakeInput(0);
    const got: number[] = [];
    onSettle(input as unknown as HTMLInputElement, (v) => got.push(v));
    input.dispatchEvent(new Event('pointerdown'));
    input.value = '0.7';
    input.dispatchEvent(new Event('change'));
    expect(got).toEqual([0.7]);
  });

  it('keeps a pending choice when focus leaves, and stops after cleanup', () => {
    const input = fakeInput(0);
    const got: number[] = [];
    const off = onSettle(input as unknown as HTMLInputElement, (v) => got.push(v), 300);
    press(input, 'ArrowLeft', -1);
    input.dispatchEvent(new Event('blur'));
    expect(got).toEqual([-1]);
    // a blur with nothing pending does nothing
    input.dispatchEvent(new Event('blur'));
    expect(got).toEqual([-1]);
    off();
    press(input, 'ArrowLeft', -2);
    vi.advanceTimersByTime(1000);
    expect(got).toEqual([-1]);
  });
});
