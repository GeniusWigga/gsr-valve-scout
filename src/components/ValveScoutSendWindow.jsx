import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import dataLayerPush from "../helper/dataLayerHelper";
import { FormActions } from "../reflux/actions";
import PeopleRow from "./PeopleRow";
import Response from "./Response";
import { _l } from "../../deps/server/helpers/locale";
import valveScout from "../../deps/js/static/valveScout";

export default class ValveScoutSendWindow extends React.Component {
  static propTypes = {
    count: PropTypes.number.isRequired,
    show: PropTypes.bool.isRequired,
    toForm: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    sendToShow: PropTypes.func.isRequired,
    subText: PropTypes.string,
  };

  render() {
    const { show, count, onClose, sendToShow, toForm, locale, subText } = this.props;
    const className = classNames("valve-result-send", { show, toform: toForm });

    const onClick = () => {
      sendToShow();
      dataLayerPush("open-form", "");
      FormActions.showForm(true);
    };

    const buttonText = _l(valveScout.form.resultwindow.sendButton, locale);
    const subtext = subText || _l(valveScout.form.resultwindow.subtext, locale);

    const headline =
      count <= 1
        ? _l(valveScout.form.resultwindow.headline.singular, locale)
        : _l(valveScout.form.resultwindow.headline.plural, locale).replace("{{count}}", count);

    return (
      <ReactCSSTransitionGroup
        transitionName={toForm ? "valveResultSendForm" : "valveResultSend"}
        transitionEnterTimeout={2400}
        transitionLeaveTimeout={400}
      >
        {show && !toForm && (
          <div key="valveResultSend" className="valve-result-send-wrapper">
            <div className={className} id="valve-result-send">
              <a onClick={onClose} className="valve-result-close">
                ×
              </a>
              <h3 className="valve-result-header">{headline}</h3>
              <p>{subtext}</p>
              <div className="valve-result-info">
                <div className="valve-result-people">
                  <PeopleRow />
                </div>
                <Response locale={locale} />
                <a className="valve-result-button" onClick={onClick}>
                  <i className="fa fa-arrow-up" />
                  <p>{buttonText}</p>
                </a>
              </div>
            </div>
          </div>
        )}
      </ReactCSSTransitionGroup>
    );
  }
}
