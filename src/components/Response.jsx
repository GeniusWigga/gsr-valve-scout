import React from "react";
import moment from "moment-timezone";
import renderHTML from "react-render-html";
import { _l } from "../../deps/server/helpers/locale";
import valveScout from "../../deps/js/static/valveScout";

export default class Response extends React.Component {
  static _responseActive() {
    const mNow = moment().tz("Europe/Berlin");
    const acitveDay = mNow.day() > 0 && mNow.day() < 6;
    const activeTime = mNow.hour() > 6 && mNow.hour() < 16;
    return acitveDay && activeTime;
  }

  render() {
    if (Response._responseActive()) {
      return (
        <div className="response">
          <i className="fa fa-check-circle" />
          {renderHTML(_l(valveScout.form.responseTime.active, this.props.locale))}
        </div>
      );
    }
    return (
      <div className="response">
        <i className="fa fa-times-circle" />
        {renderHTML(_l(valveScout.form.responseTime.inactive, this.props.locale))}
      </div>
    );
  }
}
