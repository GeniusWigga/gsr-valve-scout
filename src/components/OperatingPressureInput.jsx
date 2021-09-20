import React from "react";
import _ from "lodash";
import classnames from "classnames";
import renderHTML from "react-render-html";
import Loader from "./Loader.jsx";
import { _l, substitute } from "../../../server/helpers/locale.js";
import valveScout from "../../static/valveScout.js";

export default class OperatingPressureInput extends React.Component {
  static _saveOperatingPressureValue(event, addAnswers, maxPressure, questionNumber) {
    const value = OperatingPressureInput._validateValue(event.target.value);

    if (_.trim(value) === "") {
      addAnswers({ operatingPressure: null });
    } else if (value <= maxPressure) {
      addAnswers({
        operatingPressure: {
          answer: value,
          questionNumber,
          forceSet: true,
        },
      });
    }
  }

  static _handleOnBlur(event, addAnswers, maxPressure, questionNumber) {
    if (_.isEmpty(event.target.value)) {
      return;
    }

    OperatingPressureInput._saveOperatingPressureValue(event, addAnswers, maxPressure, questionNumber);
  }

  static _handleOnKeyUp(event, addAnswers, currentAnswers, maxPressure, questionNumber) {
    const { keyCode, target } = event;
    const { value } = target;

    const operatingPressureValue = _.get(currentAnswers, ["operatingPressure", "answer"], null);

    if (_.isEmpty(event.target.value)) {
      return;
    }

    if (keyCode === (13 || 9) && value !== operatingPressureValue) {
      OperatingPressureInput._saveOperatingPressureValue(event, addAnswers, maxPressure, questionNumber);
      event.target.blur();
    }
  }

  static _validateValue(value, maxPressure) {
    const _castedValue = _.toNumber(value);

    if (!value || _.startsWith(value, "-") || _.isNaN(_castedValue)) {
      return "";
    }
    if (_castedValue >= maxPressure) {
      return maxPressure;
    }
    return _castedValue;
  }

  _setOperatingPressureValue(value) {
    this.setState({ operatingPressureValue: value });
  }

  _handleSubmit(event, addAnswers, currentAnswers, maxPressure) {
    const { operatingPressureValue } = this.state;

    const cachedOperatingPressureValue = _.get(currentAnswers, ["operatingPressure", "answer"], null);
    const shouldChange =
      !_.isEmpty(operatingPressureValue) && !_.isEqual(cachedOperatingPressureValue, operatingPressureValue);

    if (shouldChange) {
      OperatingPressureInput._saveOperatingPressureValue(event, addAnswers, maxPressure);
    }
  }

  constructor(props) {
    super(props);

    const operatingPressureValue = _.get(props.currentAnswers, ["operatingPressure", "answer"], {});

    const operatingPressureVal =
      _.isPlainObject(operatingPressureValue) && _.isEmpty(operatingPressureValue)
        ? "" // if it's an empty object user selected to skip the answer previously
        : operatingPressureValue;

    this.state = {
      operatingPressureValue: operatingPressureVal,
    };
  }

  render() {
    const { operatingPressureQuestion, currentAnswers, addAnswers, disabled, locale, questionNumber } = this.props;
    const { operatingPressureValue } = this.state;
    const currentOperatingPressure = _.get(currentAnswers, ["operatingPressure", "answer"]);

    const maxPressure = _.get(
      operatingPressureQuestion,
      "answers.operatingPressure[0].answer",
      currentOperatingPressure,
    );

    const descriptionText = substitute(_l(valveScout.questions.operatingPressure.descriptionMaxPressure, locale), {
      maxPressure,
    });

    const submitString = _l(valveScout.buttons.confirm, locale);

    return (
      <div className={classnames({ disable: disabled })}>
        <Loader customClass="operatingPressure" loaded={!disabled || _.has(currentAnswers, "operatingPressure")}>
          {renderHTML(descriptionText)}
        </Loader>
        <input
          type="number"
          pattern="[0-9]+([,\.][0-9]+)?"
          max={maxPressure}
          name="operatingPressure"
          onChange={(event) => {
            const validatedValue = OperatingPressureInput._validateValue(
              event.target.value,
              maxPressure,
              questionNumber,
            );

            this._setOperatingPressureValue(validatedValue);
          }}
          onBlur={(event) => OperatingPressureInput._handleOnBlur(event, addAnswers, maxPressure, questionNumber)}
          onKeyUp={(event) =>
            OperatingPressureInput._handleOnKeyUp(event, addAnswers, currentAnswers, maxPressure, questionNumber)
          }
          value={operatingPressureValue}
        />
        <a
          onClick={() => {
            this._setOperatingPressureValue("");
            addAnswers({ operatingPressure: null });
          }}
        >
          <i className="fa fa-times cross-button" />
        </a>
        <br />
        <a
          className="submit-btn"
          onClick={(event) => this._handleSubmit(event, addAnswers, currentAnswers, maxPressure)}
        >
          {submitString}
        </a>
      </div>
    );
  }
}
