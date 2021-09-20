const _ = require("lodash");

const DEFAULT_LANGTAG = "de-DE";

const LOCALE = {
  DE: "de",
  EN: "en",
};

const LANG_TAG = {
  [LOCALE.DE]: "de-DE",
  [LOCALE.EN]: "en-GB",
};

/**
 * Retrieves translations from obj. If obj is an array
 * translations will be joined with separator.
 *
 * If no translation is found for locale, tries to
 * retrieve translation for DEFAULT_LANGTAG.
 *
 * [
 *   {
 *     "id": 1,
 *     "value": { "de-DE": "Hallo", "en-GB": "Hello" }
 *   },
 *   {
 *     "id": 2,
 *     "value": { "de-DE": "Tschüss", "en-GB": "Bye bye" }
 *   }
 * ]
 *
 * @param obj e.g. above
 * @param locale e.g. 'en'
 * @param separator e.g. ' - '
 * @param takeAllFromConcat e.g. true or false
 *
 * @returns string e.g. "Hello - Bye Bye"
 */
function translationFromObject(obj, locale, separator = " ", takeAllFromConcat) {
  if (typeof separator !== "string") {
    separator = ", ";
  }

  if (obj && _.isArray(obj) && !_.isEmpty(_.compact(obj))) {
    const mapped = _.map(obj, (item) => {
      const value = item !== null && typeof item.value !== "undefined" ? item.value : item;

      if (value && _.isArray(value)) {
        return takeAllFromConcat
          ? translationFromObject(value, locale, separator, takeAllFromConcat)
          : translationFromObject(_.get(value, [0], ""), locale, separator, takeAllFromConcat);
      }
      return translationFromObject(value, locale, separator, takeAllFromConcat);
    });

    return mapped.join(separator);
  }
  if (obj && _.isPlainObject(obj) && obj.value) {
    return translationFromObject(obj.value, locale, separator, takeAllFromConcat);
  }
  if (obj) {
    const langtag = mapLocaleToLangtag(locale, obj);
    return _translation(obj, langtag);
  }
}

/**
 * Parses plain object (obj) for translation based on langtag.
 *
 * @private
 *
 * @param obj e.g. { 'de-DE' : 'Hallo', 'en-GB' : 'Hello' }
 * @param langtag e.g. 'en-GB'
 * @param defaultLangtag e.g. 'de-DE'
 *
 * @returns string e.g. 'Hello'
 */
function _translation(obj, langtag, defaultLangtag) {
  if (!_.isPlainObject(obj)) {
    return obj;
  }

  if (!defaultLangtag) {
    defaultLangtag = DEFAULT_LANGTAG;
  }

  let content = obj[langtag];

  // fallback to default translation if no or empty translation found
  if ((content === null || content === "") && langtag !== defaultLangtag) {
    content = obj[defaultLangtag];
  }

  return content;
}

/**
 * Tries to map locale 'de' to a langtag like 'de-DE'.
 *
 * mapLocaleToLangtag('de', {"en-GB" : ".", "de-DE" : "."}) === 'de-DE'
 * mapLocaleToLangtag('en', {"en-GB" : ".", "de-DE" : "."}) === 'en-GB'
 * mapLocaleToLangtag('en', {"de-DE" : "."}) === 'de-DE'
 * mapLocaleToLangtag('en', {}) === 'de-DE'
 *
 * @param locale e.g. 'de'
 * @param obj e.g. { "de-DE" : "Hallo", "en-GB" : "Hello" }
 * @param defaultLangtag e.g. 'de-DE'
 * @returns langtag e.g. 'en-GB'
 */
function mapLocaleToLangtag(locale, obj, defaultLangtag) {
  if (!defaultLangtag) {
    defaultLangtag = DEFAULT_LANGTAG;
  }

  // langtag de-DE starts with locale de
  const langtag = _.find(_.keys(obj), (langtag) => _.startsWith(langtag, locale));

  return langtag || defaultLangtag;
}

/**
 * Substitutes "{{n}}" with the field n of substitute
 */
function substitute(string, substitute) {
  const regex = new RegExp("{{([a-zA-Z]+)}}", "g");

  return string.replace(regex, (match, placeholder) =>
    typeof substitute[placeholder] !== "undefined" ? substitute[placeholder] : match,
  );
}

module.exports = {
  DEFAULT_LANGTAG,
  LOCALE,
  LANG_TAG,
  _l: translationFromObject,
  _translation,
  mapLocale: mapLocaleToLangtag,
  substitute,
};
