import { DEFAULT_LANG, isSupported, languageOf, matchLanguage } from './languages';

/**
 * Minimal i18n: every visible string lives in /public/locales/{lang}/{namespace}.json.
 * Namespaces: `common` (UI chrome, concept map, shared widget labels) and `chNN` (one per chapter).
 *
 * Files are fetched lazily, one namespace at a time, only for the active language, so adding
 * languages never grows the JavaScript bundle. A missing file falls back to English (a language
 * can ship chapter by chapter); a missing key falls back to English if that file is cached.
 */
type Dict = { [k: string]: unknown };

const cache = new Map<string, Dict>();
const inflight = new Map<string, Promise<Dict>>();
const STORE_KEY = 'feedback-adventure:lang';
let lang = detectLang();
const listeners = new Set<(lang: string) => void>();

export const getLang = (): string => lang;

/** ?lang= in the URL, then the saved choice, then the browser's preferences, then English. */
function detectLang(): string {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (fromUrl && matchLanguage(fromUrl)) return matchLanguage(fromUrl)!;
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved && matchLanguage(saved)) return matchLanguage(saved)!;
  } catch {
    /* storage blocked */
  }
  for (const pref of navigator.languages ?? [navigator.language]) {
    const match = matchLanguage(pref);
    if (match) return match;
  }
  return DEFAULT_LANG;
}

/** Reflects the language on <html> (lang + dir) so screen readers pronounce text correctly. */
export function applyDocumentLang(): void {
  const l = languageOf(lang);
  document.documentElement.lang = l.code;
  document.documentElement.dir = l.dir;
}

/** Switches language: loads its common strings first, then notifies listeners to re-render. */
export async function setLang(code: string): Promise<void> {
  if (!isSupported(code) || code === lang) return;
  const previous = lang;
  lang = code;
  try {
    await loadNamespace('common');
  } catch (err) {
    lang = previous;
    throw err;
  }
  try {
    localStorage.setItem(STORE_KEY, code);
  } catch {
    /* ignore */
  }
  applyDocumentLang();
  listeners.forEach((l) => l(code));
}

export function onLangChange(fn: (lang: string) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

async function fetchJson(code: string, ns: string): Promise<Dict | null> {
  const res = await fetch(`${import.meta.env.BASE_URL}locales/${code}/${ns}.json`);
  if (!res.ok) return null;
  return (await res.json()) as Dict;
}

export function loadNamespace(ns: string, code = lang): Promise<Dict> {
  const key = `${code}/${ns}`;
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  const pending = inflight.get(key);
  if (pending) return pending;
  const p = (async () => {
    let data = await fetchJson(code, ns);
    if (!data && code !== DEFAULT_LANG) {
      if (import.meta.env.DEV) console.warn(`[i18n] ${key} not translated yet, using ${DEFAULT_LANG}`);
      data = await loadNamespace(ns, DEFAULT_LANG);
    }
    if (!data) throw new Error(`Missing locale file ${key}`);
    cache.set(key, data);
    return data;
  })().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

/** Warms the cache for a namespace without blocking (used to preload the next chapter). */
export function prefetchNamespace(ns: string): void {
  loadNamespace(ns).catch(() => {});
}

export function lookup(dict: Dict | undefined, path: string): unknown {
  let cur: unknown = dict;
  for (const part of path.split('.')) {
    if (cur && typeof cur === 'object' && part in (cur as Dict)) cur = (cur as Dict)[part];
    else return undefined;
  }
  return cur;
}

export const interpolate = (str: string, vars?: Record<string, string | number>): string =>
  vars ? str.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : str;

export type T = (key: string, vars?: Record<string, string | number>) => string;

function find(ns: string, path: string): unknown {
  const v = lookup(cache.get(`${lang}/${ns}`), path);
  if (v !== undefined || lang === DEFAULT_LANG) return v;
  return lookup(cache.get(`${DEFAULT_LANG}/${ns}`), path);
}

/** Creates a translator bound to a namespace; missing keys render visibly as ⟦key⟧. */
export function translator(ns: string, prefix = ''): T {
  return (key, vars) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const v = find(ns, path);
    if (typeof v !== 'string') {
      if (import.meta.env.DEV) console.warn(`[i18n] missing ${lang}/${ns}:${path}`);
      return `⟦${key}⟧`;
    }
    return interpolate(v, vars);
  };
}

/** Raw (possibly structured) value, for arrays of strings etc. */
export function raw<V = unknown>(ns: string, key: string): V | undefined {
  return find(ns, key) as V | undefined;
}

/** Locale-aware number formatting and a true minus sign. */
export function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return n > 0 ? '∞' : n < 0 ? '−∞' : '—';
  return new Intl.NumberFormat(lang, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
    .format(n)
    .replace('-', '−');
}

export const tc = translator('common');
