import _ from "lodash";
import path from "path";

import { getAttachmentUrl } from "../helpers/attachments";
import { _l, LANG_TAG, LOCALE } from "../helpers/locale";

export const OFFER_PORTAL_TABLES = [
  {
    id: 46,
    name: "offerPortal_contactPerson",
    key: "employee",
    aggregate: offerPortalContacts,
    map(entries) {
      return _.map(entries, (value, key) => ({ label: value, value: _.toInteger(key) }));
    },
  },
  {
    id: 48,
    name: "offerPortal_outroText",
    key: "outro",
    aggregate: offerPortalDefaultSettings,
    map: translateOfferPortalDefaultSettings,
  },
  {
    id: 49,
    name: "offerPortal_deliveryTime",
    key: "delivery",
    aggregate: offerPortalDefaultSettings,
    map: translateOfferPortalDefaultSettings,
  },
  {
    id: 50,
    name: "offerPortal_deliveryConditions",
    key: "delivery_condition",
    aggregate: offerPortalDefaultSettings,
    map: translateOfferPortalDefaultSettings,
  },
  {
    id: 51,
    name: "offerPortal_termsOfPayment",
    key: "payment_conditon",
    aggregate: offerPortalDefaultSettings,
    map: translateOfferPortalDefaultSettings,
  },
  {
    id: 52,
    name: "offerPortal_emailSettings",
    key: "email_settings",
    aggregate: offerPortalEmail,
    map(entries, locale) {
      return _.mapValues(entries, (v) => _l(v, locale));
    },
  },
  {
    id: 53,
    name: "offerPortal_introText",
    key: "intro",
    aggregate: offerPortalDefaultSettings,
    map: translateOfferPortalDefaultSettings,
  },
];

