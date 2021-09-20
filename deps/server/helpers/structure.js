import { getDatabase } from "../aggregator/database";
import { LANG_TAG, LOCALE } from "./locale";

const _ = require("lodash");
const structureJson = require("./structure.json");

const nodes = {};
const locales = ["de", "en"];
const defaultLanguage = "de";

const LinkNode = function (linkKey, linkObject, parentNode) {
  function generateRouterRegexString() {
    const paths = [];
    _.forOwn(linkObject, (value, key) => {
      if (_.indexOf(locales, key) !== -1) {
        if (key != defaultLanguage && !parentNode) {
          paths.push(`${key}\/${value}`);
        } else {
          paths.push(value);
        }
      }
    });
    return `(${paths.join("|")})`;
  }

  const routerRegexString = generateRouterRegexString();
  const routerRegex = new RegExp(`\/${routerRegexString}`);

  return {
    getTranslation(languageKey) {
      return linkObject[languageKey];
    },
    getParent() {
      return parentNode;
    },
    getLinkKey() {
      return linkKey;
    },
    getRouterRegex() {
      return routerRegex;
    },
    // Using a dummy parameter: http://stackoverflow.com/questions/10858005/regex-for-route-matching-in-express
    getRouterRegexString() {
      return `/:neverUsed${routerRegexString}`;
    },
    getUrl(languageKey) {
      if (parentNode) {
        return `${parentNode.getUrl(languageKey)}/${this.getTranslation(languageKey)}`;
      }
      if (languageKey != defaultLanguage) {
        return `/${languageKey}/${this.getTranslation(languageKey)}`;
      }
      return `/${this.getTranslation(languageKey)}`;
    },
  };
};

function generateNode(value, key, parentNode) {
  const currentNodeKey = parentNode ? `${parentNode.getLinkKey()}/${key}` : key;
  const currentNode = new LinkNode(currentNodeKey, value, parentNode);
  nodes[currentNodeKey] = currentNode;
  _.forOwn(value.children, (childValue, childKey) => {
    generateNode(childValue, childKey, currentNode);
  });
}

function generateLookupMap() {
  const result = {};

  function addLookupKeys(currentObj, linkKey, parentLangPaths) {
    const langPaths = {};
    _.forOwn(currentObj, (value, key) => {
      if (key !== "children") {
        let langPath;
        if (key === defaultLanguage) {
          if (parentLangPaths && parentLangPaths[defaultLanguage]) {
            langPath = `${parentLangPaths[defaultLanguage]}/${value}`;
          } else {
            langPath = `/${value}`;
          }

          langPaths[defaultLanguage] = langPath;
          result[langPath] = linkKey;
        } else {
          if (parentLangPaths && parentLangPaths[key]) {
            langPath = `${parentLangPaths[key]}/${value}`;
          } else {
            langPath = `/${key}/${value}`;
          }
          langPaths[key] = langPath;
          result[langPath] = linkKey;
        }
        result[linkKey] = linkKey;
      }
    });
    _.forOwn(currentObj.children, (childObj, childKey) => {
      addLookupKeys(childObj, `${linkKey}/${childKey}`, langPaths);
    });
  }

  _.forOwn(structureJson, (value, key) => {
    addLookupKeys(value, key, {});
  });

  return result;
}

function generateNodes() {
  _.forOwn(structureJson, (value, key) => {
    generateNode(value, key, null);
  });
}

function initValveDesignStructure() {
  const valveDesignTypes = _.get(getDatabase(), ["valveDesign", "types"]);
  const valveDesignStructure = _.chain(valveDesignTypes)
    .keyBy("path")
    .mapValues(({ pathLabel }) =>
      _.mapKeys(pathLabel, (value, localeOrLangTag) =>
        _.has(LOCALE, localeOrLangTag)
          ? localeOrLangTag
          : _.findKey(LANG_TAG, (langTag) => langTag === localeOrLangTag),
      ),
    )
    .value();

  _.set(structureJson, ["valve_design", "children"], valveDesignStructure);
}

initValveDesignStructure();
generateNodes();

let lookupMap = generateLookupMap();

module.exports = {
  getLinkNode(linkKey) {
    let lookupMapVal;
    if (linkKey !== "/" && linkKey !== "/en/" && linkKey !== "/en") {
      // removes the params from url
      lookupMapVal = lookupMap[linkKey.replace(/(?:\/$|\?.*)/, "")];
    } else {
      lookupMapVal = lookupMap.index;
    }
    return nodes[lookupMapVal] || null;
  },
  getRouterRegexFromLinkNode(linkKey) {
    const linkNode = this.getLinkNode(linkKey);

    return linkNode && linkNode.getRouterRegex();
  },
  getRouterRegexStringFromLinkNode(linkKey) {
    const linkNode = this.getLinkNode(linkKey);

    return linkNode && linkNode.getRouterRegexString();
  },
  reinit() {
    initValveDesignStructure();

    // WARNING: when re-initializing, new nodes will be added to the old ones
    generateNodes();

    lookupMap = generateLookupMap();
  },
};
