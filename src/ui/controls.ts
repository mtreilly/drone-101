import { h, uid } from '../core/dom';
import { fmt, tc } from '../core/i18n';
import { plainText, setRich } from '../core/rich-text';
import type { Loop } from './loop';

export interface SliderOptions {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit?: string;
  digits?: number;
  /** colour key for the label swatch, e.g. 'eff' */
  color?: string;
  /** custom value text (also used for aria-valuetext) */
  format?: (v: number) => string;
  onInput: (v: number) => void;
  /** optional helper text under the slider */
  hint?: string;
}

export interface Slider {
  el: HTMLElement;
  input: HTMLInputElement;
  get value(): number;
  set value(v: number);
  setDisabled(d: boolean): void;
}

/** Labelled range slider with a live numeric value and unit. Native input ⇒ keyboard + screen reader support. */
export function slider(o: SliderOptions): Slider {
  const id = uid('sl');
  const out = h('output', { for: id, class: 'slider-value' });
  const input = h('input', {
    id,
    type: 'range',
    min: o.min,
    max: o.max,
    step: o.step,
    value: o.value,
  });
  const text = (v: number) => (o.format ? o.format(v) : `${fmt(v, o.digits ?? decimals(o.step))}${o.unit ? ` ${o.unit}` : ''}`);
  const sync = () => {
    const v = Number(input.value);
    out.textContent = text(v);
    input.setAttribute('aria-valuetext', text(v));
    const f = (v - o.min) / (o.max - o.min);
    input.style.setProperty('--fill', `${f * 100}%`);
  };
  input.addEventListener('input', () => {
    sync();
    o.onInput(Number(input.value));
  });
  const label = h('label', { for: id, class: 'slider-label' });
  setRich(label, o.label);
  if (label.querySelector('.katex')) input.setAttribute('aria-label', plainText(label));
  const el = h(
    'div',
    { class: `slider${o.color ? ` c-${o.color}-slider` : ''}` },
    h('div', { class: 'slider-top' }, label, out),
    input,
    o.hint ? h('div', { class: 'slider-hint' }, o.hint) : null,
  );
  if (o.color) el.style.setProperty('--accent', `var(--c-${cssKey(o.color)})`);
  sync();
  return {
    el,
    input,
    get value() {
      return Number(input.value);
    },
    set value(v: number) {
      input.value = String(v);
      sync();
    },
    setDisabled(d: boolean) {
      input.disabled = d;
    },
  };
}

function cssKey(k: string): string {
  return { sp: 'setpoint', out: 'output', err: 'error', eff: 'effort', dis: 'disturb' }[k] ?? k;
}

const decimals = (step: number): number => {
  const s = String(step);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
};

export interface TransportOptions {
  loop: Loop;
  onReset: () => void;
  /** advance a small fixed amount while paused */
  onStep?: () => void;
  speeds?: number[];
}

/** Play/pause, reset, step and speed controls bound to a Loop. */
export function transport(o: TransportOptions): HTMLElement {
  const play = h('button', { class: 'btn small', type: 'button' });
  const syncPlay = () => {
    play.innerHTML = o.loop.playing ? `${ICON.pause}<span>${tc('transport.pause')}</span>` : `${ICON.play}<span>${tc('transport.play')}</span>`;
    play.setAttribute('aria-label', o.loop.playing ? tc('transport.pause') : tc('transport.play'));
  };
  play.addEventListener('click', () => o.loop.toggle());
  o.loop.onChange(syncPlay);
  syncPlay();
  const reset = h('button', { class: 'btn small', type: 'button', 'aria-label': tc('transport.reset'), html: `${ICON.reset}<span>${tc('transport.reset')}</span>` });
  reset.addEventListener('click', o.onReset);
  const step = o.onStep
    ? h('button', { class: 'btn small', type: 'button', 'aria-label': tc('transport.step'), html: `${ICON.step}<span class="btn-text">${tc('transport.step')}</span>` })
    : null;
  step?.addEventListener('click', () => {
    o.loop.pause();
    o.onStep?.();
  });
  const speeds = o.speeds ?? [0.25, 0.5, 1, 2];
  const group = uid('speed');
  const speedEl = h(
    'fieldset',
    { class: 'speed' },
    h('legend', { class: 'visually-hidden' }, tc('transport.speed')),
    h('span', { class: 'speed-label', 'aria-hidden': 'true' }, tc('transport.speed')),
    speeds.map((sp) => {
      const id = uid('sp');
      const input = h('input', { type: 'radio', name: group, id, value: sp, checked: sp === o.loop.speed });
      input.addEventListener('change', () => (o.loop.speed = sp));
      return h('span', null, input, h('label', { for: id }, `${fmt(sp, sp < 1 ? 2 : 0)}×`));
    }),
  );
  return h('div', { class: 'transport', role: 'group', 'aria-label': tc('transport.label') }, play, reset, step, speedEl);
}

