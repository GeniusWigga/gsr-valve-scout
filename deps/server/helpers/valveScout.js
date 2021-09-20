const _ = require("lodash");

const INFO = require("../static/static_names.js");
const { getUniqConnectionsFromProducts } = require("./connectionsHelpers");
const { _l } = require("./locale.js");

// Machine readable names
const ATTRIBUTE_NAME = INFO.productAttributeNames();

const CONNECTION_TYPE = {
  THREAD: 1,
  FLANGE: 2,
};

const ValveCategory = {
  Solenoid: 1,
  PressureControlled: 2,
};

const SwitchPosition = {
  _2_2_ways: 1,
  _3_2_ways: 2,
  _5_2_ways: 3,
};

const Environment = {
  Open: 1,
  Closed: 2,
};

const PressureControlledFunction = {
  NC_damped: {
    actuatorFunctions: [1, 4],
    actuatorSizes: [5, 6, 7, 8, 9],
  },
  NC_fast: {
    actuatorFunctions: [1, 4],
    actuatorSizes: [1, 2, 3, 4],
  },
  NO: {
    actuatorFunctions: [2],
    actuatorSizes: [1, 2, 3, 4],
  },
  NC_tube: {
    actuatorFunctions: [7],
  },
  NO_tube: {
    actuatorFunctions: [8],
  },
};

const filterOptions = {
  // Question 1 (static)
  valveCategory: null,

  // Question 2 (static)
  switchPosition: null,

  // Question 3 (dynamic)
  connection: null,
  connectionType: null,
  kv: null,

  // Question 4 (dynamic)
  media: null,

  // Question 4 alternative (dynamic)
  housingMaterial: null,
  sealing: null,

  // Question 5 (static)
  environment: null,

  // Question protectionClass
  protectionClass: null,

  // Question 6 (static)
  operatingPressure: null,

  // Question 7
  current: null,
  voltage: null,

  // Question 7 alternative
  pressureControlledFunction: null,

  // Question 8
  valveOption: null,
};

const getSeriesIdsAndConnectionIdsForKv =
  // _.memoize(
  ({ kvValue: originalKvValue, valveCategory, connectionType, kvValues }) => {
    const SMALL_VALUE_THRESHOLD = 1.5;
    const SMALL_VALUE_MULTIPLIER = 3;
    const KV_TOLERANCE_LOWER = 0.05;
    const KV_TOLERANCE_UPPER = 0.5;

    if (originalKvValue <= SMALL_VALUE_THRESHOLD) {
      originalKvValue *= SMALL_VALUE_MULTIPLIER;
    }

    const lowerKvValue = (1 - KV_TOLERANCE_LOWER) * originalKvValue;
    const upperKvValue = (1 + KV_TOLERANCE_UPPER) * originalKvValue;

    const kvData =
      valveCategory == ValveCategory.Solenoid
        ? kvValues.solenoidValves
        : valveCategory == ValveCategory.PressureControlled
        ? kvValues.pressureControlledValves
        : _.concat(kvValues.solenoidValves, kvValues.pressureControlledValves);

    const nextKvData = _.chain(kvData)
      .sortBy("kvValue")
      .find(({ kvValue }) => kvValue >= originalKvValue)
      .value();

    const filteredKvData = _.chain(kvData)
      .filter(({ kvValue }) => kvValue >= lowerKvValue && kvValue <= upperKvValue)
      .concat(nextKvData || [])
      .map((kvData) => {
        if (!connectionType) {
          return kvData;
        }

        const { connectionsWithValveSeat } = kvData;

        const filteredConnections = _.filter(connectionsWithValveSeat, ({ value: identifier }) => {
          const connectionIdentifier = _.get(identifier, [0, 0, "value"]);

          if (connectionType === CONNECTION_TYPE.THREAD) {
            return _.includes(connectionIdentifier, "G");
          }

          return _.includes(connectionIdentifier, "DN");
        });

        if (_.isEmpty(filteredConnections)) {
          return null;
        }

        return {
          ...kvData,
          connectionsWithValveSeat: filteredConnections,
        };
      })
      .compact()
      .value();

    const seriesIds = _.chain(filteredKvData).flatMap("series").map("id").uniq().sortBy().value();

    const connectionIds = _.chain(filteredKvData)
      .flatMap("connectionsWithValveSeat")
      .map("value.0.0.id")
      .uniq()
      .sortBy()
      .value();

    return { seriesIds, connectionIds };
  }
  // ,
  // ({ kvValue, valveCategory, connectionType, cacheKey }) =>
  //   [kvValue, valveCategory, connectionType, cacheKey].join("_"),
