import React from "react";
import PropTypes from "prop-types";
import $ from "jquery";
import _ from "lodash";
import renderHTML from "react-render-html";
import { _l } from "../../../deps/server/helpers/locale";
import valveScout from "../../../deps/js/static/valveScout";
import FormInputWithLabel from "../FormInputWithLabel";
import CrossIcon from "../widgets/CrossIcon";

class CommercialPartnersDialog extends React.PureComponent {
  static propTypes = {
    customer: PropTypes.string,
    allCustomers: PropTypes.object.isRequired,
    setCustomer: PropTypes.func.isRequired,
    closePortal: PropTypes.func.isRequired,
    locale: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      value: props.customer || "",
      valid: false,
      submitted: false,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillMount() {
    // prevent background-scrolling
    $("body").css("overflow", "hidden");
  }

  componentWillUnmount() {
    $("body").css("overflow", "auto");
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  handleSubmit(event) {
    event.preventDefault();

    const valid = _.find(this.props.allCustomers, (cust) => _.lowerCase(cust.id) === _.lowerCase(this.state.value));

    if (valid || this.state.value === "") {
      this.props.setCustomer(_.get(valid, "id"));
    }

    this.setState({
      valid,
      submitted: true,
    });
  }

  render() {
    const { locale } = this.props;

    return (
      <div className="commercial-partners-overlay" onClick={this.props.closePortal}>
        <div className="wrapper" onClick={(e) => e.stopPropagation()}>
          <h2>{_l(valveScout.commercialPartners.overlay_headline, locale)}</h2>
          <p>{renderHTML(_l(valveScout.commercialPartners.overlay_description, locale))}</p>

          <form onSubmit={this.handleSubmit} autoComplete="on">
            <FormInputWithLabel
              label={_l(valveScout.commercialPartners.overlay_form_customer_id, locale)}
              type="text"
              name="customer-id"
              handleChange={this.handleChange}
              value={this.state.value}
            />
            <div className="form-input-label-wrapper">
              <div className="input-wrapper">
                <button className="submit" type="submit">
                  {_l(valveScout.commercialPartners.overlay_form_submit, locale)}
                </button>
              </div>
            </div>
          </form>

          {this.state.submitted && (
            <p className={this.state.valid ? "customer-valid" : "customer-invalid"}>
              {_l(
                this.state.valid
                  ? valveScout.commercialPartners.overlay_submitted_valid
                  : valveScout.commercialPartners.overlay_submitted_invalid,
                locale,
              )}
            </p>
          )}

          <a onClick={this.props.closePortal} className="close-icon">
            <CrossIcon color="#c01717" />
          </a>
        </div>
      </div>
    );
  }
}

export default CommercialPartnersDialog;
