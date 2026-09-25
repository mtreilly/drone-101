import { h } from '../../core/dom';
import { tc } from '../../core/i18n';
import type { DroneSim } from '../../sim/drone-model';
import { BlockDiagram } from '../../ui/block-diagram';
import { DroneView } from '../../ui/drone-view';
import { Plot } from '../../ui/plot';

/** Drone view on the left, height + thrust plots on the right. Shared by chapters 1 and 2. */
export function droneRig(
  host: HTMLElement,
  o: { tMax: number; hMax: number; thrustMin: number; thrustMax: number; heightLabel: string; thrustLabel: string; aria: string; errorBand?: boolean },
): { view: DroneView; hPlot: Plot; tPlot: Plot; left: HTMLElement; right: HTMLElement } {
  const grid = h('div', { class: 'w-grid side' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(grid);
  const view = new DroneView(left, { hMax: o.hMax, width: 260 });
  const hPlot = new Plot(right, {
    x: { label: tc('plots.time'), min: 0, max: o.tMax },
    y: { label: tc('plots.height'), min: 0, max: o.hMax },
    series: [
      { id: 'r', color: 'sp', dash: [7, 5], width: 2 },
      { id: 'h', color: 'out', label: o.heightLabel, ghost: true },
    ],
    height: 200,
    label: o.aria,
    fillBetween: o.errorBand ? ['r', 'h', 'err'] : undefined,
  });
  const tPlot = new Plot(right, {
    x: { label: tc('plots.time'), min: 0, max: o.tMax },
    y: { label: tc('plots.thrust'), min: o.thrustMin, max: o.thrustMax },
    series: [{ id: 'T', color: 'eff', label: o.thrustLabel, ghost: true }],
    height: 130,
    label: o.thrustLabel,
  });
  return { view, hPlot, tPlot, left, right };
}

/** Advances a DroneSim by wall-clock seconds, keeping the sub-millisecond remainder. */
export function stepper(sim: () => DroneSim): (dt: number, onSample: () => void, sampleEvery?: number) => void {
  let carry = 0;
  let sinceSample = 0;
  return (dt, onSample, sampleEvery = 0.05) => {
    carry += dt;
    const n = Math.floor(carry / 0.001 + 1e-9);
    carry -= n * 0.001;
    const s = sim();
    for (let i = 0; i < n; i++) {
      s.step();
      sinceSample += 0.001;
      if (sinceSample >= sampleEvery - 1e-9) {
        sinceSample = 0;
        onSample();
      }
    }
  };
}

export interface LoopLabels {
  setpoint: string;
  error: string;
  controller: string;
  schedule: string;
  thrust: string;
  plant: string;
  disturbance: string;
  output: string;
  sensor: string;
  aria: string;
  description: string;
}

/** The feedback-loop block diagram (open-loop parts: 'sp-open', 'ctrl-open'). */
export function loopDiagram(host: HTMLElement, L: LoopLabels): BlockDiagram {
  return new BlockDiagram(host, {
    width: 760,
    height: 240,
    label: L.aria,
    description: L.description,
    arrows: [
      { id: 'sp', points: [[16, 100], [113, 100]], label: L.setpoint, labelAt: [62, 86], color: 'sp', sign: '+' },
      { id: 'sp-open', points: [[16, 100], [208, 100]], label: L.setpoint, labelAt: [100, 86], color: 'sp' },
      { id: 'err', points: [[145, 100], [208, 100]], label: L.error, labelAt: [178, 86], color: 'err' },
      { id: 'thrust', points: [[330, 100], [406, 100]], label: L.thrust, labelAt: [368, 86], color: 'eff' },
      { id: 'dist', points: [[470, 26], [470, 70]], label: L.disturbance, labelAt: [470, 18], color: 'dis' },
      { id: 'out', points: [[534, 100], [744, 100]], label: L.output, labelAt: [690, 86], color: 'out' },
      { id: 'fb1', points: [[640, 100], [640, 200], [534, 200]], color: 'out' },
      { id: 'fb2', points: [[406, 200], [130, 200], [130, 117]], color: 'out', sign: '−' },
    ],
    blocks: [
      { id: 'sum', x: 130, y: 100, kind: 'sum', label: 'Σ' },
      { id: 'ctrl', x: 270, y: 100, w: 120, h: 56, label: L.controller },
      { id: 'ctrl-open', x: 270, y: 100, w: 120, h: 56, label: L.schedule },
      { id: 'plant', x: 470, y: 100, w: 128, h: 56, label: L.plant },
      { id: 'sensor', x: 470, y: 200, w: 128, h: 46, label: L.sensor },
    ],
  });
}

export const OPEN_PARTS = ['sp-open', 'ctrl-open', 'thrust', 'plant', 'dist', 'out'];
export const CLOSED_PARTS = ['sp', 'sum', 'err', 'ctrl', 'thrust', 'plant', 'dist', 'out', 'fb1', 'sensor', 'fb2'];
export const ALL_PARTS = [...new Set([...OPEN_PARTS, ...CLOSED_PARTS])];
