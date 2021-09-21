import _ from "lodash";
import superAgent from "superagent";

import config from "../config.json";
import structure from "../deps/server/helpers/structure";
import { getQueryString } from "../deps/js/OfferPortal/helper/path";

const BASE_API_URL = config.apiUrl;

export function fetch(url, options) {
  const fetchOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  };

  const request = _.get(superAgent, _.toLower(options.method), "get")(url).set(fetchOptions.headers);
  return request.body ? request.body(options.body) : request;
}

const getApiUrl = (path, options = {}) => {
  const { baseUrl = BASE_API_URL } = options;
  path = _.replace(path, new RegExp("^/+(.*)"), "$1");

  return _.compact([baseUrl, path]).join("/");
};

const doFetch = ({ path, body = {}, options = {}, method }) => {
  return fetch(getApiUrl(path, options), {
    method: method,
    headers: options.headers,
    body: body,
  });
};

export const simpleGet = (requestOptions) => doFetch({ ...requestOptions, method: "GET" });

export const getAnswers = (locale, query) => {
  return simpleGet({
    path: structure.getLinkNode("valve_scout/answers").getUrl(locale) + getQueryString(query),
  });
};

export const getQuestions = locale => {
  return simpleGet({ path: structure.getLinkNode("valve_scout/questions").getUrl(locale) });
};

export const getFilteredProducts = locale => {
  return simpleGet({
    path: structure.getLinkNode("valve_scout/filtered").getUrl(locale) + getQueryString(query),
  });
};