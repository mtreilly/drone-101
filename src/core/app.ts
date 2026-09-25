import { CHAPTERS, CHAPTER_COUNT } from '../chapters/registry';
import { avatar, type Who } from '../story/characters';
import rough from 'roughjs';
import { s as svgEl } from './dom';
import { conceptMap } from '../story/concept-map';
import { renderChapter } from '../story/renderer';
import { createBus, type ChapterContent } from '../story/types';
import { h } from './dom';
import { applyDocumentLang, getLang, loadNamespace, onLangChange, prefetchNamespace, raw, setLang, tc } from './i18n';
import { LANGUAGES, languageOf } from './languages';
import { progress } from './progress';
import { setRich } from './rich-text';
import { applyTheme, getTheme, type ThemeChoice } from './theme';

let cleanups: (() => void)[] = [];
let rootEl: HTMLElement;
let main: HTMLElement;
let strip: HTMLElement;
let drawerList: HTMLElement;
let bar: HTMLElement;
let readBar: HTMLElement;

const ICONS = {
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  map: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="7" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="7" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="18" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.3 8.6l2.5 7M15.7 8.6l-2.5 7M8.8 7h6.4" stroke="currentColor" stroke-width="1.8"/></svg>',
  legend: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h4M4 12h4M4 17h4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M11.5 7h8.5M11.5 12h8.5M11.5 17h8.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.8 12h16.4M12 3.8c2.4 2.3 3.6 5 3.6 8.2s-1.2 5.9-3.6 8.2c-2.4-2.3-3.6-5-3.6-8.2s1.2-5.9 3.6-8.2z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true" class="menu-check"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 4.5a7.5 7.5 0 0 1 0 15z" fill="currentColor"/></svg>',
  light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 14.6A7.8 7.8 0 1 1 9.4 4.5a6.2 6.2 0 0 0 10.1 10.1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
};

/* ---------- popovers (legend, language): one open at a time, Esc / outside click closes ---------- */
interface Pop {
  el: HTMLElement;
  btn: HTMLElement;
  onOpen?: () => void;
}
let openPop: Pop | null = null;

function togglePop(p: Pop): void {
  if (openPop?.el === p.el) {
    closePop(false);
    return;
  }
  closePop(false);
  p.el.hidden = false;
  p.btn.setAttribute('aria-expanded', 'true');
  openPop = p;
  p.onOpen?.();
}

function closePop(returnFocus: boolean): void {
  if (!openPop) return;
  const { el, btn } = openPop;
  el.hidden = true;
  btn.setAttribute('aria-expanded', 'false');
  openPop = null;
  if (returnFocus) btn.focus();
}

function installGlobalHandlers(): void {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openPop) {
      e.preventDefault();
      closePop(true);
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!openPop) return;
    const t = e.target as Node;
    if (!openPop.el.contains(t) && !openPop.btn.contains(t)) closePop(false);
  });
  // reading progress for the current chapter (decorative; the chapter bar carries the real progress)
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const isChapter = !!main?.querySelector('.chapter');
      readBar?.parentElement?.classList.toggle('on', isChapter);
      if (!isChapter || !readBar) return;
      const max = document.documentElement.scrollHeight - innerHeight;
      const frac = max > 0 ? Math.min(1, scrollY / max) : 0;
      readBar.style.transform = `scaleX(${frac})`;
      rememberPlace(frac);
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  addEventListener('route:rendered', onScroll);
}

export async function startApp(root: HTMLElement): Promise<void> {
  rootEl = root;
  applyTheme(getTheme());
  applyDocumentLang();
  await loadNamespace('common');
  installGlobalHandlers();
  root.append(buildShell());
  window.addEventListener('hashchange', route);
  progress.subscribe(updateNav);
  // a language switch rebuilds the chrome and the current page in place, no reload
  onLangChange(async () => {
    closePop(false);
    cleanups.forEach((c) => c());
    cleanups = [];
    rootEl.replaceChildren(buildShell());
    await route({ keepScroll: true });
    document.getElementById('lang-btn')?.focus();
    announce(tc('lang.button', { name: languageOf(getLang()).name }));
  });
  await route();
}

