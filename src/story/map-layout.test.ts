import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CHAPTER_COUNT } from '../chapters/registry';
import { lookup } from '../core/i18n';
import { LANGUAGES } from '../core/languages';
import { EDGES, mapProblems, NODES, nodeSize, textWidth } from './map-layout';

const common = (code: string) => JSON.parse(readFileSync(join(process.cwd(), 'public/locales', code, 'common.json'), 'utf8'));

describe('concept map layout', () => {
  it('every chapter owns at least one idea, and the finale more than just "you"', () => {
    for (let ch = 0; ch < CHAPTER_COUNT; ch++) expect(Object.values(NODES).filter(([c]) => c === ch).length, `chapter ${ch}`).toBeGreaterThan(0);
    const finale = Object.keys(NODES).filter((id) => NODES[id][0] === 11 && id !== 'you');
    expect(finale.length).toBeGreaterThanOrEqual(2);
    expect(Object.keys(NODES)).toEqual(expect.arrayContaining(['limits', 'motorlag', 'tradeoff']));
  });

  it('every edge joins two existing ideas, once, never itself', () => {
    const seen = new Set<string>();
    for (const [a, b] of EDGES) {
      expect(NODES[a], a).toBeDefined();
      expect(NODES[b], b).toBeDefined();
      expect(a).not.toBe(b);
      const key = [a, b].sort().join('|');
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
  });

  it('the grit ideas link back to Chapters 3, 8, 9 and 10', () => {
    const linked = (x: string, y: string) => EDGES.some(([a, b]) => (a === x && b === y) || (a === y && b === x));
    expect(linked('firstorder', 'motorlag')).toBe(true);
    expect(linked('motorlag', 'phaselag')).toBe(true);
    expect(linked('limits', 'tradeoff')).toBe(true);
    expect(linked('noise', 'tradeoff')).toBe(true);
    expect(linked('margins', 'tradeoff')).toBe(true);
    expect(linked('tradeoff', 'you')).toBe(true);
    expect(linked('stability', 'limits')).toBe(true);
    expect(linked('firstorder', 'noise')).toBe(true);
  });

  it('the width estimate covers the fonts it has to hold', () => {
    // measured in the browser at 19 px: Patrick Hand ≈ 7.1–8.6 px per character, Noto Sans JP/SC ≈ 15–19
    expect(textWidth('modes')).toBeGreaterThan(43);
    expect(textWidth('あなたは制御エンジニア')).toBeGreaterThan(11 * 17);
    expect(nodeSize('a\nb').h).toBeGreaterThan(nodeSize('a').h);
    expect(nodeSize('short\nlonger line').w).toBe(nodeSize('longer line').w);
  });

  describe.each(LANGUAGES.map((l) => l.code))('%s: no bubble overlaps another or leaves the sheet', (code) => {
    it('fits', () => {
      const dict = common(code);
      const node = (id: string) => {
        const v = lookup(dict, `map.nodes.${id}`);
        expect(typeof v, `${code} map.nodes.${id}`).toBe('string');
        return v as string;
      };
      const chapter = (n: number) => lookup(dict, `chapters.${n}.short`) as string;
      expect(mapProblems(node, chapter)).toEqual([]);
    });
  });
});
