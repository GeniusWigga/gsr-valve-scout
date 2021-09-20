/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable react/jsx-no-comment-textnodes */
import _ from "lodash";
import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
import Select from "react-select";

import { _l } from "../../deps/server/helpers/locale";
import { CONNECTION_TYPE } from "../../deps/server/helpers/valveScout";
import { KV_ANSWER_KEY, QUESTION_KEY } from "../../deps/server/static/questions";
import buildClassName from "../../deps/js/OfferPortal/helper/buildClassName";
import translations from "../../deps/js/static/valveScout";
import { generateUnsetAnswers } from "./QuestionContainer";

const TEMPERATURE_SCALE = {
  C: 1,
  F: 2,
};

const getConnectionTypeOptions = (locale) => [
  {
    label: _l(translations.questionConnectionThreaded, locale),
    value: CONNECTION_TYPE.THREAD,
  },
  {
    label: _l(translations.questionConnectionFlanged, locale),
    value: CONNECTION_TYPE.FLANGE,
  },
];

const getMediaOptions = (media, locale) =>
  _.chain(media)
    .map(({ label, answer }) => ({
      label: _l(label, locale),
      value: answer,
    }))
    .sortBy("label")
    .value();

const KvcInputBox = (props) => {
  const { answerKey, children, kvArgs, label, onChange, unit } = props;
  const value = _.isFinite(kvArgs[answerKey]) ? kvArgs[answerKey] : "";

  return (
    <div className="kvc__input-box">
      <p className="kvc__input-label">{label}</p>

      <div className="kvc__input-mask">
        <input
          className="kvc__input"
          type="number"
          onChange={(event) => onChange && onChange(answerKey, event.target.value)}
          readOnly={!onChange}
          value={value}
        />

        {unit && <span className="kvc__input-unit">{unit}</span>}
      </div>

      {children}
    </div>
  );
};

const KvTemperatureSwitcher = (props) => {
  const { currentValue, onSwitch } = props;
  const isCelcius = currentValue === TEMPERATURE_SCALE.C;

  const switchTemperatureScale = () => {
    const scale = isCelcius ? TEMPERATURE_SCALE.F : TEMPERATURE_SCALE.C;

    return onSwitch(scale);
  };

  return (
    <div className="kvc__switch" onClick={switchTemperatureScale}>
      <span>°C</span>
      <span className="kvc__switch-slider">
        <span className={buildClassName("kvc__switch-slider-bullet", { right: !isCelcius })} />
      </span>
      <span>°F</span>
    </div>
  );
};

const calculateKv = (values, isLiquid, isCelcius) => {
  const q = values[KV_ANSWER_KEY.FLOWRATE];
  const rho = values[KV_ANSWER_KEY.DENSITY];
  const dp = values[KV_ANSWER_KEY.PRESSURE_DELTA];
  const p2 = values[KV_ANSWER_KEY.PRESSURE_AFTER];
  const t1 = values[KV_ANSWER_KEY.TEMPERATURE];

  const valuesToCheck = isLiquid ? [q, rho, dp] : [q, rho, dp, p2, t1];

  if (!_.every(valuesToCheck, _.isFinite)) {
    console.debug("cannot calculate kv: missing variables");

    return null;
  }

  if (isLiquid) {
    return q * Math.sqrt(rho / (1000 * dp));
  }

  const p1 = dp + p2;
  const pDiv = p1 / 2;
  const kelvin = isCelcius ? t1 + 273 : (5 / 9) * (t1 + 459.67);

  if (p2 >= pDiv) {
    return (q / 514.0) * Math.sqrt((rho * kelvin) / (dp * p2));
  }
  return (q / (257 * p1)) * Math.sqrt(rho * kelvin);
};