/** Where the reader is in the current chapter (as a fraction), saved at most once a second. */
let lastSave = 0;
function rememberPlace(frac: number): void {
  const m = /^#\/ch\/(\d+)/.exec(location.hash);
  const now = performance.now();
  if (!m || now - lastSave < 1000) return;
  lastSave = now;
  progress.save('reading', { ch: Number(m[1]), frac });
}

/** Polite screen-reader announcement for app-level events. */
function announce(text: string): void {
  const el = document.getElementById('app-announcer');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => (el.textContent = text));
}

function tool(icon: string, label: string, attrs: Record<string, unknown> = {}, tag: 'button' | 'a' = 'button'): HTMLElement {
  const el = h(tag as 'button', { class: 'tool', 'aria-label': label, 'data-tip': label, ...(tag === 'button' ? { type: 'button' } : {}), ...attrs });
  el.innerHTML = icon;
  return el;
}

function buildLanguageMenu(): { btn: HTMLElement; pop: HTMLElement } {
  const current = languageOf(getLang());
  const btn = tool(`${ICONS.globe}<span class="tool-code" aria-hidden="true">${current.code.toUpperCase()}</span>`, tc('lang.button', { name: current.name }), {
    id: 'lang-btn',
    class: 'tool tool-lang',
    'aria-haspopup': 'menu',
    'aria-expanded': 'false',
    'aria-controls': 'lang-menu',
  });
  const list = h('ul', { role: 'menu', 'aria-label': tc('lang.menu'), class: 'menu-list' });
  const items: HTMLButtonElement[] = [];
  for (const l of LANGUAGES) {
    const active = l.code === current.code;
    const item = h(
      'button',
      { type: 'button', role: 'menuitemradio', 'aria-checked': String(active), lang: l.code, class: 'menu-item', tabindex: '-1' },
      h('span', { class: 'menu-code', 'aria-hidden': 'true' }, l.code.toUpperCase()),
      h('span', { class: 'menu-name' }, l.name),
    );
    item.insertAdjacentHTML('beforeend', ICONS.check);
    item.addEventListener('click', async () => {
      if (l.code === getLang()) {
        closePop(true);
        return;
      }
      btn.setAttribute('aria-busy', 'true');
      btn.classList.add('busy');
      try {
        await setLang(l.code);
      } catch (err) {
        console.error(err);
        btn.removeAttribute('aria-busy');
        btn.classList.remove('busy');
        closePop(true);
      }
    });
    items.push(item);
    list.append(h('li', { role: 'none' }, item));
  }
  list.addEventListener('keydown', (e) => {
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const go = (j: number) => items[(j + items.length) % items.length].focus();
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(items.length - 1);
    else if (e.key === 'Tab') closePop(false);
    else return;
    if (e.key !== 'Tab') e.preventDefault();
  });
  const pop = h('div', { class: 'menu-pop', id: 'lang-menu', hidden: true }, list);
  btn.addEventListener('click', () =>
    togglePop({ el: pop, btn, onOpen: () => (items.find((it) => it.getAttribute('aria-checked') === 'true') ?? items[0]).focus() }),
  );
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && openPop?.el !== pop) {
      e.preventDefault();
      btn.click();
    }
  });
  return { btn, pop };
}

