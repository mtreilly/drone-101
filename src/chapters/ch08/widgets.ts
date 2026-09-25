import { h, s as svg } from '../../core/dom';
import { fmt, tc } from '../../core/i18n';
import { tex } from '../../core/rich-text';
import { stepMetrics } from '../../math/metrics';
import { DRONE, DroneSim, HOVER_THRUST, defaultDroneConfig, type PID } from '../../sim/drone-model';
import type { WidgetFactory } from '../../story/types';
import { readout, segmented, slider, toggle } from '../../ui/controls';
import { DroneView } from '../../ui/drone-view';
import { Loop } from '../../ui/loop';
import { Plot } from '../../ui/plot';
import { SPlane, formatS } from '../../ui/s-plane';
import { keepCase, sample } from '../ch06/helpers';
import './ch08.css';
import { gainsFromPoles, noZeroResponse, overshootOf, settleOf, stepFromPoles, zeroResponse, zetaOf } from './poles';

const { m, c } = DRONE;
const pd = (kp: number, kd: number): PID => ({ kp, ki: 0, kd, ff: HOVER_THRUST, dTau: 0, dOnMeasurement: true, antiWindup: false });

/** 8a — the same recipe G(s) turns any input into an output: Y = G·R. */
const recipe: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const KP = 20;
  const T1 = 8;
  type In = 'step' | 'pulse' | 'wave';
  let input: In = 'step';
  const setpoints: Record<In, (tt: number) => number> = {
    step: () => 2,
    pulse: (tt) => 2 - Math.exp(-2 * tt),
    wave: (tt) => 1 + 0.5 * Math.sin(2 * tt),
  };
  const R: Record<In, string> = {
    step: '\\frac{1}{s}',
    pulse: '\\frac{1}{s} - \\frac{1}{s+2}',
    wave: '\\frac{0.5\\cdot 2}{s^2 + 4}',
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
  const view = new DroneView(right, { hMax: 3, width: 200 });
  const eq = h('div', { class: 'math-block' });
  host.append(eq);
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
    sim.advance(T1, () => {
      ts.push(sim.t);
      hs.push(sim.h);
      rs.push(sp(sim.t));
      thr.push(sim.thrust);
    }, 20);
    plot.set('r', ts, rs);
    plot.set('h', ts, hs);
    eq.innerHTML = tex(`\\out{Y}(s) = \\underbrace{\\frac{\\eff{20}}{0.5s^2 + s + \\eff{20}}}_{G(s)\\ \\text{${t('same')}}} \\cdot \\underbrace{${R[input]}}_{\\sp{R}(s)\\ \\text{${t('changes')}}}`, true);
    plot.describe(t(`describe.${input}`));
    playT = 0;
    if (Loop.autoplay) loop.play();
    else view.update({ h: hs[hs.length - 1], r: rs[rs.length - 1], thrust: thr[thr.length - 1] });
  };
  run();
  return () => loop.destroy();
};

