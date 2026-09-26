import { describe, expect, it } from 'vitest';
import { isolateRuns, markRuns, valueDir } from './bidi';

const show = (s: string): string => markRuns(s, { open: '⟨', close: '⟩' });

describe('markRuns', () => {
  it.each([
    // a formula and its value are one run
    ['مع $K_p$ = 20 نيوتن/م', 'مع ⟨$K_p$ = 20⟩ نيوتن/م'],
    ['عند $K_i$ = {scrub|ki|eff} نيوتن', 'عند ⟨$K_i$ = {scrub|ki|eff}⟩ نيوتن'],
    ['و$K_i$ = {scrub|ki|eff} %، لكل', 'و⟨$K_i$ = {scrub|ki|eff} %⟩، لكل'],
    ['يصبح $\\err e$ = 4.9/20 ≈ 24.5 سم', 'يصبح ⟨$\\err e$ = 4.9/20 ≈ 24.5⟩ سم'],
    // plain symbols, playable numbers and signs
    ['عند ω = {scrub|w} راديان', 'عند ⟨ω = {scrub|w}⟩ راديان'],
    ['الأقطاب عند −{scrub|sig} ± {scrub|w}i: تتقلّص', 'الأقطاب عند ⟨−{scrub|sig} ± {scrub|w}i⟩: تتقلّص'],
    ['قطبان عند −0.2 و −5. بعد', 'قطبان عند ⟨−0.2⟩ و ⟨−5⟩. بعد'],
    ['بمقدار {calc|deg}°، أي', 'بمقدار ⟨{calc|deg}°⟩، أي'],
    ['كل ×10 خطوة', 'كل ⟨×10⟩ خطوة'],
    ['هامش الكسب × 1.40)', 'هامش الكسب ⟨× 1.40⟩)'],
    ['أقوى بنحو 1 ÷ 0.72 ≈ 1.4 مرة', 'أقوى بنحو ⟨1 ÷ 0.72 ≈ 1.4⟩ مرة'],
    ['هامش الطور: 180° − 130° = 50°.', 'هامش الطور: ⟨180° − 130° = 50°⟩.'],
    ['بعد تجاوز الحد (Ki > 12.5): تكبر', 'بعد تجاوز الحد (⟨Ki > 12.5⟩): تكبر'],
    ['نحو 43° يرافق ζ = 0.4 (تجاوز 25%)', 'نحو ⟨43°⟩ يرافق ⟨ζ = 0.4⟩ (تجاوز ⟨25%⟩)'],
    ['يقع عند σ\u00a0=\u00a0−0.54.', 'يقع عند ⟨σ\u00a0=\u00a0−0.54⟩.'],
    ['تصل إلى 38 °C في', 'تصل إلى ⟨38 °C⟩ في'],
    ['يقلّصه ×½ إلى', 'يقلّصه ⟨×½⟩ إلى'],
    ['a² = 2 تقريبًا', '⟨a² = 2⟩ تقريبًا'],
    ['مساحة الميل هي 2، و s·F − f(0) = {calc|rhs}. العدد', 'مساحة الميل هي 2، و ⟨s·F − f(0) = {calc|rhs}⟩. العدد'],
    ['مساحته k ÷ (s + r) = {calc|eq}."', 'مساحته ⟨k ÷ (s + r) = {calc|eq}⟩."'],
    ['يستقر، قاعدة 4/σ', 'يستقر، قاعدة ⟨4/σ⟩'],
    ['ωn = |p|', '⟨ωn = |p|⟩'],
    ['(Kp 20, Ki 10, Kd 4, τf 0.04 s)', '(⟨Kp 20, Ki 10, Kd 4, τf 0.04 s⟩)'],
    // an unpaired bracket stays outside the run
    ['المُنعِّم (τ = 1 ث) على', 'المُنعِّم (⟨τ = 1⟩ ث) على'],
    ['عند سرعة −180° (0.95 راديان/ثانية)', 'عند سرعة ⟨−180°⟩ (0.95 راديان/ثانية)'],
  ])('%s', (src, want) => expect(show(src)).toBe(want));

  it.each([
    // lone numbers, words, formulas and playable numbers already read the right way
    'الطائرة عالقة أسفل الهدف بـ 24.5 سم',
    'مع $K_p$ نيوتن',
    'يؤخر {calc|rad} راديان',
    'P وحده',
    // colour groups and link targets are markup, never touched
    'راقب {err|المساحة المظللة} و[الفصل](#/ch/3)',
    '**زائد {calc|gain} × ميله**',
  ])('leaves %s alone', (src) => expect(show(src)).toBe(src));

  it('strips old direction marks and finds the runs again', () => {
    expect(show('مع ⁦$K_p$ = 20⁩ نيوتن')).toBe('مع ⟨$K_p$ = 20⟩ نيوتن');
  });

  it('plain text gets Unicode isolates', () => {
    expect(isolateRuns('القطب عند σ = −0.50.')).toBe('القطب عند ⁦σ = −0.50⁩.');
  });
});

describe('valueDir', () => {
  it.each([
    ['−2.0 ± 4.0i', 'ltr'],
    ['× 1.40', 'ltr'],
    ['2.06 م', 'rtl'],
    ['فوق الجرف', 'rtl'],
  ])('%s → %s', (v, want) => expect(valueDir(v)).toBe(want));
});
