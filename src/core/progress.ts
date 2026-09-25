/** Learner progress, persisted in localStorage (every access guarded — storage may be blocked). */
export interface Progress {
  visited: number[];
  completed: number[];
  predictions: Record<string, number>;
  quiz: Record<string, number>;
  /** arbitrary per-widget saved data, e.g. the learner's Chapter 0 shower run */
  saved: Record<string, unknown>;
}

const KEY = 'feedback-adventure:v1';
const empty = (): Progress => ({ visited: [], completed: [], predictions: {}, quiz: {}, saved: {} });

let state: Progress = load();
const listeners = new Set<(p: Progress) => void>();

function load(): Progress {
  try {
    const rawValue = localStorage.getItem(KEY);
    if (!rawValue) return empty();
    return { ...empty(), ...(JSON.parse(rawValue) as Partial<Progress>) };
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
