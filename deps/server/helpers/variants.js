const _ = require("lodash");

const { getLocale } = require("../offerportalDb/helpers/url");
const { _l } = require("./locale");
const { LANGUAGES } = require("../offerportalDb/constants/commonTranslations");
const valveScout = require("../../js/static/valveScout");

const IDENTIFIER_DELIMITIER = "_";
const PRESSURE_INDEX = 1;
const CURRENT_INDEX = 3;
const VOLTAGE_INDEX = 4;
const CONNECTION_TYPE_INDEX = 6;
const HOUSING_INDEX = 7;
const SEAL_INDEX = 8;

const ARTICLE_NUMBER_PART_SEPARATOR = "/";
const ARTICLE_NUMBER_VALVE_OPTION_SEPARATOR = "-";

function getFromIdentifierByIndex(identifier, index) {
  const identifierParts = getIdentifierParts(identifier);
  return _.nth(identifierParts, index);
}

function getImageUrl(uuid, locale, size, filename) {
  return uuid && locale && size && filename ? `/attachments/${uuid}/${locale}/${size}/${filename}` : null;
}

const getArticleNumber = (variant, lang = LANGUAGES.de.value) => {
  const { articleNumber, isAccessory, displayValue, label } = variant;

  if (isAccessory) {
    return articleNumber || _l(displayValue, lang);
  }

  return articleNumber || label;
};

const getVoltageFromAnswer = (currentAnswer) => _.get(currentAnswer, ["voltage", "answer"]);

const getVoltage = (variant, currentAnswer) => {
  const answerVoltage = getVoltageFromAnswer(currentAnswer);
  const getFromVariant = (path, fallback) => _.get(variant, path, fallback);
  const voltage = getFromVariant(["voltage"], answerVoltage);
  return voltage ? `${voltage}V` : null;
};

const getSolenoidValue = (variant, lang) => {
  const solenoid = _l(_.chain(variant).get("solenoidType.identifier", "").concat().value(), lang);
  const solenoidValue = _.chain(solenoid).split("W").first().toNumber().value();

  return solenoidValue || null;
};

const articleExplanation = (variant = {}, currentAnswers) => {
  const answerIsSolenoidValve = _.get(currentAnswers, ["valveCategory", "answer"]) === 1;
  const answerVoltage = _.get(currentAnswers, ["voltage", "answer"]);
  const answerCurrent = _.get(currentAnswers, ["current", "answer"]) === "AC" ? "50-60Hz" : "00Hz";

  const getFromVariant = (path, fallback) => _.get(variant, path, fallback);

  const partialPos6 = getFromVariant("electricalConnectionType") || getFromVariant("actuatorFunction");

  // 7 solenoidType || actuatorType
  const partialPos7 = getFromVariant("solenoidType") || getFromVariant("actuatorType");

  // 8 protectionClass || actuatorSize
  const partialPos8 = getFromVariant("protectionClass") || getFromVariant("actuatorSize");

  const { series } = valveScout.results;
  const { pressureRange } = valveScout.results;
  const { voltage } = valveScout.results;

  return [
    [series, getFromVariant(["modelVersion", "version"], "") + (getFromVariant("modelKey") || "")],
    [
      `${getFromVariant(["connectionWithValveSeat", "connection", 0, "value"], "")} ${getFromVariant(
        ["connectionWithValveSeat", "valveSeat"],
        "n.a.",
      )}mm`,
      getFromVariant("connectionWithValveSeat.connectionKey"),
    ],

    // separator
    [null, "/"],

    [getFromVariant("material.material"), getFromVariant("material.housingMaterialKey")],
    [getFromVariant("sealing.identifier"), getFromVariant("sealing.sealingKey")],

    // separator
    [null, "/"],

    [_.get(partialPos6, "identifier"), _.get(partialPos6, "partialKey")],
    [_.get(partialPos7, "identifier"), _.get(partialPos7, "partialKey")],
    [_.get(partialPos8, "identifier"), _.get(partialPos8, "partialKey")],

    // separator
    [null, "\u2014"],

    [getFromVariant("valveOption.identifier"), getFromVariant("valveOption.partialKey")],
    [pressureRange, `${getFromVariant("pressureMin")}-${getFromVariant("pressureMax")} bar`],

    // append voltage and current type, if it's a solenoid valve
    ...(answerIsSolenoidValve && answerVoltage ? [[voltage, `${answerVoltage}V/${answerCurrent}`]] : []),
  ];
};