const KvCalculator = (props) => {
  const { addAnswers, connectionQuestion, currentAnswers, locale, mediaQuestion, questionNumber } = props;

  const allMedia = mediaQuestion.answers[QUESTION_KEY.MEDIA];
  const allConnections = connectionQuestion.answers[QUESTION_KEY.CONNECTION];
  const mediaOptions = getMediaOptions(allMedia, locale);
  const connectionTypeOptions = getConnectionTypeOptions(locale);

  const initialKvValue = _.get(currentAnswers, [KV_ANSWER_KEY.KV, "value"]);
  const initialKvArgs = _.chain(currentAnswers).pick(_.values(KV_ANSWER_KEY)).mapValues("value").value();

  if (!_.has(initialKvArgs, KV_ANSWER_KEY.TEMPERATURE_SCALE)) {
    initialKvArgs[KV_ANSWER_KEY.TEMPERATURE_SCALE] = TEMPERATURE_SCALE.C;
  }

  const initialMediaId = _.get(currentAnswers, [QUESTION_KEY.MEDIA, "answer"]);
  const initialConnectionId = _.get(currentAnswers, [QUESTION_KEY.CONNECTION, "answer"]);
  const initialConnection = _.find(allConnections, { answer: initialConnectionId });

  const initialConnectionTypeId =
    (initialConnection && _.includes(initialConnection.label, "G") && CONNECTION_TYPE.THREAD) ||
    (initialConnection && _.includes(initialConnection.label, "DN") && CONNECTION_TYPE.FLANGE);

  const [currentMediaId, setCurrentMediaId] = useState(initialMediaId);
  const [currentKvArgs, setCurrentKvArgs] = useState(initialKvArgs);
  const [result, setResult] = useState(null);

  const currentMedia = _.find(allMedia, { answer: currentMediaId });
  const currentMediaOption = _.find(mediaOptions, { value: currentMediaId });

  // we will disable the select input if we get the connection from the regular question, so prefer the initial value
  const currentConnectionTypeId = initialConnectionTypeId || _.get(currentKvArgs, KV_ANSWER_KEY.CONNECTION_TYPE);
  const currentConnectionTypeOption = _.find(connectionTypeOptions, { value: currentConnectionTypeId });

  const isCelcius = currentKvArgs[KV_ANSWER_KEY.TEMPERATURE_SCALE] === TEMPERATURE_SCALE.C;
  const isLiquid = _.get(currentMedia, "isLiquid");
  const currentMediaDensity = _.get(currentMedia, "density");

  const updateCurrentKvArgs = (name, value) => {
    const number = parseFloat(value);

    setCurrentKvArgs({
      ...currentKvArgs,
      [name]: _.isFinite(number) ? number : undefined,
    });
  };

  const EFFECT = {
    RECALCULATE_RESULT: () => {
      if (!currentMediaId) {
        !currentMediaId && console.debug("will not calculate kv: missing media");

        return;
      }

      const result = calculateKv(currentKvArgs, isLiquid, isCelcius);

      return setResult(result && result.toFixed(2));
    },

    UPDATE_DENSITY: () => {
      updateCurrentKvArgs(KV_ANSWER_KEY.DENSITY, currentMediaDensity);
    },

    UPDATE_CURRENT_KV_ARGS: () => {
      if (_.isEqual(currentKvArgs, initialKvArgs)) {
        return;
      }

      // preserve the density if we already have a predefined one from the current media
      const kvArgs = currentMediaDensity
        ? _.assign({}, initialKvArgs, { [KV_ANSWER_KEY.DENSITY]: currentMediaDensity })
        : initialKvArgs;

      setCurrentKvArgs(kvArgs);
    },

    UPDATE_CURRENT_MEDIA_ID: () => setCurrentMediaId(initialMediaId),
  };

  useEffect(EFFECT.UPDATE_DENSITY, [currentMediaDensity]);
  useEffect(EFFECT.UPDATE_CURRENT_KV_ARGS, [currentAnswers]);
  useEffect(EFFECT.UPDATE_CURRENT_MEDIA_ID, [initialMediaId]);
  useEffect(EFFECT.RECALCULATE_RESULT, [currentMediaId, currentKvArgs]);

  const applyResult = () => {
    if (_.isEmpty(result)) {
      console.warn("'result' is empty and cannot be applied");

      return;
    }

    const mediaAnswer = _.assign({}, currentMedia, { questionNumber, forceSet: true });
    const unsetAnswers = generateUnsetAnswers(mediaQuestion, QUESTION_KEY.CONNECTION);
    const kvArgs = _.chain(currentKvArgs)
      .pickBy()
      .mapValues((value) => ({ value }))
      .value();

    addAnswers({
      // other values which were used for the calculation
      ...kvArgs,

      // unset answers which are now irrelevant
      ...unsetAnswers,

      // our new calculated kv value
      [KV_ANSWER_KEY.KV]: { value: result },

      // media value
      [QUESTION_KEY.MEDIA]: mediaAnswer,
    });
  };

  // we don't need the kv rate calculator if the connection has been explicitly chosen
  const isDisabled = !!initialConnectionId;

  return (
    <div className={buildClassName("kvc", { disabled: isDisabled, "has-value": initialKvValue })}>
      <h3 className="kvc__tag">{_l(translations.kv.tag, locale)}</h3>
      <h2 className="kvc__title">{_l(translations.kv.title, locale)}</h2>

      {initialKvValue && (
        <div className="kv__current-value-box">
          {_l(translations.kv.currentValue, locale)}:<span className="kv__current-value">{initialKvValue}</span>
        </div>
      )}

      <Select
        className="kvc__select kvc__connection-type-select"
        classNamePrefix="kvc-select"
        isSearchable={false}
        placeholder={_l(translations.kv.placeholder.connectionType, locale)}
        onChange={(selection) => updateCurrentKvArgs(KV_ANSWER_KEY.CONNECTION_TYPE, selection && selection.value)}
        options={connectionTypeOptions}
        value={currentConnectionTypeOption || null}
        isDisabled={initialConnectionId}
      />

      <Select
        className="kvc__select"
        classNamePrefix="kvc-select"
        openMenuOnClick
        isSearchable
        placeholder={_l(translations.kv.placeholder.media, locale)}
        onChange={(selection) => setCurrentMediaId(selection && selection.value)}
        options={mediaOptions}
        value={currentMediaOption || null}
      />

      <div className="kvc__columns">
        <div className="kvc__column">
          <KvcInputBox
            label="Q"
            unit={!currentMedia || isLiquid ? "m³/h" : "Nm³/h"}
            answerKey={KV_ANSWER_KEY.FLOWRATE}
            onChange={updateCurrentKvArgs}
            kvArgs={currentKvArgs}
          />

          <KvcInputBox
            label={!currentMedia || isLiquid ? "ρ1" : "ρn"}
            unit="kg/m³"
            answerKey={KV_ANSWER_KEY.DENSITY}
            onChange={!currentMediaDensity && updateCurrentKvArgs}
            kvArgs={currentKvArgs}
          />

          <KvcInputBox
            label="Δp"
            unit="bar"
            answerKey={KV_ANSWER_KEY.PRESSURE_DELTA}
            onChange={updateCurrentKvArgs}
            kvArgs={currentKvArgs}
          />
        </div>

        <div className={buildClassName("kvc__column", { disabled: isLiquid })}>
          <KvcInputBox
            label="p2"
            unit="bar"
            answerKey={KV_ANSWER_KEY.PRESSURE_AFTER}
            onChange={updateCurrentKvArgs}
            kvArgs={currentKvArgs}
          />

          <KvcInputBox
            label="T1"
            answerKey={KV_ANSWER_KEY.TEMPERATURE}
            onChange={updateCurrentKvArgs}
            kvArgs={currentKvArgs}
          >
            <KvTemperatureSwitcher
              currentValue={currentKvArgs[KV_ANSWER_KEY.TEMPERATURE_SCALE]}
              onSwitch={(scale) => updateCurrentKvArgs(KV_ANSWER_KEY.TEMPERATURE_SCALE, scale)}
            />
          </KvcInputBox>
        </div>
      </div>

      <div className="kvc__results">
        <p className="kvc__result-text">
          {_l(translations.kv.results.result, locale)}:
          {result ? (
            <span className="kvc__result">{result} m³/h</span>
          ) : (
            <span className="kvc__missing-params-text">
              {_l(translations.kv.results.pleaseEnterParameters, locale)}
            </span>
          )}
        </p>

        <a className={buildClassName("kvc__apply-button", { disabled: !result })} onClick={applyResult}>
          {_l(translations.kv.results.applyResult, locale)}
        </a>
      </div>
    </div>
  );
};

