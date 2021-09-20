import _ from "lodash";

export const KV_ANSWER_KEY = {
  CONNECTION_TYPE: "connectionType",
  TEMPERATURE_SCALE: "tscale",
  FLOWRATE: "q",
  DENSITY: "rho",
  PRESSURE_DELTA: "dp",
  PRESSURE_AFTER: "p2",
  TEMPERATURE: "t1",
  KV: "kv",
};

export const QUESTION_KEY = {
  VALVE_CATEGORY: "valveCategory",
  SWITCH_POSITION: "switchPosition",
  CONNECTION: "connection",
  MEDIA: "media",
  MATERIALS: "materials",
  HOUSING_MATERIAL: "housingMaterial",
  SEALING: "sealing",
  ENVIRONMENT: "environment",
  PROTECTION_CLASS: "protectionClass",
  OPERATING_PRESSURE: "operatingPressure",
  CURRENT_AND_VOLTAGE: "currentAndVoltage",
  PRESSURE_CONTROLLED_FUNCTION: "pressureControlledFunction",
  VALVE_OPTION: "valveOption",
  VOLTAGE: "voltage",
  CURRENT: "current",
};

export const questions = [
  {
    id: QUESTION_KEY.VALVE_CATEGORY,
    title: {
      "de-DE": "Welche Ventilart suchen Sie?",
      "en-GB": "Which type of valve are you looking for?",
    },
    answerKeys: [QUESTION_KEY.VALVE_CATEGORY],
    helpTextKey: "FRAGE_VENTILART",
  },

  {
    id: QUESTION_KEY.SWITCH_POSITION,
    title: {
      "de-DE": "Wie ist die Anzahl der Anschlüsse?",
      "en-GB": "How many connections do you have?",
    },
    answerKeys: [QUESTION_KEY.SWITCH_POSITION],
    helpTextKey: "FRAGE_ANZAHL_ANSCHLUESSE",
  },

  {
    id: QUESTION_KEY.CONNECTION,
    title: {
      "de-DE": "Welche Anschlussart benötigen Sie?",
      "en-GB": "Which type of connection do you need?",
    },
    answerKeys: [QUESTION_KEY.CONNECTION],
    unsetAnswerKeys: _.values(KV_ANSWER_KEY),
    helpTextKey: "FRAGE_ANSCHLUSSART",
  },

  {
    id: QUESTION_KEY.MEDIA,
    title: {
      "de-DE": "Welches Medium wird durch das Ventil transportiert?",
      "en-GB": "Which medium is to be conveyed through the valve?",
    },
    answerKeys: [QUESTION_KEY.MEDIA],
    unsetAnswerKeys: [QUESTION_KEY.HOUSING_MATERIAL, QUESTION_KEY.SEALING],
    helpTextKey: "FRAGE_MEDIUM",
  },

  {
    id: QUESTION_KEY.MATERIALS,
    title: {
      "de-DE": "Was sind Ihre bevorzugten Ventilwerkstoffe?",
      "en-GB": "Which are your preferred valve materials?",
    },
    answerKeys: [QUESTION_KEY.HOUSING_MATERIAL, QUESTION_KEY.SEALING],
    unsetAnswerKeys: [QUESTION_KEY.MEDIA],
    helpTextKey: "FRAGE_VENTILWERKSTOFFE",
  },

  {
    id: QUESTION_KEY.ENVIRONMENT,
    title: {
      "de-DE": "Für welchen Einsatzfall wird das Ventil eingesetzt?",
      "en-GB": "For which application is the valve to be used?",
    },
    answerKeys: [QUESTION_KEY.ENVIRONMENT],
    helpTextKey: "FRAGE_KREISLAUF",
  },

  {
    id: QUESTION_KEY.PROTECTION_CLASS,
    title: {
      "de-DE": "Welche Schutzart wird benötigt?",
      "en-GB": "Which protection type is needed?",
    },
    answerKeys: [QUESTION_KEY.PROTECTION_CLASS],
    helpTextKey: "FRAGE_SCHUTZART",
  },

  {
    id: QUESTION_KEY.OPERATING_PRESSURE,
    title: {
      "de-DE": "Kennen Sie den Betriebsdruck?",
      "en-GB": "Do you know the operating pressure?",
    },
    answerKeys: [QUESTION_KEY.OPERATING_PRESSURE],
    helpTextKey: "FRAGE_BETRIEBSDRUCK",
  },

  {
    id: QUESTION_KEY.CURRENT_AND_VOLTAGE,
    title: {
      "de-DE": "Welche Spannung benötigen Sie?",
      "en-GB": "Which voltage do you need?",
    },
    answerKeys: [QUESTION_KEY.VOLTAGE, QUESTION_KEY.CURRENT],
    unsetAnswerKeys: [QUESTION_KEY.PRESSURE_CONTROLLED_FUNCTION],
    helpTextKey: "FRAGE_SPANNUNG",
  },

  {
    id: QUESTION_KEY.PRESSURE_CONTROLLED_FUNCTION,
    title: {
      "de-DE": "Wie soll die Funktion sein?",
      "en-GB": "What about the function?",
    },
    answerKeys: [QUESTION_KEY.PRESSURE_CONTROLLED_FUNCTION],
    unsetAnswerKeys: [QUESTION_KEY.VOLTAGE, QUESTION_KEY.CURRENT],
    helpTextKey: "FRAGE_FUNKTION",
  },

  {
    id: QUESTION_KEY.VALVE_OPTION,
    title: {
      "de-DE": "Welche Ventiloptionen benötigen Sie?",
      "en-GB": "Which valve options do you need?",
    },
    map: ({ valveOptionCategory }) => ({
      valveOptionCategories: valveOptionCategory,
    }),
    answerKeys: [QUESTION_KEY.VALVE_OPTION],
    helpTextKey: "FRAGE_VENTILOPTIONEN",
  },
];
