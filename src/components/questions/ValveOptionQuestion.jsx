import cn from "classnames";
import _ from "lodash";
import PropTypes from "prop-types";
import React, { Component } from "react";

import { _l } from "../../../deps/server/helpers/locale.js";
import valveScout from "../../../deps/js/static/valveScout";
import AnswerWrapper from "../AnswerWrapper.jsx";
import Question from "../Question.jsx";
import RadioInput from "../RadioInput.jsx";

const MIN_NUM_OPTIONS_TO_FILTER = 10;

export default class ValveOptionQuestion extends Component {
  static propTypes = {
    question: PropTypes.object.isRequired,
    locale: PropTypes.string.isRequired,
    addAnswers: PropTypes.func.isRequired,
    currentAnswers: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.renderRadioInput = this.renderRadioInput.bind(this);
    this.state = { currentCategoryIds: [] };
  }

  renderRadioInput(answer, index, activeValveOptionIds) {
    const { locale, addAnswers, currentAnswers } = this.props;
    const detailsActionElementLabel = _l(valveScout.questionValveOption.details, locale);

    return (
      <RadioInput
        key={index}
        answer={{
          ...answer,
          options: _.map(answer.options, option => {
            const { id } = option;

            return {
              ...option,
              active: _.includes(activeValveOptionIds, id),
            };
          }),
        }}
        locale={locale}
        addAnswers={addAnswers}
        checked={_.isEqual(_.get(currentAnswers, ["valveOption", "answer"]), answer.answer)}
        actionElement={<p>{detailsActionElementLabel}</p>}
      />
    );
  }

  render() {
    const { currentCategoryIds } = this.state;
    const { question, locale } = this.props;

    const standardOptions = _l(valveScout.questionValveOption.standard, locale);
    const specialOptions = _l(valveScout.questionValveOption.special, locale);
    const filterOptionsHeadline = _l(valveScout.questionValveOption.options, locale);

    const availableAnswers = _.filter(question.answers.valveOption, "available");
    const shouldRenderFilters = availableAnswers.length > MIN_NUM_OPTIONS_TO_FILTER;

    const currentCategories = _.map(currentCategoryIds,
        categoryId => _.find(question.valveOptionCategories, {"id": categoryId})
    )

    const filteredAnswers =
      !_.isEmpty(currentCategories)
        ? _.filter(availableAnswers, ({ options }) => {
          const optionIds = _.map(options, "id");

          return _.every(currentCategories, ({ valveOptions }) => {
            const categoryValveOptionIds = _.map(valveOptions, "id");

            return _.intersection(optionIds, categoryValveOptionIds).length;
          });
        })
        : availableAnswers;

    const answers = _.sortBy(filteredAnswers, (answer) => String(_l(answer.label, locale)).trim().toLowerCase());
    const activeValveOptionIds = _.flatMap(currentCategories, ({valveOptions}) => _.map(valveOptions, "id"));

    const [standardRadioInputs, specialRadioInputs] = _
      .partition(answers, "standard")
      .map(answers => _
        .map(answers, (answer, index) => this.renderRadioInput(answer, index, activeValveOptionIds)),
      );

    const isFilterActive = (id) => _.includes(currentCategoryIds, id);

    const onFilter = (id) => {
      const alreadySelected = isFilterActive(id);

      this.setState({
        ...this.state,
        currentCategoryIds: alreadySelected ? _.without(currentCategoryIds, id) : _.concat(currentCategoryIds, id),
      });
    };

    const answerIds = _.chain(answers).flatMap("options").map("id").value();
    // filter categories that are not filterable
    const filteredAndSortedCategories = _.chain(question.valveOptionCategories)
      .filter(({ valveOptions }) => {
        return _.some(valveOptions, ({ id }) => _.includes(answerIds, id));
      })
      .sortBy("order")
      .value();

    const standardRadioInputsCount = standardRadioInputs.length;
    const specialRadioInputsCount = specialRadioInputs.length;
    const resultTranslation = _l(valveScout.questionValveOption.result, locale);
    const resultsTranslation = _l(valveScout.questionValveOption.results, locale);
    const resultTranslationByCount = (count) => (count > 1 ? resultsTranslation : resultTranslation);
    const standardCountIndicatorTranslation = ` (${standardRadioInputsCount} ${resultTranslationByCount(
      standardRadioInputsCount,
    )})`;
    const specialCountIndicatorTranslation = ` (${specialRadioInputsCount} ${resultTranslationByCount(
      specialRadioInputsCount,
    )})`;

    return (
      <Question question={question} locale={locale} required>
        {shouldRenderFilters && (
          <div className="answer">
            <h3 className="valve-option-question__filter-headline">{filterOptionsHeadline}</h3>
            <div className="valve-option-question__filter">
              {_.map(filteredAndSortedCategories, (category, key) => {
                const { identifier, id } = category;
                return (
                  <button
                    className={cn("valve-option-question__item", { active: isFilterActive(id) }, "button-invert")}
                    key={key}
                    onClick={() => onFilter(id)}
                  >
                    {_l(identifier, locale)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {!_.isEmpty(standardRadioInputs) ? (
          <AnswerWrapper id="valveOptionStandard" name="valveOption">
            <h3>
              {standardOptions}
              <span className="valve-option-question__count-indicator">{standardCountIndicatorTranslation}</span>
            </h3>
            {standardRadioInputs}
          </AnswerWrapper>
        ) : null}

        {!_.isEmpty(specialRadioInputs) ? (
          <AnswerWrapper id="valveOptionSpecial" name="valveOption">
            <h3>
              {specialOptions}
              <span className="valve-option-question__count-indicator">{specialCountIndicatorTranslation}</span>
            </h3>
            {specialRadioInputs}
          </AnswerWrapper>
        ) : null}
      </Question>
    );
  }
}
