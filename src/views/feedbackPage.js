const PAGE_STYLE = `
  body { font-family: Arial, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 16px; color: #222; }
  nav { text-align: right; margin-bottom: 16px; }
  nav a { margin-left: 12px; }
  label { display: block; font-weight: bold; margin: 20px 0 8px; }
  textarea { width: 100%; min-height: 90px; padding: 8px; font-size: 15px; box-sizing: border-box; }
  button { margin-top: 24px; padding: 10px 20px; font-size: 15px; cursor: pointer; }
  .date { color: #555; }
`;

function buildLanguageLinks() {
  return '<nav><a href="/feedback?lang=en">English</a><a href="/feedback?lang=fr">Français</a></nav>';
}

function buildQuestionFields(questions) {
  const fields = questions.map((question, index) => {
    const fieldName = `answer_${index + 1}`;
    return `
      <label for="${fieldName}">${index + 1}. ${question}</label>
      <textarea id="${fieldName}" name="${fieldName}" required></textarea>`;
  });
  return fields.join('');
}

function buildPage(language, title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${PAGE_STYLE}</style>
</head>
<body>
  ${buildLanguageLinks()}
  ${bodyContent}
</body>
</html>`;
}

function renderFeedbackForm(language, text, todayText) {
  const bodyContent = `
  <h1>${text.page_title}</h1>
  <p class="date">${text.date_label}: ${todayText}</p>
  <p>${text.instructions}</p>
  <form method="POST" action="/feedback?lang=${language}">
    ${buildQuestionFields(text.questions)}
    <button type="submit">${text.submit_button}</button>
  </form>`;

  return buildPage(language, text.page_title, bodyContent);
}

function renderThankYou(language, text) {
  const bodyContent = `
  <h1>${text.thank_you}</h1>
  <p><a href="/feedback?lang=${language}">${text.back_link}</a></p>`;

  return buildPage(language, text.page_title, bodyContent);
}

module.exports = { renderFeedbackForm, renderThankYou };
