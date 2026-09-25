/** Resolve the active script's handwriting font for canvas labels. */
const families = new Map<string, string>();

export function canvasHandFont(px: number): string {
  const lang = document.documentElement.lang;
  let family = families.get(lang);
  if (!family) {
    family = getComputedStyle(document.documentElement).getPropertyValue('--font-hand').trim() || 'cursive';
    families.set(lang, family);
  }
  return `${px}px ${family}`;
}
