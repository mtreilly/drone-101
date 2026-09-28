import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import katex from 'katex';

const ORIGIN = 'https://drone.actuallymaybe.com';
const LOCALES = ['en', 'fr', 'es', 'it', 'de', 'pl', 'pt-BR', 'ja', 'zh-CN', 'ar'];
const COUNT = 14;
const OUT = path.resolve('dist');
const getJson = async (locale, namespace) => JSON.parse(await readFile(`public/locales/${locale}/${namespace}.json`, 'utf8'));
const escape = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const url = (locale, chapter) => `${ORIGIN}/read/${locale}/${chapter}/`;
const template = (value, data) => value.replace(/\{(\w+)\}/g, (_, key) => String(data[key] ?? ''));

function math(tex, display = false) {
  return katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,
    strict: 'ignore',
    output: 'mathml',
    trust: (context) => context.command === '\\htmlClass',
    macros: {
      '\\sp': '#1', '\\out': '#1', '\\err': '#1', '\\eff': '#1', '\\dis': '#1',
    },
  });
}

function rich(value) {
  return String(value).split(/(\$[^$]+\$)/g).map((part) => {
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) return math(part.slice(1, -1));
    return escape(part)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
      .replace(/==(.+?)==/g, '<mark>$1</mark>')
      .replace(/\{(?:sp|out|err|eff|dis)\|(.+?)\}/g, '$1')
      .replace(/\{(?:scrub|calc)\|(\w+)(?:\|\w+)?\}/g, '$1')
      .replace(/\[(.+?)\]\(#\/ch\/(\d+)(?:\/[^)]*)?\)/g, '<a href="/#/ch/$2">$1</a>');
  }).join('');
}

function blockHtml(block, common, playLink, playLabel) {
  switch (block.t) {
    case 'say': return `<p><strong>${escape(common.cast[block.who])}:</strong> ${rich(block.text)}</p>`;
    case 'p': return `<p>${rich(block.text)}</p>`;
    case 'note': return `<aside>${rich(block.text)}</aside>`;
    case 'math': return `<div class="equation">${math(block.tex, true)}</div>`;
    case 'h3': return `<h3>${rich(block.text)}</h3>`;
    case 'list': return `<ul>${block.items.map((item) => `<li>${rich(item)}</li>`).join('')}</ul>`;
    case 'recap': return `<section class="recap"><h3>${escape(common.story.recap)}</h3><ul>${block.items.map((item) => `<li>${rich(item)}</li>`).join('')}</ul></section>`;
    case 'vocab': return `<section><h3>${escape(common.story.vocab)}</h3><dl>${block.items.map((item) => `<dt>${rich(item.term)}</dt><dd>${rich(item.def)}</dd>`).join('')}</dl></section>`;
    case 'callout': return `<aside><h3>${rich(block.title)}</h3>${block.blocks.map((child) => blockHtml(child, common, playLink, playLabel)).join('')}</aside>`;
    case 'cliff': return `<p class="cliff">${rich(block.text)}</p>`;
    case 'predict': return `<p><strong>${escape(common.story.predict)}</strong> ${rich(block.q)}</p>`;
    case 'widget':
    case 'play': return `<p class="interactive"><a href="${escape(playLink)}">${escape(playLabel)} ↗</a></p>`;
    default: return ''; // Widgets, quizzes and maps need the interactive course.
  }
}

function head({ title, description, canonical, locale, alternates, schema, type = 'article' }) {
  return `<!doctype html><html lang="${escape(locale)}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}"><head>` +
    `<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${escape(title)}</title><meta name="description" content="${escape(description)}">` +
    `<link rel="canonical" href="${escape(canonical)}">` +
    alternates.map((item) => `<link rel="alternate" hreflang="${escape(item.locale)}" href="${escape(item.href)}">`).join('') +
    `<meta property="og:type" content="${type}"><meta property="og:title" content="${escape(title)}">` +
    `<meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(canonical)}">` +
    `<meta name="twitter:card" content="summary"><link rel="stylesheet" href="/read.css">` +
    `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script></head>`;
}

function chapterPage(locale, number, common, chapter) {
  const canonical = url(locale, number);
  const title = `${chapter.title} · ${common.app.short}`;
  const description = chapter.question.replace(/[\$*{}]/g, '');
  const alternates = LOCALES.map((lang) => ({ locale: lang, href: url(lang, number) }));
  alternates.push({ locale: 'x-default', href: url('en', number) });
  const schema = {
    '@context': 'https://schema.org', '@type': 'LearningResource',
    name: chapter.title, description: chapter.question, inLanguage: locale,
    url: canonical, isPartOf: { '@type': 'Course', name: common.app.title, url: `${ORIGIN}/` },
  };
  const toc = Array.from({ length: COUNT }, (_, i) => {
    const label = template(common.nav.chapterN, { n: i, title: common.chapters[i].title });
    return `<li><a ${i === number ? 'aria-current="page" ' : ''}href="${url(locale, i)}">${escape(label)}</a></li>`;
  }).join('');
  const playLink = `${ORIGIN}/?lang=${encodeURIComponent(locale)}#/ch/${number}`;
  const playLabel = template(common.nav.chapterN, { n: number, title: chapter.title });
  const sections = chapter.sections.map((section) =>
    `<section id="${escape(section.id)}"><h2>${rich(section.title)}</h2>${section.blocks.map((block) => blockHtml(block, common, playLink, playLabel)).join('')}</section>`,
  ).join('');
  return head({ title, description, canonical, locale, alternates, schema }) +
    `<body><a class="skip" href="#content">${escape(common.nav.skip)}</a>` +
    `<div class="layout"><main id="content"><nav><a href="/">${escape(common.nav.home)}</a></nav>` +
    `<p class="kicker">${escape(chapter.kicker)}</p><h1>${rich(chapter.title)}</h1>` +
    `<p class="question">${rich(chapter.question)}</p>` +
    `<p><a class="button" href="${escape(playLink)}">${escape(playLabel)} ↗</a></p>` +
    sections + `<p><a class="button" href="${escape(playLink)}">${escape(playLabel)} ↗</a></p></main>` +
    `<aside class="chapters"><h2>${escape(common.nav.chapters)}</h2><ol>${toc}</ol></aside></div></body></html>`;
}

const commons = Object.fromEntries(await Promise.all(LOCALES.map(async (locale) => [locale, await getJson(locale, 'common')])));
const urls = [`${ORIGIN}/`];
for (const locale of LOCALES) {
  for (let number = 0; number < COUNT; number++) {
    const chapter = await getJson(locale, `ch${String(number).padStart(2, '0')}`);
    const dest = path.join(OUT, 'read', locale, String(number));
    await mkdir(dest, { recursive: true });
    await writeFile(path.join(dest, 'index.html'), chapterPage(locale, number, commons[locale], chapter));
    urls.push(url(locale, number));
  }
}

const home = commons.en;
const homeFallback = `<main class="read-home"><p class="kicker">${escape(home.home.kicker)}</p>` +
  `<h1>${escape(home.app.title)}</h1><p class="question">${rich(home.home.question)}</p>` +
  home.home.intro.map((paragraph) => `<p>${rich(paragraph)}</p>`).join('') +
  `<p><a class="button" href="/#/ch/0">${escape(home.home.start)}</a></p>` +
  `<h2>${escape(home.home.contents)}</h2><ol>` +
  Array.from({ length: COUNT }, (_, i) => `<li><a href="/read/en/${i}/"><strong>${escape(home.chapters[i].title)}</strong><span>${rich(home.chapters[i].question)}</span></a></li>`).join('') +
  `</ol></main>`;
const homeSchema = {
  '@context': 'https://schema.org', '@type': 'Course',
  name: home.app.title, description: home.home.question, inLanguage: LOCALES,
  url: `${ORIGIN}/`, provider: { '@type': 'Person', name: home.footer.name },
  hasPart: Array.from({ length: COUNT }, (_, i) => ({ '@type': 'LearningResource', name: home.chapters[i].title, url: url('en', i) })),
};
let index = await readFile(path.join(OUT, 'index.html'), 'utf8');
index = index.replace('<div id="app"></div>', `<div id="app">${homeFallback}</div>`);
index = index.replace('</head>', `<script type="application/ld+json">${JSON.stringify(homeSchema).replace(/</g, '\\u003c')}</script></head>`);
await writeFile(path.join(OUT, 'index.html'), index);

const css = `:root{color-scheme:light dark;font-family:system-ui,sans-serif;line-height:1.65}body{margin:0;background:#f8f5ec;color:#1e2a32}a{color:#176484}a:hover{text-decoration-thickness:2px}.layout{max-width:1180px;margin:auto;padding:2rem;display:grid;grid-template-columns:minmax(0,780px) 260px;gap:3rem}.layout main{min-width:0}.read-home{max-width:850px;margin:auto;padding:2rem}.read-home ol{padding-left:1.5rem}.read-home li{margin:.8rem 0}.read-home li a{display:grid;gap:.2rem}.read-home li span{color:#3a4c55}h1{font-size:clamp(2rem,5vw,3.5rem);line-height:1.1}h2{line-height:1.2;margin-top:2.5rem}.question{font-size:1.3rem}.kicker{letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:#76513c}p,li{max-width:72ch}aside:not(.chapters),.recap{background:#eee9db;padding:1rem 1.3rem;border-left:4px solid #176484;margin:1.5rem 0}.chapters{position:sticky;top:1rem;align-self:start;max-height:95vh;overflow:auto}.chapters ol{padding-inline-start:1.5rem}.chapters li{margin:.45rem 0}.chapters [aria-current]{font-weight:700}.button{display:inline-block;background:#176484;color:white;padding:.7rem 1.1rem;border-radius:.35rem;text-decoration:none}.button:hover{background:#0f4d66}.equation{overflow-x:auto;padding:.5rem 0}dl{display:grid;grid-template-columns:max-content 1fr;gap:.6rem 1rem}dt{font-weight:700}dd{margin:0}.skip{position:absolute;top:-100px}.skip:focus{top:0;background:white;padding:.5rem}.cliff{font-size:1.2rem;font-weight:600}@media(max-width:850px){.layout{display:block;padding:1rem}.chapters{position:static;max-height:none;border-top:1px solid #ccc;margin-top:2rem}.read-home{padding:1rem}}@media(prefers-color-scheme:dark){body{background:#182127;color:#eee9dc}.read-home li span{color:#bdc9ce}a{color:#80c5e3}aside:not(.chapters),.recap{background:#2a3539}.button{color:white}}`;
await writeFile(path.join(OUT, 'read.css'), `${css}@media(prefers-color-scheme:dark){.kicker{color:#d4aa8a}}`);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((entry) => `  <url><loc>${escape(entry)}</loc></url>`).join('\n')}\n</urlset>\n`;
await writeFile(path.join(OUT, 'sitemap.xml'), sitemap);
await writeFile(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`);
await writeFile(path.join(OUT, 'llms.txt'), `# ${home.app.title}\n\n${home.home.question}\n\n${home.home.intro.join('\n\n')}\n\n## Chapters\n\n${Array.from({ length: COUNT }, (_, i) => `- [${home.chapters[i].title}](${url('en', i)}): ${home.chapters[i].question}`).join('\n')}\n`);
console.log(`Generated ${urls.length} indexable URLs across ${LOCALES.length} languages.`);
