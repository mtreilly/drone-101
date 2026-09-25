/**
 * Minimal i18n: every visible string lives in /public/locales/{lang}/{namespace}.json.
 * Namespaces: `common` (UI chrome, concept map, shared widget labels) and `chNN` (one per chapter).
 */
type Dict = { [k: string]: unknown };

const cache = new Map<string, Dict>();
let lang = 'en';

export const getLang = (): string => lang;

export async function loadNamespace(ns: string): Promise<Dict> {
  const key = `${lang}/${ns}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const res = await fetch(`${import.meta.env.BASE_URL}locales/${lang}/${ns}.json`);
  if (!res.ok) throw new Error(`Missing locale file ${key}`);
  const data = (await res.json()) as Dict;
  cache.set(key, data);
  return data;
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

/** Creates a translator bound to a namespace; missing keys render visibly as ⟦key⟧. */
export function translator(ns: string, prefix = ''): T {
  return (key, vars) => {
    const dict = cache.get(`${lang}/${ns}`);
    const v = lookup(dict, prefix ? `${prefix}.${key}` : key);
    if (typeof v !== 'string') {
      if (import.meta.env.DEV) console.warn(`[i18n] missing ${ns}:${prefix ? prefix + '.' : ''}${key}`);
      return `⟦${key}⟧`;
    }
    return interpolate(v, vars);
  };
}

/** Raw (possibly structured) value, for arrays of strings etc. */
export function raw<V = unknown>(ns: string, key: string): V | undefined {
  return lookup(cache.get(`${lang}/${ns}`), key) as V | undefined;
}

/** Locale-aware number formatting. */
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
