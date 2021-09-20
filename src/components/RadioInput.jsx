import $ from "jquery";
import _ from "lodash";
import "magnific-popup";
import React, { createElement, forwardRef, useEffect, createRef } from "react";
import ReactDOM from "react-dom";

import { _l } from "../../../server/helpers/locale";
import buildClassName from "../../OfferPortal/helper/buildClassName";
import popup from "../../popup";
import { ToolTipActions } from "../reflux/actions.js";
import { generateUnsetAnswers } from "./QuestionContainer";

const TOGGLE_DRAWING_ID = "toggle-drawing";

const InfoWrapper = forwardRef(({ drawingUrl, helpTexts, elementId, checked, actionElement, hasActive }, ref) => {
  const id = `${TOGGLE_DRAWING_ID}--${elementId}`;

  useEffect(() => {
      popup.registerImage($(`#${id}`), {
        mainClass: "info-wrapper__popup",
        image: { verticalFit: true, tError: '<a href="%url%">The image</a> could not be loaded.' },
        callbacks: {
          beforeClose() {
            // Save scrolling position to restore it on close.
            // eslint-disable-next-line react/no-this-in-sfc
            this.scrollTop = $(document).scrollTop();
          },
          close() {
            // Restore scrolling position ffs! (hackz0r)
            setTimeout(() => {
              // eslint-disable-next-line react/no-this-in-sfc
              $(document).scrollTop(this.scrollTop);
            }, 0);
          },
        },
        removalDelay: 0,
      });
    }, [checked, hasActive]);

  if (_.isEmpty(helpTexts) && _.isEmpty(drawingUrl)) {
    return null;
  }

  const childComp = React.Children.map(actionElement, (child) =>
    React.cloneElement(child, {
      ref,
      className: "info-wrapper__action",
      onClick: (event) => event.preventDefault(),
    }),
  );

  return createElement(drawingUrl ? "a" : "span", {
    className: buildClassName("info-wrapper", { clickable: drawingUrl }),
    id: drawingUrl && id,
    href: drawingUrl && drawingUrl,
    children: (
      <>
        {_.isEmpty(drawingUrl) ? null : childComp}

        {_.isEmpty(helpTexts) ? null : (
          <i
            ref={ref}
            className="info-wrapper__action fa fa-info"
            onClick={event => event.preventDefault()}
          />
        )}
      </>
    )
  });
});

export default class RadioInput extends React.Component {
  _onMouseLeave() {
    ToolTipActions.showToolTip({});
  }

  _onMouseEnter() {
    ToolTipActions.showToolTip(this.state);
  }

  _setOffsetValues(prevOffsetTop, prevOffsetLeft) {
    const {
      answerWrapper: { current: answerWrapper },
      option: { current: option },
    } = this;

    if (answerWrapper && option) {
      const answerDOMNode = ReactDOM.findDOMNode(answerWrapper);
      const optionElementDOMNode = ReactDOM.findDOMNode(option);
      const helpTexts = this.getHelpTexts();
      const getOffsetParent = _.get(answerDOMNode, ["offsetParent"], null);

      const parentId = getOffsetParent ? getOffsetParent.id : _.get(answerDOMNode, ["parentElement", "id"], "");
      const offsetTop = _.get(answerDOMNode, ["offsetTop"], 0);
      const optionElementWidth = _.get(optionElementDOMNode, ["offsetWidth"], 0);
      const offsetLeft = _.get(optionElementDOMNode, ["offsetLeft"], 0) + optionElementWidth / 2;

      const shouldUpdate = prevOffsetTop !== offsetTop || prevOffsetLeft !== offsetLeft;

      if (shouldUpdate) {
        this.setState({
          offsetLeft,
          parentId,
          offsetTop,
          helpTexts,
        });
      }
    }
  }

  getElementId = () => {
    const { answer, name } = this.props;

    return `${name}-${answer.answer}`;
  };

  getHelpTexts = () => {
    const { answer, locale } = this.props;

    return _.chain(answer.helpText)
      .concat()
      .compact()
      .map((helpText) => _l(helpText, locale))
      .value();
  };

  constructor(props) {
    super(props);

    this.state = {
      offsetLeft: null,
      offsetTop: null,
      parentId: null,
      helpTexts: null,
      locale: null,
    };

    this.option = createRef();
    this.answerWrapper = createRef();

    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._onMouseEnter = this._onMouseEnter.bind(this);
  }

  componentDidMount() {
    this._setOffsetValues(this.state.offsetTop, this.state.offsetLeft);
  }

  componentDidUpdate(prevProps, prevState) {
    this._setOffsetValues(prevState.offsetTop, prevState.offsetLeft);
  }

  render() {
    const { question, answer, locale, checked, addAnswers, name, questionNumber, disabled, actionElement } = this.props;
    const elementId = this.getElementId();

    const helpTexts = this.getHelpTexts();
    const shouldHover = !_.isEmpty(helpTexts);

    const onClick = (event) => {
      /*
       * onChange not firing when radio button is clicked but not changed
       * https://facebook.github.io/react/blog/2017/06/13/react-v15.6.0.html
       */

      const answerKey = event.target.name;
      const newAnswer = _.assign({}, answer, { questionNumber });
      const unsetAnswers = generateUnsetAnswers(question);

      addAnswers({
        [answerKey]: newAnswer,
        ...unsetAnswers,
      });
    };

    const drawingUrl = answer.drawing && _l(_.chain(answer.drawing).first().get("url").value(), locale);
    const isEnabled = answer.available && !disabled;

    const sortedOptions = answer.options && _.sortBy(answer.options, "order");

    return (
      <div
        ref={this.answerWrapper}
        className={buildClassName("radio-input", null, { enabled: isEnabled, disabled: !isEnabled })}
      >
        <input
          onClick={onClick}
          type="radio"
          name={name}
          value={answer.answer}
          id={elementId}
          checked={checked}
          disabled={isEnabled ? "" : "disabled"}
          readOnly
        />
        <label
          htmlFor={`${name}-${answer.answer}`}
          ref={this.option}
          onMouseLeave={shouldHover ? this._onMouseLeave : null}
          onMouseEnter={shouldHover ? this._onMouseEnter : null}
        >
          {sortedOptions ? (
            <span>
              {_.map(sortedOptions, ({ identifier, active }, index) => {
                return (
                  <span className="radio-input__display-value" key={index}>
                    <span className={buildClassName("radio-input__item", null, { active, "button-invert": active })}>
                       {_l(identifier, locale)}
                    </span>
                    {index < sortedOptions.length - 1 && <span className="radio-input__plus">+</span>}
                  </span>
                );
              })}

              <span className="radio-input__display-value">
                ({answer.partialKey})
              </span>
            </span>
          ) : (
            <>
              {`${_l(answer.label, locale)}\u00a0`}
              {answer.sublabel ? (
                <span className="answer-sublabel">{`${_l(answer.sublabel, locale)}\u00a0`}</span>
              ) : null}
            </>
          )}
          <InfoWrapper
            drawingUrl={drawingUrl}
            helpTexts={helpTexts}
            elementId={this.getElementId()}
            checked={checked}
            actionElement={actionElement}
            hasActive={_.find(sortedOptions, "active")}
          />
        </label>
      </div>
    );
  }
}
