import _ from "lodash";

export default function (key, label) {
  if (typeof dataLayer !== "undefined" && dataLayer && _.isArray(dataLayer)) {
    const _key = key === "answer" ? "answer" : `scout-${key}`;

    const event = {
      event: _key,
      eventCategory: "ventil scout",
      eventAction: "reply",
      eventLabel: label,
    };

    dataLayer.push(event);

    return event;
  }
  return null;
}
