import type { PlayModel } from '../story/play';
import type { WidgetFactory } from '../story/types';

type WidgetModule = { widgets: Record<string, WidgetFactory> };
type PlayModule = { plays: Record<string, PlayModel> };

/** One entry per chapter; widget code is loaded lazily when the chapter opens. */
/** `plays` holds the models behind a chapter's playable sentences (pure maths, testable in Node). */
export const CHAPTERS: { ns: string; load: () => Promise<WidgetModule>; plays?: () => Promise<PlayModule> }[] = [
  { ns: 'ch00', load: () => import('./ch00/widgets') },
  { ns: 'ch01', load: () => import('./ch01/widgets') },
  { ns: 'ch02', load: () => import('./ch02/widgets') },
  { ns: 'ch03', load: () => import('./ch03/widgets') },
  { ns: 'ch04', load: () => import('./ch04/widgets'), plays: () => import('./ch04/plays') },
  { ns: 'ch05', load: () => import('./ch05/widgets') },
  { ns: 'ch06', load: () => import('./ch06/widgets'), plays: () => import('./ch06/plays') },
  { ns: 'ch07', load: () => import('./ch07/widgets') },
  { ns: 'ch08', load: () => import('./ch08/widgets') },
  { ns: 'ch09', load: () => import('./ch09/widgets') },
  { ns: 'ch10', load: () => import('./ch10/widgets') },
  { ns: 'ch11', load: () => import('./ch11/widgets') },
];

export const CHAPTER_COUNT = CHAPTERS.length;
