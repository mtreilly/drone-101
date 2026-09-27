import { fmt } from '../core/i18n';
import { type LoopMargins, type TF, loopMargins, sweep } from '../math/bode';
import type { WidgetCtx } from '../story/types';
import { Plot } from './plot';

export interface MarginPlotOptions {
  /** the wiggle speeds of the sweep, rad/s, increasing (their ends are the x axis) */
  ws: readonly number[];
  withGain?: boolean;
  height?: number;
  /** gain axis (log) */
  gainMin?: number;
  gainMax?: number;
  /** bottom and top of the phase axis, degrees */
  phaseMin?: number;
  phaseMax?: number;
}

/**
 * Bode plots of an open loop with both margins drawn as distances to the cliff: an arrow from the
 * loop gain at the −180° speed up to gain 1 (× gain margin), and one from the phase at the
 * gain-of-1 speed down to −180° (phase margin). Shared by Chapter 12's shower loops and Chapter
 * 11's drone loop. `withGain: false` draws the phase plot only. Strings from the widget's own
 * subtree: w, gain, phase, loop, gainAria, phaseAria, one, cliff, atCross, gm.
 */
export function marginPlots(onCleanup: WidgetCtx['onCleanup'], host: HTMLElement, t: WidgetCtx['t'], o: MarginPlotOptions) {
  const { ws, withGain = true, height = 190, gainMin = 0.1, gainMax = 10, phaseMin = -360, phaseMax = -90 } = o;
  const xAxis = { label: t('w'), min: ws[0], max: ws[ws.length - 1], log: true, logSteps: [1, 2, 5] };
  const ticks = [-90, -180, -270, -360, -540].filter((v) => v >= phaseMin && v <= phaseMax && (v !== -270 || phaseMin > -360));
  const gain = withGain
    ? new Plot(host, {
        x: xAxis,
        // a taller frame: a gain margin of × 1.4 is only 0.15 decade, so the arrow and the labels
        // at gain 1 need every pixel they can get on a phone
        y: { label: t('gain'), min: gainMin, max: gainMax, log: true },
        series: [{ id: 'L', color: 'out', label: t('loop'), ghost: true }],
        height: height + 30,
        label: t('gainAria'),
      }, onCleanup)
    : null;
  const phase = new Plot(host, {
    x: xAxis,
    y: { label: t('phase'), min: phaseMin, max: phaseMax, ticks },
    series: [{ id: 'L', color: 'out', label: withGain ? undefined : t('loop'), ghost: true }],
    height,
    label: t('phaseAria'),
  }, onCleanup);
  const show = (loop: TF, delay: number, fresh: boolean): LoopMargins => {
    const pts = sweep(loop.num, loop.den, delay, ws);
    const m = loopMargins(loop, delay);
    const has180 = Number.isFinite(m.w180) && Number.isFinite(m.gm);
    const hasCross = Number.isFinite(m.wc) && Number.isFinite(m.pm);
    if (gain) {
      gain.clear(fresh);
      gain.set('L', ws, pts.map((q) => q.mag));
      gain.setLines([
        { kind: 'h', at: 1, color: 'ink3', label: t('one'), labelAt: 'end', labelSide: 'above', avoid: ['L'] },
        ...(has180 ? [{ kind: 'v' as const, at: m.w180, color: 'err', dash: [3, 4] }] : []),
      ]);
      // like the phase plot: the arrow is the margin and carries the only label ("gain margin × 1.40")
      gain.setMarkers(has180 ? [{ x: m.w180, y: 1 / m.gm, color: 'err', clamp: true }] : []);
      gain.setArrows(has180 ? [{ at: m.w180, from: 1 / m.gm, to: 1, color: 'err', label: `${t('gm')} × ${fmt(m.gm, 2)}` }] : []);
    }
    phase.clear(fresh);
    phase.set('L', ws, pts.map((q) => q.phase));
    phase.setLines([
      { kind: 'h', at: -180, color: 'err', label: t('cliff'), labelAt: 'end', labelSide: 'above', avoid: ['L'] },
      ...(hasCross ? [{ kind: 'v' as const, at: m.wc, color: 'ink3', dash: [3, 4] }] : []),
    ]);
    // one label for the point and its arrow ("phase margin 22°"): two labels a few pixels apart collide on a phone.
    // Past the cliff there is no margin (the readout shows —), only how far over it the loop is.
    phase.setMarkers(hasCross ? [{ x: m.wc, y: -180 + m.pm, color: 'out', clamp: true }] : []);
    phase.setArrows(hasCross ? [{ at: m.wc, from: -180 + m.pm, to: -180, color: m.pm > 0 ? 'out' : 'err', label: m.pm > 0 ? `${t('atCross')} ${fmt(m.pm, 0)}°` : `${fmt(m.pm, 0)}°` }] : []);
    return m;
  };
  return { gain, phase, show };
}