const PROP_TYPE = {
  QUESTION: PropTypes.shape({
    answers: PropTypes.exact({
      media: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.object.isRequired,
          answer: PropTypes.number.isRequired,
        }),
      ).isRequired,
    }),
  }).isRequired,
};

KvCalculator.propTypes = {
  addAnswers: PropTypes.func.isRequired,

  currentAnswers(props, propName, componentName) {
    const currentAnswers = props[propName];
    const allowedKeys = _.concat(_.values(QUESTION_KEY), _.values(KV_ANSWER_KEY));
    const differentKeys = _.difference(_.keys(currentAnswers), allowedKeys);

    if (!_.isEmpty(differentKeys)) {
      return new Error(
        `Invalid prop '${propName}' supplied to ${componentName}: Extra keys [${differentKeys.join(
          ", ",
        )}] supplied. Validation failed.`,
      );
    }

    const isValueValid = (value) => _.isNil(value) || _.isNumber(value) || _.isString(value);

    const regularAnswers = _.pick(currentAnswers, _.values(QUESTION_KEY));
    const malformedRegularAnswerKey = _.findKey(regularAnswers, ({ answer }) => !isValueValid(answer));

    if (malformedRegularAnswerKey) {
      return new Error(
        `Invalid prop '${propName}' supplied to ${componentName}: The value at '${malformedRegularAnswerKey}.answer' should be a number. Validation failed.`,
      );
    }

    const kvAnswers = _.pick(currentAnswers, _.values(KV_ANSWER_KEY));
    const malformedKvAnswerKey = _.findKey(kvAnswers, ({ value }) => !isValueValid(value));

    if (malformedKvAnswerKey) {
      return new Error(
        `Invalid prop '${propName}' supplied to ${componentName}: The value at '${malformedKvAnswerKey}.value' should be a number. Validation failed.`,
      );
    }
  },

  locale: PropTypes.string.isRequired,

  mediaQuestion: PROP_TYPE.QUESTION,
};

export default KvCalculator;
