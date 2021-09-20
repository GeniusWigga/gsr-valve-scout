import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FormActions } from "../reflux/actions";
import valveScout from "../../static/valveScout.js";
import { _l } from "../../../server/helpers/locale.js";
import dataLayerPush from "../helper/dataLayerHelper";

export default class OpenFormButton extends PureComponent {
  static propTypes = {
    locale: PropTypes.string.isRequired,
    numResults: PropTypes.number.isRequired,
    show: PropTypes.bool,
  };

  render() {
    const { locale, numResults, show } = this.props;

    const buttonText =
      numResults <= 1
        ? _l(valveScout.form.callToAction.singular, locale)
        : _l(valveScout.form.callToAction.plural, locale);

    const className = classNames("open-form-button", { show });

    const onClick = () => {
      dataLayerPush("open-form", "");
      FormActions.showForm(true);
    };

    return (
      <a className={className} onClick={onClick}>
        <i className="fa fa-paper-plane" />
        {buttonText}
      </a>
    );
  }
}
