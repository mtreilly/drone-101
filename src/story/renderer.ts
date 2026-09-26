import { h, prefersReducedMotion, uid } from '../core/dom';
import { tc, translator } from '../core/i18n';
import { progress } from '../core/progress';
import { plainText, setRich, tex } from '../core/rich-text';
import { avatar } from './characters';
import { conceptMap } from './concept-map';
import { type PlayModel, renderPlay } from './play';
import { hasSketch, sketch } from './sketches';
import type { Block, Bus, ChapterContent, Option, WidgetFactory } from './types';

export interface RenderEnv {
  chapter: number;
  ns: string;
  content: ChapterContent;
  widgets: Record<string, WidgetFactory>;
  plays: Record<string, PlayModel>;
  bus: Bus;
  cleanups: (() => void)[];
  /** set once the chapter's first playable sentence has its "drag me" hint */
  hinted?: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function renderChapter(env: RenderEnv): HTMLElement {
  const { content } = env;
  const page = h('article', { class: `page chapter ch-${env.chapter}` });
  page.append(
    h(
      'header',
      { class: 'chapter-head' },
      h('div', { class: 'kicker' }, content.kicker),
      h('h1', { id: 'chapter-title' }, content.title),
      setRich(h('p', { class: 'driving-q' }), content.question),
    ),
  );
  for (const section of content.sections) {
    const sec = h('section', { id: section.id, 'aria-labelledby': `${section.id}-h` });
    if (section.title) sec.append(setRich(h('h2', { id: `${section.id}-h` }), section.title));
    let target: HTMLElement = sec;
    for (const block of section.blocks) {
      const el = renderBlock(block, env);
      target.append(el);
      if (block.t === 'predict' && block.gate) {
        const gated = h('div', { class: 'gated', hidden: true });
        target.append(gated);
        const id = block.id;
        const open = () => {
          gated.hidden = false;
        };
        // ?reveal opens every gate (lets automated accessibility checks see gated widgets)
        if (progress.get().predictions[id] !== undefined || new URLSearchParams(location.search).has('reveal')) open();
        env.cleanups.push(env.bus.on(`predict:${id}`, open));
        target = gated;
      }
    }
    page.append(sec);
  }
  revealDialogue(page, env);
  return page;
}

/** Dialogue lines rise in as they scroll into view, a beat apart, once. */
function revealDialogue(page: HTMLElement, env: RenderEnv): void {
  if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
  const lines = [...page.querySelectorAll<HTMLElement>('.say')];
  lines.forEach((l) => l.classList.add('reveal-pending'));
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
      visible.sort((a, b) => lines.indexOf(a) - lines.indexOf(b));
      visible.forEach((el, i) => {
        io.unobserve(el);
        el.style.animationDelay = `${i * 90}ms`;
        el.classList.remove('reveal-pending');
        el.classList.add('revealed');
      });
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  lines.forEach((l) => io.observe(l));
  env.cleanups.push(() => io.disconnect());
}

function renderBlock(b: Block, env: RenderEnv): HTMLElement {
  switch (b.t) {
    case 'p':
      return setRich(h('p'), b.text);
    case 'h3':
      return setRich(h('h3'), b.text);
    case 'list': {
      const list = h(b.ordered ? 'ol' : 'ul');
      b.items.forEach((i) => list.append(setRich(h('li'), i)));
      return list;
    }
    case 'say': {
      const right = b.who === 'theo';
      return h(
        'div',
        { class: `say ${b.who}${right ? ' right' : ''}${b.think ? ' think' : ''}` },
        h('div', { class: 'avatar' }, avatar(b.who, b.mood), h('span', { class: 'name' }, tc(`cast.${b.who}`))),
        setRich(h('div', { class: 'bubble' }), b.text),
      );
    }
    case 'note':
      return setRich(h('p', { class: `note${b.aside ? ' aside' : ''}` }), b.text);
    case 'math':
      return mathBlock(b, env);
    case 'widget':
      return mountWidget(b.id, b.caption, b.wide ?? true, env);
    case 'predict':
      return predictCard(b.id, b.q, b.options, env);
    case 'vocab':
      return h(
        'div',
        { class: 'card vocab' },
        h('div', { class: 'card-title' }, b.title ?? tc('story.vocab')),
        h(
          'dl',
          null,
          b.items.map((i) => [setRich(h('dt'), i.term), setRich(h('dd'), i.def)]),
        ),
      );
    case 'recap':
      return h(
        'div',
        { class: 'recap' },
        h('div', { class: 'card-title' }, b.title ?? tc('story.recap')),
        h(
          'ul',
          null,
          b.items.map((i) => setRich(h('li'), i)),
        ),
      );
    case 'quiz':
      return quizCard(b.title ?? tc('story.check'), b.items, env);
    case 'cliff':
      return setRich(h('p', { class: 'cliff' }), b.text);
    case 'play': {
      // only the chapter's first playable sentence says "drag me"
      const hint = !env.hinted ? tc('story.dragHint') : undefined;
      env.hinted = true;
      return renderPlay(h('p'), b.id, b.text, env.plays[b.id], { t: translator(env.ns, `plays.${b.id}`), bus: env.bus, cleanups: env.cleanups, hint });
    }
    case 'callout': {
      const id = uid('trip');
      const box = h(
        'div',
        { class: 'side-trip', role: 'note', 'aria-labelledby': id },
        h('div', { class: 'side-trip-kicker', 'aria-hidden': 'true' }, tc('story.sideTrip')),
        setRich(h('div', { class: 'side-trip-title', id }), b.title),
      );
      // the "drag me" hint belongs on the main path, never inside a side trip
      const hinted = env.hinted;
      env.hinted = true;
      for (const inner of b.blocks) box.append(renderBlock(inner, env));
      env.hinted = hinted;
      return box;
    }
    case 'map':
      return h('div', { class: 'widget wide' }, conceptMap({ upTo: env.chapter, highlight: env.chapter, compact: true }));
  }
}

/**
 * A display formula. With `alt` + `on` it is an on-page mistake that gets fixed: the first form
 * shows until bus event `on` fires, then `alt` (a `false` payload swaps back, as a toggle does).
 * `?reveal` shows the fixed form straight away, like it opens the prediction gates. Both forms
 * share one grid cell, so the block keeps the taller one's height and the page never jumps
 * under the reader's hand. The widget that fires the event says what changed in its status line.
 */
function mathBlock(b: Extract<Block, { t: 'math' }>, env: RenderEnv): HTMLElement {
  const swappable = b.alt !== undefined && !!b.on;
  const el = h('div', { class: `math-block${swappable ? ' swaps' : ''}` });
  const forms = swappable ? [b.tex, b.alt!].map((src) => h('div', { class: 'math-form', html: tex(src, true) })) : [];
  if (swappable) el.append(...forms);
  else el.innerHTML = tex(b.tex, true);
  // only a block that actually scrolls needs to be focusable (keyboard scrolling)
  const fitFocus = () =>
    requestAnimationFrame(() => {
      if (el.scrollWidth > el.clientWidth + 1) {
        el.tabIndex = 0;
        el.setAttribute('role', 'region');
        el.setAttribute('aria-label', plainText(swappable ? forms[fixed ? 1 : 0] : el));
      } else {
        el.removeAttribute('tabindex');
        el.removeAttribute('role');
        el.removeAttribute('aria-label');
      }
    });
  let fixed = swappable && new URLSearchParams(location.search).has('reveal');
  const show = () => {
    forms.forEach((f, i) => (f.hidden = (i === 1) !== fixed));
    el.dataset.form = fixed ? 'alt' : 'first';
  };
  if (swappable) {
    show();
    env.cleanups.push(
      env.bus.on(b.on!, (payload) => {
        const next = payload !== false;
        if (next === fixed) return;
        fixed = next;
        show();
        fitFocus();
        const f = forms[fixed ? 1 : 0];
        f.classList.remove('swapped');
        void f.offsetWidth; // restart the short "this changed" cue
        f.classList.add('swapped');
      }),
    );
  }
  fitFocus();
  return el;
}

function mountWidget(id: string, caption: string | undefined, wide: boolean, env: RenderEnv): HTMLElement {
  const host = h('div', { class: 'widget-frame' });
  const fig = h('div', { class: `widget${wide ? ' wide' : ''}`, 'data-widget': id }, host);
  if (caption) fig.append(setRich(h('p', { class: 'widget-caption' }), caption));
  const factory = env.widgets[id];
  if (!factory) {
    console.error(`Missing widget: ${id}`);
    host.append(h('p', { class: 'widget-error' }, tc('app.interactiveUnavailable')));
    return fig;
  }
  // mount after insertion so layout-dependent widgets can measure themselves
  queueMicrotask(() => {
    try {
      const cleanup = factory(host, {
        t: translator(env.ns, `widgets.${id}`),
        tch: translator(env.ns),
        chapter: env.chapter,
        id,
        bus: env.bus,
      });
      if (cleanup) env.cleanups.push(cleanup);
    } catch (err) {
      console.error(err);
      host.append(h('p', { class: 'widget-error' }, tc('app.interactiveUnavailable')));
    }
  });
  return fig;
}

function optionButton(o: Option, i: number, sketchMode: boolean): HTMLButtonElement {
  const btn = h('button', { class: 'option', type: 'button', 'aria-pressed': 'false' });
  btn.append(h('span', { class: 'letter', 'aria-hidden': 'true' }, LETTERS[i]));
  if (sketchMode && o.sketch && hasSketch(o.sketch)) btn.append(sketch(o.sketch));
  const text = setRich(h('span', { class: 'option-text' }), o.text);
  btn.append(text);
  if (text.querySelector('.katex')) btn.setAttribute('aria-label', `${LETTERS[i]}: ${plainText(text)}`);
  return btn;
}

function predictCard(id: string, q: string, options: Option[], env: RenderEnv): HTMLElement {
  const sketchMode = options.some((o) => o.sketch);
  const card = h('div', { class: 'card predict', role: 'group', 'aria-labelledby': `${id}-q` });
  card.append(h('div', { class: 'card-title' }, tc('story.predict')));
  card.append(setRich(h('p', { id: `${id}-q`, class: 'predict-q' }), q));
  const list = h('div', { class: `options${sketchMode ? ' sketches' : ''}` });
  const fb = h('div', { class: 'feedback', hidden: true, 'aria-live': 'polite' });
  const buttons = options.map((o, i) => optionButton(o, i, sketchMode));
  const hasCorrect = options.some((o) => o.correct);
  const choose = (i: number, silent = false) => {
    buttons.forEach((b, j) => {
      b.disabled = true;
      b.setAttribute('aria-pressed', String(i === j));
      if (hasCorrect && options[j].correct) b.classList.add('correct');
      else if (i === j && hasCorrect) b.classList.add('wrong');
    });
    const o = options[i];
    const verdict = !hasCorrect ? tc('story.predictLocked') : o.correct ? tc('story.predictRight') : tc('story.predictSurprise');
    const cls = !hasCorrect ? '' : o.correct ? 'good' : 'surprise';
    fb.hidden = false;
    fb.replaceChildren(h('div', { class: `verdict ${cls}` }, verdict), setRich(h('p'), o.why));
    if (hasCorrect && !o.correct) {
      const right = options.find((x) => x.correct);
      if (right) fb.append(setRich(h('p', { class: 'also' }), right.why));
    }
    if (!silent) {
      progress.predict(id, i);
      env.bus.emit(`predict:${id}`, { choice: i, correct: !!o.correct });
    }
  };
  buttons.forEach((b, i) => b.addEventListener('click', () => choose(i)));
  list.append(...buttons);
  card.append(list, fb);
  const prev = progress.get().predictions[id];
  if (prev !== undefined && prev < options.length) {
    choose(prev, true);
    const again = h('button', { class: 'btn small', type: 'button' }, tc('story.predictAgain'));
    again.addEventListener('click', () => {
      buttons.forEach((b) => {
        b.disabled = false;
        b.classList.remove('correct', 'wrong');
        b.setAttribute('aria-pressed', 'false');
      });
      fb.hidden = true;
      again.remove();
    });
    card.append(again);
  }
  return card;
}

function quizCard(title: string, items: { id: string; q: string; options: Option[] }[], env: RenderEnv): HTMLElement {
  const card = h('div', { class: 'card quiz' });
  card.append(h('div', { class: 'card-title' }, title));
  const solved = new Set<string>();
  const score = h('p', { class: 'quiz-score', 'aria-live': 'polite' });
  const wasComplete = progress.isComplete(env.chapter);
  let stamped = false;
  const updateScore = () => {
    score.textContent = tc('story.quizScore', { n: solved.size, total: items.length });
    if (solved.size === items.length) {
      score.textContent += ` ${tc('story.quizDone')}`;
      progress.complete(env.chapter);
      if (!stamped) {
        stamped = true;
        // a rubber stamp lands on the card; it animates only when earned just now
        const stamp = h('div', { class: `stamp${wasComplete ? '' : ' fresh'}`, 'aria-hidden': 'true' }, tc('story.completeStamp'));
        card.append(stamp);
        if (!wasComplete) {
          const live = document.getElementById('app-announcer');
          if (live) live.textContent = tc('story.completeAnnounce', { n: env.chapter });
        }
      }
    }
  };
  items.forEach((item, qi) => {
    const wrap = h('div', { class: 'quiz-item', role: 'group', 'aria-labelledby': `${item.id}-q` });
    wrap.append(setRich(h('p', { class: 'quiz-q', id: `${item.id}-q` }), `${qi + 1}. ${item.q}`));
    const sketchMode = item.options.some((o) => o.sketch);
    const list = h('div', { class: `options${sketchMode ? ' sketches' : ''}` });
    const fb = h('div', { class: 'feedback', hidden: true, 'aria-live': 'polite' });
    const buttons = item.options.map((o, i) => optionButton(o, i, sketchMode));
    const pick = (i: number) => {
      const o = item.options[i];
      buttons[i].classList.add(o.correct ? 'correct' : 'wrong');
      buttons.forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
      if (o.correct) buttons.forEach((b) => (b.disabled = true));
      fb.hidden = false;
      fb.replaceChildren(
        h('div', { class: `verdict ${o.correct ? 'good' : 'bad'}` }, o.correct ? tc('story.quizRight') : tc('story.quizWrong')),
        setRich(h('p'), o.why),
      );
      if (o.correct) {
        solved.add(item.id);
        progress.answer(item.id, i);
        updateScore();
      }
    };
    buttons.forEach((b, i) => b.addEventListener('click', () => pick(i)));
    list.append(...buttons);
    wrap.append(list, fb);
    card.append(wrap);
    const prev = progress.get().quiz[item.id];
    if (prev !== undefined && item.options[prev]?.correct) pick(prev);
  });
  card.append(score);
  updateScore();
  return card;
}
