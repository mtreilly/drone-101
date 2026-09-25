import { LANGUAGES, matchLanguage } from './languages';

describe('language negotiation', () => {
  it('recognizes every shipped locale exactly', () => {
    for (const { code } of LANGUAGES) expect(matchLanguage(code)).toBe(code);
  });

  it('accepts common regional browser tags', () => {
    expect(matchLanguage('pt-PT')).toBe('pt-BR');
    expect(matchLanguage('ja-JP')).toBe('ja');
    expect(matchLanguage('zh-Hans-CN')).toBe('zh-CN');
    expect(matchLanguage('zh-SG')).toBe('zh-CN');
    expect(matchLanguage('ar-EG')).toBe('ar');
    expect(matchLanguage('de-AT')).toBe('de');
  });

  it('does not silently show simplified Chinese for a traditional-script preference', () => {
    expect(matchLanguage('zh-Hant')).toBeUndefined();
    expect(matchLanguage('zh-TW')).toBeUndefined();
  });
});
