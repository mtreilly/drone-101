/** Learner progress, persisted in localStorage (every access guarded — storage may be blocked). */
export interface Progress {
  visited: number[];
  completed: number[];
  predictions: Record<string, number>;
  quiz: Record<string, number>;
  /** arbitrary per-widget saved data, e.g. the learner's Chapter 0 shower run */
  saved: Record<string, unknown>;
  /** which chapter numbering `visited` / `completed` use; missing means the 12-chapter course */
  course?: number;
}

const KEY = 'feedback-adventure:v1';
const COURSE = 2;
const empty = (): Progress => ({ visited: [], completed: [], predictions: {}, quiz: {}, saved: {}, course: COURSE });

/** Old chapter → new chapters, from when Chapters 5 and 7 were each split in two (12 → 14 chapters). */
const SPLIT: Record<number, number[]> = { 5: [5, 6], 6: [7], 7: [8, 9], 8: [10], 9: [11], 10: [12], 11: [13] };
const renumber = (chs: number[]): number[] => [...new Set(chs.flatMap((ch) => SPLIT[ch] ?? [ch]))];

/** Brings progress saved by an older course layout up to the current chapter numbers. */
export function migrate(p: Progress): Progress {
  if ((p.course ?? 1) >= COURSE) return p;
  return { ...p, visited: renumber(p.visited), completed: renumber(p.completed), course: COURSE };
}

let state: Progress = load();
const listeners = new Set<(p: Progress) => void>();

function load(): Progress {
  try {
    const rawValue = localStorage.getItem(KEY);
    if (!rawValue) return empty();
    const saved = JSON.parse(rawValue) as Partial<Progress>;
    return migrate({ ...empty(), course: undefined, ...saved });
  } catch {
    return empty();
  }
}

function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: progress lives for this session only */
  }
  listeners.forEach((l) => l(state));
}

export const progress = {
  get: (): Progress => state,
  subscribe(fn: (p: Progress) => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  visit(ch: number): void {
    if (!state.visited.includes(ch)) {
      state.visited.push(ch);
      persist();
    }
  },
  complete(ch: number): void {
    if (!state.completed.includes(ch)) {
      state.completed.push(ch);
      persist();
    }
  },
  isComplete: (ch: number): boolean => state.completed.includes(ch),
  predict(id: string, choice: number): void {
    state.predictions[id] = choice;
    persist();
  },
  answer(id: string, choice: number): void {
    state.quiz[id] = choice;
    persist();
  },
  save(id: string, data: unknown): void {
    state.saved[id] = data;
    persist();
  },
  load<V>(id: string): V | undefined {
    return state.saved[id] as V | undefined;
  },
  reset(): void {
    state = empty();
    persist();
  },
};