// );

const valveScout =
  // _.memoize(
  ({ products, connections, kvValues, filterOptions, cacheKey }) => {
    const valveCategory = _.toNumber(filterOptions.valveCategory);
    const connectionId = _.toNumber(filterOptions.connection);
    const kvValue = _.toNumber(filterOptions.kv);
    const connectionType = _.toNumber(filterOptions.connectionType);

    const copyProduct = (product) => ({
      [ATTRIBUTE_NAME.pId]: product[ATTRIBUTE_NAME.pId],
      [ATTRIBUTE_NAME.pSeries]: product[ATTRIBUTE_NAME.pSeries],
      [ATTRIBUTE_NAME.pTags]: product[ATTRIBUTE_NAME.pTags],
      [ATTRIBUTE_NAME.pImages]: product[ATTRIBUTE_NAME.pImages],
      [ATTRIBUTE_NAME.pDescription]: product[ATTRIBUTE_NAME.pDescription],
      [ATTRIBUTE_NAME.pOptional]: product[ATTRIBUTE_NAME.pOptional],
      [ATTRIBUTE_NAME.pFunction]: product[ATTRIBUTE_NAME.pFunction],
      [ATTRIBUTE_NAME.pMaxPressure]: product[ATTRIBUTE_NAME.pMaxPressure],
    });

    const filteredProducts = _.reduce(
      products,
      (filteredProducts, product) => {
        const productId = _.toNumber(product.id);

        let variants = product[ATTRIBUTE_NAME.pVariants];
        let compatibleMediaObjects = product[ATTRIBUTE_NAME.pCompatibleMedia];

        // region Question 1
        if (valveCategory) {
          const categoryId = _.get(product, [ATTRIBUTE_NAME.pTags, 0, "id"]);

          if (valveCategory != categoryId) {
            return filteredProducts;
          }
        }
        // endregion

        // region Question 2
        if (filterOptions.switchPosition) {
          const functions = _.get(product, [ATTRIBUTE_NAME.pFunction], []);

          const predicate = _.some(functions, (func) => func.id == filterOptions.switchPosition);

          if (!predicate) {
            return filteredProducts;
          }
        }
        // endregion

        // region Question 3
        if (connectionId) {
          // filter only variants with the particular connection
          const filteredVariants = _.filter(
            variants,
            (variant) => _.get(variant, ["connectionWithValveSeat", "connection", 0, "id"]) == connectionId,
          );

          // if no variants left, valve doesn't fit
          if (_.isEmpty(filteredVariants)) {
            return filteredProducts;
          }

          variants = filteredVariants;
        } else if (kvValue) {
          const { seriesIds, connectionIds } = getSeriesIdsAndConnectionIdsForKv({
            kvValue,
            valveCategory,
            connectionType,
            kvValues,
            cacheKey,
          });

          if (!_.includes(seriesIds, productId)) {
            return filteredProducts;
          }

          const filteredVariants = _.filter(variants, ({ connectionWithValveSeat }) => {
            const connectionId = _.get(connectionWithValveSeat, ["connection", 0, "id"]);

            return _.includes(connectionIds, connectionId);
          });

          if (_.isEmpty(filteredVariants)) {
            return filteredProducts;
          }

          variants = filteredVariants;
        }
        // endregion

        // region Question 4
        if (filterOptions.media) {
          const filteredMediaObjects = _.chain(compatibleMediaObjects)
            .map((compatibleMediaObject) => {
              const compatibleMedia = _.filter(
                compatibleMediaObject.compatibleMedia,
                (media) => filterOptions.media == media.id,
              );

              if (_.isEmpty(compatibleMedia)) {
                return null;
              }

              return {
                ...compatibleMediaObject,
                compatibleMedia,
              };
            })
            .compact()
            .value();

          if (filteredMediaObjects.length === 0) {
            return filteredProducts;
          }

          compatibleMediaObjects = filteredMediaObjects;

          // filter Variants for filtered compatibleMedia
          const sealingIds = _(compatibleMediaObjects)
            .map((compatibleMedia) => compatibleMedia.sealing)
            .flatten()
            .uniqBy("id")
            .map((sealing) => sealing.id)
            .value();

          const housingMaterialIds = _(compatibleMediaObjects)
            .map((compatibleMedia) => compatibleMedia.housingMaterial)
            .flatten()
            .uniqBy("id")
            .map((housingMaterial) => housingMaterial.id)
            .value();

          const filteredVariantsMedia = _.filter(variants, (variant) => {
            const predicateHousingMaterial = _.includes(housingMaterialIds, variant.material.id);
            const predicateSealing = _.includes(sealingIds, variant.sealing.id);

            return predicateHousingMaterial && predicateSealing;
          });

          if (filteredVariantsMedia.length === 0) {
            return filteredProducts;
          }
          variants = filteredVariantsMedia;
        }
        // endregion

        // region Question 4 alternative
        if (filterOptions.housingMaterial) {
          const filteredVariantsMaterial = _.filter(
            variants,
            (variant) => filterOptions.housingMaterial == variant.material.id,
          );

          if (filteredVariantsMaterial.length === 0) {
            return filteredProducts;
          }
          variants = filteredVariantsMaterial;
        }

        if (filterOptions.sealing) {
          const filteredVariantsSealing = _.filter(variants, (variant) => filterOptions.sealing == variant.sealing.id);

          if (filteredVariantsSealing.length === 0) {
            return filteredProducts;
          }
          variants = filteredVariantsSealing;
        }
        // endregion

        // region Question 5
        if (filterOptions.environment) {
          const filteredVariantsPressureMin = _.filter(variants, (variant) => {
            const pressureMin = _.get(variant, ["pressureMin"], 0);
            return (
              (filterOptions.environment == Environment.Open && pressureMin > 0) ||
              (filterOptions.environment == Environment.Closed && pressureMin === 0)
            );
          });

          if (filteredVariantsPressureMin.length === 0) {
            return filteredProducts;
          }
          variants = filteredVariantsPressureMin;
        }
        // endregion

        // region Question Schutzart
        if (filterOptions.protectionClass) {
          const filterExplosionProtection = filterOptions.protectionClass === "EX_SCHUTZ";

          const filteredVariantsProtectionClass = _.filter(variants, (variant) => {
            const hasExplosionProtection = _.get(variant, ["protectionClass", "explosionProtection"], false);

            return (
              (filterExplosionProtection && hasExplosionProtection) ||
              (!filterExplosionProtection && !hasExplosionProtection)
            );
          });

          if (filteredVariantsProtectionClass.length === 0) {
            return filteredProducts;
          }
          variants = filteredVariantsProtectionClass;
        }
        // endregion

        const maxPressure = _.max(_.map(variants, "pressureMax"));

        // region Question 6
        if (filterOptions.operatingPressure) {
          const filteredVariantsPressureMax = _.filter(variants, (variant) => {
            const pressureMax = _.get(variant, ["pressureMax"], 0);
            return filterOptions.operatingPressure <= pressureMax;
          });

          if (filteredVariantsPressureMax.length === 0) {
            return filteredProducts;
          }

          variants = filteredVariantsPressureMax;
        }
        // endregion

        // region Question 7
        if (filterOptions.current) {
          const filteredVariantsCurrent = _.filter(variants, (variant) => {
            const electricalCurrentTypes = _.map(
              _.get(variant, ["electricalConnectionType", "currentType"], null),
              "value",
            );

            return _.includes(electricalCurrentTypes, filterOptions.current);
          });

          if (filteredVariantsCurrent.length === 0) {
            return filteredProducts;
          }
          variants = filteredVariantsCurrent;
        }
        // endregion

        // region Question 7 alternative
        if (filterOptions.pressureControlledFunction) {
          const filter = _.get(PressureControlledFunction, [filterOptions.pressureControlledFunction], {
            actuatorFunctions: [],
            actuatorSizes: [],
          });

          const filteredVariantsFunction = _.filter(variants, (variant) => {
            const actuatorSize = _.get(variant, ["actuatorSize", "id"], null);
            const actuatorFunction = _.get(variant, ["actuatorFunction", "id"], null);
            const actuatorType = _.get(variant, ["actuatorType", "id"], null);

            return (
              (filter.actuatorFunctions ? _.includes(filter.actuatorFunctions, actuatorFunction) : true) &&
              (filter.actuatorSizes ? _.includes(filter.actuatorSizes, actuatorSize) : true) &&
              (filter.actuatorType ? _.includes(filter.actuatorTypes, actuatorType) : true)
            );
          });

          if (filteredVariantsFunction.length === 0) {
            return filteredProducts;
          }
          variants = filteredVariantsFunction;
        }
        // endregion

        // region Question 8
        if (filterOptions.valveOption) {
          const filteredVariantsOptions = _.filter(variants, (variant) => {
            const valveOption = _.get(variant, ["valveOption", "id"], null);
            return filterOptions.valveOption == valveOption;
          });

          if (filteredVariantsOptions.length === 0) {
            return filteredProducts;
          }
          variants = filteredVariantsOptions;
        }
        // endregion

        if (_.isEmpty(variants)) {
          return filteredProducts;
        }

        const filteredProduct = {
          ...copyProduct(product),
          [ATTRIBUTE_NAME.pVariants]: variants,
          [ATTRIBUTE_NAME.pMaxPressure]: maxPressure,
          [ATTRIBUTE_NAME.pDifferingValveOptionStandard]: product[ATTRIBUTE_NAME.pDifferingValveOptionStandard],
          [ATTRIBUTE_NAME.pCompatibleMedia]: compatibleMediaObjects,
        };

        filteredProducts.push(filteredProduct);

        return filteredProducts;
      },
      [],
    );

    if (filterOptions.operatingPressure) {
      // ignore valves with a much higher pressureMax
      // than the user asked for

      const pressureRangeThreshold = filterOptions.connection
        ? _.get(_.find(connections, { id: _.toInteger(filterOptions.connection) }), ["pressureRangeThreshold"]) || 2
        : 2;

      const maxPressures = _(filteredProducts)
        .map("variants")
        .flatten()
        .map("pressureMax")
        .map(_.toNumber)
        .sortBy()
        .uniq()
        .take(pressureRangeThreshold)
        .value();

      return _.chain(filteredProducts)
        .map((product) => {
          let variants = product[ATTRIBUTE_NAME.pVariants];

          // region Question 6
          if (maxPressures) {
            const filteredVariantsPressureMax = _.filter(variants, (variant) => {
              const pressureMax = _.get(variant, ["pressureMax"], 0);
              return _.includes(maxPressures, pressureMax);
            });

            if (filteredVariantsPressureMax.length === 0) {
              return null;
            }
            variants = filteredVariantsPressureMax;
          }
          // endregion

          if (_.get(variants, ["length"], 0) === 0) {
            return null;
          }

          return {
            ...copyProduct(product),
            [ATTRIBUTE_NAME.pVariants]: variants,
          };
        })
        .compact()
        .value();
    }

    return filteredProducts;
  }
  // ,
  // ({ filterOptions, cacheKey }) => [JSON.stringify(filterOptions), cacheKey].join("_"),