export const ICON = {
  play: '<svg viewBox="0 0 20 20" aria-hidden="true" width="16" height="16"><path d="M5 3.5v13l11-6.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 20 20" aria-hidden="true" width="16" height="16"><path d="M5 3h3.5v14H5zM11.5 3H15v14h-3.5z" fill="currentColor"/></svg>',
  reset: '<svg viewBox="0 0 20 20" aria-hidden="true" width="16" height="16"><path d="M4 10a6 6 0 1 0 2-4.5M4 3v3.5h3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  step: '<svg viewBox="0 0 20 20" aria-hidden="true" width="16" height="16"><path d="M4 3.5v13l8-6.5zM13 3.5h3v13h-3z" fill="currentColor"/></svg>',
};

/** Small read-out chip: label + value (e.g. "overshoot 23 %"). */
export function readout(label: string, colorKey?: string): { el: HTMLElement; set: (v: string, state?: 'good' | 'bad' | '') => void } {
  const val = h('span', { class: 'readout-val' }, '—');
  const el = h('div', { class: 'readout' }, h('span', { class: 'readout-label' }, label), val);
  if (colorKey) el.style.setProperty('--accent', `var(--c-${cssKey(colorKey)})`);
  return {
    el,
    set(v, state = '') {
      val.textContent = v;
      el.dataset.state = state;
    },
  };
}

/** Segmented toggle button group; returns element and a setter. */
export function segmented<V extends string>(
  label: string,
  options: { value: V; label: string }[],
  value: V,
  onChange: (v: V) => void,
): { el: HTMLElement; set: (v: V) => void } {
  const name = uid('seg');
  const inputs: HTMLInputElement[] = [];
  const el = h(
    'fieldset',
    { class: 'segmented' },
    h('legend', null, label),
    h(
      'div',
      { class: 'segmented-opts' },
      options.map((o) => {
        const id = uid('sg');
        const input = h('input', { type: 'radio', name, id, value: o.value, checked: o.value === value });
        inputs.push(input);
        input.addEventListener('change', () => onChange(o.value));
        const lab = h('label', { for: id });
        setRich(lab, o.label);
        if (lab.querySelector('.katex')) input.setAttribute('aria-label', plainText(lab));
        return h('span', null, input, lab);
      }),
    ),
  );
  return {
    el,
    set(v) {
      inputs.forEach((i) => (i.checked = i.value === v));
    },
  };
}

/** Accessible toggle (checkbox styled as a switch). */
export function toggle(label: string, checked: boolean, onChange: (v: boolean) => void): { el: HTMLElement; input: HTMLInputElement } {
  const id = uid('tg');
  const input = h('input', { type: 'checkbox', id, role: 'switch', checked });
  input.addEventListener('change', () => onChange(input.checked));
  const lab = h('label', { for: id });
  setRich(lab, label);
  return { el: h('div', { class: 'toggle' }, input, lab), input };
}
