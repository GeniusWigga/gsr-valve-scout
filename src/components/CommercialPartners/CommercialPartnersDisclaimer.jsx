import React from "react";
import _ from "lodash";
import { _l } from "../../../deps/server/helpers/locale";
import valveScout from "../../../deps/js/static/valveScout";

const CommercialPartnersDisclaimer = ({ open, logout, locale, customer, allCustomers }) => {
  const isLoggedIn = !!customer;
  const customerObject = _.get(allCustomers, customer);

  if (isLoggedIn && customerObject) {
    const customerName = _.get("shortName", customerObject) || customer;
    const logoRoute = _.get(customerObject, "logo");

    return (
      <div className="commercial-partners-container">
        <div className="partner-display">
          <div className="partner-logo-wrapper">
            <img className="partner-logo" src={logoRoute} alt="" />
          </div>
          <a key="button" className="description" onClick={open}>
            {`${_l(valveScout.commercialPartners.logged_in_as, locale)} "${customerName}"`}
          </a>
          <div className="partner-logout">
            <a className="logout-description" onClick={logout}>
              {_l(valveScout.commercialPartners.logout, locale)}
              <i className="fa fa-times" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="commercial-partners-container">
      <a key="button" className="description" onClick={open}>
        {_l(valveScout.commercialPartners.disclaimer, locale)}
      </a>
    </div>
  );
};

export default CommercialPartnersDisclaimer;
