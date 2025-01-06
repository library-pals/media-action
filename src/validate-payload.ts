import { MediaPayload, MediaStatus } from "./types";

const validPrefixes = [
  "https://www.imdb.com/",
  "https://www.rottentomatoes.com/",
];

export function validatePayload(payload: MediaPayload): {
  success: boolean;
  message: string;
} {
  if (!payload) {
    return { success: false, message: "Missing payload" };
  }

  if (payload["media-status"] === "summary") {
    return { success: true, message: "Valid payload" };
  }

  if (!payload["identifier"]) {
    return { success: false, message: "Missing `identifier` in payload" };
  }

  const { identifier } = payload;

  if (!validPrefixes.some((prefix) => identifier.startsWith(prefix))) {
    return {
      success: false,
      message: `Invalid \`identifier\` in payload: ${identifier}. Must start with one of the following: ${validPrefixes.join(", ")}`,
    };
  }

  if (payload["date"] && !isDate(payload["date"])) {
    return {
      success: false,
      message: `Invalid \`date\` in payload: ${payload["date"]}. Date must be in YYYY-MM-DD format.`,
    };
  }

  if (!payload["media-status"] || !isMediaStatus(payload["media-status"])) {
    return {
      success: false,
      message: `Invalid \`media-status\` in payload: "${payload["media-status"]}". Choose from: "want to watch", "watching", "watched".`,
    };
  }

  return { success: true, message: "Valid payload" };
}

function isMediaStatus(status: string): status is MediaStatus {
  return ["want to watch", "watching", "watched"].includes(status);
}

/** make sure date is in YYYY-MM-DD format */
export function dateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/** make sure date value is a valid date */
export function isDate(date: string): boolean {
  return !isNaN(Date.parse(date)) && dateFormat(date);
}
