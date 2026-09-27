import { h, uid } from '../../core/dom';
import { fmt, tc, unitLabel } from '../../core/i18n';
import { tex } from '../../core/rich-text';
import { c as cx } from '../../math/complex';
import { laplaceReal, table as T } from '../../math/laplace';
import { DRONE, DroneSim, P_ONLY, defaultDroneConfig } from '../../sim/drone-model';
import type { WidgetFactory } from '../../story/types';
import '../ch08/ch08.css';
import { readout, segmented, slider, toggle } from '../../ui/controls';
import { prefersReducedMotion } from '../../core/dom';
import { Plot } from '../../ui/plot';
import { niceTicks } from '../../ui/plot-layout';
import { mark, onInteractStart, sample } from '../ch07/helpers';
import { PROBE_T, shadeOverlay } from '../ch08/area-plot';
import { DRAW_T, combinedTop, dampedCos, derivativeRule, fromFunction, fromPoints, solveDrone, stepPiece, wigglePiece } from '../ch08/tools';

/** 9a — test the derivative rule on a signal the learner draws. */
const derivRule: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  mark(host);
  let d = fromFunction((tt) => 1 + 0.8 * Math.exp(-0.6 * tt) * Math.cos(1.8 * tt));
  let s = 1;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const grid = h('div', { class: 'w-grid two' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(grid);
  const fp = new Plot(left, {
    x: { label: tc('plots.time'), min: 0, max: DRAW_T },
    y: { label: '', min: -1.5, max: 2.5 },
    series: [
      { id: 'f', color: 'out', label: t('f') },
      { id: 'df', color: 'ink2', label: t('df'), width: 1.6, dash: [3, 3] },
    ],
    height: 250,
    label: t('plotAria'),
  }, ctx.onCleanup);
  const sp = new Plot(right, {
    x: { label: 's', min: 0.2, max: 3 },
    y: { label: '', min: -2, max: 2 },
    series: [
      { id: 'lhs', color: 'ink', label: t('lhs'), width: 3.2 },
      // neutral ink: orange is kept for control effort
      { id: 'rhs', color: 'ink2', label: t('rhs'), dash: [6, 5], width: 2 },
    ],
    height: 250,
    label: t('sAria'),
  }, ctx.onCleanup);
  const rL = readout(t('lhsShort'));
  const rR = readout(t('rhsShort'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const update = () => {
    fp.set('f', d.xs, d.f);
    fp.set('df', d.xs, d.df);
    const ss: number[] = [];
    const L: number[] = [];
    const R: number[] = [];
    for (let v = 0.2; v <= 3.001; v += 0.05) {
      const r = derivativeRule(d, v);
      ss.push(v);
      L.push(r.lhs);
      R.push(r.rhs);
    }
    const lo = Math.min(...L, ...R);
    const hi = Math.max(...L, ...R);
    const pad = Math.max(0.2, (hi - lo) * 0.15);
    // at least three labelled ticks, even on a phone
    sp.opts.y.ticks = niceTicks(lo - pad, hi + pad, 4);
    sp.setY(lo - pad, hi + pad);
    sp.set('lhs', ss, L);
    sp.set('rhs', ss, R);
    sp.setLines([{ kind: 'v', at: s, color: 'ink3', dash: [2, 3] }]);
    const r = derivativeRule(d, s);
    rL.set(fmt(r.lhs, 3));
    rR.set(fmt(r.rhs, 3));
    const ok = Math.abs(r.lhs - r.rhs) < 0.01;
    status.textContent = ok ? t('match', { s: fmt(s, 2), v: fmt(r.lhs, 3) }) : t('nomatch');
    status.className = `w-status${ok ? ' good' : ''}`;
    fp.describe(t('describe', { l: fmt(r.lhs, 3), r: fmt(r.rhs, 3) }));
  };
  const sl = slider({ label: t('s'), min: 0.2, max: 3, step: 0.05, value: s, onInput: (v) => ((s = v), update()) });
  const presets = [
    (tt: number) => 1 + 0.8 * Math.exp(-0.6 * tt) * Math.cos(1.8 * tt),
    (tt: number) => (tt < 2 ? 0.1 : 1.5) + 0.3 * Math.sin(3 * tt),
    (tt: number) => 2 * Math.exp(-0.4 * tt) - 0.5,
  ];
  const hint = h('p', { class: 'w-help', 'aria-live': 'polite' }, t('help'));
  let drawing = false;
  const drawBtn = h('button', { class: 'btn small primary', type: 'button', 'aria-pressed': 'false' }, t('draw'));
  const setDrawing = (on: boolean) => {
    drawing = on;
    drawBtn.setAttribute('aria-pressed', String(on));
    drawBtn.textContent = on ? t('stopDraw') : t('draw');
    fp.el.classList.toggle('drawing', on);
    if (on) {
      hint.textContent = t('drawing');
      fp.enableSketch((pts) => {
        if (pts.length < 5 || pts[pts.length - 1].x - pts[0].x < 3) {
          hint.textContent = t('tooShort');
          return;
        }
        d = fromPoints(pts.map((p) => ({ x: Math.max(0, Math.min(DRAW_T, p.x)), y: Math.max(-1.5, Math.min(2.5, p.y)) })));
        fp.setGuess(pts);
        seg.set('none');
        hint.textContent = t('drawn');
        update();
      });
    } else {
      fp.disableSketch();
      hint.textContent = t('help');
    }
  };
  drawBtn.addEventListener('click', () => setDrawing(!drawing));
  const seg = segmented(
    t('presetLabel'),
    presets.map((_, i) => ({ value: String(i), label: t(`presets.${i}`) })),
    '0',
    (v) => {
      setDrawing(false);
      fp.setGuess([]);
      d = fromFunction(presets[Number(v)]);
      update();
    },
  );
  const eq = h('div', { class: 'math-block', html: tex('\\underbrace{\\int_0^\\infty f\'(t)\\,e^{-st}\\,dt}_{\\text{' + t('lhsShort') + '}} \\;\\overset{?}{=}\\; \\underbrace{s\\,F(s) - f(0)}_{\\text{' + t('rhsBrace') + '}}', true) });
  host.append(
    eq,
    h('div', { class: 'w-controls' }, sl.el),
    h('div', { class: 'w-controls draw-row' }, seg.el, drawBtn),
    h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rL.el, rR.el)),
    status,
    hint,
  );
  update();
};

/** 9b — derive the table one row at a time, each row checked against the probe. */
const tableW: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  mark(host);
  const rows = [
    { f: () => 1, F: (s: number) => T.step(cx(s)).re, a: 0 },
    { f: (tt: number) => Math.exp(-tt), F: (s: number) => T.exp(-1)(cx(s)).re, a: -1 },
    { f: (tt: number) => Math.sin(2 * tt), F: (s: number) => T.sin(2)(cx(s)).re, a: 0 },
    { f: (tt: number) => Math.exp(-0.5 * tt) * Math.sin(2 * tt), F: (s: number) => T.dampedSin(0.5, 2)(cx(s)).re, a: -0.5 },
  ];
  const extra = [null, null, { f: (tt: number) => Math.cos(2 * tt), F: (s: number) => T.cos(2)(cx(s)).re }, { f: (tt: number) => Math.exp(-0.5 * tt) * Math.cos(2 * tt), F: (s: number) => dampedCos(0.5, 2)(cx(s)).re }];
  const derived = new Set<number>([0]);
  let cur = 0;
  let shownRow = -1;
  let s = 1;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const tbody = h('tbody');
  const tableEl = h('table', { class: 'ltable' }, h('caption', { class: 'visually-hidden' }, t('caption')), h('thead', null, h('tr', null, h('th', { scope: 'col' }, t('colSignal')), h('th', { scope: 'col' }, t('colF')), h('th', { scope: 'col' }, h('span', { class: 'visually-hidden' }, t('colCheck'))))), tbody);
  const grid = h('div', { class: 'w-grid side' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  left.append(tableEl);
  host.append(grid);
  const plot = new Plot(right, {
    x: { label: tc('plots.time'), min: 0, max: PROBE_T },
    y: { label: '', min: -1.2, max: 1.4 },
    series: [
      { id: 'f', color: 'out', label: t('f') },
      { id: 'prod', color: 'ink', label: t('product'), width: 2.4 },
    ],
    height: 220,
    label: t('plotAria'),
  }, ctx.onCleanup);
  shadeOverlay(plot, () => (tt) => rows[cur].f(tt) * Math.exp(-s * tt), () => PROBE_T);
  const steps = h('div', { class: 'derivation', id: uid('derivation') });
  const rNum = readout(t('numeric'));
  const rFor = readout(t('formulaVal'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  right.append(h('div', { class: 'readouts' }, rNum.el, rFor.el), status);
  const render = (focusRow = -1) => {
    tbody.replaceChildren();
    rows.forEach((_, i) => {
      const done = derived.has(i);
      // not a toggle: the button opens that row's derivation below, and marks the row being shown
      const btn = h('button', { class: 'btn small', type: 'button', 'aria-current': i === cur ? 'true' : undefined, 'aria-controls': steps.id }, done ? t('show') : t('derive'));
      btn.addEventListener('click', () => {
        derived.add(i);
        cur = i;
        render(i);
        update();
      });
      const F = done ? h('td', { html: tex(t(`rows.${i}.F`)) }) : h('td', null, h('span', { 'aria-hidden': 'true' }, '?'), h('span', { class: 'visually-hidden' }, t('unknown')));
      tbody.append(h('tr', { class: i === cur ? 'current' : '' }, h('td', { html: tex(t(`rows.${i}.f`)) }), F, h('td', null, btn)));
      // the row is re-drawn, so keep keyboard focus on the button that was pressed
      if (i === focusRow) btn.focus();
    });
  };
  const update = () => {
    const r = rows[cur];
    const d = sample(r.f, PROBE_T, 300);
    plot.set('f', d.xs, d.ys);
    const q = sample((tt) => r.f(tt) * Math.exp(-s * tt), PROBE_T, 300);
    plot.set('prod', q.xs, q.ys);
    const num = laplaceReal(r.f, s, Math.min(200, 40 / (s - r.a)), 20000);
    const form = r.F(s);
    rNum.set(fmt(num, 4));
    const ok = Math.abs(num - form) < 1e-3;
    rFor.set(fmt(form, 4), ok ? 'good' : 'bad');
    const ex = extra[cur];
    // the words follow the same test as the readout's colour
    status.textContent = !ok ? t('differ') : ex ? t('twinCheck', { n: fmt(laplaceReal(ex.f, s, Math.min(200, 40 / (s - r.a)), 20000), 4), f: fmt(ex.F(s), 4) }) : t('agree');
    const list = (t(`rows.${cur}.steps`) || '').split('||');
    if (shownRow !== cur) {
      shownRow = cur;
      steps.replaceChildren(h('p', { class: 'w-subtitle' }, t('how')), ...list.map((st) => h('div', { class: 'math-block', html: tex(st, true) })));
    }
    plot.describe(t('describe', { n: fmt(num, 4), f: fmt(form, 4) }));
  };
  const sl = slider({ label: t('s'), min: 0.2, max: 3, step: 0.05, value: s, onInput: (v) => ((s = v), update()) });
  host.append(h('div', { class: 'w-controls' }, sl.el), steps);
  render();
  update();
};

/** 9d — solve the drone with the transform and compare with the simulation. */
const solve: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  mark(host);
  let kp = 20;
  let h0 = 1;
  // ?reveal shows the page's swap maths in their fixed form, so the widget starts fixed too
  let ic = new URLSearchParams(location.search).has('reveal');
  const T1 = 6;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const plot = new Plot(host, {
    x: { label: tc('plots.time'), min: 0, max: T1 },
    y: { label: tc('plots.height'), min: 0, max: 3.6 },
    series: [
      { id: 'sim', color: 'out', label: t('sim'), width: 4, ghost: true },
      { id: 'formula', color: 'ink', label: t('formula'), dash: [7, 5], width: 2 },
    ],
    height: 260,
    label: t('plotAria'),
  }, ctx.onCleanup);
  plot.setLines([{ kind: 'h', at: 2, color: 'sp', label: t('target') }]);
  const eqH = h('div', { class: 'math-block' });
  const eqT = h('div', { class: 'math-block' });
  const rGap = readout(t('gap'));
  const rZero = readout(t('atZero'));
  const rSettle = readout(t('settle'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  // when the h(0) fix is switched on/off the formula curve glides onto its new shape
  let shownF: number[] = [];
  let morphing = 0;
  let animateNext = false;
  const morphFormula = (xs: number[], f: number[]) => {
    cancelAnimationFrame(morphing);
    const from = shownF.length === f.length ? shownF : f;
    if (!animateNext || prefersReducedMotion() || from === f) {
      shownF = f;
      plot.set('formula', xs, f);
      return;
    }
    animateNext = false;
    const t0 = performance.now();
    const DUR = 520;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / DUR);
      const e = 1 - Math.pow(1 - k, 3);
      shownF = f.map((v, i) => from[i] + (v - from[i]) * e);
      plot.set('formula', xs, shownF);
      if (k < 1) morphing = requestAnimationFrame(step);
    };
    morphing = requestAnimationFrame(step);
  };
  const update = () => {
    const p = { m: DRONE.m, c: DRONE.c, g: DRONE.g, kp, r: 2, h0, v0: 0 };
    const sol = solveDrone(p, ic);
    const sim = new DroneSim(defaultDroneConfig({ pid: P_ONLY(kp), h0 }));
    const xs = [0];
    const ys = [sim.h];
    sim.advance(T1, () => {
      xs.push(sim.t);
      ys.push(sim.h);
    }, 10);
    plot.set('sim', xs, ys);
    const f = xs.map(sol.f);
    morphFormula(xs, f);
    let gap = 0;
    xs.forEach((_, i) => (gap = Math.max(gap, Math.abs(ys[i] - f[i]))));
    rGap.set(`${fmt(gap, gap < 0.01 ? 6 : 2)} ${unitLabel('m')}`, gap < 1e-3 ? 'good' : 'bad');
    rZero.set(`${fmt(ys[0], 2)} / ${fmt(f[0], 2)} ${unitLabel('m')}`);
    // Chapter 2's look: dotted blue "settles here" line at A, red droop band up to the target
    const droop = 2 - sol.A;
    plot.setDroop({ target: 2, settle: sol.A, label: t('droop', { d: fmt(droop, 3) }), labelAt: 'end', labelSide: 'below', avoid: ['sim', 'formula'] });
    rSettle.set(`${fmt(sol.A, 3)} ${unitLabel('m')}`);
    // numerator terms that are zero (from the ground, or with the fix switched off) are left out
    const terms = ic ? [DRONE.m * h0 !== 0 ? `${fmt(DRONE.m * h0, 2)}s^2` : '', DRONE.c * h0 !== 0 ? `${fmt(DRONE.c * h0, 2)}s` : ''].filter(Boolean) : [];
    const num = [...terms, fmt(kp * 2 - DRONE.m * DRONE.g, 3)].join(' + ');
    eqH.innerHTML = tex(
      `\\begin{aligned} \\out{H}(s) &= \\frac{${num}}{s\\,(${fmt(DRONE.m, 1)}s^2 + s + \\eff{${fmt(kp, 0)}})} \\\\[4pt] &= \\frac{${fmt(sol.A, 3)}}{s} + \\frac{${fmt(sol.B, 3)}\\,s ${sol.C >= 0 ? '+' : '-'} ${fmt(Math.abs(sol.C), 3)}}{${fmt(DRONE.m, 1)}s^2 + s + \\eff{${fmt(kp, 0)}}} \\end{aligned}`,
      true,
    );
    const decay = sol.sigma === 1 ? '-t' : `-${fmt(sol.sigma, 2)}t`;
    const osc = `e^{${decay}}\\big(${fmt(sol.K1, 3)}\\cos ${fmt(sol.wd, 2)}t ${sol.K2 >= 0 ? '+' : '-'} ${fmt(Math.abs(sol.K2), 3)}\\sin ${fmt(sol.wd, 2)}t\\big)`;
    // on narrow screens the solution breaks onto two aligned lines instead of scrolling sideways
    eqT.innerHTML = tex(
      host.clientWidth < 560 ? `\\begin{aligned} \\out{h}(t) &= ${fmt(sol.A, 3)} \\\\ &\\quad + ${osc} \\end{aligned}` : `\\out{h}(t) = ${fmt(sol.A, 3)} + ${osc}`,
      true,
    );
    // from the ground the forgotten terms are zero, so the mistake hides: say so rather than "perfect"
    const text = gap < 1e-3 ? (ic ? `${t('match')} ${t('fixed')}` : t('hidden')) : ic ? t('odd') : t('mismatch', { h: fmt(h0, 1) });
    status.textContent = text;
    status.className = `w-status${gap < 1e-3 && ic ? ' good' : gap < 1e-3 ? '' : ' bad'}`;
    plot.describe(status.textContent);
  };
  const sk = slider({ label: t('kp'), min: 5, max: 60, step: 1, value: kp, unit: 'N/m', color: 'eff', onInput: (v) => ((kp = v), update()) });
  const sh = slider({ label: t('h0'), min: 0, max: 3, step: 0.1, value: h0, unit: 'm', color: 'out', onInput: (v) => ((h0 = v), update()) });
  onInteractStart(sk.input, () => plot.clear(true));
  onInteractStart(sh.input, () => plot.clear(true));
  const tg = toggle(t('toggle'), ic, (v) => {
    ic = v;
    animateNext = true;
    ctx.bus.emit('ch7:ic', v);
    update();
  });
  host.append(
    eqH,
    eqT,
    h('div', { class: 'w-row fix-row' }, tg.el),
    h('div', { class: 'w-controls' }, sk.el, sh.el),
    h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rGap.el, rZero.el, rSettle.el)),
    status,
    h('p', { class: 'w-help' }, t('rk4')),
  );
  update();
  return () => cancelAnimationFrame(morphing);
};

/** 9c: undoing a common denominator. Two table pieces, their sum in time, and the one fraction they add up to. */
const pieces: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  mark(host);
  let [A, B, C] = [1, -1, -1];
  const T1 = 6;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const eq = h('div', { class: 'math-block pieces-eq' });
  host.append(eq);
  const plot = new Plot(host, {
    x: { label: tc('plots.time'), min: 0, max: T1 },
    y: { label: t('y'), min: -1.5, max: 2.5 },
    series: [
      { id: 'step', color: 'ink2', label: t('stepPiece'), dash: [6, 4], width: 2 },
      { id: 'wig', color: 'ink3', label: t('wigglePiece'), dash: [2, 4], width: 2 },
      { id: 'sum', color: 'out', label: t('sum') },
    ],
    height: 230,
    label: t('plotAria'),
  }, ctx.onCleanup);
  plot.setLines([{ kind: 'h', at: 0, color: 'ink3', dash: [2, 3], width: 1 }]);
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const num = (v: number) => fmt(v, Number.isInteger(v) ? 0 : 1);
  /** a polynomial in s as people write it: no zero terms, no "1 s", signs between terms */
  const poly = (cs: number[]): string => {
    const deg = cs.length - 1;
    const terms = cs
      .map((k, i) => ({ k, p: deg - i }))
      .filter(({ k }) => k !== 0)
      .map(({ k, p }, j) => {
        const mag = Math.abs(k) === 1 && p > 0 ? '' : num(Math.abs(k));
        const pow = p === 0 ? '' : p === 1 ? 's' : `s^${p}`;
        const sign = k < 0 ? '-' : j ? '+' : '';
        return `${sign} ${mag}${mag && pow ? '\\,' : ''}${pow}`;
      });
    return terms.length ? terms.join(' ').trim() : '0';
  };
  const say = () => {
    const [a2, a1, a0] = combinedTop(A, B, C);
    const text = t('status', { A: num(A), top: `${num(a2)}, ${num(a1)}, ${num(a0)}` });
    if (status.textContent !== text) status.textContent = text;
  };
  const draw = () => {
    const [a2, a1, a0] = combinedTop(A, B, C);
    eq.innerHTML = tex(
      `\\frac{${poly([A])}}{s} + \\frac{${poly([B, C])}}{s^2 + 2s + 5}\\;\\;\\longleftrightarrow\\;\\; \\frac{${poly([a2, a1, a0])}}{s\\,(s^2 + 2s + 5)}`,
      true,
    );
    const step = stepPiece(A);
    const wig = wigglePiece(B, C);
    const d = sample(step, T1, 300);
    plot.set('step', d.xs, d.ys);
    const w = sample(wig, T1, 300);
    plot.set('wig', w.xs, w.ys);
    const u = sample((x) => step() + wig(x), T1, 300);
    plot.set('sum', u.xs, u.ys);
    plot.describe(t('describe', { A: num(A), B: num(B), C: num(C) }));
  };
  const mk = (key: string, v: number, set: (x: number) => void) =>
    slider({ label: t(key), min: -2, max: 2, step: 0.5, value: v, onInput: (x) => (set(x), draw()), onSettle: say });
  const sA = mk('A', A, (x) => (A = x));
  const sB = mk('B', B, (x) => (B = x));
  const sC = mk('C', C, (x) => (C = x));
  host.append(h('div', { class: 'w-controls' }, sA.el, sB.el, sC.el), status, h('p', { class: 'w-help' }, t('help')));
  draw();
  say();
};

export const widgets: Record<string, WidgetFactory> = { derivRule, table: tableW, pieces, solve };
