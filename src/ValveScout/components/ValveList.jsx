import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { getImageUrl } from "../helper/valveScoutHelper";
import { _l } from "../../../server/helpers/locale";

export default class ValveList extends React.Component {
  static propTypes = {
    valveResult: PropTypes.array,
  };

  _getValveImages() {
    let data = this.props.valveResult;
    const { locale } = this.props;

    if (data.length > 5) {
      /* max 5 images can be displayed */
      data = data.slice(0, 5);
    }

    return data.map((valve) => {
      const uuid = _.get(valve, ["images", 0, "Bilder", 0, "uuid"]);
      const filename = _.get(valve, ["images", 0, "Bilder", 0, "externalName"]);
      return getImageUrl(uuid, locale, "reduced", _l(filename, locale));
    });
  }

  render() {
    const images = this._getValveImages();
    const renderImages = images.map((url, key) => <img key={key} src={url} alt="" />);
    return (
      <div className="valve-list">
        <div className="fade" />
        {renderImages}
      </div>
    );
  }
}
