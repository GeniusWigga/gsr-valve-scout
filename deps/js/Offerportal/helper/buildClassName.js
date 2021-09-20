import _ from "lodash";

export function buildClassArray(classNames) {
  classNames = _.concat(classNames);

  return _.reduce(
    classNames,
    (result, className) => {
      if (_.isObject(className)) {
        const classes = _.chain(className).pickBy().keys().value();

        return _.concat(result, classes);
      }
      if (_.isNil(className)) {
        return result;
      }

      return _.concat(result, className);
    },
    [],
  );
}

export default function buildClassName(componentName, modifiers = [], classNames = []) {
  const modifiersList = buildClassArray(modifiers).map((name) => `${componentName}--${name}`);
  const classNameList = buildClassArray(classNames);

  return _.concat(componentName, modifiersList, classNameList).join(" ");
}
