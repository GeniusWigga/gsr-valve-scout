const R = require("ramda");

/**
 * Should only be used to parse numbers and numbers with fractions.
 *
 * - 100
 * - 2 1/2
 * - 3 3/8
 * - 2/4
 * - 2 1/2
 *
 * @param {*} sizeString
 * @returns {integer}
 */
const parseNumberOrFractions = (sizeString) => {
  // eslint-disable-next-line no-eval
  const result = eval(R.replace(/\s/, "+")(sizeString));
  return Number.isFinite(result) ? result : 0;
};

/**
 * Parses and sorts connections
 */
const connectionsParser = R.compose(
  R.sortWith([R.descend(R.prop("type")), R.ascend(R.prop("size"))]),
  R.map((connection) =>
    R.compose(
      ([type, sizeString]) => ({
        type,
        // https://de.wikipedia.org/wiki/Nennweite
        size: parseNumberOrFractions(sizeString),
        value: connection.value,
        id: connection.id,
      }),
      R.map(R.trim),
      R.take(2),
      R.drop(1),
      R.match(/(DN|G)\s*([0-9\/\s]*)/),
      R.trim,
      R.defaultTo(""),
      R.prop("value"),
    )(connection),
  ),
);

/**
 * Collects and sorts all unique connections from products array.
 */
const getUniqConnectionsFromProducts = R.compose(
  connectionsParser,
  R.uniqBy(R.prop("id")),
  R.chain(
    R.compose(
      R.filter(R.compose(R.not, R.isNil)),
      R.map(R.compose(R.defaultTo(null), R.path(["connectionWithValveSeat", "connection", 0]))),
      R.defaultTo([]),
      R.prop("variants"),
    ),
  ),
);

module.exports = {
  connectionsParser,
  getUniqConnectionsFromProducts,
};
