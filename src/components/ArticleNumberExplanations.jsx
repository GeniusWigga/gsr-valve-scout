import React from "react";
import _ from "lodash";
import classnames from "classnames";

import { _l } from "../../deps/server/helpers/locale";
import valveScout from "../../deps/js/static/valveScout";
import structure from "../../deps/server/helpers/structure";
import { getLocalStorageItem } from "../../deps/js/OfferPortal/helper/localStorage";
import { parseQuery } from "../../deps/js/OfferPortal/helper/path";
import { createIdentifier } from "../../deps/server/helpers/variants";

function generateValvePrinterUrl(product, variant, locale, currentAnswers, customer) {
  const { articleNumber } = variant;
  const currentType = _.get(variant, ["electricalConnectionType", "currentType", 0, "value"], null);

  const params = _.pickBy({
    media: _.get(currentAnswers, ["media", "answer"], null),
    current: currentType,
    voltage: _.get(currentAnswers, ["voltage", "answer"], null),
    operatingPressure: _.get(currentAnswers, ["operatingPressure", "answer"], null),
    customer,
  });

  const query = _.map(params, (value, key) => `${key}=${value}`).join("&");

  return `${structure.getLinkNode("valve_printer").getUrl(locale)}/pdf/${product.id}/${encodeURIComponent(
    articleNumber,
  )}?${query}`;
}

const SelectVariant = ({ onSelectValves }) => (
  <div className="cell-item">
    <label className="article-number-explanations__input-wrapper">
      <input className="article-number-explanations__input" type="checkbox" onChange={onSelectValves} />
      <span className="article-number-explanations__icon" />
    </label>
  </div>
);

