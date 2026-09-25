import { prefersReducedMotion } from '../core/dom';

/**
 * Real-time animation loop. Each frame calls `tick(simSeconds)` with the elapsed
 * wall-clock time × speed (capped so a background tab doesn't cause a huge jump).
 * The loop idles while its host element is off-screen.
 */
export class Loop {
  playing = false;
  speed = 1;
  private raf = 0;
  private last = 0;
  private visible = true;
  private io: IntersectionObserver | null = null;
  private listeners = new Set<(playing: boolean) => void>();

  constructor(
    private tick: (dt: number) => void,
    host?: HTMLElement,
  ) {
    if (host && typeof IntersectionObserver !== 'undefined') {
      this.io = new IntersectionObserver((entries) => {
        this.visible = entries.some((e) => e.isIntersecting);
        if (this.visible && this.playing) this.schedule();
      });
      this.io.observe(host);
    }
  }

  /** Whether simulations should auto-start (not when the user prefers reduced motion). */
  static get autoplay(): boolean {
    return !prefersReducedMotion();
  }

  onChange(fn: (playing: boolean) => void): void {
    this.listeners.add(fn);
  }

  play(): void {
    if (this.playing) return;
    this.playing = true;
    this.last = 0;
    this.schedule();
    this.listeners.forEach((l) => l(true));
  }

  pause(): void {
    if (!this.playing) return;
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.listeners.forEach((l) => l(false));
  }

  toggle(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  destroy(): void {
    this.pause();
    this.io?.disconnect();
  }

  private schedule(): void {
    if (this.raf) return;
    this.raf = requestAnimationFrame((now) => {
      this.raf = 0;
      if (!this.playing) return;
      if (!this.visible) {
        this.last = 0;
        return;
      }
      const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
      this.last = now;
      this.tick(dt * this.speed);
      this.schedule();
    });
  }
}
