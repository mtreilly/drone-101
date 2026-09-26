import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CHAPTERS } from '../chapters/registry';
import { interpolate, lookup } from '../core/i18n';
import { LANGUAGES } from '../core/languages';
import { rich } from '../core/rich-text';
import { nudgeInput, type PlayInput, playTokens, snapInput } from './play';
import type { Block, ChapterContent } from './types';

describe('playable-number helpers', () => {
  const cont: PlayInput = { min: -2, max: 4, step: 0.5, value: 3 };
  const list: PlayInput = { min: 0, max: 0, step: 1, value: 4, values: [1, 2, 4, 12, 100] };

  it('snaps to the step grid and clamps to the range', () => {
    expect(snapInput(cont, 1.3)).toBe(1.5);
    expect(snapInput(cont, 9)).toBe(4);
    expect(snapInput(cont, -7)).toBe(-2);
    expect(snapInput({ min: 0, max: 1, step: 0.1, value: 0 }, 0.3)).toBe(0.3);
  });

  it('snaps discrete inputs to the nearest listed value', () => {
    expect(snapInput(list, 9)).toBe(12);
    expect(snapInput(list, 1000)).toBe(100);
  });

  it('nudges by notches and stops at the ends', () => {
    expect(nudgeInput(cont, 3, 1)).toBe(3.5);
    expect(nudgeInput(cont, 3, 10)).toBe(4);
    expect(nudgeInput(list, 4, 1)).toBe(12);
    expect(nudgeInput(list, 4, -5)).toBe(1);
  });

  it('turns tokens into live spans and keeps units attached', () => {
    const html = rich('after {scrub|n} s you have {calc|v|eff}.');
    expect(html).toContain('data-scrub="n"');
    expect(html).toContain('class="calc c-eff"');
    expect(html).toMatch(/<\/span> s /);
    expect(playTokens('{scrub|n} and {calc|v|eff}')).toEqual(['{calc|v|eff}', '{scrub|n}']);
  });
});

/** Every block of a chapter, including the ones inside side trips. */
function* blocks(list: Block[]): Generator<Block> {
  for (const b of list) {
    yield b;
    if (b.t === 'callout') yield* blocks(b.blocks);
  }
}

describe('every playable sentence is wired to a model, in every language', () => {
  const ROOT = join(process.cwd(), 'public/locales');
  it('the chapter registry is readable', () => expect(CHAPTERS.length).toBeGreaterThan(0));
  for (const [i, entry] of CHAPTERS.entries()) {
    if (!entry.plays) continue;
    it(`${entry.ns}`, async () => {
      const { plays } = await entry.plays!();
      for (const { code } of LANGUAGES) {
        const content = JSON.parse(readFileSync(join(ROOT, code, `${entry.ns}.json`), 'utf8')) as ChapterContent & { plays?: Record<string, Record<string, string>> };
        const used = new Set<string>();
        for (const s of content.sections) {
          for (const b of blocks(s.blocks)) {
            if (b.t !== 'play') continue;
            used.add(b.id);
            const model = plays[b.id];
            expect(model, `${code} ${entry.ns}: play ${b.id} has no model`).toBeDefined();
            const t = (k: string, vars?: Record<string, string | number>) => {
              const v = lookup(content as never, `plays.${b.id}.${k}`);
              expect(typeof v, `${code} ${entry.ns}: plays.${b.id}.${k} missing`).toBe('string');
              return interpolate(String(v), vars);
            };
            const common = JSON.parse(readFileSync(join(ROOT, code, 'common.json'), 'utf8'));
            const tc = (k: string, vars?: Record<string, string | number>) => {
              const v = lookup(common, k);
              expect(typeof v, `${code} common: ${k} missing`).toBe('string');
              return interpolate(String(v), vars);
            };
            const values = Object.fromEntries(Object.entries(model.inputs).map(([k, inp]) => [k, inp.value]));
            for (const tok of playTokens(b.text)) {
              const [kind, name] = tok.slice(1, -1).split('|');
              if (kind === 'scrub') {
                expect(model.inputs[name], `${b.id}.${name}`).toBeDefined();
                t(name); // accessible name
              } else {
                expect(model.outputs[name], `${b.id}.${name}`).toBeDefined();
                const out = model.outputs[name](values, t, tc);
                expect(out).not.toMatch(/NaN|⟦|undefined/);
              }
            }
            // every output renders at the ends of every input's range too
            for (const [k, inp] of Object.entries(model.inputs)) {
              for (const v of inp.values ?? [inp.min, inp.max]) {
                for (const fn of Object.values(model.outputs)) expect(fn({ ...values, [k]: v }, t, tc)).not.toMatch(/NaN|⟦|undefined/);
              }
            }
          }
        }
        expect([...used].sort(), `${code}: chapter ${i} plays`).toEqual(Object.keys(plays).sort());
      }
    });
  }
});