// );

function generateAnswers(products) {
  const answers = {
    valveCategory: [],
    switchPosition: [],
    connection: [],
    media: [],
    housingMaterial: [],
    sealing: [],
    environment: [],
    protectionClass: [],
    operatingPressure: [],
    current: [],
    voltage: [],
    pressureControlledFunction: [],
    valveOption: [],
  };

  /*
   * perhaps refactor answer generation
   * for each question to work per product
   * currently each answer generation step
   * goes through all products
   */

  // region Question 1
  const valveCategories = _(products)
    .map((product) => _.get(product, [ATTRIBUTE_NAME.pTags, 0, "id"]))
    .uniq()
    .value();

  if (_.includes(valveCategories, ValveCategory.Solenoid)) {
    answers.valveCategory.push({
      label: {
        "de-DE": "Magnetventil",
        "en-GB": "Solenoid valve",
      },
      answer: ValveCategory.Solenoid,
    });
  }

  if (_.includes(valveCategories, ValveCategory.PressureControlled)) {
    answers.valveCategory.push({
      label: {
        "de-DE": "Druckgesteuertes Ventil",
        "en-GB": "Externally controlled valve",
      },
      sublabel: {
        "de-DE": "externes Steuermedium ist erforderlich",
        "en-GB": "external control pressure is necessary",
      },
      answer: ValveCategory.PressureControlled,
    });
  }
  // endregion

  // region Question 2
  const functions = _(products).map(ATTRIBUTE_NAME.pFunction).flatten().reject(_.isEmpty).uniqBy("id").value();

  answers.switchPosition = _(functions)
    .filter((func) => _.includes(_.values(SwitchPosition), func.id))
    .map((switchPosition) => ({
      label: switchPosition.value,
      answer: switchPosition.id,
    }))
    .value();
  // endregion

  // region Question 3
  answers.connection = _(getUniqConnectionsFromProducts(products))
    .map((connection, index) => ({
      label: connection.value,
      answer: connection.id,
      order: index,
    }))
    .value();
  // endregion

  // region Question 4

  const media = _.chain(products)
    .flatMap((product) => {
      const compatibleMedia = _.get(product, [ATTRIBUTE_NAME.pCompatibleMedia], []);

      return _.chain(compatibleMedia).flatMap("compatibleMedia").reject(_.isNull).value();
    })
    .uniqBy("id")
    .value();

  answers.media = _.map(media, (media) => ({
    label: media.media,
    answer: media.id,
    density: media.density,
    isLiquid: !media.gaseous,
  }));
  // endregion

  // region Question 4 alternative
  const housingMaterials = _.uniqBy(
    _.flatten(
      _.map(products, (product) =>
        _.reject(
          _.map(_.get(product, [ATTRIBUTE_NAME.pVariants], []), (variant) => variant.material),
          _.isNull,
        ),
      ),
    ),
    "id",
  );

  answers.housingMaterial = _.map(housingMaterials, (housingMaterial) => ({
    label: _.get(housingMaterial, "material", {}),
    answer: housingMaterial.id,
    helpText: housingMaterial.helpText,
  }));

  const sealings = _.uniqBy(
    _.flatten(
      _.map(products, (product) =>
        _.reject(
          _.map(_.get(product, [ATTRIBUTE_NAME.pVariants], []), (variant) => variant.sealing),
          _.isNull,
        ),
      ),
    ),
    "id",
  );

  answers.sealing = _.map(_.sortBy(sealings, "order"), (sealing) => ({
    label: _.get(sealing, "identifier", {}),
    answer: sealing.id,
    helpText: sealing.helpText,
  }));
  // endregion

  // region Question 5
  const environments = _.uniq(
    _.flatten(
      _.map(products, (product) =>
        _.map(_.get(product, [ATTRIBUTE_NAME.pVariants], []), (variant) =>
          _.get(variant, "pressureMin") > 0 ? Environment.Open : Environment.Closed,
        ),
      ),
    ),
  );

  if (_.includes(environments, Environment.Closed)) {
    answers.environment.push({
      label: {
        "de-DE": "Ich benötige das Ventil für einen geschlossenen Kreislauf.",
        "en-GB": "I need the valve for a closed circuit.",
      },
      sublabel: {
        "de-DE": "Ergebnis beschränkt sich auf direkt- oder zwangsgesteuerte Ventile (Bsp. 0-16 bar).",
        "en-GB": "Result refers to direct- or force-controlled valves (e.g. 0-16 bar).",
      },
      answer: Environment.Closed,
    });
  }

  if (_.includes(environments, Environment.Open)) {
    answers.environment.push({
      label: {
        "de-DE": "Ich benötige das Ventil für ein offenes System.",
        "en-GB": "I need the valve for an open system.",
      },
      sublabel: {
        "de-DE": "Ergebnis beschränkt sich auf servogesteuerte Ventile (Bsp. 0,3-16 bar).",
        "en-GB": "Result refers to servo controlled valves (e.g. 0.3-16 bar).",
      },
      answer: Environment.Open,
    });
  }
  // endregion

  // region Question protectionClass
  const protectionClasses = _.uniqBy(
    _.flatten(
      _.map(products, (product) =>
        _.without(
          _.map(_.get(product, [ATTRIBUTE_NAME.pVariants], []), (variant) => _.get(variant, ["protectionClass"], null)),
          null,
        ),
      ),
    ),
    "id",
  );

  if (
    _.filter(protectionClasses, { explosionProtection: false }).length >= 1 ||
    _.filter(protectionClasses, { explosionProtection: null }).length >= 1
  ) {
    answers.protectionClass.push({
      label: {
        "de-DE": "IP65",
        "en-GB": "IP65",
      },
      answer: "IP65",
    });
  }

  if (_.filter(protectionClasses, { explosionProtection: true }).length >= 1) {
    answers.protectionClass.push({
      label: {
        "de-DE": "Ex-Schutz",
        "en-GB": "Ex-Protection",
      },
      answer: "EX_SCHUTZ",
    });
  }
  // endregion

  // region Question 6
  const maxPressure = _.max(_.map(products, ATTRIBUTE_NAME.pMaxPressure));

  if (maxPressure) {
    answers.operatingPressure.push({ label: "maxPressure", answer: maxPressure });
  }
  // endregion

  // region Question 7
  const currents = _.uniq(
    _.flatten(
      _.map(products, (product) => _.map(_.get(product, [ATTRIBUTE_NAME.pVariants], []), getCurrentTypeFromVariant)),
    ),
  );

  if (currents.length > 0) {
    if (_.includes(currents, "AC") || _.includes(currents, "BC")) {
      answers.current.push({
        label: {
          "de-DE": "Wechselstrom",
          "en-GB": "alternating current",
        },
        answer: "AC",
      });
    }

    if (_.includes(currents, "DC") || _.includes(currents, "BC")) {
      answers.current.push({
        label: {
          "de-DE": "Gleichstrom",
          "en-GB": "direct current",
        },
        answer: "DC",
      });
    }

    answers.voltage = _.map([230, 220, 120, 110, 48, 24, 12], (voltage) => ({
      label: {
        "de-DE": `${voltage}V`,
      },
      answer: voltage,
    }));
  }
  // endregion

  // region Question 7 alternative
  const pressureControlledFunctions = _.uniq(
    _.flatten(
      _.map(products, (product) =>
        _.reject(
          _.map(_.get(product, [ATTRIBUTE_NAME.pVariants], []), (variant) => {
            const actuatorSize = _.get(variant, ["actuatorSize", "id"], null);
            const actuatorFunction = _.get(variant, ["actuatorFunction", "id"], null);

            if (
              _.includes(PressureControlledFunction.NC_damped.actuatorSizes, actuatorSize) &&
              _.includes(PressureControlledFunction.NC_damped.actuatorFunctions, actuatorFunction)
            ) {
              return "NC_damped";
            }
            if (
              _.includes(PressureControlledFunction.NC_fast.actuatorSizes, actuatorSize) &&
              _.includes(PressureControlledFunction.NC_fast.actuatorFunctions, actuatorFunction)
            ) {
              return "NC_fast";
            }
            if (
              _.includes(PressureControlledFunction.NO.actuatorSizes, actuatorSize) &&
              _.includes(PressureControlledFunction.NO.actuatorFunctions, actuatorFunction)
            ) {
              return "NO";
            }
            if (_.includes(PressureControlledFunction.NO_tube.actuatorFunctions, actuatorFunction)) {
              return "NO_tube";
            }
            if (_.includes(PressureControlledFunction.NC_tube.actuatorFunctions, actuatorFunction)) {
              return "NC_tube";
            }
            return null;
          }),
          _.isNull,
        ),
      ),
    ),
  );

  if (_.includes(pressureControlledFunctions, "NC_damped")) {
    answers.pressureControlledFunction.push({
      label: {
        "de-DE": "NC – mit Federkraft und gegen dem Mediumstrom gedämpft schließend",
        "en-GB": "NC — closed by spring power against the media (soft closing)",
      },
      answer: "NC_damped",
    });
  }

  if (_.includes(pressureControlledFunctions, "NC_fast")) {
    answers.pressureControlledFunction.push({
      label: {
        "de-DE": "NC – mit Federkraft und mit Mediumstrom schnell schließend",
        "en-GB": "NC — closed by spring power with the flow direction",
      },
      answer: "NC_fast",
    });
  }

  if (_.includes(pressureControlledFunctions, "NO")) {
    answers.pressureControlledFunction.push({
      label: {
        "de-DE": "NO – mit Federkraft geöffnet",
        "en-GB": "NO — open by spring power",
      },
      answer: "NO",
    });
  }

  if (_.includes(pressureControlledFunctions, "NO_tube")) {
    answers.pressureControlledFunction.push({
      label: {
        "de-DE": "NO - mit Federkraft geöffnet, nur Ventile mit Steuerrohr",
        "en-GB": "NO — open by spring power, only Sliding Valves",
      },
      answer: "NO_tube",
    });
  }

  if (_.includes(pressureControlledFunctions, "NC_tube")) {
    answers.pressureControlledFunction.push({
      label: {
        "de-DE": "NC - mit Federkraft geschlossen, nur Ventile mit Steuerrohr",
        "en-GB": "NC — closed by spring power, only Sliding Valves",
      },
      answer: "NC_tube",
    });
  }
  // endregion

  // region Question 8
  const valveOptions = _.chain(products)
    .flatMap(ATTRIBUTE_NAME.pVariants)
    .map("valveOption")
    .reject(_.isEmpty)
    .uniqBy("id")
    .value();

  // Hardcoded standard valve options
  const hardcodedStandardValveOptionIds = [
    1,
    11, // solinoid valves
    102,
  ];

  // Dynamic standard valve options based on column in PIM
  const dynamicStandardValveOptionIds = _(products)
    .flatMap(ATTRIBUTE_NAME.pDifferingValveOptionStandard)
    .reject(_.isNil)
    .uniqBy("id")
    .map("id")
    .value();

  const standardValveOptionIds = hardcodedStandardValveOptionIds.concat(dynamicStandardValveOptionIds);

  answers.valveOption = _.map(valveOptions, (valveOption) => {
    return {
      options: _.get(valveOption, "options", []),
      drawing: _.get(valveOption, "drawing"),
      answer: valveOption.id,
      helpText: _.flatMap(valveOption.options, "helpText"),
      standard: _.includes(standardValveOptionIds, valveOption.id),
      partialKey: _.get(valveOption, "partialKey"),
    };
  });
  // endregion

  return answers;
}