export const VALVE_DESIGN_TABLES = [
  {
    id: 78,
    name: "valveDesign_video",
    key: "videos",
    aggregate: (rows, columns) => {
      const titleColumnIndex = _.findIndex(columns, { name: "title" });
      const imageColumnIndex = _.findIndex(columns, { name: "image" });
      const urlColumnIndex = _.findIndex(columns, { name: "url" });

      return _.chain(rows)
        .keyBy("id")
        .mapValues(({ values }) => {
          const label = values[titleColumnIndex];
          const image = _.first(values[imageColumnIndex]);

          return {
            label,
            thumb: getAttachmentUrl(image, "small"),
            url: values[urlColumnIndex],
            image,
          };
        })
        .omitBy((data) => _.some(data, _.isEmpty))
        .value();
    },
  },
  {
    id: 79,
    name: "valveDesign_image",
    key: "images",
    aggregate: (rows, columns) => {
      const titleColumnIndex = _.findIndex(columns, { name: "title" });
      const imageColumnIndex = _.findIndex(columns, { name: "image" });

      return _.chain(rows)
        .keyBy("id")
        .mapValues(({ values }) => {
          const label = values[titleColumnIndex];
          const image = _.first(values[imageColumnIndex]);

          return {
            label,
            url: getAttachmentUrl(image, "reduced"),
            thumb: getAttachmentUrl(image, "small"),
            image,
          };
        })
        .omitBy((data) => _.some(data, _.isEmpty))
        .value();
    },
  },
  {
    id: 90,
    name: "valveDesign_document",
    key: "documents",
    aggregate: (rows, columns) => {
      const titleColumnIndex = _.findIndex(columns, { name: "title" });

      const documentColumnIndexes = {
        [LANG_TAG[LOCALE.DE]]: _.findIndex(columns, { name: "documentDE" }),
        [LANG_TAG[LOCALE.EN]]: _.findIndex(columns, { name: "documentEN" }),
      };

      return _.chain(rows)
        .keyBy("id")
        .mapValues(({ values }) => {
          const label = values[titleColumnIndex];
          const documents = _.mapValues(documentColumnIndexes, (index) => _.first(values[index]));

          return {
            label,
            url: _.mapValues(documents, (document) => getAttachmentUrl(document)),
            documents: _.values(documents),
          };
        })
        .omitBy((data) => _.some(data, _.isEmpty))
        .value();
    },
  },
  {
    id: 80,
    name: "valveDesign_contentBlock",
    key: "contentBlocks",
    dependencies: ["videos", "images", "documents"],
    aggregate: (rows, columns, dependencies) => {
      const getDependencies = (ids, name) => _.map(ids, (id) => _.get(dependencies, [name, id]));

      const textColumnIndex = _.findIndex(columns, { name: "text" });
      const imagesColumnIndex = _.findIndex(columns, { name: "images" });
      const videosColumnIndex = _.findIndex(columns, { name: "videos" });
      const documentsColumnIndex = _.findIndex(columns, { name: "documents" });

      return _.chain(rows)
        .keyBy("id")
        .mapValues(({ values }) =>
          _.omitBy(
            {
              text: values[textColumnIndex],
              images: getDependencies(_.map(values[imagesColumnIndex], "id"), "images"),
              videos: getDependencies(_.map(values[videosColumnIndex], "id"), "videos"),
              documents: getDependencies(_.map(values[documentsColumnIndex], "id"), "documents"),
            },
            _.isEmpty,
          ),
        )
        .omitBy((data) => _.every(data, _.isEmpty))
        .value();
    },
  },
  {
    id: 85,
    name: "valveDesign_type",
    key: "types",
    aggregate: (rows, columns) => {
      const identifierColumnIndex = _.findIndex(columns, { name: "identifier" });
      const categoryColumnIndex = _.findIndex(columns, { name: "category" });
      const pathColumnIndex = _.findIndex(columns, { name: "path" });

      return _.chain(rows)
        .keyBy("id")
        .mapValues(({ id, values }) => {
          const label = values[identifierColumnIndex];
          const pathLabel = values[pathColumnIndex];
          const path = pathLabel["en-GB"];
          const category = _.first(values[categoryColumnIndex]);

          return {
            id,
            label,
            category: {
              id: _.get(category, "id"),
              label: _.get(category, "value"),
            },
            pathLabel,
            path,
          };
        })
        .omitBy((data) => _.every(data, _.isEmpty))
        .value();
    },
  },
  {
    id: 86,
    name: "valveDesign_content",
    key: "categories",
    dependencies: ["contentBlocks", "types"],
    aggregate: (rows, columns, dependencies) => {
      const getDependencies = (ids, name) => _.map(ids, (id) => _.get(dependencies, [name, id]));

      return _.chain(rows)
        .map(({ values }) => {
          const typeColumnIndex = _.findIndex(columns, { name: "type" });
          const contentColumnIndex = _.findIndex(columns, { name: "content" });

          const typeIds = _.map(values[typeColumnIndex], "id");
          const type = _.first(getDependencies(typeIds, "types"));
          const category = _.get(type, "category");
          const contentBlockIds = _.map(values[contentColumnIndex], "id");
          const content = getDependencies(contentBlockIds, "contentBlocks");

          return {
            category,
            type,
            content,
          };
        })
        .groupBy("category.id")
        .mapValues((groups) => ({
          label: _.get(groups[0], ["category", "label"]),
          types: _.chain(groups)
            .groupBy("type.id")
            .mapValues((groups) => ({
              label: _.get(groups[0], ["type", "label"]),
              path: _.get(groups[0], ["type", "path"]),
              content: _.reduce(groups, (result, { content }) => _.concat(result, content), []),
            }))
            .value(),
        }))
        .value();
    },
  },
];

