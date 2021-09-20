import _ from "lodash";

import { _l } from "./locale";
import { getDatabase } from "../aggregator/database";

export function getImageUrlByKey(key, locale, size) {
  const { downloads } = getDatabase();

  const download = _.find(downloads, (download) => download.name === key).attachments[0];

  if (download) {
    return getDownloadUrl(download.uuid, locale, size, _l(download.externalName, locale));
  }
  console.error("No download found for key", key);
  return "";
}

export function getImageUrl(uuid, locale, size, filename) {
  const parts = _.compact([uuid, locale, size, filename]);

  return `/attachments/${parts.join("/")}`;
}

export function getAttachmentUrl(data, size) {
  if (!data) {
    return null;
  }

  const uuid = _.get(data, "uuid");
  const fileName = _.get(data, ["externalName", "de-DE"]);
  const locale = "de";

  return getImageUrl(uuid, locale, size, fileName);
}

export function getDownloadUrlByKey(key, locale) {
  const { downloads } = getDatabase();

  const download = _.find(downloads, (download) => download.name === key).attachments[0];

  if (download) {
    return getDownloadUrl(download.uuid, locale, _l(download.externalName, locale));
  }
  console.error("No download found for key", key);
  return "";
}

export function getDownloadUrl(uuid, locale, filename) {
  return `/attachments/${uuid}/${locale}/${filename}`;
}
