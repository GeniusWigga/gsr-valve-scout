import _ from "lodash";
import lunr from "lunr";

import STATIC_NAMES from "../static/static_names.js";

lunr.tokenizer.separator = null;

/**
 * We split on every non-word character as well as between
 * characters and after four consecutive digits.
 *
 * E.g. A3529/1001 => ["A", "3520", "1001"]
 * E.g. 35291001 => ["3529", "1001"]
 *
 * @param {array} obj
 */
lunr.tokenizer = function (obj) {
  if (!arguments.length || obj == null || obj == undefined) return [];
  if (Array.isArray(obj)) return obj.map((t) => lunr.utils.asString(t).toLowerCase());

  const tokens =
    obj
      .toString()
      .trim()
      .toLowerCase()
      .match(/[a-zäöüß]+|[0-9]{1,4}/g) || [];

  return tokens;
};

require("lunr-languages/lunr.stemmer.support.js")(lunr);
require("lunr-languages/lunr.de.js")(lunr);
require("lunr-languages/lunr.multi.js")(lunr);

const searchIndexDE = lunr(getConfig());
const searchIndexEN = lunr(getConfig());

const articlesSearchIndex = lunr(getArticleConfig());

/**
 * Search Index with language
 */
function getConfig() {
  const names = STATIC_NAMES.productAttributeNames();

  return function () {
    // multi-language stemming support
    this.use(lunr.multiLanguage("en", "de"));

    // set identifier field
    this.ref(names.pId);

    // reference search fields
    this.field(names.pSeries, { boost: 10 });
    this.field(names.pDescription);
    this.field(names.pMedia);
    this.field(names.pMaterials);
    this.field(names.pSealing);
    this.field(names.pOptional);
    this.field(names.pFunction);
    this.field(names.pKeywords);
    this.field(names.pKind, { boost: 8 });
    this.field(names.pConnections, { boost: 8 });
    this.field("articleNumbers", { boost: 20 });
  };
}

function getArticleConfig() {
  return function () {
    // multi-language stemming support
    this.use(lunr.multiLanguage("en", "de"));

    // set identifier field
    this.ref("articleNumber");

    // reference search fields
    this.field("articleNumber", { boost: 20 });
    this.field("connection", { boost: 8 });
    this.field("pressuremin");
    this.field("pressuremax");
    this.field("sealing");
    this.field("material", { boost: 8 });
    this.field("valveOption", { boost: 10 });
    this.field("electricalConnectionType");
    this.field("protectionClass");
  };
}

export function search(searchQuery, allProducts, language, isArticle) {
  const processedSearchQuery = (searchQuery || "")
    // remove some words
    .replace(/(baureihe|br|type?)/i, " ")
    // replace multiple spaces with one space
    .replace(/\s\s+/, " ")
    // remove leading and trailing whitespace
    .trim();

  return executeSearch(processedSearchQuery, allProducts, language, isArticle);
}

function executeSearch(query, collection, language, isArticle) {
  const productSearchIdx = language === "de" ? searchIndexDE : searchIndexEN;
  const searchIndex = isArticle ? articlesSearchIndex : productSearchIdx;
  const lunrSearchResult = searchIndex.search(query);

  return _.compact(
    _.map(lunrSearchResult, ({ ref }) => _.find(collection, isArticle ? { articleNumber: ref } : { id: ref })),
  );
}

/**
 * Fill the index with product data
 */
export function resetSearchIndex(database) {
  const products = database.productsSearch;

  _.forEach(_.get(products, "en-GB"), (product) => searchIndexEN.add(product));
  _.forEach(_.get(products, "de-DE"), (product) => searchIndexDE.add(product));
}

export function resetArticleSearchIndex(articles) {
  _.forEach(articles, (article) => articlesSearchIndex.add(article));
}
