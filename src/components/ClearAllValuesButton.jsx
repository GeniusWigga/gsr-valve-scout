import React, { Component } from "react";
import classNames from "classnames";
import valveScout from "../../deps/js/static/valveScout";
import { _l } from "../../deps/server/helpers/locale.js";

export default class ClearAllValuesButton extends Component {
  render() {
    const { locale, show, resetAnswersFn, resultActive } = this.props;

    const buttonText = _l(valveScout.buttons.resetAnswer, locale);
    const className = classNames("clear-all-values-button", { show, resultActive });

    return (
      <a className={className} onClick={resetAnswersFn}>
        <i className="fa fa-undo" />
        {buttonText}
      </a>
    );
  }
}
