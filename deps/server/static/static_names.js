// Machine readable names
const productAttrLabels = {};
productAttrLabels.pId = "id";
productAttrLabels.pSeries = "series"; // Baureihe 1
productAttrLabels.pKind = "kind"; // Steuerungsart 2
productAttrLabels.pConnections = "connections"; // Anschlüsse 3 & syn
productAttrLabels.pMaterials = "materials"; // Gehäusewerkstoffe (syn)
productAttrLabels.pTags = "tags"; // Kategorie 5
productAttrLabels.pKeywords = "keywords"; // Keywords 6
productAttrLabels.pImages = "images"; // Bilder 7
productAttrLabels.pPressureMin = "pressuremin"; // Druck (min) 8
productAttrLabels.pPressureMax = "pressuremax"; // Druck (max) 9
productAttrLabels.pTemperatureMin = "temperaturemin"; // Temperatur (min) 10
productAttrLabels.pTemperatureMax = "temperaturemax"; // Temperatur (max) 11
productAttrLabels.pDescription = "description"; // Beschreibung 13
productAttrLabels.pMedia = "media"; // Medien (syn)
productAttrLabels.pSealing = "sealing"; // Dichtung (syn)
productAttrLabels.pOptional = "optional"; // Optional 16
productAttrLabels.pDatasheets = "datasheets"; // Datenblätter 17
productAttrLabels.pInstructions = "instructions"; // Bedienungsanleitung 18
productAttrLabels.pCertificates = "certificates"; // Zertifikate 19
productAttrLabels.pFunction = "function"; // Function 20
productAttrLabels.pModelKey = "modelKey"; // Baureihenschlüssel 21
productAttrLabels.pPressureRangesSolenoidValves = "pressureRangesSolenoidValves"; // Druckbereiche Magnetventile 22
productAttrLabels.pPressureRangesPressureControlledValves = "pressureRangesPressureControlledValves"; // Druckbereiche druckgesteuerte Ventile 23
productAttrLabels.pCompatibleMedia = "compatibleMedia"; // Kompatible Medien 24
productAttrLabels.pDifferingValveOptionStandard = "differingValveOptionStandard"; // Abweichender Standard (Ventiloption) 25
productAttrLabels.pModelVersions = "modelVersions"; // Ausführungen 27
productAttrLabels.pVideo = "video"; // Video 31
productAttrLabels.pVariants = "variants"; // Varianten (syn)
productAttrLabels.pVariantsSeriesList = "variantsSeriesList"; // values to display in frontend
productAttrLabels.pVariantsFilterIds = "variantsFilterIds"; // variants filter ids to
productAttrLabels.pMaxPressure = "maxPressure";
productAttrLabels.pCustomsTariffNumber = "customsTariffNumber";
productAttrLabels.pCountry = "country";
productAttrLabels.pECCN = "eccn";
productAttrLabels.pAL = "al";
productAttrLabels.pStpFilesSolenoidValves = "stpFilesSolenoidValves";
productAttrLabels.pStpFilesPressureControlledValves = "stpFilesPressureControlledValves";

// Json column ids and indizes

const modelColumnsInfo = [
  { name: productAttrLabels.pSeries, id: 1 },
  { name: productAttrLabels.pModelKey, id: 21 },
  { name: productAttrLabels.pKind, id: 2 },
  { name: productAttrLabels.pConnections, id: 3 },
  { name: productAttrLabels.pTags, id: 5 },
  { name: productAttrLabels.pKeywords, id: 6 },
  { name: productAttrLabels.pImages, id: 7 },
  { name: productAttrLabels.pPressureMin, id: 8 },
  { name: productAttrLabels.pPressureMax, id: 9 },
  { name: productAttrLabels.pTemperatureMin, id: 10 },
  { name: productAttrLabels.pTemperatureMax, id: 11 },
  { name: productAttrLabels.pDescription, id: 13 },
  { name: productAttrLabels.pOptional, id: 16 },
  { name: productAttrLabels.pDatasheets, id: 17 },
  { name: productAttrLabels.pInstructions, id: 18 },
  { name: productAttrLabels.pCertificates, id: 19 },
  { name: productAttrLabels.pFunction, id: 20 },
  { name: productAttrLabels.pPressureRangesSolenoidValves, id: 22 },
  { name: productAttrLabels.pPressureRangesPressureControlledValves, id: 23 },
  { name: productAttrLabels.pCompatibleMedia, id: 24 },
  { name: productAttrLabels.pDifferingValveOptionStandard, id: 28 },
  { name: productAttrLabels.pModelVersions, id: 30 },
  { name: productAttrLabels.pVideo, id: 31 },
  { name: productAttrLabels.pCustomsTariffNumber, id: 32 },
  { name: productAttrLabels.pCountry, id: 33 },
  { name: productAttrLabels.pECCN, id: 34 },
  { name: productAttrLabels.pAL, id: 35 },
];

// Used in aggregator, which filter should be dynamically
const enabledFilters = [
  productAttrLabels.pKind,
  productAttrLabels.pMaterials,
  productAttrLabels.pTags,
  productAttrLabels.pKeywords,
  productAttrLabels.pFunction,
];

// Query parameter names
const queryNamesObj = {};
queryNamesObj.pSeries = "s";
queryNamesObj.pKind = "k";
queryNamesObj.pPressureMin = "p";
queryNamesObj.pPressureMax = "pm";
queryNamesObj.pTemperatureMin = "temp";
queryNamesObj.pTemperatureMax = "tempm";
queryNamesObj.pConnections = "c";
queryNamesObj.pMaterials = "m";
queryNamesObj.pTags = "t";
queryNamesObj.pSearch = "search";
queryNamesObj.pFunction = "f";
queryNamesObj.sealing = "sealing";
queryNamesObj.connection = "connection";
queryNamesObj.material = "material";
queryNamesObj.valveOption = "valveOption";
queryNamesObj.electricalConnectionType = "electricalConnectionType";
queryNamesObj.protectionClass = "protectionClass";

function queryNames() {
  return queryNamesObj;
}

function productAttributeNames() {
  return productAttrLabels;
}

function getEnabledFilters() {
  return enabledFilters;
}

module.exports = {
  productAttributeNames,
  modelColumnsInfo,
  queryNames,
  enabledFilters: getEnabledFilters,
};
