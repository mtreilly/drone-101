import { h } from '../../core/dom';
import { tc } from '../../core/i18n';
import { transport } from '../../ui/controls';
import { DroneView } from '../../ui/drone-view';
import { Loop } from '../../ui/loop';
import { Plot, type SeriesDef } from '../../ui/plot';
import { LIMITED, type Trace } from './pid-tools';

export interface PlayerOptions {
  /** extra series drawn on the thrust plot: id → values per sample */
  extra?: { id: string; color: string; label: string; dash?: number[]; values: (tr: Trace) => number[] }[];
  hMax?: number;
  duration: number;
  heightLabel: string;
  thrustLabel: string;
  heightRange?: [number, number];
  thrustRange?: [number, number];
  showSensor?: boolean;
  /** show the noisy measurement as a faint series */
  showMeasured?: boolean;
  measuredLabel?: string;
  gravityLabel?: string;
  /**
   * The drone may fly out of its picture and bump into the page. The trace must already contain
   * the hit (compute it with `view.ceilingHeight()`, see `page-ceiling.ts`): the view only shows it.
   */
  pageCeiling?: boolean;
}

/**
 * Replays a precomputed drone trace in real time: the drone moves, and the height
 * and thrust curves are drawn up to the playhead. Loading a new trace ghosts the old one.
 */
export class TracePlayer {
  readonly el: HTMLElement;
  readonly hPlot: Plot;
  readonly tPlot: Plot;
  readonly view: DroneView;
  readonly loop: Loop;
  /** play/pause/reset/step/speed; the widget decides where it goes (after its sliders) */
  readonly transportEl: HTMLElement;
  private tr: Trace | null = null;
  /** next preview should ghost the current run (true after a slider is released) */
  private fresh = true;
  private idx = 0;
  private time = 0;
  onFrame: ((t: number, i: number) => void) | null = null;

  constructor(host: HTMLElement, private o: PlayerOptions) {
    const grid = h('div', { class: 'w-grid side' });
    const left = h('div');
    const right = h('div');
    grid.append(left, right);
    host.append(grid);
    this.el = grid;
    this.view = new DroneView(left, {
      hMax: o.hMax ?? 3,
      width: 240,
      showSensor: o.showSensor,
      ...(o.pageCeiling ? { onCeiling: () => {}, ceilingResponse: 'bump' as const } : {}),
    });
    const hs: SeriesDef[] = [
      { id: 'r', color: 'sp', dash: [6, 5], width: 1.8 },
      { id: 'h', color: 'out', label: o.heightLabel, ghost: true },
    ];
    // drawn over the blue height (it jitters only ±2 cm around it, so underneath it would vanish)
    if (o.showMeasured) hs.push({ id: 'meas', color: 'pencil', label: o.measuredLabel ?? '', width: 1.2 });
    this.hPlot = new Plot(right, {
      x: { label: tc('plots.time'), min: 0, max: o.duration },
      y: { label: tc('plots.height'), min: o.heightRange?.[0] ?? 0, max: o.heightRange?.[1] ?? 3 },
      series: hs,
      fillBetween: ['r', 'h', 'err'],
      height: 190,
      label: o.heightLabel,
    });
    this.tPlot = new Plot(right, {
      x: { label: tc('plots.time'), min: 0, max: o.duration },
      y: { label: tc('plots.thrust'), min: o.thrustRange?.[0] ?? 0, max: o.thrustRange?.[1] ?? 22 },
      series: [{ id: 'T', color: 'eff', label: o.thrustLabel, ghost: true }, ...(o.extra ?? []).map((e) => ({ id: e.id, color: e.color, label: e.label, dash: e.dash, width: 1.8 }))],
      height: 150,
      label: o.thrustLabel,
    });
    const lines: Parameters<Plot['setLines']>[0] = [{ kind: 'h', at: LIMITED.tMax, color: 'ink3', dash: [2, 4], label: tc('drone.thrust') + ' max' }];
    if (o.gravityLabel) lines.push({ kind: 'h', at: LIMITED.m * LIMITED.g, color: 'dis', dash: [5, 4], label: o.gravityLabel });
    this.tPlot.setLines(lines);
    this.loop = new Loop((dt) => this.advance(dt), host);
    // pressing play on a finished flight replays it from the start
    this.loop.onChange((playing) => {
      if (playing && this.tr && this.idx >= this.tr.t.length - 1) this.rewind();
    });
    this.transportEl = transport({ loop: this.loop, onReset: () => this.restart(), onStep: () => this.advance(0.1) });
  }

