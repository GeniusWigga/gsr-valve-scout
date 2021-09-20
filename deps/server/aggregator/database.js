import _ from "lodash";
import { join as pathJoin } from "path";

import { DEFAULT_LANGTAG } from "../helpers/locale.js";
import { resetSearchIndex } from "../helpers/lunr";
import { OFFER_PORTAL_TABLES } from "./constants";

export const DATABASE_KEY = {
  PRODUCTS: "products", // TODO use this for all occurences
};

/**
 * Database fields definition
 */
export const DATABASE = {
  accessories: {},
  articlesSearch: {},
  allArticleNumbers: {},
  attachments: {},
  catalogs: {},
  compatibleMedia: {},
  connections: {},
  currentTypes: {},
  deliveryContents: {
    solenoidValues: {},
  },
  downloads: {},
  filterIds: {},
  helpTexts: {},
  heroSlider: {},
  kvValues: {},
  landingPageSeoCategories: {},
  companyPageSettings: {},
  media: {
    certificates: {},
    datasheets: {},
    galleries: {},
    instructions: {},
  },
  news: [],
  offerPortal: {},
  pressureRanges: {
    pressureControlledValves: {},
    solenoidValues: {},
  },
  priceSettings: {},
  products: [],
  productsSearch: {},
  temperatureMediumPressureControlledValves: {},
  tradePartner: {},
  valveDesign: {},
  valveFunctions: {},
  valveHousings: {},
  valveMedia: {},
  valveOptions: {},
  valveOption: {},
  valveOptionCategory: {},
  valvePrice: {},
  valveSealings: {},
  videos: {},
  welcomeBoxSettings: {},
};

export const DATABASE_META = {
  cacheDirectory: null,
};

export function loadDatabaseFromCacheDirectory(cacheDirectory) {
  // eslint-disable-next-line global-require
  const { readdirPromise, readJsonPromise } = require("../helpers/fsHelpers");

  const errors = [];
  const keys = _.keys(DATABASE);
  const database = {};

  console.log(`loading database from ${cacheDirectory} ...`);

  return Promise.all(
    _.map(keys, (key) => {
      let promise;

      if (key === DATABASE_KEY.PRODUCTS) {
        promise = readdirPromise(cacheDirectory).then((entries) => {
          const fileNames = _.filter(entries, (entry) =>
            new RegExp(`^${DATABASE_KEY.PRODUCTS}_\\d+.json$`).test(entry),
          );

          if (_.isEmpty(fileNames)) {
            return Error(`no data found for '${DATABASE_KEY.PRODUCTS}'`);
          }

          return Promise.all(
            _.map(fileNames, (fileName) => {
              const path = pathJoin(cacheDirectory, fileName);

              return readJsonPromise(path, {
                encoding: "utf8",
              });
            }),
          );
        });
      } else {
        const path = `${cacheDirectory}/${key}.json`;

        promise = readJsonPromise(path, { encoding: "utf8" });
      }

      console.log(`database part '${key}' - LOADING ...`);

      return promise
        .then((data) => {
          database[key] = data;

          console.log(`database part '${key}' - SUCCESS`);
        })
        .catch((error) => {
          console.log(`database part '${key}' - FAILED`);

          errors.push({ key, error });
        });
    }),
  )
    .then(() => {
      if (_.isEmpty(errors)) {
        return Promise.resolve();
      }

      return Promise.reject(errors);
    })
    .then(() => {
      _.assign(DATABASE, database);

      resetSearchIndex(DATABASE);

      DATABASE_META.cacheDirectory = cacheDirectory;

      console.log("Successfully loaded database from file.");
    });
}

export function getDatabase() {
  return DATABASE;
}

export function getMedia() {
  return DATABASE.media;
}

export function getOfferPortal(locale = DEFAULT_LANGTAG) {
  return _.reduce(
    OFFER_PORTAL_TABLES,
    (acc, { key, map }) => {
      const offerPortalEntry = _.get(DATABASE.offerPortal, key);
      const value = _.isFunction(map) ? map(offerPortalEntry, locale) : offerPortalEntry;
      return { ...acc, [key]: value };
    },
    {},
  );
}
