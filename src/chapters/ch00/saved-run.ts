/** Chapter 0 owns the learner run replayed later in Chapter 12. */
export interface SavedShowerRun {
  t: number[];
  T: number[];
  u: number[];
}

export const SHOWER_RUN_KEY = 'ch0.run';
