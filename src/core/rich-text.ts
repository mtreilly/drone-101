import katex from 'katex';

/**
 * KaTeX macros for the colour language, so equations match the plots:
 *   \sp{r}  setpoint (green)   \out{h}  output (blue)   \err{e}  error (red)
 *   \eff{u} effort (orange)    \dis{d}  disturbance (purple)
 */
const macros = {
  '\\sp': '\\htmlClass{c-sp}{#1}',
  '\\out': '\\htmlClass{c-out}{#1}',
  '\\err': '\\htmlClass{c-err}{#1}',
  '\\eff': '\\htmlClass{c-eff}{#1}',
  '\\dis': '\\htmlClass{c-dis}{#1}',
};

export function tex(src: string, display = false): string {
  // decimal commas (fr/es/it/de/pl formatting) must be {,} in TeX or they typeset as "1, 00"
  src = src.replace(/(\d),(?=\d)/g, '$1{,}');
  return katex.renderToString(src, {
    displayMode: display,
    throwOnError: false,
    trust: (ctx) => ctx.command === '\\htmlClass',
    strict: 'ignore',
    macros: { ...macros },
    output: 'htmlAndMathml',
  });
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const COLOR_CLASS: Record<string, string> = {
  sp: 'c-sp',
  out: 'c-out',
  err: 'c-err',
  eff: 'c-eff',
  dis: 'c-dis',
};

/**
 * Inline markup used in the locale files:
 *   $…$ inline maths · **bold** · *italic* · ==highlight== · {out|coloured text} · [text](#/ch/3)
 *   {scrub|n} / {calc|n} playable numbers (see story/play.ts), {scrub|k|eff} coloured
 * Everything else is escaped.
 */
export function rich(src: string): string {
  const parts = src.split(/(\$[^$]+\$)/g);
  return parts
    .map((part, i) => {
      if (part.length > 2 && part.startsWith('$') && part.endsWith('$')) {
        // punctuation right after a formula stays with it instead of starting the next line
        const punct = /^[.,;:!?)。，、；：！？]+/.exec(parts[i + 1] ?? '')?.[0];
        if (!punct) return tex(part.slice(1, -1));
        parts[i + 1] = parts[i + 1].slice(punct.length);
        return `<span class="math-punct">${tex(part.slice(1, -1))}${escapeHtml(punct)}</span>`;
      }
      let out = escapeHtml(part)
        // playable numbers: {scrub|name} inputs and {calc|name} outputs, optionally coloured
        .replace(/\{(scrub|calc)\|(\w+)(?:\|(sp|out|err|eff|dis))?\}/g, (_m, kind: string, name: string, col?: string) =>
          `<span data-${kind}="${name}" class="${kind}${col ? ` ${COLOR_CLASS[col]}` : ''}" dir="ltr"></span>`,
        )
        // keep short arithmetic ("1.41 × 1.41 ≈ 2") on one line
        .replace(/(\d) ([×÷=≈]) (?=[\d√−-])/g, '$1\u00a0$2\u00a0')
        // keep numbers and their units together on one line ("38 °C", "0,245 m", "2.5 s")
        .replace(/(\d|(?:scrub|calc)[^"]*" dir="ltr"><\/span>) (°C|°|%|m\/s|m|s|N·s\/m|N\/m|N|kg|rad\/s|Hz|cm|min)(?![\p{L}])/gu, '$1\u00a0$2');
      out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      out = out.replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>');
      out = out.replace(/==(.+?)==/g, '<mark>$1</mark>');
      out = out.replace(/\{(sp|out|err|eff|dis)\|(.+?)\}/g, (_m, k: string, txt: string) => `<span class="${COLOR_CLASS[k]}">${txt}</span>`);
      out = out.replace(/\[(.+?)\]\((#[^)\s]*)\)/g, '<a href="$2">$1</a>');
      return out;
    })
    .join('');
}

/** Sets rich content on an element. */
export function setRich(el: HTMLElement, src: string): HTMLElement {
  el.innerHTML = rich(src);
  return el;
}

const GREEK: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η',
  theta: 'θ', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ',
  tau: 'τ', phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
};
const SYMBOL: Record<string, string> = {
  cdot: '·', times: '×', div: '÷', pm: '±', mp: '∓', approx: '≈', ne: '≠', neq: '≠', le: '≤', leq: '≤',
  ge: '≥', geq: '≥', infty: '∞', to: '→', rightarrow: '→', leftarrow: '←', circ: '∘', degree: '°',
  partial: '∂', int: '∫', sum: 'Σ', sqrt: '√', ldots: '…', dots: '…', cdots: '…', prime: '′',
};
const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '−': '⁻' };

/**
 * Readable text for a TeX formula, for accessible names and announcements: "K_p" → "Kp",
 * "\tau_f" → "τf", "\frac{a}{b}" → "a/b", "\text{gain}" → "gain", colour macros dropped.
 */
export function texToPlain(src: string): string {
  // escaped braces are literal text: park them so the group handling below leaves them alone
  let s = src.replace(/\\\{/g, '\uE000').replace(/\\\}/g, '\uE001');
  // groups that only change style or colour keep their content
  for (let i = 0; i < 4; i++) {
    s = s.replace(/\\(?:text|mathrm|mathbf|mathit|operatorname|textbf|boldsymbol|sp|out|err|eff|dis|htmlClass\{[^}]*\})\s*\{([^{}]*)\}/g, '$1');
    s = s.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, (_m, a: string, b: string) => `${a.length > 1 ? `(${a})` : a}/${b.length > 1 ? `(${b})` : b}`);
    s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, '√($1)');
    s = s.replace(/\\mathcal\s*\{L\}/g, '𝓛');
  }
  s = s.replace(/\\(?:left|right|big|Big|bigg|Bigg)(?![a-zA-Z])/g, '');
  s = s.replace(/\\[,;:! ]|\\quad|\\qquad|~/g, ' ');
  s = s.replace(/\\([{}%$&#_])/g, '$1');
  s = s.replace(/\\([a-zA-Z]+)/g, (_m, name: string) => GREEK[name] ?? SYMBOL[name] ?? name);
  // superscripts: digits become ², others read "^(…)"; subscripts join the base ("K_p" → "Kp")
  s = s.replace(/\^\{([^{}]*)\}|\^(.)/g, (_m, g?: string, c?: string) => {
    const v = g ?? c ?? '';
    return [...v].every((ch) => SUP[ch]) ? [...v].map((ch) => SUP[ch]).join('') : `^(${v})`;
  });
  s = s.replace(/_\{([^{}]*)\}|_(.)/g, (_m, g?: string, c?: string) => g ?? c ?? '');
  s = s.replace(/\{,\}/g, ',').replace(/[{}]/g, '').replace(/\uE000/g, '{').replace(/\uE001/g, '}');
  return s.replace(/\s+/g, ' ').trim();
}

/** Plain-text version of rich content (maths turned into readable text), for accessible names. */
export function plainText(el: Element): string {
  const clone = el.cloneNode(true) as Element;
  clone.querySelectorAll('.katex').forEach((k) => {
    const src = k.querySelector('annotation')?.textContent ?? '';
    k.replaceWith(texToPlain(src));
  });
  return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
}
