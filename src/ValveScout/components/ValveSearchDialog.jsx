import React from "react";
import classnames from "classnames";
import _ from "lodash";

import AnswerWrapper from "./AnswerWrapper";
import RadioInput from "./RadioInput";
import OutsideClickWrapper from "./OutsideClickWrapper";
import structure from "../../../server/helpers/structure";
import { _l } from "../../../server/helpers/locale";
import valveScout from "../../static/valveScout";

class ValveSearchDialog extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      initialCurrent: null,
      currentAnswers: {},
    };

    this.setAnswer = this.setAnswer.bind(this);
    this.openPrinter = this.openPrinter.bind(this);
  }

  componentDidMount() {
    const { currentTypes, answer } = this.props;
    const { displayValue, isSingleCurrentValve } = answer;
    const initialCurrentKey = _.last(displayValue.split("/")).charAt(0);

    /* if answer is a article-number with a current-key we set radiobutton initial to that */
    if (initialCurrentKey !== ".") {
      const currentValue = isSingleCurrentValve || _.get(currentTypes, initialCurrentKey);
      if (currentValue) {
        this.setState({
          initialCurrent: currentValue,
          currentAnswers: { current: currentValue },
        });
      }
    }
  }

  setAnswer(answer) {
    if (_.has(answer, "voltage")) {
      const clickedVoltage = _.get(answer, ["voltage", "answer"]);
      const deselect = clickedVoltage === this.state.currentAnswers.voltage;

      this.setState({
        currentAnswers: {
          ...this.state.currentAnswers,
          voltage: deselect ? null : clickedVoltage,
        },
      });
    } else {
      const clickedCurrent = _.get(answer, ["current", "answer"]);
      const deselect = clickedCurrent === this.state.currentAnswers.current;

      this.setState({
        currentAnswers: {
          ...this.state.currentAnswers,
          current: deselect ? null : clickedCurrent,
        },
      });
    }
  }

  openPrinter(withValues) {
    const { answer, customer, locale } = this.props;
    // eslint-disable-next-line prefer-const
    let { productID, displayValue } = answer;
    const { initialCurrent, currentAnswers } = this.state;
    const { voltage, current } = currentAnswers;

    if ((withValues && initialCurrent && initialCurrent !== current) || initialCurrent) {
      /* if user enters different current than initially set from valve-search input
       we have to remove key from article-number to prevent a error in the valve-printer! */
      /* if user does not know what current he wants/needs but article-number from valve-search has one, remove it! */
      const numberVals = displayValue.split("/");
      const lastPart = _.last(numberVals);

      displayValue = `${_.dropRight(numberVals, 1).join("/")}/.${lastPart.substring(1)}`;
    }

    const params = _.pickBy({ current, customer, ignore: "ignore", ...(withValues && { voltage, current }) });
    const query = _.map(params, (value, key) => `${key}=${value}`).join("&");
    const link = `${structure.getLinkNode("valve_printer").getUrl(locale)}/pdf/${productID}/${encodeURIComponent(
      displayValue,
    )}?${query}`;

    window.open(link);
  }

  renderHelpButton = () => {
    const { currentAnswers: { voltage, current } = {} } = this.state;
    const { locale, disableHelpButton, onSubmit } = this.props;

    if (disableHelpButton) {
      return null;
    }

    return (
      <button
        className="valve-search-dialog-submit empty"
        onClick={
          onSubmit
            ? () => onSubmit(voltage, current, true)
            : () => {
                this.openPrinter(false);
              }
        }
      >
        <div className="button-text">
          <i className="fa fa-arrow-right" />
          {_l(valveScout.valveSearch.dialog["dont-know"], locale)}
        </div>
      </button>
    );
  };

  render() {
    const { locale, currentAndVoltageQuestion, onClose, answer, onSubmit, disableCurrent, requireAnswers } = this.props;
    const { displayValue, isSingleCurrentValve } = answer;

    const { currentAnswers } = this.state;
    const { voltage, current } = currentAnswers;
    const isSubmitDisabled = requireAnswers && (!current || !voltage);

    const _onSubmit = () => {
      if (isSubmitDisabled) {
        return;
      }

      if (onSubmit) {
        return onSubmit(voltage, current);
      }

      return this.openPrinter(true);
    };

    const submitButtonClasses = classnames("valve-search-dialog-submit", {
      "valve-search-dialog-submit--disabled": isSubmitDisabled,
    });

    return (
      <div className="valve-search-dialog">
        <div className="valve-search-dialog-content-wrapper">
          <OutsideClickWrapper handleClickOutside={onClose}>
            <div className="valve-search-dialog-content-container">
              <a onClick={onClose} className="valve-search-dialog-close">
                ×
              </a>
              <div className="valve-search-dialog-header">
                <h3 className="valve-search-dialog-article_number">
                  {`${_l(valveScout.valveSearch.dialog["article-number"], locale)} ${displayValue}`}
                </h3>
                <h2 className="valve-search-dialog-title">{_l(valveScout.valveSearch.dialog.header, locale)}</h2>
              </div>
              <div className="valve-search-dialog-answers">
                <AnswerWrapper name="voltage" className="column">
                  {_.orderBy(currentAndVoltageQuestion.answers.voltage, ["answer"], ["asc"]).map((answer, index) => (
                    <RadioInput
                      key={index}
                      answer={{ ...answer, available: true }}
                      locale={locale}
                      addAnswers={this.setAnswer}
                      checked={_.isEqual(_.get(currentAnswers, "voltage"), answer.answer)}
                      question={currentAndVoltageQuestion}
                    />
                  ))}
                </AnswerWrapper>
                <div className="column">
                  <h3 className="remark">{_l(valveScout.valveSearch.dialog["choose-current"], locale)}</h3>
                  <AnswerWrapper name="current">
                    {currentAndVoltageQuestion.answers.current.map((answer, index) => (
                      <RadioInput
                        disabled={disableCurrent}
                        key={index}
                        answer={{ ...answer, available: !isSingleCurrentValve }}
                        locale={locale}
                        addAnswers={this.setAnswer}
                        checked={_.trim(currentAnswers.current) === _.trim(answer.answer)}
                        question={currentAndVoltageQuestion}
                      />
                    ))}
                  </AnswerWrapper>
                  {isSingleCurrentValve ? (
                    <p className="valve-search-dialog-annotation">
                      {_l(valveScout.valveSearch.dialog.annotation, locale)}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="valve-search-dialog-footer">
                {this.renderHelpButton()}
                <button className={submitButtonClasses} onClick={_onSubmit}>
                  <div className="button-text">
                    <i className="fa fa-arrow-right" />
                    {_l(valveScout.valveSearch.dialog.submit, locale)}
                  </div>
                </button>
              </div>
            </div>
          </OutsideClickWrapper>
        </div>
      </div>
    );
  }
}

export default ValveSearchDialog;