export const createIdentifier = (variant, currentAnswer, lang = LANGUAGES.de.value) => {
  if (variant.isAccessory) {
    return _l(variant.displayValue, lang);
  }

  const getFromVariant = (path, fallback) => _.get(variant, path, fallback);
  const join = (params, delimiter = "") => params.join(delimiter);

  const electricalConnectionType = getFromVariant("electricalConnectionType");
  const electricalConnectionCurrentType = _.get(electricalConnectionType, "currentType.0.value");
  const articleNumber = getArticleNumber(variant);

  const pressureMin = getFromVariant(["pressureMin"]);
  const pressureMax = getFromVariant(["pressureMax"]);
  const answerCurrent = electricalConnectionCurrentType === "AC" ? "50-60Hz" : "00Hz";

  const pressureRange = `${pressureMin}-${pressureMax}`;
  const voltage = getVoltage(variant, currentAnswer);
  const solenoidType = getSolenoidValue(variant, lang);

  const explanation = articleExplanation(variant, currentAnswer);
  const connectionType = _.get(explanation, [1, 0]);
  const housing = _l(_.chain(explanation).get([3, 0]).concat().value(), lang);
  const seal = _.get(explanation, [4, 0]);

  return join(
    [
      articleNumber,
      pressureRange,
      answerCurrent,
      electricalConnectionCurrentType,
      voltage,
      solenoidType,
      connectionType,
      housing,
      seal,
    ],
    IDENTIFIER_DELIMITIER,
  );
};

export const updateVariants = (variants, variantToUpdate) =>
  _.map(variants, (variant) => {
    if (areVariantsEqualByOfferPosition(variant, variantToUpdate)) {
      return {
        ...variant,
        ...variantToUpdate,
      };
    }

    return variant;
  });

const getDisplayValue = (variant, lang) => {
  if (variant.isAccessory) {
    return _l(variant.displayValue, lang);
  }

  const articleNumber = getArticleNumber(variant, lang);
  const electricalConnectionType = _.get(variant, "electricalConnectionType", []);
  const electricalConnectionDisplayName = _.get(electricalConnectionType, ["currentType", 0, "value"]);
  const electricalInfos = _.compact([electricalConnectionDisplayName, getVoltage(variant)]).join(", ");

  return articleNumber ? [articleNumber, electricalInfos].join(" ") : null;
};

function getVariantProperties(variant, currentAnswer, oldVariants) {
  const isAccessory = variant.isAccessory;
  const electricalConnectionType = _.get(variant, "electricalConnectionType", []);
  const media = _.get(variant, "media");
  const voltage = _.get(variant, "voltage");
  const productID = _.get(variant, "id") || _.get(variant, "productID");
  const price = _.get(variant, "price", 0);
  const image = isAccessory ? _.get(variant, ["image", 0]) : _.get(variant, ["images", 0, "Bilder", 0]);
  const uuid = _.get(image, "uuid");
  const filename = _.get(image, "externalName");
  const locale = `${getLocale()}-${_.toUpper(getLocale())}`;
  const imageUrl = filename ? getImageUrl(uuid, getLocale(), "reduced", _l(filename, locale)) : null;
  const isSolenoidValve = _.get(variant, ["tags", 0, "id"]) === 1;
  const articleNumber = getArticleNumber(variant, LANGUAGES.de.value);
  const articleNumberEn = getArticleNumber(variant, LANGUAGES.en.value);
  const identifier = articleNumber ? createIdentifier(variant, currentAnswer, LANGUAGES.de.value) : null;
  const identifierEn = articleNumberEn ? createIdentifier(variant, currentAnswer, LANGUAGES.en.value) : null;
  const displayValue = getDisplayValue(variant, LANGUAGES.de.value);
  const displayValueEn = getDisplayValue(variant, LANGUAGES.en.value);
  const value = _.isString(articleNumber) ? articleNumber.replace(/[^\w]/gi, "").toUpperCase() : null;
  const offerPositionId = getOfferPositionId(variant, oldVariants);

  const metadata = _.pickBy({
    valveOptionIdentifier: _.get(variant, ["valveOption", "identifier"]),
    kvValue: _.get(variant, "kvValue"),
  });

  return {
    productID,
    offer_positionid: offerPositionId,
    articleNumber,
    articleNumberEn,
    displayValue,
    displayValueEn,
    label: articleNumber,
    value,
    isSolenoidValve,
    electricalConnectionType,
    media,
    price,
    image: imageUrl,
    voltage,
    identifier,
    identifierEn,
    metadata,
  };
}

function getOfferPositionId(newVariant, oldVariants) {
  const offerPositionId = _.get(newVariant, "offer_positionid");

  if (_.isNil(offerPositionId)) {
    const newOfferPositionId = _.chain(oldVariants).map("offer_positionid").max().value() + 1;
    return _.isNaN(newOfferPositionId) ? 0 : newOfferPositionId;
  }

  return offerPositionId;
}

