#!/usr/bin/env node
/**
 * Accessibility suite: runs axe-core (via @axe-core/cli) against every page of the built site,
 * in every language, in light and dark themes, with prediction gates opened (?reveal).
 *
 *   pnpm a11y            English light+dark, every other language light  (default)
 *   pnpm a11y --full     every language × both themes
 *   pnpm a11y --quick    English light only
 *
 * Needs Chrome and a matching ChromeDriver. CHROME_PATH overrides the browser binary.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const args = new Set(process.argv.slice(2));
const PORT = 4178;
const BASE = `http://localhost:${PORT}/`;
const LANGS = ['en', 'fr', 'es', 'it', 'de', 'pl', 'pt-BR', 'ja', 'zh-CN', 'ar'];
const ROUTES = ['#/', '#/map', ...Array.from({ length: 12 }, (_, i) => `#/ch/${i}`)];
const TAGS = 'wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa,best-practice';

const chrome =
  process.env.CHROME_PATH ??
  ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => existsSync(p));

const combos = [];
for (const lang of args.has('--quick') ? ['en'] : LANGS) {
  const themes = args.has('--full') || lang === 'en' ? (args.has('--quick') ? ['light'] : ['light', 'dark']) : ['light'];
  for (const theme of themes) combos.push({ lang, theme });
}
const urls = combos.flatMap(({ lang, theme }) => ROUTES.map((r) => `${BASE}?lang=${lang}&theme=${theme}&reveal${r}`));

const run = (cmd, argv, opts = {}) => spawn(cmd, argv, { stdio: 'inherit', ...opts });

console.log(`Building, then checking ${urls.length} pages (${combos.map((c) => `${c.lang}/${c.theme}`).join(', ')})…`);
await new Promise((res, rej) => run('pnpm', ['exec', 'vite', 'build', '--logLevel', 'warn']).on('exit', (c) => (c ? rej(new Error('build failed')) : res())));
const server = run('pnpm', ['exec', 'vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1500));

const axeArgs = ['exec', 'axe', ...urls, '--tags', TAGS, '--load-delay', '2000', '--exit', '--chrome-options=no-sandbox'];
if (chrome) axeArgs.push('--chrome-path', chrome);
if (args.has('--save')) axeArgs.push('--dir', './a11y-results');
const code = await new Promise((res) => run('pnpm', axeArgs).on('exit', res));
server.kill();
process.exit(code ?? 1);
