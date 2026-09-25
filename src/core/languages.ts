/**
 * Languages the course ships in. Names are each language's own name (endonym), shown as-is
 * in the chooser in every UI language, so they are data rather than translatable text.
 */
export interface Language {
  code: string;
  name: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'it', name: 'Italiano', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', dir: 'ltr' },
  { code: 'pl', name: 'Polski', dir: 'ltr' },
];

export const DEFAULT_LANG = 'en';

export const isSupported = (code: string): boolean => LANGUAGES.some((l) => l.code === code);

export const languageOf = (code: string): Language => LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
