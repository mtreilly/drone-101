import { clamp, h } from '../core/dom';
import { fmt, type T } from '../core/i18n';
import { progress } from '../core/progress';
import { plainText, setRich } from '../core/rich-text';
import type { Bus } from './types';

/**
 * Playable sentences (Bret Victor's "reactive documents"): a number inside the prose that the
 * reader drags, or focuses and steps with the arrow keys, while the other numbers in the same
 * sentence recompute. The words live in the locale file with `{scrub|name}` inputs and
 * `{calc|name}` outputs; the maths lives in the chapter's `plays` registry.
 */
export interface PlayInput {
  min: number;
  max: number;
  step: number;
  value: number;
  /** decimals shown (default: from `step`) */
  digits?: number;
  /** discrete values instead of min/max/step (e.g. 1, 2, 4, 12, 100, 1000) */
  values?: number[];
  /** unit appended to the screen-reader value (the visible unit is written in the sentence) */
  unit?: string;
  /** custom visible text for a value (default: `fmt` with `digits`) */
  format?: (v: number) => string;
}

export type PlayValues = Record<string, number>;

export interface PlayModel {
  inputs: Record<string, PlayInput>;
  /** each output is plain text; `t` reads strings under `plays.<id>` */
  outputs: Record<string, (v: PlayValues, t: T) => string>;
}

const decimals = (step: number): number => {
  const s = String(step);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
};

/** Every `{scrub|…}` / `{calc|…}` token in a string, for the locale validator. */
export const playTokens = (s: string): string[] => (s.match(/\{(?:scrub|calc)\|[\w|]+\}/g) ?? []).sort();

/** Formats an input value the way the sentence shows it. */
export function formatInput(inp: PlayInput, v: number): string {
  return inp.format ? inp.format(v) : fmt(v, inp.digits ?? decimals(inp.step));
}

/** Snaps and clamps a raw value to what the input allows. */
export function snapInput(inp: PlayInput, v: number): number {
  if (inp.values) {
    let best = inp.values[0];
    for (const x of inp.values) if (Math.abs(x - v) < Math.abs(best - v)) best = x;
    return best;
  }
  const n = Math.round((v - inp.min) / inp.step);
  return clamp(Number((inp.min + n * inp.step).toFixed(10)), inp.min, inp.max);
}

/** Moves an input by `steps` notches (a notch = one `step`, or one entry of `values`). */
export function nudgeInput(inp: PlayInput, v: number, steps: number): number {
  if (inp.values) {
    const i = inp.values.indexOf(snapInput(inp, v));
    return inp.values[clamp(i + steps, 0, inp.values.length - 1)];
  }
  return snapInput(inp, v + steps * inp.step);
}

const notches = (inp: PlayInput): number => (inp.values ? inp.values.length - 1 : Math.round((inp.max - inp.min) / inp.step));

export interface PlayEnv {
  /** translator for `plays.<id>` of the chapter namespace */
  t: T;
  bus: Bus;
  cleanups: (() => void)[];
  /** hand-lettered "drag me" hint on the first number, until the reader has tried one */
  hint?: string;
}

const HINT_KEY = 'play-hint-seen';

/**
 * Renders a playable sentence into a `<p>` (or any element): tokens become live spans.
 * Emits `play:<id>` with the current values whenever an input changes, so widgets can follow.
 */
