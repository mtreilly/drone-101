import { h, prefersReducedMotion } from '../core/dom';
import { tc, translator } from '../core/i18n';
import { progress } from '../core/progress';
import { plainText, setRich, tex } from '../core/rich-text';
import { avatar } from './characters';
import { conceptMap } from './concept-map';
import { hasSketch, sketch } from './sketches';
import type { Block, Bus, ChapterContent, Option, WidgetFactory } from './types';

export interface RenderEnv {
  chapter: number;
  ns: string;
  content: ChapterContent;
  widgets: Record<string, WidgetFactory>;
  bus: Bus;
  cleanups: (() => void)[];
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function renderChapter(env: RenderEnv): HTMLElement {
  const { content } = env;
  const page = h('article', { class: 'page chapter' });
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
        if (progress.get().predictions[id] !== undefined) open();
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
      return h('div', { class: 'math-block', html: tex(b.tex, true) });
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
    case 'callout':
      return h('div', { class: 'card callout' }, setRich(h('div', { class: 'card-title' }), b.title), setRich(h('p'), b.text));
    case 'map':
      return h('div', { class: 'widget wide' }, conceptMap({ upTo: env.chapter, highlight: env.chapter, compact: true }));
  }
}

function mountWidget(id: string, caption: string | undefined, wide: boolean, env: RenderEnv): HTMLElement {
  const host = h('div', { class: 'widget-frame' });
  const fig = h('div', { class: `widget${wide ? ' wide' : ''}`, 'data-widget': id }, host);
  if (caption) fig.append(setRich(h('p', { class: 'widget-caption' }), caption));
  const factory = env.widgets[id];
  if (!factory) {
    host.append(h('p', { class: 'widget-error' }, `Missing widget: ${id}`));
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
      host.append(h('p', { class: 'widget-error' }, String(err)));
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
  const updateScore = () => {
    score.textContent = tc('story.quizScore', { n: solved.size, total: items.length });
    if (solved.size === items.length) {
      score.textContent += ` ${tc('story.quizDone')}`;
      progress.complete(env.chapter);
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
