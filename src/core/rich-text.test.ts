import { describe, expect, it } from 'vitest';
import { texToPlain } from './rich-text';

describe('texToPlain', () => {
  it.each([
    ['K_p', 'Kp'],
    ['\\text{D filter } \\tau_f', 'D filter τf'],
    ['\\sigma', 'σ'],
    ['\\eff{K_i} = 50', 'Ki = 50'],
    ['\\frac{1}{s}', '1/s'],
    ['\\frac{mg}{K_p}', '(mg)/(Kp)'],
    ['s^2 + 2\\zeta\\omega_n s', 's² + 2ζωn s'],
    ['e^{-st}', 'e^(-st)'],
    ['\\mathcal{L}\\{f\\}', '𝓛{f}'],
    ['1{,}5\\,\\text{s}', '1,5 s'],
    ['G_{\\circ}(s)', 'G∘(s)'],
    ['\\left( a \\right)', '( a )'],
    ['\\frac{1}{s^{2}}', '1/(s²)'],
    ['\\frac{\\frac{1}{s}}{1+\\frac{1}{s}}', '(1/s)/(1+1/s)'],
    ['\\tfrac{1}{\\omega}', '1/ω'],
    ['\\dfrac{a}{b}', 'a/b'],
    ['x > 0 \\Rightarrow y', 'x > 0 ⇒ y'],
    ['A \\Longrightarrow B', 'A ⇒ B'],
    ['\\angle G = -180^\\circ', '∠ G = -180^(∘)'],
    ['\\dot{h} + \\ddot h', 'ḣ + ḧ'],
    ['\\underbrace{e^{-st}}_{\\text{probe}}', 'e^(-st) (probe)'],
    ['\\begin{aligned} a &= 1 \\\\ b &= 2 \\end{aligned}', 'a = 1; b = 2'],
    ['\\cancel{s}\\,F', 's F'],
  ])('%s → %s', (src, want) => expect(texToPlain(src)).toBe(want));
});
