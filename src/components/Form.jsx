import React from "react";
import PropTypes from "prop-types";
import request from "superagent";
import _ from "lodash";
import classNames from "classnames";
import Reflux from "reflux";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import structure from "../../deps/server/helpers/structure.js";
import valveScout from "../../deps/js/static/valveScout";
import { _l } from "../../deps/server/helpers/locale.js";
import dataLayerPush from "../helper/dataLayerHelper.js";
import OutsideClickWrapper from "./OutsideClickWrapper";
import FormInputWithLabel from "./FormInputWithLabel.jsx";
import CrossIcon from "./widgets/CrossIcon";
import { FormActions } from "../reflux/actions";
import { FormStore } from "../reflux/store";
import PeopleRow from "./PeopleRow";
import Response from "./Response";
import ValveList from "./ValveList";

function FormFloatingWrapper({ handleClose, children }) {
  return (
    <div className="form-content-wrapper">
      <OutsideClickWrapper handleClickOutside={handleClose}>
        <div className="form-content-container">{children}</div>
      </OutsideClickWrapper>
    </div>
  );
}

export default class Form extends Reflux.Component {
  static propTypes = {
    locale: PropTypes.string.isRequired,
    currentAnswers: PropTypes.object.isRequired,
    resultCount: PropTypes.number.isRequired,
    resultData: PropTypes.array.isRequired,
    onClose: PropTypes.func,
    suitedValvesText: PropTypes.string,
  };

  constructor(props) {
    super(props);

    this.state = {
      response: {},
      validation: this._validation({}),
      values: {},
      addressActive: null,
      remarkActive: null,
    };

    this.store = FormStore;

    this._handleChange = this._handleChange.bind(this);
    this._handleSubmit = this._handleSubmit.bind(this);
    this._handleResponse = this._handleResponse.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const haveAnswersChanged = !_.isEqual(this.props.currentAnswers, nextProps.currentAnswers);

    if (haveAnswersChanged) {
      this.setState({
        ...this.state,
        response: {},
      });
    }
  }

  _handleChange(event) {
    const values = {
      ...this.state.values,
      [event.target.name]: event.target.value,
    };

    const validation = this._validation(values);

    this.setState({
      ...this.state,
      values,
      validation,
    });
  }

  _validation(values, force) {
    const nonEmpty = (value) => !_.isEmpty(value);

    const nonEmptyMsg = {
      de: "Dies ist ein Pflichtfeld.",
      en: "This field is mandatory.",
    };

    const validationConfigs = {
      firm: {
        fn: nonEmpty,
        msg: nonEmptyMsg,
      },
      name: {
        fn: nonEmpty,
        msg: nonEmptyMsg,
      },
      phone: {
        fn: (value) => {
          const regEx = /^[0-9 /-]{3,100}$/g;
          return regEx.test(value);
        },
        msg: {
          de: "Geben Sie eine gültige Rufnummer ein.",
          en: "Please enter a valid phone number.",
        },
      },
      email: {
        fn: (value) => {
          const regEx = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
          return regEx.test(value);
        },
        msg: {
          de: "Geben Sie eine gültige Email ein.",
          en: "Please enter a valid email address.",
        },
      },
    };

    return _.mapValues(validationConfigs, (config, key) => {
      if (values[key] || force) {
        const valid = config.fn(values[key]);

        return {
          valid,
          msg: !valid ? config.msg : null,
        };
      }

      return {
        valid: false,
      };
    });
  }

  _handleSubmit(event) {
    const validation = this._validation(this.state.values, true);
    const valid = _.every(this._validation(this.state.values), (part) => part.valid);

    if (!valid) {
      this.setState({
        ...this.state,
        validation,
      });

      return;
    }

    const result = {
      ...this.state.values,
      email_adress: undefined, // needed for spam bot protection
      locale: this.props.locale,
      currentAnswers: _(this.props.currentAnswers)
        .mapValues((answer) => _.omit(answer, ["questionNumber"]))
        .pickBy((value) => !(_.isPlainObject(value) && _.isEmpty(value)))
        .value(),
    };

    if (valid) {
      // track form click
      dataLayerPush("form", "");

      request
        .post(structure.getLinkNode("contact/valve_scout_form").getUrl(this.props.locale))
        .send(result)
        .end((err, res) => {
          if (err) {
            console.error("error", err);
          } else {
            console.log("response", res);
          }

          this._handleResponse(err, res);
        });
    }

    event.preventDefault();
  }

