import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CHAPTER_COUNT } from "../chapters/registry";
import { CONCEPTS, KNOWN_GAPS, type Concept, type Where } from "./concepts";
import { NODES } from "./map-layout";

/**
 * Reads the English chapters in reading order and holds them to the prerequisite graph in
 * `concepts.ts`: an idea is built before it is leaned on, its section really builds it, and it
 * comes back later. Gaps the course still has are listed in `KNOWN_GAPS` with their fix.
 */
interface Piece {
  ch: number;
  section: number;
  text: string;
  math: string;
}
interface ChapterText {
  sections: string[];
  pieces: Piece[];
}

const MATH_KEYS = new Set(["tex", "alt"]);
const load = (ch: number) =>
  JSON.parse(
    readFileSync(
      join(process.cwd(), "public/locales/en", `ch${String(ch).padStart(2, "0")}.json`),
      "utf8",
    ),
  );

/** every string of a value, with its maths ($…$, tex, alt) collected separately */
function strings(v: unknown, key: string, out: { text: string[]; math: string[] }): void {
  if (typeof v === "string") {
    out.text.push(v);
    if (MATH_KEYS.has(key)) out.math.push(v);
    else out.math.push(...(v.match(/\$[^$]+\$/g) ?? []));
  } else if (Array.isArray(v)) v.forEach((x) => strings(x, key, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) strings(x, k, out);
}

const CHAPTERS: ChapterText[] = Array.from({ length: CHAPTER_COUNT }, (_, ch) => {
  const f = load(ch);
  const widgets = (f.widgets ?? {}) as Record<string, unknown>;
  const pieces: Piece[] = [];
  f.sections.forEach((sec: { blocks: unknown[] }, section: number) => {
    const out = { text: [] as string[], math: [] as string[] };
    strings(sec, "", out);
    // a widget's own words are read where the widget sits
    for (const [, id] of JSON.stringify(sec.blocks).matchAll(/"t":"widget","id":"(\w+)"/g))
      strings(widgets[id], "", out);
    pieces.push({ ch, section, text: out.text.join("\n"), math: out.math.join("\n") });
  });
  return { sections: f.sections.map((s: { id: string }) => s.id), pieces };
});

const pos = (w: Where): number | undefined => {
  const i = CHAPTERS[w.ch]?.sections.indexOf(w.section) ?? -1;
  return i < 0 ? undefined : w.ch * 1000 + i;
};
const where = (p: Piece) => `ch${p.ch} §${p.section} (${CHAPTERS[p.ch].sections[p.section]})`;
const ALL = CHAPTERS.flatMap((c) => c.pieces);
const hits = (c: Concept) =>
  ALL.filter((p) => c.uses!.some((re) => re.test(c.mathOnly ? p.math : p.text)));

/** everything wrong with one idea, empty when it holds */
function problems(id: string): string[] {
  const c = CONCEPTS[id];
  const out: string[] = [];
  const at = pos(c.builtIn);
  if (at === undefined) return [`${c.builtIn.ch}/${c.builtIn.section}: section does not exist yet`];
  for (const p of c.prereqs) {
    const pat = pos(CONCEPTS[p].builtIn);
    // a prerequisite that is not built yet is its own gap, reported once, on itself
    if (pat !== undefined && pat > at) out.push(`needs ${p}, which is built later`);
  }
  if (c.defines) {
    const home = ALL.find((p) => p.ch * 1000 + p.section === at)!;
    if (!c.defines.test(home.text)) out.push(`${where(home)} does not build it (no ${c.defines})`);
  }
  if (c.uses) {
    const previews = new Set((c.previews ?? []).map(pos));
    const early = hits(c).filter(
      (p) => p.ch * 1000 + p.section < at && !previews.has(p.ch * 1000 + p.section),
    );
    if (early.length) out.push(`used before it is built: ${early.map(where).join(", ")}`);
    if (!c.once && !hits(c).some((p) => p.ch > c.builtIn.ch))
      out.push("never used again after its chapter");
  }
  return out;
}

describe("the prerequisite graph", () => {
  it("names only ideas that exist, with no loops", () => {
    const seen = new Set<string>();
    const visit = (id: string, trail: string[]): void => {
      expect(CONCEPTS[id], `${trail.join(" → ")} → ${id}`).toBeDefined();
      expect(trail, `loop: ${[...trail, id].join(" → ")}`).not.toContain(id);
      if (seen.has(id)) return;
      CONCEPTS[id].prereqs.forEach((p) => visit(p, [...trail, id]));
      seen.add(id);
    };
    Object.keys(CONCEPTS).forEach((id) => visit(id, []));
    for (const id of Object.keys(KNOWN_GAPS)) expect(CONCEPTS[id], id).toBeDefined();
  });

  it("every concept-map node stands for one idea, built in the chapter the map puts it in", () => {
    const byNode = new Map(
      Object.entries(CONCEPTS).flatMap(([id, c]) => (c.node ? [[c.node, id]] : [])),
    );
    for (const [node, [ch]] of Object.entries(NODES)) {
      const id = byNode.get(node);
      expect(id, `map node ${node}`).toBeDefined();
      expect(CONCEPTS[id!].builtIn.ch, `map node ${node}`).toBe(ch);
    }
    expect(byNode.size).toBe(Object.keys(NODES).length);
  });

  it("the markers find real uses (a pattern that matches nothing checks nothing)", () => {
    for (const [id, c] of Object.entries(CONCEPTS))
      if (c.uses) expect(hits(c).length, id).toBeGreaterThan(0);
  });

  it.each(Object.keys(CONCEPTS).filter((id) => !(id in KNOWN_GAPS)))(
    "%s is built before it is leaned on",
    (id) => {
      expect(problems(id)).toEqual([]);
    },
  );

  it.each(Object.keys(KNOWN_GAPS))(
    "%s is still a known gap (remove it from KNOWN_GAPS once fixed)",
    (id) => {
      expect(problems(id), KNOWN_GAPS[id]).not.toEqual([]);
    },
  );
});
