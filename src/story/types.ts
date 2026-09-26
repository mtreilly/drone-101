import type { T } from '../core/i18n';
import type { Mood, Who } from './characters';

export interface Option {
  text: string;
  /** name of a pencil sketch from sketches.ts */
  sketch?: string;
  correct?: boolean;
  /** explanation shown when this option is chosen */
  why: string;
}

export type Block =
  | { t: 'p'; text: string }
  | { t: 'h3'; text: string }
  | { t: 'say'; who: Who; mood?: Mood; text: string; think?: boolean }
  | { t: 'note'; text: string; aside?: boolean }
  | { t: 'math'; tex: string }
  | { t: 'widget'; id: string; caption?: string; wide?: boolean }
  | {
      t: 'predict';
      id: string;
      q: string;
      options: Option[];
      /** hide the rest of the section until answered */
      gate?: boolean;
    }
  | { t: 'vocab'; title?: string; items: { term: string; def: string }[] }
  | { t: 'recap'; title?: string; items: string[] }
  | { t: 'quiz'; title?: string; items: { id: string; q: string; options: Option[] }[] }
  | { t: 'cliff'; text: string }
  | { t: 'list'; items: string[]; ordered?: boolean }
  /** a sentence with draggable numbers; `id` names its model in the chapter's `plays` */
  | { t: 'play'; id: string; text: string }
  /** an optional "side trip": visible, but quieter than the main path */
  | { t: 'callout'; title: string; blocks: Block[] }
  | { t: 'map' };

export interface Section {
  id: string;
  title: string;
  blocks: Block[];
}

export interface ChapterContent {
  kicker: string;
  title: string;
  question: string;
  sections: Section[];
  widgets?: Record<string, unknown>;
}

export interface Bus {
  on(event: string, fn: (payload?: unknown) => void): () => void;
  emit(event: string, payload?: unknown): void;
}

export interface WidgetCtx {
  /** strings under `widgets.<id>` of the chapter namespace */
  t: T;
  /** strings of the whole chapter namespace */
  tch: T;
  chapter: number;
  id: string;
  bus: Bus;
}

/** Mounts an interactive into `host`; may return a cleanup function. */
export type WidgetFactory = (host: HTMLElement, ctx: WidgetCtx) => void | (() => void);

export function createBus(): Bus {
  const map = new Map<string, Set<(p?: unknown) => void>>();
  return {
    on(event, fn) {
      if (!map.has(event)) map.set(event, new Set());
      map.get(event)!.add(fn);
      return () => map.get(event)?.delete(fn);
    },
    emit(event, payload) {
      map.get(event)?.forEach((fn) => fn(payload));
    },
  };
}
