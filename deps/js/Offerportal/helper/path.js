import _ from "lodash";
import { compile as compilePath } from "path-to-regexp";
import qs from "qs";

export const getQueryString = (query, params = {}) => {
  query = _.omitBy(query, (entry) => _.isNil(entry) || (_.isString(entry) && _.isEmpty(entry)));
  return qs.stringify(query, { addQueryPrefix: true, skipNulls: true, ...params });
};

export const getNextQueryString = (oldSearch, newQuery) => {
  const newObj = newQuery;
  const oldQuery = parseQuery(oldSearch);

  const keysToDelete = _.reduce(
    newQuery,
    (res, value, key) => {
      if (_.isEmpty(value) || _.isNil(value)) {
        res.push(key);
      }

      return res;
    },
    [],
  );

  const nextQuery = {
    ...oldQuery,
    ...newObj,
  };

  return getQueryString(_.omit(nextQuery, keysToDelete));
};

export const parseQuery = (search, options = {}) =>
  qs.parse(search, {
    ...options,
    ignoreQueryPrefix: true,
  });

export const buildPath = (path, params, query) => {
  const toPath = compilePath(path);

  return toPath(params) + getQueryString(query);
};