  /**
   * Instant preview while a slider is being dragged: the whole flight appears at once,
   * with the last settled run as the ghost. Call `commit()` when the drag ends.
   */
  show(tr: Trace): void {
    this.tr = tr;
    this.loop.pause();
    this.hPlot.clear(this.fresh);
    this.tPlot.clear(this.fresh);
    this.fresh = false;
    this.showUpTo(tr.t.length - 1);
  }

  commit(): void {
    this.fresh = true;
  }

  /** Wires a slider so dragging previews instantly and releasing settles the ghost. */
  bind(input: HTMLInputElement): void {
    input.addEventListener('change', () => this.commit());
  }

  private rewind(): void {
    this.hPlot.clear(false);
    this.tPlot.clear(false);
    this.idx = 0;
    this.time = 0;
    this.showUpTo(0);
  }

  load(tr: Trace, autoplay = Loop.autoplay): void {
    this.tr = tr;
    this.hPlot.clear();
    this.tPlot.clear();
    this.fresh = true;
    this.idx = 0;
    this.time = 0;
    if (autoplay) {
      this.loop.play();
      this.advance(0);
    } else {
      this.loop.pause();
      this.showUpTo(tr.t.length - 1);
    }
  }

  /** Seconds into the replay. */
  get playhead(): number {
    return this.time;
  }

  /**
   * Replaces the trace without moving the playhead or touching the ghosts. Only for a trace that
   * agrees with the current one up to the playhead (e.g. the page ceiling moved, but it hasn't hit yet).
   */
  swap(tr: Trace): void {
    this.tr = tr;
    this.showUpTo(Math.min(this.idx, tr.t.length - 1));
  }

  restart(): void {
    if (!this.tr) return;
    this.rewind();
    this.loop.play();
  }

  /** Jumps to the end: whole curves visible. */
  finish(): void {
    if (!this.tr) return;
    this.loop.pause();
    this.showUpTo(this.tr.t.length - 1);
  }

  private advance(dt: number): void {
    const tr = this.tr;
    if (!tr) return;
    this.time += dt;
    let i = this.idx;
    while (i < tr.t.length - 1 && tr.t[i + 1] <= this.time) i++;
    this.showUpTo(i);
    if (i >= tr.t.length - 1) this.loop.pause();
  }

  private showUpTo(i: number): void {
    const tr = this.tr!;
    this.idx = i;
    this.time = Math.max(this.time, tr.t[i]);
    const n = i + 1;
    const t = tr.t.slice(0, n);
    this.hPlot.set('h', t, tr.h.slice(0, n));
    this.hPlot.set('r', t, tr.r.slice(0, n));
    if (this.o.showMeasured) this.hPlot.set('meas', t, tr.measured.slice(0, n));
    this.tPlot.set('T', t, tr.thrust.slice(0, n));
    for (const e of this.o.extra ?? []) this.tPlot.set(e.id, t, e.values(tr).slice(0, n));
    this.view.update({ h: tr.h[i], r: tr.r[i], thrust: tr.thrust[i], wind: tr.wind[i], pkg: tr.pkg[i], crashed: tr.crashed && (tr.crashAt != null ? tr.t[i] >= tr.crashAt - 1e-9 : i === tr.t.length - 1), measured: tr.measured[i] });
    this.onFrame?.(tr.t[i], i);
  }

  destroy(): void {
    this.loop.destroy();
  }
}