/** 8b — the centrepiece: drag the poles, everything else follows. */
const playground: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const T1 = 6;
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
    imMax: 7,
    label: t('planeAria'),
    regions: true,
    step: 0.1,
    onChange: (p) => {
      re = p.re;
      im = Math.max(0, p.im);
      if (Math.hypot(re, im) < 0.15) {
        re = -0.15;
        plane.move('p', re, im);
      }
      update();
    },
  });
  // guides: settling-time lines, overshoot rays, the challenge zone
  const zone = svg('polygon', { class: 'challenge-zone' });
  plane.deco.append(zone);
  {
    // keep guides inside the plane
    const clipId = `clip-${Math.random().toString(36).slice(2, 8)}`;
    const box = plane.svg.viewBox.baseVal;
    plane.svg.prepend(svg('defs', null, svg('clipPath', { id: clipId }, svg('rect', { x: 0, y: 0, width: box.width, height: box.height }))));
    plane.deco.setAttribute('clip-path', `url(#${clipId})`);
  }
  for (const [r, lab] of [
    [-1, '4 s'],
    [-2, '2 s'],
    [-4, '1 s'],
  ] as [number, string][]) {
    const x = plane.sx(r);
    const y = plane.sy(-4.2);
    plane.deco.append(
      svg('line', { class: 'guide', x1: x, x2: x, y1: plane.sy(7), y2: plane.sy(-7) }),
      svg('text', { class: 'guide-label', x: x - 4, y, transform: `rotate(-90 ${x - 4} ${y})`, 'text-anchor': 'middle' }, `${t('settles')} ≈ ${lab}`),
    );
  }
  for (const [z, lab] of [
    [0.2, '53%'],
    [0.5, '16%'],
    [0.7, '5%'],
  ] as [number, string][]) {
    const th = Math.acos(z);
    const L = 14;
    const x2 = -L * Math.cos(th);
    const y2 = L * Math.sin(th);
    for (const sgn of [1, -1]) plane.deco.append(svg('line', { class: 'guide ray', x1: plane.sx(0), y1: plane.sy(0), x2: plane.sx(x2), y2: plane.sy(sgn * y2) }));
    const yl = 6.3;
    const xl = -yl / Math.tan(th);
    plane.deco.append(svg('text', { class: 'guide-label', x: plane.sx(xl) - 4, y: plane.sy(yl), 'text-anchor': 'end' }, lab));
  }
  plane.deco.append(svg('text', { class: 'guide-label', x: plane.sx(-9.8), y: plane.sy(-5.6) }, t('raysLegend')));
  const wLine = svg('line', { class: 'guide wiggle' });
  const wLabel = svg('text', { class: 'guide-label', 'text-anchor': 'end' });
  plane.deco.append(wLine, wLabel);
  plane.set([{ id: 'p', re, im, kind: 'pole', mirror: true, draggable: true, label: t('pole') }]);

  const top = h('div', { class: 'w-grid two' });
  const vbox = h('div');
  const rbox = h('div');
  top.append(vbox, rbox);
  right.append(top);
  const view = new DroneView(vbox, { hMax: 3, width: 190 });
  const rP = readout(t('poles'));
  const rTs = readout(t('settle'));
  const rOs = readout(t('overshoot'));
  const rKp = readout('Kp', 'eff');
  const rKd = readout('Kd', 'eff');
  [rKp, rKd, rTs].forEach((r) => keepCase(r.el));
  rbox.append(h('div', { class: 'readouts stack' }, rP.el, rTs.el, rOs.el, rKp.el, rKd.el));
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
  host.append(eq, status);
  const chal = toggle(t('challenge'), false, (v) => {
    zone.style.display = v ? '' : 'none';
    challengeStatus.hidden = !v;
    update();
  });
  host.append(chal.el, challengeStatus, h('p', { class: 'w-help' }, t('help')));
  zone.style.display = 'none';
  challengeStatus.hidden = true;
  {
    // overshoot < 10% ⇔ ζ > 0.591; settling < 2 s ⇔ σ > 2
    const tanT = Math.tan(Math.acos(0.591));
    const y1 = 2 * tanT;
    const xClip = -7 / tanT;
    const pts: [number, number][] = [
      [-2, y1],
      [xClip, 7],
      [-10, 7],
      [-10, -7],
      [xClip, -7],
      [-2, -y1],
    ];
    zone.setAttribute('points', pts.map(([x, y]) => `${plane.sx(x)},${plane.sy(y)}`).join(' '));
  }
  let resp = { xs: [] as number[], ys: [] as number[] };
  let f = stepFromPoles(re, im);
  let playT = 0;
  const loop = new Loop((dt) => {
    playT += dt;
    if (playT > T1 + 1) playT = 0;
    const tt = Math.min(playT, T1);
    const hNow = f(tt);
    const v = (f(tt + 1e-4) - f(Math.max(0, tt - 1e-4))) / (tt > 0 ? 2e-4 : 1e-4);
    const { kp, kd } = gainsFromPoles(re, im);
    const crashed = hNow <= 0 && tt > 0;
    view.update({ h: crashed ? 0 : hNow, r: 2, thrust: HOVER_THRUST + kp * (2 - hNow) - kd * v, crashed });
    plot.setCursor(tt);
  }, host);
  const svgEl = plane.svg;
  svgEl.addEventListener('pointerdown', () => plot.clear(true));
  let lastKey = 0;
  svgEl.addEventListener('keydown', () => {
    if (performance.now() - lastKey > 700) plot.clear(true);
    lastKey = performance.now();
  });
  function update(): void {
    f = stepFromPoles(re, im);
    resp = sample(f, T1, 400);
    plot.set('h', resp.xs, resp.ys);
    const { kp, kd } = gainsFromPoles(re, im);
    const ts = settleOf(re);
    const os = overshootOf(re, im);
    rP.set(formatS(re, im, true));
    rTs.set(Number.isFinite(ts) ? `≈ ${fmt(ts, 1)} s` : t('never'));
    rOs.set(Number.isFinite(os) ? `${fmt(os, 0)} %` : '∞');
    rKp.set(`${fmt(kp, 1)} N/m`);
    rKd.set(`${fmt(kd, 2)} N·s/m`);
    const cd = c + kd;
    eq.innerHTML = tex(
      `\\frac{\\out{H}(s)}{\\sp{R}(s)} = \\frac{\\eff{K_p}}{m s^2 + (c + \\eff{K_d})\\,s + \\eff{K_p}} = \\frac{\\eff{${fmt(kp, 1)}}}{${fmt(m, 1)}s^2 ${cd >= 0 ? '+' : '-'} ${fmt(Math.abs(cd), 2)}s + \\eff{${fmt(kp, 1)}}} = \\frac{${fmt(kp / m, 1)}}{(s - p)(s - \\bar p)},\\quad p = ${formatS(re, im).replace('i', '\\,i')}`,
      true,
    );
    const w = im;
    wLine.setAttribute('x1', String(plane.sx(-10)));
    wLine.setAttribute('x2', String(plane.sx(4)));
    wLine.setAttribute('y1', String(plane.sy(w)));
    wLine.setAttribute('y2', String(plane.sy(w)));
    wLine.style.display = w > 0.05 ? '' : 'none';
    wLabel.setAttribute('x', String(plane.sx(4) - 4));
    wLabel.setAttribute('y', String(plane.sy(w) - 4));
    wLabel.textContent = w > 0.05 ? t('wiggle', { T: fmt((2 * Math.PI) / w, 2) }) : '';
    const verdict = re < -0.02 ? 'stable' : re > 0.02 ? 'unstable' : 'marginal';
    status.textContent = t(`verdict.${verdict}`);
    status.className = `w-status${verdict === 'stable' ? ' good' : verdict === 'unstable' ? ' bad' : ''}`;
    const zeta = zetaOf(re, im);
    if (!challengeStatus.hidden) {
      const tsReal = stepMetrics(resp.xs, resp.ys, 1, 2).settlingTime;
      const osReal = stepMetrics(resp.xs, resp.ys, 1, 2).overshoot;
      const ok = verdict === 'stable' && osReal < 10 && tsReal < 2;
      challengeStatus.textContent = ok ? t('chalOk', { o: fmt(osReal, 1), s: fmt(tsReal, 2) }) : t('chalNo', { o: fmt(osReal, 0), s: Number.isNaN(tsReal) ? '—' : fmt(tsReal, 2) });
      challengeStatus.className = `w-status${ok ? ' good' : ''}`;
    }
    plane.describe();
    plot.describe(t('describe', { p: formatS(re, im, true), s: Number.isFinite(ts) ? fmt(ts, 1) : '∞', o: Number.isFinite(os) ? fmt(os, 0) : '∞', z: fmt(zeta, 2) }));
    playT = 0;
  }
  update();
  if (Loop.autoplay) loop.play();
  const off = ctx.bus.on('predict:ch8-rhp', () => {
    plane.move('p', 0.6, 3);
    re = 0.6;
    im = 3;
    plot.clear(true);
    update();
  });
  return () => {
    off();
    loop.destroy();
  };
};

