import { CHAPTERS, CHAPTER_COUNT } from '../chapters/registry';
import { avatar, type Who } from '../story/characters';
import { conceptMap } from '../story/concept-map';
import { renderChapter } from '../story/renderer';
import { createBus, type ChapterContent } from '../story/types';
import { h } from './dom';
import { loadNamespace, raw, tc } from './i18n';
import { progress } from './progress';
import { setRich } from './rich-text';
import { applyTheme, getTheme, type ThemeChoice } from './theme';

let cleanups: (() => void)[] = [];
let main: HTMLElement;
let strip: HTMLElement;
let drawerList: HTMLElement;
let bar: HTMLElement;

const ICONS = {
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  map: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="7" r="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="7" r="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="18" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 9l2.3 6.3M15.5 9l-2.3 6.3M9 7h6" stroke="currentColor" stroke-width="2"/></svg>',
  legend: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h4M4 12h4M4 17h4" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M11 7h9M11 12h9M11 17h9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
  light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
};

export async function startApp(root: HTMLElement): Promise<void> {
  applyTheme(getTheme());
  await loadNamespace('common');
  document.title = tc('app.title');
  root.append(buildShell());
  window.addEventListener('hashchange', route);
  progress.subscribe(updateNav);
  await route();
}

function buildShell(): DocumentFragment {
  const frag = document.createDocumentFragment();
  const skip = h('a', { class: 'skip-link', href: '#main' }, tc('nav.skip'));
  skip.addEventListener('click', (e) => {
    e.preventDefault();
    main.focus();
  });
  strip = h('ol', { class: 'chapter-strip', 'aria-label': tc('nav.chapters') });
  drawerList = h('ol');
  const drawer = h('nav', { class: 'drawer', id: 'drawer', hidden: true, 'aria-label': tc('nav.chapters') });
  const scrim = h('div', { class: 'scrim', hidden: true });
  const closeDrawer = () => {
    drawer.hidden = true;
    scrim.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
  };
  const menuBtn = h('button', { class: 'icon-btn menu-btn', type: 'button', 'aria-controls': 'drawer', 'aria-expanded': 'false', 'aria-label': tc('nav.menu'), html: ICONS.menu });
  menuBtn.addEventListener('click', () => {
    drawer.hidden = false;
    scrim.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
    (drawer.querySelector('a') as HTMLElement | null)?.focus();
  });
  scrim.addEventListener('click', closeDrawer);
  drawer.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      menuBtn.focus();
    }
  });
  drawer.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) closeDrawer();
  });
  const closeBtn = h('button', { class: 'icon-btn', type: 'button' }, tc('nav.close'));
  closeBtn.addEventListener('click', () => {
    closeDrawer();
    menuBtn.focus();
  });
  drawer.append(h('div', { class: 'w-row', style: { justifyContent: 'space-between' } }, h('strong', null, tc('nav.chapters')), closeBtn), drawerList, h('a', { href: '#/map' }, tc('nav.map')));

  const legend = h('div', { class: 'legend-pop', id: 'legend', hidden: true, role: 'dialog', 'aria-label': tc('legend.title') }, legendContent());
  const legendBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-controls': 'legend', 'aria-expanded': 'false', html: `${ICONS.legend}<span class="btn-label">${tc('legend.button')}</span>` });
  legendBtn.setAttribute('aria-label', tc('legend.title'));
  legendBtn.addEventListener('click', () => {
    legend.hidden = !legend.hidden;
    legendBtn.setAttribute('aria-expanded', String(!legend.hidden));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !legend.hidden) {
      legend.hidden = true;
      legendBtn.setAttribute('aria-expanded', 'false');
      legendBtn.focus();
    }
  });
  const mapBtn = h('a', { class: 'icon-btn hide-narrow', href: '#/map', html: `${ICONS.map}<span class="btn-label">${tc('nav.map')}</span>` });
  mapBtn.setAttribute('aria-label', tc('nav.map'));
  const themeBtn = h('button', { class: 'icon-btn', type: 'button' });
  const syncTheme = () => {
    const t = getTheme();
    themeBtn.innerHTML = ICONS[t];
    themeBtn.setAttribute('aria-label', tc('theme.label', { mode: tc(`theme.${t}`) }));
    themeBtn.title = tc('theme.label', { mode: tc(`theme.${t}`) });
  };
  themeBtn.addEventListener('click', () => {
    const order: ThemeChoice[] = ['auto', 'light', 'dark'];
    applyTheme(order[(order.indexOf(getTheme()) + 1) % 3]);
    syncTheme();
  });
  syncTheme();

  bar = h('span', { style: { width: '0%' } });
  const header = h(
    'header',
    { class: 'topbar' },
    h(
      'div',
      { class: 'topbar-inner' },
      h('a', { class: 'brand', href: '#/' }, tc('app.short')),
      h('nav', { 'aria-label': tc('nav.chapters'), style: { margin: '0 auto' } }, strip),
      h('div', { class: 'topbar-actions' }, legendBtn, mapBtn, themeBtn, menuBtn),
    ),
    h('div', { class: 'progress', role: 'progressbar', 'aria-label': tc('nav.progress'), 'aria-valuemin': 0, 'aria-valuemax': CHAPTER_COUNT }, bar),
    legend,
  );
  main = h('main', { id: 'main', tabindex: '-1' });
  frag.append(skip, header, drawer, scrim, main);
  for (let i = 0; i < CHAPTER_COUNT; i++) {
    const title = tc(`chapters.${i}.title`);
    strip.append(h('li', null, h('a', { href: `#/ch/${i}`, 'aria-label': tc('nav.chapterN', { n: i, title }), title }, String(i))));
    drawerList.append(h('li', null, h('a', { href: `#/ch/${i}` }, h('span', { class: 'num' }, String(i)), h('span', null, title), h('span', { class: 'done-mark', 'aria-hidden': 'true' }))));
  }
  return frag;
}

