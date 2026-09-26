import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { LANGUAGES, DEFAULT_LANG } from './languages';

/**
 * Every translation must mirror English exactly in structure; only the words change.
 * Checked per string: identical maths (ignoring words inside \text{…} and decimal-comma
 * `{,}`), identical {placeholders}, colour markers and playable numbers, and untouched control fields.
 */
const ROOT = join(process.cwd(), 'public/locales');
// `on` names the bus event that swaps a math block to its `alt` form (wired to code)
const FIXED_KEYS = new Set(['t', 'who', 'mood', 'id', 'sketch', 'correct', 'gate', 'wide', 'think', 'aside', 'ordered', 'on']);
// display maths: a math block's first form and the fixed form it swaps to
const TEX_KEYS = new Set(['tex', 'alt']);
const files: string[] = readdirSync(join(ROOT, DEFAULT_LANG)).filter((f: string) => f.endsWith('.json'));
const load = (lang: string, f: string) => JSON.parse(readFileSync(join(ROOT, lang, f), 'utf8'));

const mathOf = (s: string): string[] =>
  (s.match(/\$[^$]+\$/g) ?? []).map((m) =>
    m
      .replace(/\\text\{[^{}]*\}/g, '\\text{}')
      .replace(/\{,\}/g, '.')
      .replace(/\s+/g, ''),
  );
// placeholders live in prose; maths ($…$) may contain \text{word}, which is not a placeholder
const placeholders = (s: string): string[] =>
  (s.replace(/\$[^$]+\$/g, '').replace(/\\text\{[^{}]*\}/g, '').match(/\{\w+\}/g) ?? []).sort();
const colours = (s: string): string[] => (s.match(/\{(sp|out|err|eff|dis)\|/g) ?? []).sort();
// playable numbers ({scrub|n}, {calc|v|eff}) are wired to code, so they must survive translation untouched
const plays = (s: string): string[] => (s.match(/\{(?:scrub|calc)\|[\w|]+\}/g) ?? []).sort();
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
  if (TEX_KEYS.has(key)) {
    if (texOf(s) !== texOf(en)) problems.push(`${path}: maths changed`);
    return;
  }
  if (JSON.stringify(mathOf(s)) !== JSON.stringify(mathOf(en))) problems.push(`${path}: inline maths changed`);
  if (JSON.stringify(placeholders(s)) !== JSON.stringify(placeholders(en))) problems.push(`${path}: {placeholders} differ`);
  if (JSON.stringify(colours(s)) !== JSON.stringify(colours(en))) problems.push(`${path}: colour markers differ`);
  if (JSON.stringify(plays(s)) !== JSON.stringify(plays(en))) problems.push(`${path}: playable numbers differ`);
}

describe('math blocks that swap on a bus event', () => {
  const en = { t: 'math', tex: 'm s^2 H = \\text{wrong}', alt: 'm(s^2 H - s\\,h(0)) = \\text{right}', on: 'ch7:ic' };
  const check = (tr: unknown): string[] => {
    const problems: string[] = [];
    compare(en, tr, 'x', '', problems);
    return problems;
  };

  it('accepts a translation that changes only the words', () => {
    expect(check({ ...en, tex: 'm s^2 H = \\text{faux}', alt: 'm(s^2 H - s\\,h(0)) = \\text{juste}' })).toEqual([]);
  });

  it('rejects changed maths in either form, a changed event name and a missing form', () => {
    expect(check({ ...en, tex: 'm s^2 H + 1 = \\text{wrong}' })).toEqual(['x.tex: maths changed']);
    expect(check({ ...en, alt: 'm s^2 H = \\text{right}' })).toEqual(['x.alt: maths changed']);
    expect(check({ ...en, on: 'ch7:other' })[0]).toMatch(/x\.on: control field changed/);
    const { alt: _, ...noAlt } = en;
    expect(check(noAlt)).toEqual(['x.alt: missing']);
  });

  it('every swapping block in English has both forms and an event', () => {
    for (const f of files) {
      const walk = (v: unknown, path: string): void => {
        if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
        else if (v && typeof v === 'object') {
          const o = v as Record<string, unknown>;
          if (o.t === 'math' && ('alt' in o || 'on' in o)) {
            expect(typeof o.alt, `${path}: alt`).toBe('string');
            expect(typeof o.on, `${path}: on`).toBe('string');
            expect(o.alt, `${path}: alt must differ from tex`).not.toBe(o.tex);
          }
          for (const [k, x] of Object.entries(o)) walk(x, `${path}.${k}`);
        }
      };
      walk(load(DEFAULT_LANG, f), f);
    }
  });
});

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
