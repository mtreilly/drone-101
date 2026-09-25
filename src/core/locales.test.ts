import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { LANGUAGES, DEFAULT_LANG } from './languages';

/**
 * Every translation must mirror English exactly in structure; only the words change.
 * Checked per string: identical maths (ignoring words inside \text{…} and decimal-comma
 * `{,}`), identical {placeholders}, identical colour markers, and untouched control fields.
 */
const ROOT = join(process.cwd(), 'public/locales');
const FIXED_KEYS = new Set(['t', 'who', 'mood', 'id', 'sketch', 'correct', 'gate', 'wide', 'think', 'aside', 'ordered']);
const files: string[] = readdirSync(join(ROOT, DEFAULT_LANG)).filter((f: string) => f.endsWith('.json'));
const load = (lang: string, f: string) => JSON.parse(readFileSync(join(ROOT, lang, f), 'utf8'));

const mathOf = (s: string): string[] =>
  (s.match(/\$[^$]+\$/g) ?? []).map((m) =>
    m
      .replace(/\\text\{[^{}]*\}/g, '\\text{}')
      .replace(/\{,\}/g, '.')
      .replace(/\s+/g, ''),
  );
const placeholders = (s: string): string[] => (s.match(/\{\w+\}/g) ?? []).sort();
const colours = (s: string): string[] => (s.match(/\{(sp|out|err|eff|dis)\|/g) ?? []).sort();
const texOf = (s: string): string =>
  s
    .replace(/\\text\{[^{}]*\}/g, '\\text{}')
    .replace(/\{,\}/g, '.')
    .replace(/\s+/g, '');

function compare(en: unknown, tr: unknown, path: string, key: string, problems: string[]): void {
  if (problems.length > 40) return;
  if (typeof en !== typeof tr || Array.isArray(en) !== Array.isArray(tr)) {
    problems.push(`${path}: type differs`);
    return;
  }
  if (Array.isArray(en)) {
    const t = tr as unknown[];
    if (en.length !== t.length) problems.push(`${path}: array length ${t.length} ≠ ${en.length}`);
    en.forEach((v, i) => compare(v, t[i], `${path}[${i}]`, key, problems));
    return;
  }
  if (en && typeof en === 'object') {
    const t = tr as Record<string, unknown>;
    for (const k of Object.keys(en)) {
      if (!(k in t)) problems.push(`${path}.${k}: missing`);
      else compare((en as Record<string, unknown>)[k], t[k], `${path}.${k}`, k, problems);
    }
    for (const k of Object.keys(t)) if (!(k in (en as object))) problems.push(`${path}.${k}: extra key`);
    return;
  }
  if (typeof en !== 'string') {
    if (en !== tr) problems.push(`${path}: value ${String(tr)} ≠ ${String(en)}`);
    return;
  }
  const s = tr as string;
  if (FIXED_KEYS.has(key)) {
    if (s !== en) problems.push(`${path}: control field changed ("${s}" ≠ "${en}")`);
    return;
  }
  if (en.trim() && !s.trim()) problems.push(`${path}: empty translation`);
  if (key === 'tex') {
    if (texOf(s) !== texOf(en)) problems.push(`${path}: maths changed`);
    return;
  }
  if (JSON.stringify(mathOf(s)) !== JSON.stringify(mathOf(en))) problems.push(`${path}: inline maths changed`);
  if (JSON.stringify(placeholders(s)) !== JSON.stringify(placeholders(en))) problems.push(`${path}: {placeholders} differ`);
  if (JSON.stringify(colours(s)) !== JSON.stringify(colours(en))) problems.push(`${path}: colour markers differ`);
}

describe('locales mirror English', () => {
  for (const { code } of LANGUAGES.filter((l) => l.code !== DEFAULT_LANG)) {
    describe(code, () => {
      it.each(files)('%s', (f) => {
        const path = join(ROOT, code, f);
        if (!existsSync(path)) {
          // a missing file is allowed at runtime (English fallback) but must not ship silently
          throw new Error(`${code}/${f} is missing`);
        }
        const problems: string[] = [];
        compare(load(DEFAULT_LANG, f), load(code, f), `${code}/${f}`, '', problems);
        expect(problems).toEqual([]);
      });
    });
  }
});