/** 8c — a zero: same poles, extra kick. */
const zero: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
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
  const plot = new Plot(right, {
    x: { label: tc('plots.time'), min: 0, max: T1 },
    y: { label: t('y'), min: 0, max: 2.5 },
    series: [
      { id: 'ref', color: 'pencil', label: t('noZero'), dash: [6, 4], width: 2 },
      { id: 'y', color: 'out', label: t('withZero'), ghost: true },
    ],
    height: 240,
    label: t('plotAria'),
  });
  plot.setLines([{ kind: 'h', at: 1, color: 'sp' }]);
  const ref = sample(noZeroResponse, T1, 400);
  plot.set('ref', ref.xs, ref.ys);
  const rA = readout(t('osNo'));
  const rB = readout(t('osYes'));
  const eq = h('div', { class: 'math-block' });
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  right.append(h('div', { class: 'readouts' }, rA.el, rB.el), status);
  host.append(eq);
  const osNo = stepMetrics(ref.xs, ref.ys, 0, 1).overshoot;
  rA.set(`${fmt(osNo, 1)} %`);
  plane.svg.addEventListener('pointerdown', () => plot.clear(true));
  function update(): void {
    const d = sample(zeroResponse(z), T1, 400);
    plot.set('y', d.xs, d.ys);
    const os = stepMetrics(d.xs, d.ys, 0, 1).overshoot;
    rB.set(`${fmt(os, 1)} %`, os > osNo + 1 ? 'bad' : '');
    eq.innerHTML = tex(`T(s) = \\frac{13}{${fmt(-z, 2)}}\\cdot\\frac{s + ${fmt(-z, 2)}}{s^2 + 4s + 13}\\qquad(\\text{${t('zeroAt')}}\\ s = ${fmt(z, 2)})`, true);
    status.textContent = z > -1.5 ? t('near') : z < -8 ? t('far') : t('mid');
    plot.describe(t('describe', { z: fmt(z, 2), o: fmt(os, 0) }));
  }
  update();
};