function legendContent(): HTMLElement {
  const line = (c: string, dash = false) =>
    `<svg width="30" height="12" aria-hidden="true"><line x1="2" y1="6" x2="28" y2="6" stroke="var(--c-${c})" stroke-width="3" ${dash ? 'stroke-dasharray="5 4"' : ''}/></svg>`;
  const items: [string, string][] = [
    [line('setpoint', true), tc('legend.setpoint')],
    [line('output'), tc('legend.output')],
    [`<svg width="30" height="12" aria-hidden="true"><rect x="2" y="1" width="26" height="10" fill="var(--c-error-fill)" stroke="var(--c-error)"/></svg>`, tc('legend.error')],
    [line('effort'), tc('legend.effort')],
    [line('disturb'), tc('legend.disturbance')],
    [`<svg width="30" height="16" aria-hidden="true"><path d="M9 2l12 12M21 2L9 14" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/></svg>`, tc('legend.pole')],
    [`<svg width="30" height="16" aria-hidden="true"><circle cx="15" cy="8" r="6" fill="none" stroke="var(--ink)" stroke-width="2.5"/></svg>`, tc('legend.zero')],
    [`<svg width="30" height="12" aria-hidden="true"><line x1="2" y1="6" x2="28" y2="6" stroke="var(--c-output)" stroke-width="2.5" stroke-dasharray="4 4" opacity="0.35"/></svg>`, tc('legend.ghost')],
    [`<svg width="30" height="12" aria-hidden="true"><line x1="2" y1="6" x2="28" y2="6" stroke="var(--pencil)" stroke-width="2.5" stroke-dasharray="2 4" stroke-linecap="round"/></svg>`, tc('legend.guess')],
  ];
  return h('div', null, h('strong', null, tc('legend.title')), h('ul', { html: items.map(([i, l]) => `<li>${i}<span>${l}</span></li>`).join('') }));
}

function updateNav(): void {
  const hash = location.hash;
  const done = progress.get().completed;
  const mark = (list: HTMLElement) =>
    list.querySelectorAll('a').forEach((a, i) => {
      const href = `#/ch/${i}`;
      const current = hash === href || hash.startsWith(`${href}/`);
      if (current) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
      a.classList.toggle('done', done.includes(i));
      const dm = a.querySelector('.done-mark');
      if (dm) dm.textContent = done.includes(i) ? '✓' : '';
    });
  mark(strip);
  mark(drawerList);
  bar.style.width = `${(done.length / CHAPTER_COUNT) * 100}%`;
  bar.parentElement?.setAttribute('aria-valuenow', String(done.length));
}

