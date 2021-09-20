import React from "react";
import _ from "lodash";
import KvCalculator from "./KvCalculator";
import Question from "./Question.jsx";
import QuestionsWrapper from "./QuestionsWrapper";
import RadioInput from "./RadioInput.jsx";
import OperatingPressureInput from "./OperatingPressureInput.jsx";
import ValveOptionQuestion from "./questions/ValveOptionQuestion.jsx";
import AnswerWrapper from "./AnswerWrapper.jsx";
import valveScout from "../../deps/js/static/valveScout";
import { _l } from "../../deps/server/helpers/locale.js";
import dataLayerPush from "../helper/dataLayerHelper.js";
import MaterialQuestion from "./questions/MaterialQuestion";
import MediaQuestion from "./questions/MediaQuestion";

export function generateUnsetAnswers(question, additionalKeys = []) {
  const unsetAnswerKeys = _.get(question, "unsetAnswerKeys", []);

  return _.chain(unsetAnswerKeys)
    .concat(additionalKeys)
    .keyBy()
    .mapValues(() => null)
    .value();
}

export default class QuestionContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // show material question by default
      // but if media was set then show media question
      // showMediaQuestion: _.has(props.currentAnswers, "media")

      // show media question by default
      // but if either housingMaterial or sealing was set then show
      // materials question
      showMediaQuestion: !(_.has(props.currentAnswers, "housingMaterial") || _.has(props.currentAnswers, "sealing")),
    };
  }

  _renderRadioInputs = (question, categoryName, transformAnswersFn = _.identity) => {
    const { currentAnswers, addAnswers, locale } = this.props;

    const isAnswerChecked = (categoryName, answer) =>
      _.isEqual(_.get(currentAnswers, [categoryName, "answer"]), answer.answer);

    const possibleAnswers = transformAnswersFn(_.get(question, ["answers", categoryName]));

    return _.map(possibleAnswers, (possibleAnswer, index) => (
      <RadioInput
        key={index}
        answer={possibleAnswer}
        locale={locale}
        addAnswers={addAnswers}
        checked={isAnswerChecked(categoryName, possibleAnswer)}
        question={question}
      />
    ));
  };

  render() {
    const { questions, locale, currentAnswers, addAnswers, isFilteredAnswersRequesting } = this.props;

    const { showMediaQuestion } = this.state;

    const isSolenoidValveSelected = _.get(currentAnswers, ["valveCategory", "answer"]) == 1;

    const threadConnection = _l(valveScout.questionConnectionThreaded, locale);
    const flangeConnection = _l(valveScout.questionConnectionFlanged, locale);

    const alternativeMaterialText = _l(valveScout.buttons.alternativeMaterial, locale);
    const alternativeMediumText = _l(valveScout.buttons.alternativeMedia, locale);

    const currentRemark = _l(valveScout.questionVoltageCurrent.remark, locale);

    const valveCategoryQuestion = questions.valveCategory;
    const switchPositionQuestion = questions.switchPosition;
    const connectionQuestion = questions.connection;
    const mediaQuestion = questions.media;
    const materialsQuestion = questions.materials;
    const environmentQuestion = questions.environment;
    const protectionClassQuestion = questions.protectionClass;
    const operatingPressureQuestion = questions.operatingPressure;
    const currentAndVoltageQuestion = questions.currentAndVoltage;
    const pressureControlledFunctionQuestion = questions.pressureControlledFunction;
    const valveOptionQuestion = questions.valveOption;

    return (
      <QuestionsWrapper ref="questionWrapper" currentAnswers={currentAnswers} addAnswers={addAnswers}>
        <Question question={valveCategoryQuestion} locale={locale} required>
          <AnswerWrapper name="valveCategory">
            {this._renderRadioInputs(valveCategoryQuestion, "valveCategory")}
          </AnswerWrapper>
        </Question>

        <Question question={switchPositionQuestion} locale={locale}>
          <AnswerWrapper name="switchPosition">
            {this._renderRadioInputs(switchPositionQuestion, "switchPosition")}
          </AnswerWrapper>
        </Question>

        <Question question={connectionQuestion} locale={locale}>
          <div className="answer-columns">
            <AnswerWrapper name="connection">
              <h3>{threadConnection}</h3>
              {this._renderRadioInputs(connectionQuestion, "connection", (answers) =>
                _.filter(answers, ({ label }) => label.indexOf("G") >= 0),
              )}
            </AnswerWrapper>

            <AnswerWrapper name="connection">
              <h3>{flangeConnection}</h3>
              {this._renderRadioInputs(connectionQuestion, "connection", (answers) =>
                _.filter(answers, ({ label }) => label.indexOf("DN") >= 0),
              )}
            </AnswerWrapper>
          </div>

          <KvCalculator
            addAnswers={addAnswers}
            currentAnswers={currentAnswers}
            locale={locale}
            mediaQuestion={mediaQuestion}
            connectionQuestion={connectionQuestion}
          />
        </Question>

        {(() => {
          if (!showMediaQuestion) {
            return null;
          }

          const onClick = () => {
            addAnswers(generateUnsetAnswers(mediaQuestion));

            dataLayerPush("switch-media", "from-media-to-material");

            this.setState({ showMediaQuestion: !showMediaQuestion });
          };

          return (
            <MediaQuestion question={mediaQuestion} locale={locale} currentAnswers={currentAnswers}>
              <a className="alternative-button" onClick={onClick}>
                <i className="fa fa-hand-o-right" />
                {alternativeMaterialText}
              </a>
            </MediaQuestion>
          );
        })()}

        {(() => {
          if (showMediaQuestion) {
            return null;
          }

          const onClick = () => {
            addAnswers(generateUnsetAnswers(materialsQuestion));

            dataLayerPush("switch-media", "from-material-to-media");

            this.setState({ showMediaQuestion: !showMediaQuestion });
          };

          return (
            <MaterialQuestion currentAnswers={currentAnswers} question={materialsQuestion} locale={locale}>
              <a className="alternative-button" onClick={onClick}>
                <i className="fa fa-hand-o-right" />
                {alternativeMediumText}
              </a>
            </MaterialQuestion>
          );
        })()}

        {isSolenoidValveSelected ? (
          <Question question={environmentQuestion} locale={locale}>
            <AnswerWrapper name="environment">
              {this._renderRadioInputs(environmentQuestion, "environment")}
            </AnswerWrapper>
          </Question>
        ) : null}

        {isSolenoidValveSelected ? (
          <Question question={protectionClassQuestion} locale={locale}>
            <AnswerWrapper name="protectionClass">
              {this._renderRadioInputs(protectionClassQuestion, "protectionClass")}
            </AnswerWrapper>
          </Question>
        ) : null}

        <Question question={operatingPressureQuestion} locale={locale}>
          <AnswerWrapper name="operatingPressure">
            <OperatingPressureInput
              disabled={isFilteredAnswersRequesting}
              operatingPressureQuestion={operatingPressureQuestion}
              addAnswers={addAnswers}
              currentAnswers={currentAnswers}
              locale={locale}
            />
          </AnswerWrapper>
        </Question>

        {!isSolenoidValveSelected ? (
          <Question question={pressureControlledFunctionQuestion} locale={locale}>
            <AnswerWrapper name="pressureControlledFunction">
              {this._renderRadioInputs(pressureControlledFunctionQuestion, "pressureControlledFunction")}
            </AnswerWrapper>
          </Question>
        ) : null}

        {isSolenoidValveSelected ? (
          <Question question={currentAndVoltageQuestion} locale={locale}>
            <div className="answer-columns">
              <AnswerWrapper name="voltage">
                {this._renderRadioInputs(currentAndVoltageQuestion, "voltage", (answers) =>
                  _.orderBy(answers, ["answer"], ["asc"]),
                )}
              </AnswerWrapper>

              <AnswerWrapper
                name="current"
                className={_.has(currentAnswers, "voltage") ? "current-column fadeIn" : "current-column"}
              >
                <div className="remark">{currentRemark}</div>
                {_.has(currentAnswers, "voltage") && this._renderRadioInputs(currentAndVoltageQuestion, "current")}
              </AnswerWrapper>
            </div>
          </Question>
        ) : null}

        <ValveOptionQuestion
          question={valveOptionQuestion}
          locale={locale}
          addAnswers={addAnswers}
          currentAnswers={currentAnswers}
        />
      </QuestionsWrapper>
    );
  }
}
