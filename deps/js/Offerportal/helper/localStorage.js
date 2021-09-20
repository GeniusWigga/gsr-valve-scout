import _ from "lodash";

const getLocalStorage = () => {
  const localStorage = _.get(window, "localStorage");
  if (localStorage) {
    return localStorage;
  }

  return console.warn("No LocalStorage was found");
};

export const getLocalStorageItem = (key, fallBack) => {
  try {
    const localStorage = getLocalStorage();
    const item = localStorage.getItem(key);

    if (!item) {
      return fallBack || {};
    }

    return JSON.parse(item);
  } catch (e) {
    return console.warn("Error in getLocalStorageItem: ", e);
  }
};

export const setLocalStorageItem = (key, value) => {
  try {
    const localStorage = getLocalStorage();
    return localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    return console.warn("Error in setLocalStorageItem: ", e);
  }
};

export const mergeLocalStorageItem = (key, value) => {
  try {
    if (!key) {
      return;
    }

    const getItem = getLocalStorageItem(key);
    const merge = { ...getItem, ...value };
    return setLocalStorageItem(key, merge);
  } catch (e) {
    return console.warn("Error in mergeLocalStorageItem: ", e);
  }
};