function isSolenoidValve(product) {
  const valveCategory = _.get(product, [ATTRIBUTE_NAME.pTags, 0, "id"]);
  return valveCategory === ValveCategory.Solenoid;
}

function getCurrentTypeFromVariant(variant) {
  const electricalCurrentTypes = _.map(_.get(variant, ["electricalConnectionType", "currentType"], null), "value");

  const isAlternatingCurrent = _.includes(electricalCurrentTypes, "AC");
  const isDirectCurrent = _.includes(electricalCurrentTypes, "DC");

  if (isAlternatingCurrent && isDirectCurrent) {
    return "BC";
  }
  if (isAlternatingCurrent) {
    return "AC";
  }
  if (isDirectCurrent) {
    return "DC";
  }
}

const getVoltageAnswers = (products, locale) =>
  _.chain(generateAnswers(products))
    .get("voltage")
    .orderBy("answer", "asc")
    .map(({ label }) => _l(label, locale))
    .join(", ")
    .value();

module.exports = {
  valveScout,
  generateAnswers,
  getVoltageAnswers,

  getCurrentTypeFromVariant,
  isSolenoidValve,

  FilterOptionsKeys: _.keys(filterOptions),

  ValveCategory,
  SwitchPosition,
  Environment,

  CONNECTION_TYPE,
};
