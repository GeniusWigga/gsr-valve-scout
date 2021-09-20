import React from "react";
import _ from "lodash";
import renderHTML from "react-render-html";

import { _l, substitute } from "../../deps/server/helpers/locale.js";
import valveScout from "../../deps/js/static/valveScout";
import ValveResultOverviewTile from "./ValveResultOverviewTile.jsx";

const ValveResultOverview = ({
  headline,
  locale,
  filteredProducts,
  currentAnswers,
  customer,
  onSelectValves,
  descriptionLink,
  hideVariantlink,
  subHeadline,
}) => {
  const title = _l(valveScout.results.headline, locale);

  const variantsCount = _(filteredProducts).map("variants").flatten().value().length;

  const maxVariants = 500;

  return (
    <div className="valve-result-overview-wrapper">
      <div className="intro-container">
        <h2 className="title">{headline || title}</h2>
      </div>
      {filteredProducts ? (
        <div className="valve-result-overview">
          <div>
            <div>
              {variantsCount >= maxVariants ? (
                <div className="max-variants">
                  {renderHTML(substitute(_l(valveScout.results.limitSearch, locale), { variantsCount }))}
                </div>
              ) : (
                filteredProducts.map((product, index) => (
                  <ValveResultOverviewTile
                    subHeadline={subHeadline}
                    descriptionLink={descriptionLink}
                    hideVariantlink={hideVariantlink}
                    key={index}
                    currentAnswers={currentAnswers}
                    locale={locale}
                    product={product}
                    customer={customer}
                    onSelectValves={onSelectValves}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ValveResultOverview;
