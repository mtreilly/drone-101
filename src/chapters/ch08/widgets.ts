import { h, s as svg } from '../../core/dom';
import { fmt, tc } from '../../core/i18n';
import { tex } from '../../core/rich-text';
import { regionPath } from '../../math/region';
import { stepMetrics } from '../../math/metrics';
import { DRONE, DroneSim, defaultDroneConfig } from '../../sim/drone-model';
import { followPlay } from '../../story/play';
import type { WidgetFactory } from '../../story/types';
import { readout, segmented, slider, toggle } from '../../ui/controls';
import { DroneView } from '../../ui/drone-view';
import { Loop } from '../../ui/loop';
import { Plot } from '../../ui/plot';
import { SPlane, formatS } from '../../ui/s-plane';
import { caption, mark, sample } from '../ch06/helpers';
import './ch08.css';
import { fallSim, fallTrace } from './fall';
import { LIMIT_T, bestRealSettling, limitRun, pd } from './limit';
import {
  CHALLENGE,
  PLAY_T,
  budgetRadius,
  challengeOk,
  challengeZone,
  firstPush,
  gainsFromPoles,
  measuredMetrics,
  noZeroResponse,
  noZeroSlope,
  overshootOf,
  playgroundTrace,
  recipeGain,
  settleOf,
  stateAt,
  verdictOf,
  zeroResponse,
  zetaOf,
} from './poles';

const { m, c } = DRONE;

