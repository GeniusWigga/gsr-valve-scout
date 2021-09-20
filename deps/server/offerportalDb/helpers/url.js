const DEFAULT_LOCALE = "de";

function getLocale() {
  const locale = window.__locale;
  if (!locale) {
    return DEFAULT_LOCALE;
  }
  return locale;
}

module.exports = {
  getLocale,
  DEFAULT_LOCALE,
};
