import _ from "lodash";
import { parseQuery } from "../../OfferPortal/helper/path";

const LOCAL_STORAGE_TTL = 2 * 60 * 60 * 1000;

const STATE_DELIMITER = "$$$";

function deserializeState(state) {
  const keyValueStrings = atob(state).split(",");

  return _.reduce(
    keyValueStrings,
    (result, keyValueString) => {
      const [keyString, valueString] = keyValueString.split("=");
      const [valuePart, questionNumberPart, answerPart] = valueString.split(STATE_DELIMITER);
      const value = _.toNumber(valuePart) || valuePart;
      const answer = parseInt(answerPart) || answerPart;
      const questionNumber = parseInt(questionNumberPart);

      const answerObject = _.pickBy({
        value,
        answer,
        available: !!answer,
        questionNumber,
      });

      return {
        ...result,

        [keyString]: {
          ...result[keyString],
          ...answerObject,
        },
      };
    },
    {},
  );
}

const serializeState = (state) => {
  const answers = _.map(state, (answer, key) => {
    const value = [answer.value, answer.questionNumber, answer.answer].join(STATE_DELIMITER);

    return `${key}=${value}`;
  });

  return btoa(answers.join(","));
};

// eslint-disable-next-line consistent-return
const loadState = (field = "data", isOfferPortal) => {
  const searchFromWindow = window.location.search;
  const stateFromURL = new URLSearchParams(searchFromWindow).get(field);
  const keyFromURL = new URLSearchParams(searchFromWindow).get("key");
  /* if url-search is empty use localState as fallback */
  const useLocalState = stateFromURL === null || stateFromURL === "";

  const getValidState = (storageState) => {
    if (useLocalState) {
      const timeout = Date.now() - storageState.timestamp >= LOCAL_STORAGE_TTL;

      if (timeout) {
        localStorage.clear();
        return undefined;
      }
      /* if localState is loaded, update the url to match */
      const search = new URLSearchParams(searchFromWindow);
      search.set(field, storageState.value);
      window.history.replaceState(storageState.value, window.title, `?${search}`);

      /* return new state after url is updated */
      return storageState.value;
    }

    return stateFromURL;
  };

  try {
    const getItemKey = isOfferPortal ? keyFromURL : field;

    const storageState = JSON.parse(localStorage.getItem(getItemKey));
    const state = getValidState(storageState);

    if (state) {
      if (field === "customer") {
        return state;
      }

      return deserializeState(state);
    }
  } catch (err) {
    return undefined;
  }
};

const saveState = (state, field = "data", isOfferPortal) => {
  const searchFromWindow = window.location.search;
  const query = parseQuery(searchFromWindow);
  const search = new URLSearchParams(searchFromWindow);

  try {
    /* save in url */
    const { key } = query;

    const serializedState = field === "customer" ? state : serializeState(state);
    const timeStamp = Date.now();
    const keyForOfferPortalData = _.toString(key || timeStamp);
    const localStorageKey = isOfferPortal ? keyForOfferPortalData : field;

    const save = () => {
      search.set(field, serializedState);

      if (isOfferPortal) {
        search.set("key", keyForOfferPortalData);
      }

      /* save in localState */
      const localStateValue = {
        value: serializedState,
        timestamp: timeStamp,
      };

      /* save in localState */
      localStorage.setItem(localStorageKey, JSON.stringify(localStateValue));
    };

    const remove = () => {
      search.delete(field);
      search.delete("key");

      localStorage.removeItem(localStorageKey);
    };

    if (!_.isEmpty(state)) {
      save(serializedState, timeStamp, localStorageKey);
    } else {
      remove();
    }

    window.history.replaceState(serializedState, window.title, `?${search}`);
  } catch (err) {
    console.log("Saving state failed", err);
  }
};

module.exports = {
  STATE_DELIMITER,
  deserializeState,
  loadState,
  saveState,
};
