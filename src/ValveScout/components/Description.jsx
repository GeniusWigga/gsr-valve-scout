import React from "react";

import valveScout from "../../static/valveScout";
import { _l } from "../../../server/helpers/locale";

const Description = ({ locale }) => (
  <div className="description-container">
    <h2 className="head-text">{_l(valveScout.headline, locale)}</h2>
    <p className="description">{_l(valveScout.description, locale)}</p>
  </div>
);

export default Description;
