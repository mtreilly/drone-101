export type ThemeChoice = 'auto' | 'light' | 'dark';

const KEY = 'feedback-adventure:theme';
const listeners = new Set<() => void>();

export function getTheme(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice);
  try {
    if (choice === 'auto') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function isDark(): boolean {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr) return attr === 'dark';
  return matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Notified whenever the resolved colours may have changed (toggle or OS switch). */
export function onThemeChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => listeners.forEach((l) => l()));
