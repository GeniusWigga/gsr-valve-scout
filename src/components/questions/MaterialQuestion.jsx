import React, { Component } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { PlainQuestion } from "../Question.jsx";
import RadioInput from "../RadioInput.jsx";
import AnswerWrapper from "../AnswerWrapper.jsx";
import { QuestionHelpButton, QuestionNextButton } from "../QuestionButton.jsx";
import valveScout from "../../../deps/js/static/valveScout";
import { _l } from "../../../deps/server/helpers/locale";

export default class MaterialQuestion extends Component {
  static propTypes = {
    question: PropTypes.object.isRequired,
    locale: PropTypes.string.isRequired,
    addAnswers: PropTypes.func,
    currentAnswers: PropTypes.object.isRequired,
  };

  _renderHousingMaterials() {
    const { question, locale, addAnswers, currentAnswers } = this.props;

    const housing = _l(valveScout.questionMaterialHousing, locale);

    return (
      <AnswerWrapper name="housingMaterial" className="column">
        <h3>{housing}</h3>
        {_.orderBy(question.answers.housingMaterial, ["label", locale], ["asc"]).map((answer, index) => (
          <RadioInput
            key={index}
            answer={answer}
            locale={locale}
            addAnswers={addAnswers}
            checked={_.isEqual(_.get(currentAnswers, ["housingMaterial", "answer"]), answer.answer)}
            question={question}
          />
        ))}
      </AnswerWrapper>
    );
  }

  _renderSealings() {
    const { question, locale, addAnswers, currentAnswers } = this.props;

    const sealing = _l(valveScout.questionMaterialSealing, locale);

    return (
      <AnswerWrapper name="sealing" className="column">
        <h3>{sealing}</h3>
        {question.answers.sealing.map((answer, index) => (
          <RadioInput
            key={index}
            answer={answer}
            locale={locale}
            addAnswers={addAnswers}
            checked={_.isEqual(_.get(currentAnswers, ["sealing", "answer"]), answer.answer)}
            question={question}
          />
        ))}
      </AnswerWrapper>
    );
  }

  render() {
    const { question, locale, children, currentAnswers, addAnswers } = this.props;

    return (
      <PlainQuestion question={question} locale={locale}>
        {/* switch-media button */ children}

        {this._renderHousingMaterials()}
        {this._renderSealings()}

        <div className="question-button-container-wrapper">
          <QuestionHelpButton locale={locale} question={question} />
          <QuestionNextButton
            locale={locale}
            question={question}
            currentAnswers={currentAnswers}
            addAnswers={addAnswers}
          />
        </div>
      </PlainQuestion>
    );
  }
}