/** 8d — "further left is always better?" — not with real motors. */
const limit: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const T1 = 3;
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
    y: { label: tc('plots.thrust'), min: -40, max: 80 },
    series: [
      { id: 'ideal', color: 'pencil', label: t('idealT'), dash: [6, 4], width: 2 },
      { id: 'real', color: 'eff', label: t('realT') },
    ],
    height: 230,
    label: t('tAria'),
  });
  tp.setLines([
    { kind: 'h', at: 20, color: 'ink3', label: t('max') },
    { kind: 'h', at: 0, color: 'ink3', label: t('min') },
  ]);
  const rPeak = readout(t('peak'), 'eff');
  const rTsI = readout(t('tsIdeal'));
  const rTsR = readout(t('tsReal'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const run = (sat: boolean, kp: number, kd: number) => {
    const sim = new DroneSim(defaultDroneConfig({ params: { ...DRONE, saturate: sat }, pid: pd(kp, kd), h0: 1 }));
    const xs = [0];
    const hs = [sim.h];
    const th = [sim.thrust];
    sim.advance(T1, () => {
      xs.push(sim.t);
      hs.push(sim.h);
      th.push(sim.thrust);
    }, 10);
    return { xs, hs, th };
  };
  const update = () => {
    const { kp, kd } = gainsFromPoles(-sig, sig);
    const I = run(false, kp, kd);
    const R = run(real, kp, kd);
    hp.set('ideal', I.xs, I.hs);
    hp.set('real', R.xs, R.hs);
    tp.set('ideal', I.xs, I.th);
    tp.set('real', R.xs, R.th);
    const peak = Math.max(...I.th);
    rPeak.set(`${fmt(peak, 0)} N`, peak > 20 ? 'bad' : 'good');
    const mi = stepMetrics(I.xs, I.hs, 1, 2);
    const mr = stepMetrics(R.xs, R.hs, 1, 2);
    rTsI.set(Number.isNaN(mi.settlingTime) ? '—' : `${fmt(mi.settlingTime, 2)} s`);
    rTsR.set(Number.isNaN(mr.settlingTime) ? t('notYet') : `${fmt(mr.settlingTime, 2)} s`);
    status.textContent = real && peak > 20 ? t('capped', { p: fmt(peak, 0) }) : peak > 20 ? t('fantasy', { p: fmt(peak, 0) }) : t('fine');
    status.className = `w-status${real && peak > 20 ? ' bad' : ''}`;
    hp.describe(status.textContent);
  };
  const sl = slider({ label: t('sigma'), min: 1, max: 8, step: 0.5, value: sig, unit: '', format: (v) => `−${fmt(v, 1)} ± ${fmt(v, 1)}i`, onInput: (v) => ((sig = v), update()) });
  const tg = toggle(t('toggle'), real, (v) => ((real = v), update()));
  host.append(h('div', { class: 'readouts' }, rPeak.el, rTsI.el, rTsR.el), status, h('div', { class: 'w-controls' }, sl.el), tg.el);
  update();
};

export const widgets: Record<string, WidgetFactory> = { recipe, playground, zero, limit };