function areVariantsEqualByOfferPosition(variant, variantToCheck) {
  return _.get(variant, "offer_positionid") === _.get(variantToCheck, "offer_positionid");
}

function areVariantsEqualByIdentifier(variant, variantToCheck) {
  return _.get(variant, "identifier") === _.get(variantToCheck, "identifier");
}

export const mergeVariants = ({
  variants: oldVariants,
  newVariant,
  currentAnswer,
  noDuplicates,
  shouldUpdateVariants,
}) => {
  if (_.isNil(newVariant)) {
    return [];
  }

  const newIdentifier = createIdentifier(newVariant, currentAnswer);
  const newVariantWithIdentifier = getVariantProperties(newVariant, currentAnswer, oldVariants);
  const isAlreadyAvailableByOfferPosition = _.some(oldVariants, (variant) =>
    areVariantsEqualByOfferPosition(variant, newVariantWithIdentifier),
  );
  const isAlreadyAvailableByIdentifier = _.some(oldVariants, (variant) =>
    areVariantsEqualByIdentifier(variant, newVariantWithIdentifier),
  );

  if (noDuplicates && isAlreadyAvailableByIdentifier) {
    return _.reject(oldVariants, ["identifier", newIdentifier]);
  }

  if (shouldUpdateVariants && isAlreadyAvailableByOfferPosition) {
    return updateVariants(oldVariants, newVariantWithIdentifier);
  }

  return _.reject(_.concat(oldVariants, newVariantWithIdentifier), _.isEmpty);
};

function getIdentifierParts(identifier, delimiter = IDENTIFIER_DELIMITIER) {
  return _.split(identifier, delimiter);
}

function getFromIdentifierWithCheck(identifier, index, cb) {
  const val = getFromIdentifierByIndex(identifier, index);

  if (_.isEmpty(val)) {
    return null;
  }

  if (_.isFunction(cb)) {
    return cb(val);
  }

  return val;
}

export function getVoltageFromIdentifier(identifier) {
  return getFromIdentifierWithCheck(identifier, VOLTAGE_INDEX, (voltageVal) =>
    _.chain(voltageVal).split("V").first().toNumber().value(),
  );
}

export function getCurrentFromIdentifier(identifier) {
  return getFromIdentifierWithCheck(identifier, CURRENT_INDEX);
}

function getHousingFromIdentifier(identifier) {
  return getFromIdentifierWithCheck(identifier, HOUSING_INDEX);
}

function getConnectionTypeFromIdentifier(identifier) {
  return getFromIdentifierWithCheck(identifier, CONNECTION_TYPE_INDEX);
}

function getSealFromIdentifier(identifier) {
  return getFromIdentifierWithCheck(identifier, SEAL_INDEX);
}

function getPressureRange(identifier) {
  return getFromIdentifierWithCheck(identifier, PRESSURE_INDEX, (val) => `${val} bar`);
}

function getValveOptionFromArticleNumber(articleNumber) {
  const articleNumberParts = articleNumber.split(ARTICLE_NUMBER_PART_SEPARATOR);
  const lastPart = _.last(articleNumberParts);
  const valveOptionIndex = lastPart.indexOf(ARTICLE_NUMBER_VALVE_OPTION_SEPARATOR) + 1;
  return lastPart.substring(valveOptionIndex);
}

export function getArticleNumberWithWildCard(articleNumber) {
  const articleNumberParts = _.split(articleNumber, "/");
  return `${articleNumberParts[0]}/${articleNumberParts[1]}/.${articleNumberParts[2].substring(1)}`;
}

export function getExplanation(position, lang, translations) {
  const { article_nr, identifier, product_id, metadata } = position;

  // // TODO for now just an assumption; better add an extra field into db offer_position
  const isAccessory = !product_id;

  if (isAccessory) {
    return article_nr;
  }

  const connectionType = getConnectionTypeFromIdentifier(identifier);
  const seal = getSealFromIdentifier(identifier);
  const pressureRange = getPressureRange(identifier);
  const housing = getHousingFromIdentifier(identifier);
  const valveOptionIdentifier = _l(_.get(metadata, "valveOptionIdentifier"), lang);

  const kvValue = _.get(metadata, "kvValue");
  const kvValueLabel = _l(translations.OFFER_POSITION_INFO_KV_VALUE, lang);
  const kvValueWithLabel = kvValue && `${kvValueLabel}: ${kvValue}`;

  return _.chain([connectionType, housing, seal, pressureRange, valveOptionIdentifier, kvValueWithLabel])
    .compact()
    .join(" | ")
    .value();
}