function buildShell(): DocumentFragment {
  const frag = document.createDocumentFragment();
  const skip = h('a', { class: 'skip-link', href: '#main' }, tc('nav.skip'));
  skip.addEventListener('click', (e) => {
    e.preventDefault();
    main.focus();
  });
  strip = h('ol', { class: 'chapter-strip' });
  drawerList = h('ol');
  const drawer = h('nav', { class: 'drawer', id: 'drawer', hidden: true, 'aria-label': tc('nav.chapters') });
  const scrim = h('div', { class: 'scrim', hidden: true });
  const closeDrawer = () => {
    drawer.hidden = true;
    scrim.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
  };
  const menuBtn = tool(ICONS.menu, tc('nav.menu'), { class: 'tool menu-btn', 'aria-controls': 'drawer', 'aria-expanded': 'false' });
  menuBtn.addEventListener('click', () => {
    closePop(false);
    drawer.hidden = false;
    scrim.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
    (drawer.querySelector('a[aria-current]') as HTMLElement | null)?.focus() ?? (drawer.querySelector('a') as HTMLElement | null)?.focus();
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
  const closeBtn = h('button', { class: 'btn small', type: 'button' }, tc('nav.close'));
  closeBtn.addEventListener('click', () => {
    closeDrawer();
    menuBtn.focus();
  });
  drawer.append(h('div', { class: 'drawer-head' }, h('strong', null, tc('nav.chapters')), closeBtn), drawerList, h('a', { href: '#/map', class: 'drawer-map' }, tc('nav.map')));

  const legend = h('div', { class: 'legend-pop', id: 'legend', hidden: true, role: 'dialog', 'aria-label': tc('legend.title') }, legendContent());
  const legendBtn = tool(ICONS.legend, tc('legend.title'), { 'aria-controls': 'legend', 'aria-expanded': 'false', 'aria-haspopup': 'dialog' });
  legendBtn.addEventListener('click', () => togglePop({ el: legend, btn: legendBtn }));
  const mapBtn = tool(ICONS.map, tc('nav.map'), { href: '#/map', class: 'tool hide-narrow' }, 'a');
  const themeLabel = () => tc('theme.label', { mode: tc(`theme.${getTheme()}`) });
  const themeBtn = tool(ICONS[getTheme()], themeLabel());
  themeBtn.addEventListener('click', () => {
    const order: ThemeChoice[] = ['auto', 'light', 'dark'];
    applyTheme(order[(order.indexOf(getTheme()) + 1) % 3]);
    themeBtn.innerHTML = ICONS[getTheme()];
    themeBtn.setAttribute('aria-label', themeLabel());
    themeBtn.dataset.tip = themeLabel();
  });
  const lang = buildLanguageMenu();

  bar = h('span', { style: { width: '0%' } });
  readBar = h('span');
  const header = h(
    'header',
    { class: 'topbar' },
    h(
      'div',
      { class: 'topbar-inner' },
      h('a', { class: 'brand', href: '#/' }, tc('app.short')),
      h('nav', { class: 'strip-nav', 'aria-label': tc('nav.chapters') }, strip),
      h('div', { class: 'toolbar', role: 'group', 'aria-label': tc('nav.tools') }, lang.btn, legendBtn, mapBtn, themeBtn, menuBtn),
    ),
    h('div', { class: 'progress', role: 'progressbar', 'aria-label': tc('nav.progress'), 'aria-valuemin': 0, 'aria-valuemax': CHAPTER_COUNT }, bar),
    h('div', { class: 'read-progress', 'aria-hidden': 'true' }, readBar),
    legend,
    lang.pop,
  );
  main = h('main', { id: 'main', tabindex: '-1' });
  const announcer = h('div', { id: 'app-announcer', class: 'visually-hidden', 'aria-live': 'polite' });
  frag.append(skip, header, drawer, scrim, main, buildFooter(), announcer);
  for (let i = 0; i < CHAPTER_COUNT; i++) {
    const title = tc(`chapters.${i}.title`);
    strip.append(h('li', null, h('a', { href: `#/ch/${i}`, 'aria-label': tc('nav.chapterN', { n: i, title }), 'data-tip': title }, String(i))));
    drawerList.append(h('li', null, h('a', { href: `#/ch/${i}` }, h('span', { class: 'num' }, String(i)), h('span', null, title), h('span', { class: 'done-mark', 'aria-hidden': 'true' }))));
  }
  return frag;
}

const AUTHOR_LINKS: [key: string, href: string][] = [
  ['x', 'https://x.com/MichealReilly'],
  ['bluesky', 'https://bsky.app/profile/michealrs.bsky.social'],
  ['blog', 'https://actuallymaybe.com'],
  ['source', 'https://github.com/mtreilly/drone-101'],
];

function buildFooter(): HTMLElement {
  const links = h('ul', { class: 'footer-links' });
  for (const [key, href] of AUTHOR_LINKS) links.append(h('li', null, h('a', { href, rel: 'me noopener' }, tc(`footer.${key}`))));
  return h(
    'footer',
    { class: 'site-footer', 'aria-label': tc('footer.label') },
    h('p', null, h('a', { href: 'https://actuallymaybe.com', class: 'footer-name' }, tc('footer.name'))),
    links,
  );
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

async function route(opts: { keepScroll?: boolean } | Event = {}): Promise<void> {
  const keepScroll = !(opts instanceof Event) && !!opts.keepScroll;
  const y = scrollY;
  cleanups.forEach((c) => c());
  cleanups = [];
  const hash = location.hash.replace(/^#/, '');
  const m = /^\/ch\/(\d+)(?:\/([\w-]+))?/.exec(hash);
  main.replaceChildren();
  updateNav();
  if (m) {
    const n = Number(m[1]);
    if (n >= 0 && n < CHAPTER_COUNT) {
      await showChapter(n, m[2], keepScroll);
      if (keepScroll) scrollTo(0, y);
      dispatchEvent(new Event('route:rendered'));
      return;
    }
  }
  if (hash === '/map') showMap();
  else showHome();
  if (keepScroll) scrollTo(0, y);
  dispatchEvent(new Event('route:rendered'));
}

async function showChapter(n: number, sectionId?: string, keepScroll = false): Promise<void> {
  const entry = CHAPTERS[n];
  main.append(h('p', { class: 'page loading', 'aria-live': 'polite' }, tc('app.loading')));
  const [content, mod] = await Promise.all([loadNamespace(entry.ns) as Promise<unknown>, entry.load()]);
  const bus = createBus();
  const page = renderChapter({ chapter: n, ns: entry.ns, content: content as ChapterContent, widgets: mod.widgets, bus, cleanups });
  const navEl = h('nav', { class: 'chapter-nav', 'aria-label': tc('nav.chapterNav') });
  if (n > 0) navEl.append(h('a', { class: 'btn', href: `#/ch/${n - 1}` }, `← ${tc(`chapters.${n - 1}.short`)}`));
  else navEl.append(h('a', { class: 'btn', href: '#/' }, `← ${tc('nav.home')}`));
  const nextHref = n < CHAPTER_COUNT - 1 ? `#/ch/${n + 1}` : '#/map';
  const nextTitle = n < CHAPTER_COUNT - 1 ? tc(`chapters.${n + 1}.title`) : tc('map.title');
  const nextQ = n < CHAPTER_COUNT - 1 ? tc(`chapters.${n + 1}.question`) : tc('map.intro');
  navEl.append(
    h(
      'a',
      { class: 'up-next', href: nextHref },
      h('span', { class: 'up-next-kicker' }, tc('nav.upNext')),
      h('span', { class: 'up-next-title' }, nextTitle),
      setRich(h('span', { class: 'up-next-q' }), nextQ),
      h('span', { class: 'up-next-arrow', 'aria-hidden': 'true' }, '→'),
    ),
  );
  page.append(navEl);
  main.replaceChildren(page);
  document.title = `${(content as ChapterContent).title} · ${tc('app.short')}`;
  progress.visit(n);
  updateNav();
  // warm the next chapter (text + code) while the reader is busy with this one
  if (n < CHAPTER_COUNT - 1) {
    const next = CHAPTERS[n + 1];
    const warm = () => {
      prefetchNamespace(next.ns);
      next.load().catch(() => {});
    };
    if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 4000 });
    else setTimeout(warm, 1500);
  }
  if (keepScroll) return;
  const place = progress.load<{ ch: number; frac: number }>('reading');
  if (sectionId === 'resume' && place?.ch === n) {
    // wait a frame so widgets have their final height, then return to the saved spot
    requestAnimationFrame(() => scrollTo(0, place.frac * (document.documentElement.scrollHeight - innerHeight)));
    return;
  }
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
    h('div', { class: 'cast-card' }, avatar(w, 'happy'), h('strong', null, tc(`cast.${w}`)), setRich(h('p'), tc(`home.cast.${w}`))),
  );
  const done = progress.get().completed;
  const visited = progress.get().visited;
  const place = progress.load<{ ch: number; frac: number }>('reading');
  const resume = place ? place.ch : visited.length ? Math.min(CHAPTER_COUNT - 1, Math.max(...visited)) : 0;
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
    h('div', { class: 'home-hero' }, h('p', { class: 'kicker' }, tc('home.kicker')), h('h1', null, tc('app.title')), setRich(h('p', { class: 'driving-q' }), tc('home.question')), heroArt()),
    ...(raw<string[]>('common', 'home.intro') ?? []).map((p) => setRich(h('p'), p)),
    h('div', { class: 'cast' }, cast),
    h('p', null, h('a', { class: 'btn primary', href: visited.length ? `#/ch/${resume}/resume` : '#/ch/0' }, visited.length ? tc('home.resume', { n: resume }) : tc('home.start'))),
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

/** A small hovering drone over its dashed 2 m target: the course in one doodle. */
function heroArt(): SVGSVGElement {
  const svg = svgEl('svg', { viewBox: '0 0 190 132', class: 'hero-art', 'aria-hidden': 'true' });
  const rc = rough.svg(svg);
  const ink = 'currentColor';
  svg.append(
    svgEl('line', { x1: 8, x2: 182, y1: 70, y2: 70, stroke: 'var(--c-setpoint)', 'stroke-width': 2, 'stroke-dasharray': '7 5' }),
    svgEl('text', { x: 182, y: 64, 'text-anchor': 'end', 'font-family': 'var(--font-hand)', 'font-size': 15, fill: 'var(--c-setpoint)' }, '2 m'),
    rc.line(4, 120, 186, 120, { stroke: ink, strokeWidth: 1.8, roughness: 1.3, seed: 4 }),
    rc.rectangle(4, 122, 182, 10, { stroke: 'none', fill: 'var(--paper-3)', fillStyle: 'hachure', hachureGap: 6, hachureAngle: 60, seed: 5 }),
    svgEl('path', { d: 'M20 34 q 10 -6 20 0 t 20 0 M28 46 q 8 -5 16 0 t 16 0', fill: 'none', stroke: 'var(--c-disturb)', 'stroke-width': 1.8, 'stroke-linecap': 'round', opacity: 0.8 }),
  );
  const drone = svgEl('g', { class: 'hero-drone' });
  const cx = 95;
  const y = 66;
  drone.append(
    svgEl('path', { d: `M${cx} ${y - 16} L${cx} ${y - 40} M${cx - 6} ${y - 32} L${cx} ${y - 40} L${cx + 6} ${y - 32}`, stroke: 'var(--c-effort)', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    rc.line(cx - 40, y, cx + 40, y, { stroke: ink, strokeWidth: 3, roughness: 0.6, seed: 5 }),
    rc.rectangle(cx - 17, y - 9, 34, 16, { stroke: ink, strokeWidth: 2, fill: 'var(--card)', fillStyle: 'solid', seed: 6 }),
    rc.line(cx - 12, y + 7, cx - 18, y + 15, { stroke: ink, strokeWidth: 2, seed: 9 }),
    rc.line(cx + 12, y + 7, cx + 18, y + 15, { stroke: ink, strokeWidth: 2, seed: 10 }),
    svgEl('circle', { cx: cx + 8, cy: y - 1, r: 3, fill: 'var(--c-output)' }),
  );
  for (const px of [cx - 40, cx + 40]) {
    drone.append(rc.line(px, y, px, y - 7, { stroke: ink, strokeWidth: 2, seed: px }));
    const prop = rc.ellipse(px, y - 9, 34, 6, { stroke: ink, strokeWidth: 1.4, fill: 'var(--paper-3)', fillStyle: 'solid', seed: px + 1 });
    prop.classList.add('propeller');
    drone.append(prop);
  }
  svg.append(drone);
  return svg;
}
