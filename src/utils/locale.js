const english = require('../../locales/en.json');
const french = require('../../locales/fr.json');

const DEFAULT_LANGUAGE = 'en';

const translations = {
  en: english,
  fr: french,
};

function pickLanguage(requestedLanguage) {
  const isSupported = Object.keys(translations).includes(requestedLanguage);
  return isSupported ? requestedLanguage : DEFAULT_LANGUAGE;
}

function getTranslation(language) {
  return translations[language];
}

function formatTodayForLocale(intlLocale, today) {
  const formatter = new Intl.DateTimeFormat(intlLocale, { dateStyle: 'full' });
  return formatter.format(today);
}

module.exports = { pickLanguage, getTranslation, formatTodayForLocale };
