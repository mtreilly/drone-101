/**
 * Transport delay for a signal sampled at a fixed step: push one value per step,
 * read the value from `delay` seconds ago. Before enough history exists it
 * returns the initial value (the pipe is full of water at the starting temperature).
 */
export class DelayLine {
  private buf: Float64Array;
  private head = 0;
  readonly steps: number;

  constructor(delay: number, dt: number, initial = 0) {
    this.steps = Math.max(0, Math.round(delay / dt));
    this.buf = new Float64Array(this.steps + 1).fill(initial);
  }

  /** Stores the current input and returns the input from `steps` steps ago. */
  push(value: number): number {
    this.buf[this.head] = value;
    this.head = (this.head + 1) % this.buf.length;
    return this.buf[this.head];
  }

  /** The value that will come out next (oldest in the buffer). */
  peek(): number {
    return this.buf[(this.head + 1) % this.buf.length];
  }

  /** Value pushed `k` steps ago (k = 0 is the most recent push). */
  ago(k: number): number {
    const n = this.buf.length;
    return this.buf[(((this.head - 1 - k) % n) + n) % n];
  }

  reset(initial = 0): void {
    this.buf.fill(initial);
    this.head = 0;
  }
}
