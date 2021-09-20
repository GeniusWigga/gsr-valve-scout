import React from "react";
import classnames from "classnames";
import _ from "lodash";

import { _l } from "../../deps/server/helpers/locale";
import valveScout from "../../deps/js/static/valveScout";
import { getHelpText } from "../helper/valveScoutHelper.js";
import dataLayerPush from "../helper/dataLayerHelper.js";
import { HelpTextActions } from "../reflux/actions.js";

const BasicQuestionButton = ({ text, additionalClassName, onClick, children }) => {
  const classes = classnames("question-button", additionalClassName, { clickable: typeof onClick === "function" });

  return (
    <a className={classes} onClick={onClick}>
      {children || null}
      {<span>{text || "\u00A0"}</span>}
    </a>
  );
};

export const ArrowDownQuestionButton = (props) => (
  <BasicQuestionButton {...props}>
    <span className="arrow-down">
      <i className="fa fa-long-arrow-down" />
    </span>
  </BasicQuestionButton>
);

export const InfoQuestionButton = (props) => (
  <BasicQuestionButton {...props}>
    <span className="question-icon">
      <i className="fa fa-question-circle-o" />
    </span>
  </BasicQuestionButton>
);

export const EmptyQuestionButton = () => <BasicQuestionButton />;

export const QuestionHelpButton = ({ locale, question }) => {
  const helpButton = _l(valveScout.buttons.questionHelp, locale);

  const helpText = getHelpText(locale, question.helpText);

  const onHelp = () => {
    // track help click
    dataLayerPush("help", `#${question.number} ${question.answerKeys.join(", ")}`);

    HelpTextActions.showHelpText(helpText);
  };

  return _.isEmpty(helpText) ? <EmptyQuestionButton /> : <InfoQuestionButton text={helpButton} onClick={onHelp} />;
};

export const QuestionSkipButton = ({ required, locale, question, addAnswers }) => {
  const answerRequiredText = _l(valveScout.buttons.questionMandatory, locale);
  const answerCanBeSkippedText = _l(valveScout.buttons.questionSkip, locale);

  const onSkip = () => {
    // track skip click
    dataLayerPush("skip", `#${question.number} ${question.answerKeys.join(", ")}`);

    addAnswers(_.fromPairs(_.map(question.answerKeys, (key) => [key, { questionNumber: question.number }])));
  };

  return required ? (
    <BasicQuestionButton text={answerRequiredText} additionalClassName="small-font-size" />
  ) : (
    <ArrowDownQuestionButton text={answerCanBeSkippedText} additionalClassName="normal-font-size" onClick={onSkip} />
  );
};

export const QuestionNextButton = ({ locale, question, currentAnswers, addAnswers }) => {
  const answerNextText = _l(valveScout.buttons.questionNext, locale);

  const onNext = () => {
    // track next click
    dataLayerPush("next", `#${question.number} ${question.answerKeys.join(", ")}`);

    const currentAnswerKeys = _.keys(_.pick(currentAnswers, question.answerKeys));

    const partiallySkippedAnswerKeys = _.difference(question.answerKeys, currentAnswerKeys);

    addAnswers(_.fromPairs(_.map(partiallySkippedAnswerKeys, (key) => [key, { questionNumber: question.number }])));
  };

  return <ArrowDownQuestionButton text={answerNextText} additionalClassName="normal-font-size" onClick={onNext} />;
};
