import _ from "lodash";
import { _l } from "../../deps/server/helpers/locale";

export function mapAnswersToQuestions(questions, answers) {
  return _.keyBy(
    _.map(questions, (question, index) => ({
      ...question,
      index,
      answers: _.fromPairs(_.map(question.answerKeys, (answerKey) => [answerKey, _.get(answers, [answerKey], [])])),
    })),
    "id",
  );
}

export function getImageUrl(uuid, locale, size, filename) {
  return `/attachments/${uuid}/${locale}/${size}/${filename}`;
}

export function getHelpText(locale, _helpText) {
  const helpText = _l(_.get(_helpText, ["value"], {}), locale);

  const uuid = _.get(_helpText, ["attachment", 0, "uuid"]);
  const filename = _l(_.get(_helpText, ["attachment", 0, "externalName"], {}), locale);

  const imgSrc = uuid ? getImageUrl(uuid, locale, "reduced", filename) : null;

  return helpText
    ? {
        helpText,
        imgSrc,
      }
    : null;
}