export const AGGREGATION_TABLES = [
  { id: 1, name: "news" },
  { id: 2, name: "products" },
  { id: 4, name: "connections" },
  { id: 7, name: "keywords" },
  { id: 8, name: "images" },
  { id: 9, name: "valveMedia" },
  { id: 11, name: "datasheets" },
  { id: 12, name: "instructions" },
  { id: 13, name: "certificates" },
  { id: 15, name: "catalogs" },
  { id: 16, name: "videos" },
  { id: 17, name: "downloads" },
  { id: 22, name: "pressureRangesSolenoidValves" },
  { id: 26, name: "pressureRangesPressureControlledValves" },
  { id: 27, name: "compatibleMedia" },

  { id: 5, name: "housingMaterials" },
  { id: 9, name: "media" },
  { id: 10, name: "sealings" },

  { id: 28, name: "connectionsWithValveSeat" },

  { id: 18, name: "electricalConnectionTypes" },
  { id: 19, name: "solenoidTypes" },
  { id: 20, name: "protectionClasses" },

  { id: 23, name: "actuatorFunctions" },
  { id: 24, name: "actuatorTypes" },
  { id: 25, name: "actuatorSizes" },

  { id: 21, name: "valveOptions" },

  { id: 92, name: "valveOption" },

  { id: 94, name: "valveOptionCategory" },

  { id: 30, name: "helpTexts" },

  { id: 32, name: "modelVersions" },

  { id: 14, name: "functions" },

  { id: 33, name: "deliveryContentsSolenoidValves" },

  { id: 35, name: "temperatureMediumPressureControlledValves" },

  { id: 38, name: "solenoidValvePrice" },
  { id: 39, name: "pressureControlledValvePrice" },

  { id: 42, name: "priceSettings" },
  { id: 43, name: "tradePartner" },

  { id: 44, name: "heroSlider" },
  { id: 45, name: "welcomeBoxSettings" },

  ...OFFER_PORTAL_TABLES,

  { id: 54, name: "accessories" },
  { id: 56, name: "kvValuesSolenoidValves" },
  { id: 57, name: "kvValuesPressureControlledValves" },
  { id: 60, name: "switchingPositions" },
  { id: 61, name: "electricalConnections" },
  { id: 64, name: "mountingPositions" },
  { id: 87, name: "excludedValveOptions" },

  ...VALVE_DESIGN_TABLES,

  { id: 98, name: "landingPageCategoriesSettings" },
  { id: 104, name: "companyPageSettings" },

  { id: 105, name: "stpFilesSolenoidValves" },
  { id: 107, name: "stpFilesPressureControlledValves" },
];

export const BUILD_BASE_PATH = __dirname;
export const SERVER_BASE_PATH = path.join(BUILD_BASE_PATH, "..", "server");
export const DATABASE_FOLDER = path.join(SERVER_BASE_PATH, "database");

function offerPortalEmail(rows) {
  return _.reduce(
    rows,
    (acc, { values }) => {
      const key = _.nth(values, 0);
      const translation = _.nth(values, 2);

      return {
        ...acc,
        [key]: translation,
      };
    },
    {},
  );
}

function offerPortalDefaultSettings(rows) {
  const sortingColIndex = 1;

  return _.chain(rows)
    .sortBy((row) => _.get(row, ["values", sortingColIndex]))
    .map(({ values, id }) => {
      const multiLanguage = _.chain(values)
        .reject(_.isNumber)
        .reduce((acc, v) => ({ ...acc, ...v }), {})
        .value();
      return { value: multiLanguage, id };
    })
    .value();
}

function translateOfferPortalDefaultSettings(entries, locale) {
  return _.map(entries, ({ value, id }) => {
    const translate = _l(_.concat({ value, id }), locale);
    return {
      value: id,
      label: translate,
    };
  });
}

function offerPortalContacts(rows) {
  return _.reduce(
    rows,
    (acc, { id, values }) => {
      const firstName = _.nth(values, 0);
      const lastName = _.nth(values, 1);
      const name = [firstName, lastName].join(" ");
      const mail = _.nth(values, 2);
      const phone = _.nth(values, 3);
      const imageAttachment = _.nth(values, 4);
      const signatureAttachment = _.nth(values, 5);
      const image = _.map(imageAttachment, getAttachmentUrl);
      const signature = _.map(signatureAttachment, getAttachmentUrl);

      return {
        ...acc,
        [id]: {
          name,
          mail,
          phone,
          image,
          signature,
          imageAttachment,
          signatureAttachment,
        },
      };
    },
    {},
  );
}