  _handleResponse(err, res) {
    this.setState({
      ...this.state,
      response: {
        successful: _.isEmpty(err) && res.ok,
      },
    });
  }

  _handleClose = () => {
    this.props.onClose();
    this.setState({ ...this.state, response: {}, values: {}, addressActive: null, remarkActive: null });
    FormActions.showForm(false);
  };

  _handleAddressShow = () => {
    this.setState({
      ...this.state,
      addressActive: this.state.addressActive != null ? !this.state.addressActive : true,
    });
  };

  _handleRemarkShow = () => {
    this.setState({ ...this.state, remarkActive: this.state.remarkActive != null ? !this.state.remarkActive : true });
  };

  _renderForm() {
    const { locale, resultCount, resultData, suitedValvesText } = this.props;
    const { validation } = this.state;

    const formDescriptionText = _l(valveScout.form.description, locale);

    const buildLabel = (label, required, errorMsg) => {
      const labelText = _l(label, locale) + (required ? ": *" : ":");

      return _.isEmpty(errorMsg) ? (
        <span>{labelText}</span>
      ) : (
        <span>
          {labelText}
          <span className="error">{_l(errorMsg, locale)}</span>
        </span>
      );
    };

    const firm = buildLabel(valveScout.form.labels.firm, true, _.get(validation, ["firm", "msg"], ""));

    const name = buildLabel(valveScout.form.labels.name, true, _.get(validation, ["name", "msg"], ""));

    const street = buildLabel(valveScout.form.labels.street, false, _.get(validation, ["street", "msg"], ""));
    const city = buildLabel(valveScout.form.labels.city, false, _.get(validation, ["city", "msg"], ""));

    const phone = buildLabel(valveScout.form.labels.phone, true, _.get(validation, ["phone", "msg"], ""));
    const email = buildLabel(valveScout.form.labels.email, true, _.get(validation, ["email", "msg"], ""));

    const remark = buildLabel(valveScout.form.labels.remark, false, _.get(validation, ["remark", "msg"], ""));

    const submit = _l(valveScout.form.submit, locale);

    const suitedValves = suitedValvesText ?? _l(valveScout.form.labels.valves, locale);

    const willBeSend =
      resultCount <= 1
        ? _l(valveScout.form.transmittedAutomatically.singular, locale)
        : _l(valveScout.form.transmittedAutomatically.plural, locale).replace("{{count}}", resultCount);

    const hintAddress = _l(valveScout.form.hint.hintAddress, locale);
    const hintRemark = _l(valveScout.form.hint.hintRemark, locale);

    const valid = _.every(this.state.validation, (part) => part.valid);

    return (
      <ReactCSSTransitionGroup
        transitionName="form"
        transitionEnterTimeout={400}
        transitionLeaveTimeout={400}
        transitionAppear
        transitionAppearTimeout={400}
      >
        <div className="form-background" />
        <FormFloatingWrapper handleClose={this._handleClose}>
          <div className="form-description">
            <h3>{formDescriptionText}</h3>
            <a onClick={this._handleClose} className="close-icon">
              <CrossIcon color="white" />
            </a>
          </div>
          <div className="form">
            <div className="form-input-label-wrapper big">
              <div className="form-header">
                <div className="form-header-part">
                  {suitedValves && <label>{suitedValves}</label>}
                  <span className="grey">{willBeSend}</span>
                </div>
                <div className="form-header-part">
                  <ValveList valveResult={resultData} locale={locale} />
                </div>
              </div>
            </div>
            <FormInputWithLabel
              name="firm"
              label={firm}
              type="text"
              handleChange={this._handleChange}
              value={this.state.values.firm}
            />
            <FormInputWithLabel
              name="phone"
              label={phone}
              type="number"
              handleChange={this._handleChange}
              value={this.state.values.phone}
            />
            <FormInputWithLabel
              name="name"
              label={name}
              type="text"
              handleChange={this._handleChange}
              value={this.state.values.name}
            />
            <FormInputWithLabel
              name="email"
              label={email}
              type="text"
              handleChange={this._handleChange}
              value={this.state.values.email}
            />
            <div className="form-mandatory-label">{`* ${_l(valveScout.form.labels.mandatory, this.props.locale)}`}</div>
            <div className="optional-wrapper">
              <div className="input-wrapper" onClick={this._handleAddressShow}>
                {hintAddress}
                {this.state.addressActive ? <i className="fa fa-minus" /> : <i className="fa fa-plus" />}
              </div>
              <ReactCSSTransitionGroup
                transitionName="optionalInput"
                transitionEnterTimeout={200}
                transitionLeaveTimeout={100}
              >
                {this.state.addressActive && (
                  <div
                    key="optionalInput"
                    className={classNames("optional-input", {
                      active: this.state.addressActive,
                      inactive: this.state.addressActive != null ? !this.state.addressActive : null,
                    })}
                  >
                    <FormInputWithLabel
                      name="street"
                      label={street}
                      type="text"
                      handleChange={this._handleChange}
                      value={this.state.values.street}
                    />
                    <FormInputWithLabel
                      name="city"
                      label={city}
                      type="text"
                      handleChange={this._handleChange}
                      value={this.state.values.city}
                    />
                  </div>
                )}
              </ReactCSSTransitionGroup>
            </div>
            <div className="optional-wrapper">
              <div className="input-wrapper" onClick={this._handleRemarkShow}>
                {hintRemark}
                {this.state.remarkActive ? <i className="fa fa-minus" /> : <i className="fa fa-plus" />}
              </div>
              <ReactCSSTransitionGroup
                transitionName="optionalInput"
                transitionEnterTimeout={200}
                transitionLeaveTimeout={300}
              >
                {this.state.remarkActive && (
                  <div
                    key="optionalInput"
                    className={classNames("optional-input", { active: this.state.remarkActive })}
                  >
                    <div className="form-input-label-wrapper big">
                      <label htmlFor="remark">{remark}</label>
                      <div className="input-wrapper">
                        <textarea
                          id="remark"
                          name="remark"
                          onChange={this._handleChange}
                          value={this.state.values.remark}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </ReactCSSTransitionGroup>
            </div>
            <div className="form-footer">
              <div className="form-people">
                <PeopleRow />
              </div>
              <Response locale={locale} />
              <a onClick={this._handleSubmit} className={`form-submit-button${valid ? "" : " disabled"}`}>
                <i className="fa fa-paper-plane" />
                {submit}
              </a>
            </div>
          </div>
        </FormFloatingWrapper>
      </ReactCSSTransitionGroup>
    );
  }

  _renderSuccessResponse() {
    const { locale } = this.props;

    const formDescriptionHeadline = _l(valveScout.form.response.success.headline, locale);
    const formDescriptionText = _l(valveScout.form.response.success.text, locale);

    return (
      <FormFloatingWrapper handleClose={this._handleClose}>
        <div className="form-description response">
          <h2>{formDescriptionHeadline}</h2>
          <p>{formDescriptionText}</p>
          <a onClick={this._handleClose} className="close-icon">
            <CrossIcon color="white" />
          </a>
        </div>
      </FormFloatingWrapper>
    );
  }

  _renderFailedResponse() {
    const { locale } = this.props;

    const formDescriptionHeadline = _l(valveScout.form.response.failed.headline, locale);
    const formDescriptionText = _l(valveScout.form.response.failed.text, locale);

    const button = _l(valveScout.buttons.tryAgain, locale);

    const self = this;

    return (
      <FormFloatingWrapper handleClose={this._handleClose}>
        <div className="form-description response">
          <h2>{formDescriptionHeadline}</h2>
          <p>{formDescriptionText}</p>
          <a onClick={this._handleClose} className="close-icon">
            <CrossIcon color="white" />
          </a>
          <button
            onClick={() => {
              self.setState({
                ...self.state,
                response: {},
              });
            }}
          >
            {button}
          </button>
        </div>
      </FormFloatingWrapper>
    );
  }

  _renderResponse() {
    if (this.state.response && this.state.response.successful) {
      return this._renderSuccessResponse();
    }
    return this._renderFailedResponse();
  }

  render() {
    if (!this.state.isFormActive) {
      return null;
    }
    if (_.isEmpty(this.state.response)) {
      return this._renderForm();
    }
    return this._renderResponse();
  }
}