async function route(): Promise<void> {
  cleanups.forEach((c) => c());
  cleanups = [];
  const hash = location.hash.replace(/^#/, '');
  const m = /^\/ch\/(\d+)(?:\/([\w-]+))?/.exec(hash);
  main.replaceChildren();
  updateNav();
  if (m) {
    const n = Number(m[1]);
    if (n >= 0 && n < CHAPTER_COUNT) {
      await showChapter(n, m[2]);
      return;
    }
  }
  if (hash === '/map') showMap();
  else showHome();
}

async function showChapter(n: number, sectionId?: string): Promise<void> {
  const entry = CHAPTERS[n];
  main.append(h('p', { class: 'page loading', 'aria-live': 'polite' }, tc('app.loading')));
  const [content, mod] = await Promise.all([loadNamespace(entry.ns) as Promise<unknown>, entry.load()]);
  const bus = createBus();
  const page = renderChapter({ chapter: n, ns: entry.ns, content: content as ChapterContent, widgets: mod.widgets, bus, cleanups });
  const navEl = h('nav', { class: 'chapter-nav', 'aria-label': tc('nav.chapterNav') });
  if (n > 0) navEl.append(h('a', { class: 'btn', href: `#/ch/${n - 1}` }, `← ${tc('nav.prev')}: ${tc(`chapters.${n - 1}.short`)}`));
  else navEl.append(h('a', { class: 'btn', href: '#/' }, `← ${tc('nav.home')}`));
  if (n < CHAPTER_COUNT - 1) navEl.append(h('a', { class: 'btn primary', href: `#/ch/${n + 1}` }, `${tc('nav.next')}: ${tc(`chapters.${n + 1}.short`)} →`));
  else navEl.append(h('a', { class: 'btn primary', href: '#/map' }, `${tc('nav.map')} →`));
  page.append(navEl);
  main.replaceChildren(page);
  document.title = `${(content as ChapterContent).title} · ${tc('app.short')}`;
  progress.visit(n);
  updateNav();
  if (sectionId) document.getElementById(sectionId)?.scrollIntoView();
  else {
    window.scrollTo(0, 0);
    const h1 = page.querySelector('h1');
    if (h1) {
      h1.setAttribute('tabindex', '-1');
      h1.focus({ preventScroll: true });
    }
  }
}

function showHome(): void {
  document.title = tc('app.title');
  const cast = (['mika', 'theo', 'june'] as Who[]).map((w) =>
    h('div', { class: 'cast-card' }, avatar(w, 'happy'), h('div', null, h('strong', null, tc(`cast.${w}`)), setRich(h('p'), tc(`home.cast.${w}`)))),
  );
  const done = progress.get().completed;
  const visited = progress.get().visited;
  const resume = visited.length ? Math.min(CHAPTER_COUNT - 1, Math.max(...visited)) : 0;
  const list = h(
    'ol',
    { class: 'toc' },
    Array.from({ length: CHAPTER_COUNT }, (_, i) =>
      h(
        'li',
        null,
        h(
          'a',
          { href: `#/ch/${i}`, class: done.includes(i) ? 'done' : '' },
          h('span', { class: 'toc-num' }, String(i)),
          h('span', { class: 'toc-body' }, h('strong', null, tc(`chapters.${i}.title`)), setRich(h('span', { class: 'toc-q' }), tc(`chapters.${i}.question`))),
          done.includes(i) ? h('span', { class: 'toc-done', 'aria-label': tc('home.done') }, '✓') : null,
        ),
      ),
    ),
  );
  const reset = h('button', { class: 'btn small', type: 'button' }, tc('home.reset'));
  reset.addEventListener('click', () => {
    progress.reset();
    showHome();
  });
  const page = h(
    'div',
    { class: 'page home' },
    h('div', { class: 'home-hero' }, h('p', { class: 'kicker' }, tc('home.kicker')), h('h1', null, tc('app.title')), setRich(h('p', { class: 'driving-q' }), tc('home.question'))),
    ...(raw<string[]>('common', 'home.intro') ?? []).map((p) => setRich(h('p'), p)),
    h('div', { class: 'cast' }, cast),
    h('p', null, h('a', { class: 'btn primary', href: `#/ch/${resume}` }, visited.length ? tc('home.resume', { n: resume }) : tc('home.start'))),
    h('h2', null, tc('home.contents')),
    list,
    h('p', { class: 'w-help' }, tc('home.privacy'), ' ', reset),
  );
  main.replaceChildren(page);
  window.scrollTo(0, 0);
}

function showMap(): void {
  document.title = `${tc('nav.map')} · ${tc('app.short')}`;
  const visited = progress.get().visited;
  const upTo = visited.length ? Math.max(...visited) : -1;
  main.replaceChildren(
    h(
      'div',
      { class: 'page' },
      h('header', { class: 'chapter-head' }, h('h1', { tabindex: '-1' }, tc('map.title')), setRich(h('p'), tc('map.intro'))),
      h('div', { class: 'wide' }, conceptMap({ upTo })),
    ),
  );
  window.scrollTo(0, 0);
}
