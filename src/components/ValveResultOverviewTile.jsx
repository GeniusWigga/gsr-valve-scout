/* eslint-disable max-classes-per-file */
import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { _l } from "../../deps/server/helpers/locale";
import ArticleNumberExplanations from "./ArticleNumberExplanations.jsx";
import { getImageUrl } from "../helper/valveScoutHelper.js";
import valveScout from "../../deps/js/static/valveScout";
import structure from "../../deps/server/helpers/structure.js";
import { FormActions } from "../reflux/actions";

const ValveResultOverviewTile = (props) => {
  const {
    product,
    currentAnswers,
    locale,
    onSelectValves,
    customer,
    descriptionLink,
    hideVariantlink = false,
    subHeadline,
  } = props;

  const formCallToAction = _l(valveScout.form.callToAction.singular, locale);

  const uuid = _.get(product, ["images", 0, "Bilder", 0, "uuid"]);
  const filename = _.get(product, ["images", 0, "Bilder", 0, "externalName"]);

  const imgSrc = getImageUrl(uuid, locale, "reduced", _l(filename, locale));

  const seriesTitle = `${_l(valveScout.results.series, locale)} ${product.series}`;
  const showSeriesBtnText = _l(valveScout.showSeriesBtnText, locale);
  const seriesHref = `${structure.getLinkNode("products").getUrl(locale)}/${product.id}/${_.toUpper(
    _.kebabCase(product.series),
  )}`;

  return (
    <div className="valve-result-overview-table-wrapper" key={product.id}>
      <div className="image-description">
        <div className="overview-table-description-container">
          <h6 className="upper-headline">
            {_.compact([_l(product.tags, locale), _l(product.kind, locale)]).join(" ")}
          </h6>
          <h3 className="valve-title">{seriesTitle}</h3>
          {subHeadline && <h6>{subHeadline}</h6>}
          <p>{_l(product.description, locale)}</p>

          {descriptionLink || (
            <a className="arrow-btn" href={seriesHref}>
              {showSeriesBtnText} <i className="far fa-long-arrow-right" />
            </a>
          )}
        </div>
        <div className="img-wrapper">
          <img src={imgSrc} alt="" />
        </div>
      </div>
      <div className="article-numbers">
        <ArticleNumberExplanations
          onSelectValves={onSelectValves}
          product={product}
          currentAnswers={currentAnswers}
          locale={locale}
          customer={customer}
          hideVariantlink={hideVariantlink}
        />
      </div>
      <div className="show-form-button-wrapper">
        <a className="external-link show-form-button" onClick={() => FormActions.showForm(true)}>
          <span className="link-text">
            <i className="fa fa-paper-plane" /> {formCallToAction}
          </span>
        </a>
      </div>
    </div>
  );
};

ValveResultOverviewTile.propTypes = {
  product: PropTypes.object.isRequired,
  currentAnswers: PropTypes.object.isRequired,
  descriptionLink: PropTypes.node,
  hideVariantlink: PropTypes.bool,
  subHeadline: PropTypes.string,
  locale: PropTypes.string.isRequired,
};

export default ValveResultOverviewTile;
