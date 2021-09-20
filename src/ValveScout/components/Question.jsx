import React from "react";
import _ from "lodash";
import AnswerWrapper from "./AnswerWrapper.jsx";
import { QuestionHelpButton, QuestionSkipButton } from "./QuestionButton.jsx";
import { _l } from "../../../server/helpers/locale";
import valveScout from "../../static/valveScout.js";

export const PlainQuestion = ({ question, children, locale }) => {
  const questionCountString = `${_l(valveScout.questionText, locale)} ${question.number}`;

  return (
    <div className={`question-wrapper ${question.id}`}>
      <div className="question-content-wrapper">
        <h3 className="question-count">{questionCountString}</h3>
        <h2 className="question-title">{_l(question.title, locale)}</h2>
      </div>

      {React.Children.map(children, (child) => {
        if (child && _.isEqual(child.type, AnswerWrapper)) {
          return React.cloneElement(child, {
            questionId: question.id,
            questionNumber: question.number,
          });
        }
        return child;
      })}
    </div>
  );
};

const Question = ({ question, children, required, locale, addAnswers }) => (
  <PlainQuestion question={question} locale={locale}>
    {children}

    <div className="question-button-container-wrapper">
      <QuestionHelpButton locale={locale} question={question} />

      <QuestionSkipButton required={required} locale={locale} question={question} addAnswers={addAnswers} />
    </div>
  </PlainQuestion>
);

export default Question;