export function renderPlay(el: HTMLElement, id: string, text: string, model: PlayModel | undefined, env: PlayEnv): HTMLElement {
  setRich(el, text);
  el.classList.add('play');
  if (!model) {
    console.error(`Missing play model: ${id}`);
    return el;
  }
  const values: PlayValues = {};
  for (const [k, inp] of Object.entries(model.inputs)) values[k] = inp.value;
  const outs = [...el.querySelectorAll<HTMLElement>('[data-calc]')];
  const scrubs = [...el.querySelectorAll<HTMLElement>('[data-scrub]')];
  // one polite, throttled announcement of the whole sentence after the reader stops
  const live = h('span', { class: 'visually-hidden', 'aria-live': 'polite' });
  el.append(live);
  const sentence = () => {
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelector('[aria-live]')?.remove();
    return plainText(clone);
  };
  let timer = 0;
  const announce = () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => (live.textContent = sentence()), 650);
  };
  env.cleanups.push(() => clearTimeout(timer));

  const render = () => {
    for (const o of outs) {
      const fn = model.outputs[o.dataset.calc!];
      const txt = fn ? fn(values, env.t) : '⟦?⟧';
      if (o.textContent !== txt) o.textContent = txt;
    }
    for (const sEl of scrubs) {
      const k = sEl.dataset.scrub!;
      const inp = model.inputs[k];
      if (!inp) continue;
      const shown = formatInput(inp, values[k]);
      sEl.textContent = shown;
      sEl.setAttribute('aria-valuenow', String(values[k]));
      sEl.setAttribute('aria-valuetext', inp.unit ? `${shown} ${inp.unit}` : shown);
    }
  };

  const set = (k: string, v: number) => {
    const inp = model.inputs[k];
    const nv = snapInput(inp, v);
    if (nv === values[k]) return;
    tried();
    values[k] = nv;
    render();
    announce();
    env.bus.emit(`play:${id}`, { ...values });
  };

  let hint: HTMLElement | null = null;
  if (env.hint && scrubs[0] && !progress.load<boolean>(HINT_KEY)) {
    const wrap = h('span', { class: 'scrub-wrap' });
    scrubs[0].before(wrap);
    hint = h('span', { class: 'play-hint', 'aria-hidden': 'true' }, env.hint);
    wrap.append(scrubs[0], hint);
    el.classList.add('has-hint');
  }
  const tried = () => {
    if (!hint) return;
    hint.classList.add('gone');
    hint = null;
    progress.save(HINT_KEY, true);
  };

  for (const sEl of scrubs) {
    const k = sEl.dataset.scrub!;
    const inp = model.inputs[k];
    if (!inp) {
      console.error(`Missing play input: ${id}.${k}`);
      continue;
    }
    sEl.tabIndex = 0;
    sEl.setAttribute('role', 'slider');
    sEl.setAttribute('aria-label', env.t(k));
    sEl.setAttribute('aria-valuemin', String(inp.values ? inp.values[0] : inp.min));
    sEl.setAttribute('aria-valuemax', String(inp.values ? inp.values[inp.values.length - 1] : inp.max));
    sEl.setAttribute('aria-orientation', 'horizontal');
    const rtl = () => getComputedStyle(el).direction === 'rtl';
    sEl.addEventListener('keydown', (ev) => {
      const big = ev.shiftKey ? 10 : 1;
      const fwd = rtl() ? 'ArrowLeft' : 'ArrowRight';
      const back = rtl() ? 'ArrowRight' : 'ArrowLeft';
      let next: number | null = null;
      if (ev.key === 'ArrowUp' || ev.key === fwd) next = nudgeInput(inp, values[k], big);
      else if (ev.key === 'ArrowDown' || ev.key === back) next = nudgeInput(inp, values[k], -big);
      else if (ev.key === 'PageUp') next = nudgeInput(inp, values[k], 10);
      else if (ev.key === 'PageDown') next = nudgeInput(inp, values[k], -10);
      else if (ev.key === 'Home') next = inp.values ? inp.values[0] : inp.min;
      else if (ev.key === 'End') next = inp.values ? inp.values[inp.values.length - 1] : inp.max;
      if (next === null) return;
      ev.preventDefault();
      set(k, next);
    });
    // drag sideways: the whole range fits in a comfortable ~220 px swipe
    const pxPerNotch = clamp(220 / notches(inp), 5, 28);
    let start: { x: number; v: number; id: number } | null = null;
    sEl.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return;
      ev.preventDefault();
      sEl.focus({ preventScroll: true });
      sEl.setPointerCapture(ev.pointerId);
      start = { x: ev.clientX, v: values[k], id: ev.pointerId };
      el.classList.add('scrubbing');
      sEl.classList.add('active');
    });
    sEl.addEventListener('pointermove', (ev) => {
      if (!start || ev.pointerId !== start.id) return;
      const dx = (ev.clientX - start.x) * (rtl() ? -1 : 1);
      set(k, nudgeInput(inp, start.v, Math.round(dx / pxPerNotch)));
    });
    const end = (ev: PointerEvent) => {
      if (!start || ev.pointerId !== start.id) return;
      start = null;
      el.classList.remove('scrubbing');
      sEl.classList.remove('active');
    };
    sEl.addEventListener('pointerup', end);
    sEl.addEventListener('pointercancel', end);
  }
  render();
  return el;
}
