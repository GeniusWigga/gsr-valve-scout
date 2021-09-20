import React from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

import request from "superagent";
import structure from "../../../../server/helpers/structure";
import CommercialPartnersDialog from "./CommercialPartnersDialog";
import CommercialPartnersDisclaimer from "./CommercialPartnersDisclaimer";

class CommercialPartners extends React.PureComponent {
  static propTypes = {
    customer: PropTypes.string,
    setCustomer: PropTypes.func.isRequired,
    locale: PropTypes.string.isRequired,
  };

  constructor() {
    super();

    this.state = {
      ready: false,
      portalOpen: false,
      allCustomers: {},
    };
  }

  componentDidMount() {
    request
      .get(structure.getLinkNode("valve_scout/customers").getUrl(this.props.locale))
      .set("API-Key", "87553D68C4CF7EDC9D79535A1F218AD1E54116F61ABE0508C4B174EA8391CD9C")
      .end((err, res) => {
        if (err) {
          console.warn("error customers: ", err);
        } else {
          this.setState({
            ready: true,
            allCustomers: res.body,
          });
        }
      });
  }

  render() {
    const { setCustomer, customer, locale } = this.props;
    const { ready, allCustomers, portalOpen } = this.state;
    const loginNode = document && document.getElementById("login-portal");

    if (ready) {
      return createPortal(
        <>
          <CommercialPartnersDisclaimer
            open={() => this.setState({ ...this.state, portalOpen: true })}
            logout={() => setCustomer("")}
            locale={locale}
            allCustomers={allCustomers}
            customer={customer}
          />
          {portalOpen && (
            <CommercialPartnersDialog
              closePortal={() => this.setState({ ...this.state, portalOpen: false })}
              setCustomer={setCustomer}
              allCustomers={allCustomers}
              customer={customer}
              locale={locale}
            />
          )}
        </>,
        loginNode,
      );
    }

    return null;
  }
}

export default CommercialPartners;