const ArticleNumberExplanation = ({
  articleExplanationArray,
  currentAnswers,
  locale,
  className,
  valvePrinterUrl,
  variant,
  product,
  onSelectValves,
  hideVariantlink = false,
  isOfferPortal,
}) => {
  const printAnalytics = () => {
    try {
      ga("send", "event", "Ventil Scout Datenblatt Button", product.series, valvePrinterUrl);
    } catch (err) {
      /* tracking is blocked by browser => ga not loaded */
    }
  };

  let checked = false;

  if (isOfferPortal) {
    const parsedQuery = parseQuery(window.location.search);
    const sessionKey = _.get(parsedQuery, "key");
    const sessionFromLocalStorage = getLocalStorageItem(sessionKey);
    const variants = _.get(sessionFromLocalStorage, "variants");
    const identifier = createIdentifier({ ...product, ...variant }, currentAnswers);

    checked = _.some(variants, { identifier });
  }

  const renderCellItem = () => {
    if (isOfferPortal) {
      return <SelectVariant onSelectValves={onSelectValves} checked={checked} />;
    }

    return (
      <span className="cell-item button">
        <a
          href={valvePrinterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="print-button"
          onClick={printAnalytics}
        >
          <i className="fa fa-file-pdf-o" />
          &nbsp;
          {_l(valveScout.results.datasheetButton, locale)}
        </a>
      </span>
    );
  };

  const voltage = _.get(currentAnswers, ["voltage", "answer"]);
  const { articleNumber } = variant;

  const currentFromVariant = variant.electricalConnectionType && variant.electricalConnectionType.identifier;
  const current = currentFromVariant === "BC" ? "AC, DC" : currentFromVariant;
  const articleNumberWithElectric = _.compact([voltage ? `${articleNumber} ${voltage}V` : articleNumber, current]).join(
    ", ",
  );

  const showVariantHtmlBtnText = _l(valveScout.showVariantHtmlBtnText, locale);
  const query = _.map(_.pickBy({ current, voltage }), (value, key) => `${key}=${value}`).join("&");
  const variantHref = `${structure.getLinkNode("products").getUrl(locale)}/${product.id}/${_.toUpper(
    _.kebabCase(product.series),
  )}/${(articleNumber || "").split("/").join("-")}${!_.isEmpty(query) ? `?${query}` : ""}`;

  return (
    <div className="explanation__wrapper">
      <div className="explanation__header">
        <h3>{articleNumberWithElectric}</h3>
        {!hideVariantlink && (
          <a className="arrow-btn" href={variantHref}>
            {showVariantHtmlBtnText} <i className="far fa-long-arrow-right" />
          </a>
        )}
      </div>
      <div className={classnames(className, { checked })}>
        {articleExplanationArray.map((part, index) => (
          <div key={index} className="part">
            <span className="cell-item">{part[1]}</span>
            <span className="cell-item">{_l(part[0], locale)}</span>
          </div>
        ))}
        <div className="part">{renderCellItem()}</div>
      </div>
    </div>
  );
};

const ArticleNumberExplanations = ({ product, currentAnswers, locale, customer, onSelectValves, hideVariantlink }) => {
  const answerIsSolenoidValve = _.get(currentAnswers, ["valveCategory", "answer"]) === 1;
  const answerVoltage = _.get(currentAnswers, ["voltage", "answer"]);
  const answerCurrent = _.get(currentAnswers, ["current", "answer"]) === "AC" ? "50-60Hz" : "00Hz";

  const articleExplanationArrays = _(product.variants)
    .map((variant) => {
      // 6 electricalConnectionTypes || actuatorFunction
      const partialPos6 = variant.electricalConnectionType || variant.actuatorFunction;

      // 7 solenoidType || actuatorType
      const partialPos7 = variant.solenoidType || variant.actuatorType;

      // 8 protectionClass || actuatorSize
      const partialPos8 = variant.protectionClass || variant.actuatorSize;

      const { series } = valveScout.results;
      const { pressureRange } = valveScout.results;
      const { voltage } = valveScout.results;

      // key/value pairs which combine...
      // an identifier with the partial key within the article number
      const articleExplanationArray = [
        [series, _.get(variant, ["modelVersion", "version"], "") + (variant.modelKey || "")],
        [
          `${_.get(variant, ["connectionWithValveSeat", "connection", 0, "value"], "")} ${_.get(
            variant,
            ["connectionWithValveSeat", "valveSeat"],
            "n.a.",
          )}mm`,
          variant.connectionWithValveSeat.connectionKey,
        ],

        [variant.material.material, variant.material.housingMaterialKey],
        [variant.sealing.identifier, variant.sealing.sealingKey],

        [partialPos6.identifier, partialPos6.partialKey],
        [partialPos7.identifier, partialPos7.partialKey],
        [_.get(partialPos8.protectionClass, [0, "value"]) || partialPos8.identifier, partialPos8.partialKey],

        [variant.valveOption.identifier, variant.valveOption.partialKey],
        [pressureRange, `${variant.pressureMin}-${variant.pressureMax} bar`],

        // append voltage and current type, if it's a solenoid valve
        ...(answerIsSolenoidValve && answerVoltage ? [[voltage, `${answerVoltage}V/${answerCurrent}`]] : []),
      ];

      return {
        product,
        variant,
        articleExplanationArray,
      };
    })
    .sortBy()
    .value();

  return (
    <div className="article-number-explanations-wrapper">
      <div className="explanations">
        {articleExplanationArrays.map(({ product, variant, articleExplanationArray }, index) => {
          const className = index % 2 === 0 ? classnames("explanation", "even") : classnames("explanation", "odd");

          const voltage = _.get(currentAnswers, ["voltage", "answer"]);
          const variantWithProductInfos = _.chain(product).omit("variants").merge(variant).merge({ voltage }).value();

          return (
            <ArticleNumberExplanation
              key={index}
              index={index}
              hideVariantlink={hideVariantlink}
              {...{
                currentAnswers,
                articleExplanationArray,
                locale,
                variant,
                onSelectValves: () => onSelectValves(variantWithProductInfos, currentAnswers),
                isOfferPortal: _.isFunction(onSelectValves),
                className,
                product,
                valvePrinterUrl: generateValvePrinterUrl(product, variant, locale, currentAnswers, customer),
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ArticleNumberExplanations;
