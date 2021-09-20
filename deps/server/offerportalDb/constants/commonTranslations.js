const locale = require("../../helpers/locale");

const _t = locale._translation;
const mapLocale = locale.mapLocale;

const LANGUAGES = {
  de: { displayValue: "DE", value: "de" },
  en: { displayValue: "EN", value: "en" },
};

const multiLangObject = (deTranslation, enTranslation) => ({
  "de-DE": deTranslation,
  "en-GB": enTranslation,
});

const SALUTATIONS = {
  [LANGUAGES.de.value]: {
    MALE: ["Herr"],
    FEMALE: ["Frau"],
  },
  [LANGUAGES.en.value]: {
    MALE: ["Mr.", "Mr"],
    FEMALE: ["Ms.", "Ms", "Mrs.", "Mrs"],
  },
};

const TRANSLATIONS = {
  DEAR: multiLangObject("Sehr geehrte", "Dear"),
  MR: multiLangObject("Herr", "Mr"),
  MS: multiLangObject("Frau", "Ms"),
  OFFER: multiLangObject("Angebot", "Offer"),
  WELCOME_TEXT: multiLangObject("Begrüßungstext wählen", "Select greeting text"),
  PERSONAL_CONTACT: multiLangObject("Ihr Persönlicher Ansprechpartner", "Personal contact"),
  SELECT_CONTACT: multiLangObject("Ansprechpartner wählen", "Select contact"),
  KEY_DATA: multiLangObject("Angebot Eckdaten", "Offer key data"),
  OFFER_NUMBER: multiLangObject("Angebotsnummer", "Offer number"),
  REQUEST_NUMBER: multiLangObject("Anfragenummer", "Request number"),
  OFFER_DATE: multiLangObject("Angebotsdatum", "Offer date"),
  CUSTOMER_NUMBER: multiLangObject("Kundennummer", "Customer number"),
  REQUEST: multiLangObject("Anfrage", "Request"),
  CONTACT_PERSON: multiLangObject("Ansprechpartner", "Contact person"),
  CUSTOMER_PROCESS: multiLangObject("Kundenvorgang", "Customer process"),
  DEFAULT_SALUTATION: multiLangObject("Damen und Herren", "Ladies and gentlemen"),
  PRODUCT_SELECTION: multiLangObject("Ihre individuelle Produktauswahl", "Your individual product selection"),
  DELIVERY_PAYMENT: multiLangObject("Lieferzeiten & Zahlungsbedingungen", "Delivery periods & terms of payment"),
  DELIVERY_TIME: multiLangObject("Lieferzeit", "Delivery period"),
  TERMS_OF_DELIVERY: multiLangObject("Lieferbedingungen", "Terms of delivery"),
  TERMS_OF_PAYMENT: multiLangObject("Zahlungsbedingungen", "Terms of payment"),
  BILLING_ADDRESS: multiLangObject("Rechnungsadresse", "Billing address"),
  CLOSING_TEXT: multiLangObject("Vielen dank für ihr Vertrauen", "Thanks a lot"),
  VAT: multiLangObject("Umsatzsteuer", "Vat"),
  CLOSING_SELECTION: multiLangObject("Schlusstext wählen", "Select closing"),
  SUMMARY: multiLangObject("Zusammenfassung", "Summary"),
  SUB_TOTAL: multiLangObject("Zwischensumme", "Sub total"),
  TOTAL_DISCOUNTS: multiLangObject("Rabatte gesamt", "Total discounts"),
  TOTAL_NET: multiLangObject("Netto gesamt", "Total net"),
  VAT_SHORT: multiLangObject("USt.", "Vat"),
  TOTAL: multiLangObject("Gesamt", "Total"),
  ORDER: multiLangObject("Bestellen", "Order"),
  PRINT_PDF: multiLangObject("PDF drucken", "Print PDF"),
  CALL_BACK_SERVICE: multiLangObject("Rückrufservice", "Callback service"),
  FOOT_NOTE: multiLangObject(
    "Dieses Angebot wurde maschinell erstellt und ist ohne Unterschrift gültig.",
    "This offer was created automatically and is valid without signature.",
  ),
  UNIT_PRICE: multiLangObject("Einzelpreis", "Unit price"),
  DISCOUNT: multiLangObject("Rabatt", "Discount"),
  NET_PRICE: multiLangObject("Nettopreis", "Net price"),
  QUANTITY: multiLangObject("Menge", "Quantity"),
  AMOUNT: multiLangObject("Betrag", "Amount"),
  PIECE_SHORT: multiLangObject("Stk", "pc"),
  DATA_SHEET: multiLangObject("Details & Datenblatt", "Datasheet"),
  VALVE: multiLangObject("Ventil", "Valve"),
  BANK_DETAILS: multiLangObject("Unsere Bankverbindungen", "Our bank details"),
  NO_OFFER_POSITIONS_FOUND: multiLangObject(
    "Es wurden leider kein Angebot oder Angebotspositionen gefunden.",
    "Unfortunately no offer or offer positions were found.",
  ),
  INVOICE_NOTE: multiLangObject(
    "(Rechnungs- und Lieferadresse werden im Auftragsfall aus Ihrer Bestellung übernommen.)",
    "(In case of a purchase, the billing and delivery address will be taken from your order.)",
  ),
  PRODUCT: multiLangObject("Artikel", "Product"),
  BASE_PRICE: multiLangObject("Basispreis", "Base price"),
  EXTRA_CHARGE: multiLangObject("Aufschlag", "Extra charge"),
  SUM: multiLangObject("Summe", "Sum"),
  ENTER_ARTICLE_NUMBER: multiLangObject("Artikelnummer eingeben", "Enter article number"),
  ADD_ANOTHER_PRODUCT: multiLangObject("weiteres Produkt hinzufügen", "add another product"),
  SALES: multiLangObject("Vertrieb", "Sales"),
  PERSONAL_CONSULTATION: multiLangObject(
    "Sie wünschen eine persönliche Beratung?",
    "Would you like a personal consultation?",
  ),
  FILL_OUT: multiLangObject(
    "Füllen Sie folgendes Formular aus und wir rufen Sie umgehend zurück.",
    "Fill out the following form and we will call you back as soon as possible.",
  ),
  FIRST_SUR_NAME: multiLangObject("Vor- und Nachname", "First name and surname"),
  FIRM: multiLangObject("Firma", "Firm"),
  PHONE: multiLangObject("Telefon", "Phone"),
  NOTE: multiLangObject("Anmerkung", "Note"),
  MANDATORY_FIELD: multiLangObject("Pflichtfeld", "Mandatory field"),
  SUBMIT: multiLangObject("Abschicken", "Submit"),
  THANKS_FOR_REQUEST: multiLangObject("Vielen Dank für Ihre Anfrage.", "Thank you very much for your inquiry."),
  PROCESS_SOON: multiLangObject(
    "Wir werden diese schnellmöglichst bearbeiten.",
    "We will process them as soon as possible.",
  ),
  CLOSE: multiLangObject("Schließen", "Close"),
  REQUEST_ERROR: multiLangObject(
    "Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es später nochmal.",
    "Request could not be sent. Please try again later.",
  ),
  REQUEST_SENDING: multiLangObject("Anfrage wird gesendet.", "Request will be sent."),
  GREETING_MESSAGE: multiLangObject("Begrüssungstext", "Greeting text"),
  FINAL_TEXT: multiLangObject("Schlusstext", "Closing text"),
  OFFER_POSITION_INFO_KV_VALUE: multiLangObject("Kv-Wert", "Kv-value"),
  CUSTOMS_TARIFF_NUMBER: multiLangObject("Zolltarifnummer", "Customs tariff number"),
  COUNTRY_OF_ORIGIN: multiLangObject("Ursprungsland", "Country of origin"),
};

const t = (lang) => (translation) => {
  if (!translation) {
    return null;
  }

  return _t(translation, mapLocale(lang, translation));
};

const getLanguage = (lang) => {
  if (!lang) {
    return LANGUAGES.de.value;
  }

  return lang;
};

module.exports = {
  SALUTATIONS,
  TRANSLATIONS,
  LANGUAGES,
  getLanguage,
  t,
};