/** 8a — G(s) maps setpoint changes to height changes around the 1 m hover. */
const recipe: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  mark(host);
  const KP = 20;
  const T1 = 8;
  type In = 'step' | 'pulse' | 'wave';
  let input: In = 'step';
  const setpoints: Record<In, (tt: number) => number> = {
    step: () => 2,
    pulse: (tt) => 2 - Math.exp(-2 * tt),
    wave: (tt) => 1 + 0.5 * Math.sin(2 * tt),
  };
  // each input's change from the 1 m hover, in time and in s-land (Chapter 7's table)
  const R: Record<In, string> = {
    step: '\\frac{1}{s}',
    pulse: '\\frac{1}{s} - \\frac{1}{s+2}',
    wave: `\\frac{${fmt(0.5, 1)}\\cdot 2}{s^2 + 4}`,
  };
  const r: Record<In, string> = {
    step: '1',
    pulse: '1 - e^{-2t}',
    wave: `${fmt(0.5, 1)}\\sin 2t`,
  };
  host.append(h('p', { class: 'w-title' }, t('title')));
  const seg = segmented(
    t('choose'),
    (['step', 'pulse', 'wave'] as In[]).map((v) => ({ value: v, label: t(`in.${v}`) })),
    input,
    (v) => {
      input = v;
      run();
    },
  );
  const grid = h('div', { class: 'w-grid side-r' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(seg.el, grid);
  const plot = new Plot(left, {
    x: { label: tc('plots.time'), min: 0, max: T1 },
    y: { label: tc('plots.height'), min: 0, max: 3 },
    series: [
      { id: 'r', color: 'sp', label: t('input'), dash: [6, 4], width: 2 },
      { id: 'h', color: 'out', label: t('output'), ghost: true },
    ],
    height: 240,
    label: t('plotAria'),
  });
  right.append(caption(t('droneCap')));
  const view = new DroneView(right, { hMax: 3, width: 200 });
  const eq = h('div', { class: 'math-block' });
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  host.append(eq, status);
  let hs: number[] = [];
  let rs: number[] = [];
  let ts: number[] = [];
  let thr: number[] = [];
  let playT = 0;
  const loop = new Loop((dt) => {
    playT += dt;
    if (playT > T1 + 1) playT = 0;
    const i = Math.min(ts.length - 1, Math.round((Math.min(playT, T1) / T1) * (ts.length - 1)));
    view.update({ h: hs[i], r: rs[i], thrust: thr[i] });
    plot.setCursor(Math.min(playT, T1));
  }, host);
  const run = () => {
    plot.clear(true);
    const sp = setpoints[input];
    const sim = new DroneSim(defaultDroneConfig({ pid: pd(KP, 0), h0: 1, setpoint: sp }));
    ts = [0];
    hs = [sim.h];
    rs = [sp(0)];
    thr = [sim.thrust];
    let peak = sim.h;
    let k = 0;
    sim.advance(T1, () => {
      peak = Math.max(peak, sim.h);
      if (++k % 20) return;
      ts.push(sim.t);
      hs.push(sim.h);
      rs.push(sp(sim.t));
      thr.push(sim.thrust);
    }, 1);
    plot.set('r', ts, rs);
    plot.set('h', ts, hs);
    const under = `\\substack{\\Delta\\sp{R}(s)\\ \\text{${t('changes')}} \\\\ \\Delta\\sp{r}(t) = ${r[input]}}`;
    eq.innerHTML = tex(`\\Delta\\out{H}(s) = \\underbrace{\\frac{\\eff{20}}{${fmt(0.5, 1)}s^2 + s + \\eff{20}}}_{G(s)\\ \\text{${t('same')}}} \\cdot \\underbrace{${R[input]}}_{${under}}`, true);
    // the wave's steady output amplitude is 0.5·|G(2i)|; the steps report their measured peak
    status.textContent = input === 'wave' ? t('status.wave', { a: fmt(0.5, 2), b: fmt(0.5 * recipeGain(2), 2) }) : t(`status.${input}`, { p: fmt(peak, 2) });
    plot.describe(`${t(`describe.${input}`)} ${status.textContent}`);
    playT = 0;
    if (Loop.autoplay) loop.play();
    else view.update({ h: hs[hs.length - 1], r: rs[rs.length - 1], thrust: thr[thr.length - 1] });
  };
  run();
  return () => loop.destroy();
};

let zoneCache: string | null = null;

/**
 * Where the ωn circle's label goes (degrees, for `SPlane.setCircle`): the first spot that stays on the
 * playground's map (σ −10…4, ω ±8) and keeps well away from both poles, which ride the circle.
 * Below the positive real axis first (the right half is otherwise empty), then above the negative
 * one; `undefined` puts it under the circle's lowest point. 195° is the budget circle's label.
 */
function circleLabelAt(r: number, re: number, im: number): number | undefined {
  const pole = (Math.atan2(im, re) * 180) / Math.PI;
  const far = (a: number) => [pole, -pole].every((p) => Math.abs(((a - p + 540) % 360) - 180) > 35);
  const room = 2.4; // label width in plane units, roughly
  const fits = (a: number) => {
    const x = r * Math.cos((a * Math.PI) / 180);
    const y = r * Math.sin((a * Math.PI) / 180);
    // anchored away from the circle: to the right of the point on the right, to the left on the left
    const x0 = x > 0 ? x : x - room;
    const x1 = x > 0 ? x + room : x;
    return x0 > -10 && x1 < 4 && Math.abs(y) < 7.2;
  };
  // 205° is below the budget circle's label (195°): skip it when the two circles nearly meet
  const spots = [-25, 155, 205, 135].filter((a) => a !== 205 || Math.abs(r - budgetRadius(1)) > 1);
  return spots.find((a) => far(a) && fits(a));
}

/** 8b — the centrepiece: drag the poles, everything else follows. */
const playground: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  mark(host);
  const T1 = PLAY_T;
  let re = -1;
  let im = Math.sqrt(39);
  host.append(h('p', { class: 'w-title' }, t('title')));
  const grid = h('div', { class: 'w-grid two' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(grid);
  const plane = new SPlane(left, {
    reMin: -10,
    reMax: 4,
    imMax: 8,
    label: t('planeAria'),
    reLabel: t('re'),
    imLabel: t('im'),
    regions: true,
    step: 0.1,
    onChange: (p) => {
      re = p.re;
      im = Math.max(0, p.im);
      pushTrail(re, im);
      if (Math.hypot(re, im) < 0.15) {
        re = -0.15;
        plane.move('p', re, im);
      }
      update();
    },
  });
  // built-in guides (locale-aware labels): settling lines, constant-ζ rays with their overshoot
  plane.setSettleLines([1, 2, 4]);
  plane.setRays([0.2, 0.5, 0.7]);
  // our own guides: the challenge zone, the 20 N budget circle, the wiggle line and the trail
  const zone = svg('path', { class: 'challenge-zone', 'fill-rule': 'evenodd' });
  const R20 = budgetRadius(1);
  const budget = svg('circle', { class: 'budget', cx: plane.sx(0), cy: plane.sy(0), r: plane.sx(R20) - plane.sx(0) });
  // its label sits just outside it, below the negative real axis (the wiggle line only lives above)
  const ba = (195 * Math.PI) / 180;
  const budgetLabel = svg('text', { class: 'guide-label budget-label', x: plane.sx(R20 * Math.cos(ba)) - 5, y: plane.sy(R20 * Math.sin(ba)), dy: '0.9em', 'text-anchor': 'end' }, t('budget'));
  plane.deco.append(zone, budget, budgetLabel);
  {
    // keep guides inside the plane
    const clipId = `clip-${Math.random().toString(36).slice(2, 8)}`;
    const box = plane.svg.viewBox.baseVal;
    plane.svg.prepend(svg('defs', null, svg('clipPath', { id: clipId }, svg('rect', { x: 0, y: 0, width: box.width, height: box.height }))));
    plane.deco.setAttribute('clip-path', `url(#${clipId})`);
  }
  const wLine = svg('line', { class: 'guide wiggle' });
  const wLabel = svg('text', { class: 'guide-label wiggle-label', 'text-anchor': 'start' });
  // a faint trail of where the poles have just been; it fades once you let go
  const trail = svg('polyline', { class: 'pole-trail' });
  const trailTwin = svg('polyline', { class: 'pole-trail' });
  plane.deco.append(wLine, wLabel, trail, trailTwin);
  let trailPts: [number, number][] = [];
  let trailTimer = 0;
  function pushTrail(r: number, i: number): void {
    trailPts.push([r, i]);
    if (trailPts.length > 40) trailPts.shift();
    trail.setAttribute('points', trailPts.map(([x, y]) => `${plane.sx(x)},${plane.sy(y)}`).join(' '));
    trailTwin.setAttribute('points', trailPts.map(([x, y]) => `${plane.sx(x)},${plane.sy(-y)}`).join(' '));
    trail.classList.add('on');
    trailTwin.classList.add('on');
    clearTimeout(trailTimer);
    trailTimer = window.setTimeout(() => {
      trail.classList.remove('on');
      trailTwin.classList.remove('on');
      trailPts = [];
    }, 900);
  }
  plane.set([{ id: 'p', re, im, kind: 'pole', mirror: true, draggable: true }]);

  const top = h('div', { class: 'pair-grid map-pair' });
  const vbox = h('div');
  const rbox = h('div');
  top.append(vbox, rbox);
  right.append(top);
  // an unstable drone can fly out of its picture into the page; the hit stalls it and it falls (see fall.ts)
  const view = new DroneView(vbox, { hMax: 3, width: 180, onCeiling: () => hitPage() });
  const rP = readout(t('poles'));
  const rZ = readout(t('zeta'));
  const rW = readout(t('wn'));
  const rOs = readout(t('overshoot'));
  const rTs = readout(t('settle'));
  const rTm = readout(t('settleReal'));
  const rKp = readout('Kp', 'eff');
  const rKd = readout('Kd', 'eff');
  const rPush = readout(t('push'), 'eff');
  rbox.append(h('div', { class: 'readouts map-readouts' }, rP.el, rZ.el, rW.el, rOs.el, rTs.el, rTm.el));
  const plot = new Plot(right, {
    x: { label: tc('plots.time'), min: 0, max: T1 },
    y: { label: tc('plots.height'), min: -0.5, max: 4 },
    series: [{ id: 'h', color: 'out', label: t('response'), ghost: true }],
    height: 210,
    label: t('plotAria'),
  });
  plot.setLines([{ kind: 'h', at: 2, color: 'sp', label: t('target') }]);
  const eq = h('div', { class: 'math-block' });
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const challengeStatus = h('p', { class: 'w-status', 'aria-live': 'polite' });
  host.append(h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rKp.el, rKd.el, rPush.el)), eq, status);
  const chal = toggle(t('challenge'), false, (v) => {
    zone.style.display = v ? '' : 'none';
    challengeStatus.hidden = !v;
    if (v && !zoneCache) {
      // worked out once, the first time the challenge is switched on (a fraction of a second)
      zoneCache = regionPath(challengeZone(0.1), (x) => plane.sx(x), (y) => plane.sy(y));
    }
    if (zoneCache) zone.setAttribute('d', zoneCache);
    update(false);
  });
  host.append(h('div', { class: 'w-row fix-row' }, chal.el), challengeStatus, h('p', { class: 'w-help' }, t('help')));
  zone.style.display = 'none';
  challengeStatus.hidden = true;
  let trace = playgroundTrace(re, im);
  let playT = 0;
  // the state at the latest frame, and (after hitting the page) the stalled fall that replaces the formula
  let now = { t: 0, h: 0, v: 0 };
  let fall: { sim: DroneSim; t0: number; carry: number } | null = null;
  let verdict = verdictOf(re);
  function hitPage(): void {
    if (fall) return;
    fall = { sim: fallSim(now.h, now.v), t0: now.t, carry: 0 };
    // the plot shows what really happened: the formula up to the hit, then the fall
    const tr = fallTrace(now.h, now.v);
    const keep = trace.xs.findIndex((x) => x > now.t);
    const xs = [...trace.xs.slice(0, keep < 0 ? undefined : keep), ...tr.t.map((x) => now.t + x)];
    const ys = [...trace.ys.slice(0, keep < 0 ? undefined : keep), ...tr.h];
    plot.set('h', xs, ys);
    status.textContent = `${t(`verdict.${verdict}`)} ${t(verdict === 'marginal' ? 'verdict.hitPageMarginal' : 'verdict.hitPage')}`;
    status.className = 'w-status bad';
    plot.describe(status.textContent);
  }
  const loop = new Loop((dt) => {
    if (fall) {
      fall.carry += dt;
      const n = Math.floor(fall.carry / fall.sim.dt + 1e-9);
      fall.carry -= n * fall.sim.dt;
      for (let i = 0; i < n && !fall.sim.landed; i++) fall.sim.step();
      view.update({ h: fall.sim.h, r: 2, thrust: 0, crashed: fall.sim.crashed });
      plot.setCursor(Math.min(T1, fall.t0 + fall.sim.t));
      // it stays where it fell until you move the poles
      if (fall.sim.landed) loop.pause();
      return;
    }
    playT += dt;
    if (playT > T1 + 1) playT = 0;
    const tt = Math.min(playT, T1);
    // down on the ground from the touchdown on (the plot is cut there too), until the replay restarts
    const st = stateAt(trace, tt, re, im);
    now = { t: tt, h: st.h, v: st.v };
    view.update({ h: st.h, r: 2, thrust: st.thrust, crashed: st.crashed });
    plot.setCursor(tt);
  }, host);
  const svgEl = plane.svg;
  svgEl.addEventListener('pointerdown', () => plot.clear(true));
  let lastKey = 0;
  svgEl.addEventListener('keydown', () => {
    if (performance.now() - lastKey > 700) plot.clear(true);
    lastKey = performance.now();
  });
  /** `restart` false: only the words change (the challenge switched), the replay keeps going */
  function update(restart = true): void {
    if (restart) {
      fall = null;
      if (Loop.autoplay && !loop.playing) loop.play();
      trace = playgroundTrace(re, im);
      plot.set('h', trace.xs, trace.ys);
      playT = 0;
    }
    const { kp, kd } = gainsFromPoles(re, im);
    const ts = settleOf(re);
    const os = overshootOf(re, im);
    const zeta = zetaOf(re, im);
    const wn = Math.hypot(re, im);
    const mm = measuredMetrics(re, im);
    const push = firstPush(re, im);
    verdict = verdictOf(re);
    rP.set(formatS(re, im, true));
    rZ.set(fmt(zeta, 2));
    rW.set(fmt(wn, 2));
    rTs.set(Number.isFinite(ts) ? `≈ ${fmt(ts, 1)} s` : t('never'));
    rTm.set(verdict !== 'stable' ? t('never') : Number.isNaN(mm.settlingTime) ? t('notIn', { T: fmt(T1, 0) }) : `${fmt(mm.settlingTime, 2)} s`);
    rOs.set(Number.isFinite(os) ? t('pct', { v: fmt(os, 0) }) : '∞');
    rKp.set(`${fmt(kp, 1)} N/m`);
    rKd.set(`${fmt(kd, 2)} N·s/m`);
    rPush.set(`${fmt(push, 1)} N`, push > 20 ? 'bad' : '');
    // the ωn circle through the pole (Chapter 6): every point on it has the same |p|
    plane.setCircle(wn > 0.3 ? wn : null, t('wnCircle', { w: fmt(wn, 2) }), circleLabelAt(wn, re, im));
    const cd = c + kd;
    const lhs = `\\frac{\\Delta\\out{H}(s)}{\\Delta\\sp{R}(s)}`;
    const general = `\\frac{\\eff{K_p}}{m s^2 + (c + \\eff{K_d})\\,s + \\eff{K_p}}`;
    const numeric = `\\frac{\\eff{${fmt(kp, 1)}}}{${fmt(m, 1)}s^2 ${cd >= 0 ? '+' : '-'} ${fmt(Math.abs(cd), 2)}s + \\eff{${fmt(kp, 1)}}}`;
    const factored = `\\frac{${fmt(kp / m, 1)}}{(s - p)(s - \\bar p)},\\quad p = ${formatS(re, im).replace('i', '\\,i')}`;
    // wide screens: one line; narrow screens: aligned steps instead of a sideways scroll
    eq.innerHTML = tex(
      host.clientWidth < 760
        ? `\\begin{aligned} ${lhs} &= ${general} \\\\[4pt] &= ${numeric} \\\\[4pt] &= ${factored} \\end{aligned}`
        : `${lhs} = ${general} = ${numeric} = ${factored}`,
      true,
    );
    const w = im;
    wLine.setAttribute('x1', String(plane.sx(-10)));
    wLine.setAttribute('x2', String(plane.sx(4)));
    wLine.setAttribute('y1', String(plane.sy(w)));
    wLine.setAttribute('y2', String(plane.sy(w)));
    wLine.style.display = w > 0.05 ? '' : 'none';
    // sit the label at the left edge, clear of the pole marker and axis names; high up it hangs
    // under the line, out of the ray labels along the top edge
    wLabel.setAttribute('x', String(plane.sx(-10) + 6));
    // (and never inside the band the ray labels hang in along the top edge)
    wLabel.setAttribute('y', String(w > 5.2 ? Math.max(plane.sy(w) + 16, plane.sy(8) + 56) : plane.sy(w) - 6));
    wLabel.textContent = w > 0.05 ? t('wiggle', { T: fmt((2 * Math.PI) / w, 2) }) : '';
    // the status tells the whole story of this replay: where it lives, the ground, odd gains, thrust
    const words = [t(`verdict.${verdict}`)];
    if (trace.at !== null) words.push(t('verdict.hitGround'));
    if (kd < -1e-9) words.push(t('negKd'));
    if (push > 20) words.push(t('pushWarn'));
    if (!fall) {
      status.textContent = words.join(' ');
      status.className = `w-status${verdict === 'stable' ? ' good' : verdict === 'unstable' ? ' bad' : ''}`;
    }
    if (!challengeStatus.hidden) {
      const ok = challengeOk(re, im);
      const s = Number.isNaN(mm.settlingTime) ? '—' : fmt(mm.settlingTime, 2);
      challengeStatus.textContent = ok ? t('chalOk', { o: fmt(mm.overshoot, 1), s }) : t('chalNo', { o: fmt(mm.overshoot, 0), s, O: fmt(CHALLENGE.os, 0), S: fmt(CHALLENGE.ts, 0) });
      challengeStatus.className = `w-status${ok ? ' good' : ''}`;
    }
    plane.describe();
    plot.describe(t('describe', { p: formatS(re, im, true), s: Number.isFinite(ts) ? fmt(ts, 1) : '∞', o: Number.isFinite(os) ? fmt(os, 0) : '∞', z: fmt(zeta, 2) }));
    // reduced motion: no replay, so the picture pins the state at the end of the plotted window
    // (clipped to its frame, the readout still true) and agrees with the plot's last point
    if (!Loop.autoplay) {
      const st = stateAt(trace, T1, re, im);
      view.update({ h: st.h, r: 2, thrust: st.thrust, crashed: st.crashed });
    }
  }
  update();
  if (Loop.autoplay) loop.play();
  const moveTo = (r: number, i: number) => {
    plane.move('p', r, i);
    re = r;
    im = i;
    update();
  };
  const offs = [
    ctx.bus.on('predict:ch8-rhp', () => {
      plot.clear(true);
      moveTo(0.6, 3);
    }),
    // "straight up": the pair at σ = 2 moves from ±4i to ±8i, the old one stays as a ghost
    ctx.bus.on('predict:ch8-up', () => {
      moveTo(-2, 4);
      plane.ghost();
      plot.clear(true);
      moveTo(-2, 8);
    }),
    // the "gains" sentence moves the poles it talks about
    followPlay(ctx.bus, 'gains', ({ sig, w }) => {
      plot.clear(true);
      moveTo(-sig, w);
    }),
  ];
  return () => {
    offs.forEach((off) => off());
    clearTimeout(trailTimer);
    loop.destroy();
  };
};

