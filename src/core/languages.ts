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
  { code: 'pt-BR', name: 'Português (Brasil)', dir: 'ltr' },
  { code: 'ja', name: '日本語', dir: 'ltr' },
  { code: 'zh-CN', name: '简体中文', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
];

export const DEFAULT_LANG = 'en';

export const isSupported = (code: string): boolean => LANGUAGES.some((l) => l.code === code);

export const languageOf = (code: string): Language => LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];

/** Resolve browser/URL language tags to a shipped locale without choosing another script. */
export function matchLanguage(tag: string): string | undefined {
  const normalized = tag.trim().replaceAll('_', '-').toLowerCase();
  const exact = LANGUAGES.find((l) => l.code.toLowerCase() === normalized);
  if (exact) return exact.code;
  const [base, region] = normalized.split('-');
  if (base === 'pt') return 'pt-BR';
  if (base === 'zh') return !region || region === 'hans' || region === 'cn' || region === 'sg' ? 'zh-CN' : undefined;
  return LANGUAGES.find((l) => l.code === base)?.code;
}
