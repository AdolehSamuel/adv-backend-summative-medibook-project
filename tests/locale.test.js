const { pickLanguage } = require('../src/utils/locale');

describe('pickLanguage', () => {
  test('keeps a supported language', () => {
    expect(pickLanguage('fr')).toBe('fr');
  });

  test('falls back to English for an unsupported language', () => {
    expect(pickLanguage('de')).toBe('en');
  });

  test('falls back to English when no language is given', () => {
    expect(pickLanguage(undefined)).toBe('en');
  });
});