/** 8c — a zero: same poles, extra kick. */
const zero: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  mark(host);
  const T1 = 4;
  let z = -3;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const grid = h('div', { class: 'w-grid two' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(grid);
  const plane = new SPlane(left, {
    reMin: -12,
    reMax: 2,
    imMax: 5,
    label: t('planeAria'),
    reLabel: t('re'),
    imLabel: t('im'),
    step: 0.1,
    onChange: (p) => {
      z = Math.min(-0.3, p.re);
      if (p.re > -0.3) plane.move('z', z, 0);
      update();
    },
  });
  plane.set([
    { id: 'p', re: -2, im: 3, kind: 'pole', mirror: true },
    { id: 'z', re: z, im: 0, kind: 'zero', draggable: true, realOnly: true },
  ]);
  // the y-axis grows to fit the kick (a zero near 0 overshoots over 500 %), so the curve never leaves its plot
  const plot = new Plot(right, {
    x: { label: tc('plots.time'), min: 0, max: T1 },
    y: { label: t('y'), min: 0, max: 2.5, autoMax: true, autoMin: true },
    series: [
      { id: 'ref', color: 'pencil', label: t('noZero'), dash: [6, 4], width: 2 },
      { id: 'slope', color: 'out', label: t('slope', { g: fmt(1 / 3, 2) }), dash: [1, 5], width: 2 },
      { id: 'y', color: 'out', label: t('withZero'), ghost: true },
    ],
    height: 240,
    label: t('plotAria'),
  });
  plot.setLines([{ kind: 'h', at: 1, color: 'sp' }]);
  const slopeLegend = plot.el.querySelectorAll('.plot-legend-item')[1]?.lastChild ?? null;
  const ref = sample(noZeroResponse, T1, 400);
  plot.set('ref', ref.xs, ref.ys);
  const rA = readout(t('osNo'));
  const rB = readout(t('osYes'));
  const eq = h('div', { class: 'math-block' });
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  right.append(h('div', { class: 'readouts' }, rA.el, rB.el), status);
  host.append(eq, h('p', { class: 'w-help' }, t('help')));
  const osNo = stepMetrics(ref.xs, ref.ys, 0, 1).overshoot;
  rA.set(t('pct', { v: fmt(osNo, 1) }));
  plane.svg.addEventListener('pointerdown', () => plot.clear(true));
  const trim = (v: number) => fmt(v, Math.abs(v * 10 - Math.round(v * 10)) < 1e-9 ? (Number.isInteger(v) ? 0 : 1) : 2);
  function update(): void {
    const g = -1 / z;
    const d = sample(zeroResponse(z), T1, 400);
    plot.set('y', d.xs, d.ys);
    // the with-zero curve is the no-zero curve plus (1/|z|) × its slope: draw that slope part
    const sl = sample((tt) => g * noZeroSlope(tt), T1, 400);
    plot.set('slope', sl.xs, sl.ys);
    if (slopeLegend) slopeLegend.textContent = t('slope', { g: fmt(g, 2) });
    const os = stepMetrics(d.xs, d.ys, 0, 1).overshoot;
    rB.set(t('pct', { v: fmt(os, 1) }), os > osNo + 1 ? 'bad' : '');
    const zz = trim(-z);
    eq.innerHTML = tex(`G(s) = \\frac{13}{${zz}}\\cdot\\frac{s + ${zz}}{s^2 + 4s + 13}\\qquad(\\text{${t('zeroAt')}}\\ s = ${trim(z)};\\ \\text{${t('scaled')}})`, true);
    status.textContent = t(z > -1.5 ? 'near' : z < -8 ? 'far' : 'mid', { g: fmt(g, 2) });
    plot.describe(t('describe', { z: fmt(z, 2), o: fmt(os, 0) }));
  }
  update();
};

/** 8d — "further left is always better?" — not with real motors. */
const limit: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  mark(host);
  const T1 = LIMIT_T;
  let sig = 2;
  let real = true;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const grid = h('div', { class: 'w-grid two' });
  const a = h('div');
  const b = h('div');
  grid.append(a, b);
  host.append(grid);
  const hp = new Plot(a, {
    x: { label: tc('plots.time'), min: 0, max: T1 },
    y: { label: tc('plots.height'), min: 0.5, max: 2.8 },
    series: [
      { id: 'ideal', color: 'pencil', label: t('ideal'), dash: [6, 4], width: 2 },
      { id: 'real', color: 'out', label: t('real') },
    ],
    height: 230,
    label: t('hAria'),
  });
  hp.setLines([{ kind: 'h', at: 2, color: 'sp' }]);
  const tp = new Plot(b, {
    x: { label: tc('plots.time'), min: 0, max: T1 },
    y: { label: tc('plots.thrust'), min: -40, max: 80, extraTicks: [20] },
    series: [
      { id: 'ideal', color: 'pencil', label: t('idealT'), dash: [6, 4], width: 2 },
      { id: 'real', color: 'eff', label: t('realT') },
    ],
    height: 230,
    label: t('tAria'),
  });
  // "can't pull down" sits under the 0 N line, in the band no curve reaches unless the maths goes negative
  tp.setLines([
    { kind: 'h', at: 20, color: 'ink3', label: t('max'), avoid: ['real', 'ideal'] },
    { kind: 'h', at: 0, color: 'ink3', label: t('min'), labelAt: 'start', labelSide: 'below', avoid: ['real', 'ideal'] },
  ]);
  const rPeak = readout(t('peak'), 'eff');
  const rTsI = readout(t('tsIdeal'));
  const rTsR = readout(t('tsReal'));
  const rOsR = readout(t('osReal'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const update = () => {
    const I = limitRun(sig, false);
    const R = limitRun(sig, real);
    hp.set('ideal', I.xs, I.hs);
    hp.set('real', R.xs, R.hs);
    tp.set('ideal', I.xs, I.th);
    tp.set('real', R.xs, R.th);
    const peak = Math.max(...I.th);
    rPeak.set(`${fmt(peak, 0)} N`, peak > 20 ? 'bad' : 'good');
    rTsI.set(Number.isNaN(I.m.settlingTime) ? '—' : `${fmt(I.m.settlingTime, 2)} s`);
    rTsR.set(Number.isNaN(R.m.settlingTime) ? t('notYet') : `${fmt(R.m.settlingTime, 2)} s`);
    rOsR.set(t('pct', { v: fmt(R.m.overshoot, 1) }), R.m.overshoot > I.m.overshoot + 1 ? 'bad' : '');
    const best = bestRealSettling();
    status.textContent =
      real && peak > 20
        ? t('capped', { p: fmt(peak, 0), s: fmt(R.m.settlingTime, 2), b: fmt(best.ts, 2) })
        : peak > 20
          ? t('fantasy', { p: fmt(peak, 0) })
          : t('fine');
    status.className = `w-status${real && peak > 20 ? ' bad' : ''}`;
    hp.describe(status.textContent);
  };
  const sl = slider({ label: t('sigma'), min: 1, max: 8, step: 0.5, value: sig, unit: '', format: (v) => `−${fmt(v, 1)} ± ${fmt(v, 1)}i`, onInput: (v) => ((sig = v), update()) });
  const tg = toggle(t('toggle'), real, (v) => ((real = v), update()));
  host.append(h('div', { class: 'w-controls limit-controls' }, sl.el, tg.el), h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rPeak.el, rTsI.el, rTsR.el, rOsR.el)), status);
  update();
};

export const widgets: Record<string, WidgetFactory> = { recipe, playground, zero, limit };
