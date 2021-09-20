import React, { Component } from "react";
import { _l } from "../../deps/server/helpers/locale.js";
import valveScout from "../../deps/js/static/valveScout";

export default class NoAnswersOverlay extends Component {
  render() {
    const { locale } = this.props;

    const noAnswersText = _l(valveScout.noAnswersOverlay.text, locale);
    const noAnswersButtonText = _l(valveScout.noAnswersOverlay.button, locale);

    return (
      <div className="no-answers-overlay">
        <div className="wrapper">
          <h3>{noAnswersText}</h3>
          <a onClick={this.props.resetAnswersFn}>{noAnswersButtonText}</a>
        </div>
      </div>
    );
  }
}
