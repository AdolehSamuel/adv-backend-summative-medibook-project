const { pickLanguage, getTranslation, formatTodayForLocale } = require('../utils/locale');
const { renderFeedbackForm, renderThankYou } = require('../views/feedbackPage');

function showFeedbackForm(req, res) {
  const language = pickLanguage(req.query.lang);
  const text = getTranslation(language);
  const todayText = formatTodayForLocale(text.intl_locale, new Date());

  res.send(renderFeedbackForm(language, text, todayText));
}

function submitFeedback(req, res) {
  const language = pickLanguage(req.query.lang);
  const text = getTranslation(language);

  res.send(renderThankYou(language, text));
}

module.exports = { showFeedbackForm, submitFeedback };