export function testVariant(variant, articleNumber) {
  const valveOption = getValveOptionFromArticleNumber(articleNumber);
  const lengthRawArticleNumber = _.size(articleNumber) - _.size(valveOption);
  const rawArticleNumber = articleNumber.substring(0, lengthRawArticleNumber);

  /* in order to get data-sheets which have wildcards in them we use it as regex-rule */
  const rule = new RegExp(`^${rawArticleNumber}${valveOption.replace(".", "\\.")}`);

  return rule.test(variant.articleNumber);
}

export function getVariant({ articleNumber, product, current }) {
  const check = (value, predicate) => (predicate(value) ? value : null);

  const queryCurrent = check(current, (v) => v === "AC" || v === "DC") || "BC";
  const variantsFromProduct = _.get(product, "variants");

  const variants = _.chain(variantsFromProduct)
    .filter((variant) => testVariant(variant, articleNumber))
    .sortBy((variant) => {
      /*
       * We need to place variants whose article numbers match exactly, at the beginning.
       */

      return variant.articleNumber == articleNumber ? 0 : 1;
    })
    .filter((variant) => {
      /*
       * We also need to filter for current types because article number is not enough.
       */

      const currentTypes = _.map(_.get(variant, ["electricalConnectionType", "currentType"], []), "value");
      const currentType = queryCurrent === "BC" ? ["AC", "DC"] : [queryCurrent];
      return currentTypes.length === 0 || _.intersection(currentTypes, currentType).length >= 1;
    })
    .value();

  return _.head(variants);
}

export function getSearchValue(value = "") {
  return value.replace(/[^\w.?]/gi, "").toUpperCase();
}

export function wildcardArticleNumber(articleNumber) {
  const articleNumberParts = _.split(articleNumber, "/");
  return `${articleNumberParts[0]}/${articleNumberParts[1]}/.${articleNumberParts[2].substring(1)}`;
}

export function filterArticleNumbers(articleNumbers, search) {
  /* use regex to allow placeholders ?._ */
  if (_.size(search) > 0) {
    /* search for "beginning with" with !optional! ModelKey */
    const regexFilterValue = search.replace(/[_?]/gi, ".");
    const rule = new RegExp(`^([A-Z]?)${regexFilterValue}.*`);

    return _.filter(articleNumbers, ({ rawValue }) => rule.test(rawValue));
  }

  return [];
}

export function generateArticleNumber(variant, modelVersion) {
  const modelVersionKey = _.get(modelVersion, "version", "");

  const modelKey = variant.modelKey || "";
  const connectionWithValveSeat = variant.connectionWithValveSeat.connectionKey;

  const material = variant.material.housingMaterialKey;
  const sealing = variant.sealing.sealingKey;

  const partialKeyPos6 = variant.electricalConnectionType
    ? variant.electricalConnectionType.partialKey
    : variant.actuatorFunction.partialKey; // 6 electricalConnectionTypes || actuatorFunction

  const partialKeyPos7 = variant.solenoidType ? variant.solenoidType.partialKey : variant.actuatorType.partialKey; // 7 solenoidType || actuatorType

  const partialKeyPos8 = variant.protectionClass ? variant.protectionClass.partialKey : variant.actuatorSize.partialKey; // 8 protectionClass || actuatorSize

  const valveOption = variant.valveOption.partialKey;

  return [
    modelVersionKey + modelKey + connectionWithValveSeat,
    material + sealing,
    partialKeyPos6 + partialKeyPos7 + partialKeyPos8 + ARTICLE_NUMBER_VALVE_OPTION_SEPARATOR + valveOption,
  ].join(ARTICLE_NUMBER_PART_SEPARATOR);
}

export function getDeliveryContents(database, variant, current) {
  const deliveryContents = _.get(database, ["deliveryContents", "solenoidValves"], []);

  const electricalConnectionTypeId = _.get(variant, ["electricalConnectionType", "id"]);
  const solenoidTypeId = _.get(variant, ["solenoidType", "id"]);
  const protectionClassId = _.get(variant, ["protectionClass", "id"]);
  const currentType = current === "BC" ? ["AC", "DC"] : [current];

  return _(deliveryContents)
    .filter((entry) => {
      const electricalConnectionTypes = _.map(entry.electricalConnectionType, "id");
      const solenoidTypes = _.map(entry.solenoidType, "id");
      const protectionClasses = _.map(entry.protectionClass, "id");
      const currentTypes = _.map(entry.currentType, "value");

      return (
        _.includes(electricalConnectionTypes, electricalConnectionTypeId) &&
        _.includes(solenoidTypes, solenoidTypeId) &&
        _.includes(protectionClasses, protectionClassId) &&
        // if no current type was defined, ignore it
        (currentTypes.length === 0 || _.intersection(currentTypes, currentType).length >= 1)
      );
    })
    .flatMap("deliveryContents")
    .sortBy("id")
    .sortedUniqBy("id")
    .value();
}
