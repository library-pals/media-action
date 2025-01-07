import { getInput, setFailed, setOutput } from "@actions/core";
import * as github from "@actions/github";
import returnReadFile from "./read-file";
import returnWriteFile from "./write-file";
import { MediaPayload, MediaParams, ActionInputs } from "./types";
import {
  getMediaStatus,
  checkOutMedia,
  updateMedia,
  handleNewMedia,
  sortByDate,
} from "./media-utils";

import { ImdbProvider } from "./providers/imdb";
import { RottenTomatoesProvider } from "./providers/rotten-tomatoes";
import { validatePayload } from "./validate-payload";

export const providerAction = [
  {
    check: (url: string) => url.startsWith("https://www.imdb.com/"),
    action: new ImdbProvider(),
  },
  {
    check: (url: string) => url.startsWith("https://www.rottentomatoes.com/"),
    action: new RottenTomatoesProvider(),
  },
];

export async function read() {
  try {
    const payload = github.context.payload.inputs as MediaPayload;
    // Validate payload
    const { success, message } = validatePayload(payload);
    if (!success) {
      setFailed(message);
      return;
    }

    const mediaParams = extractMediaParams(payload);
    const filename: ActionInputs["filename"] = getInput("filename");
    setOutput("media-status", mediaParams.status);

    let library = await returnReadFile(filename);

    if (mediaParams.status !== "summary") {
      library = await processMedia(mediaParams, library);
      library = sortByDate(library);
      await returnWriteFile(filename, library);
    }

    // await summary.addRaw(summaryMarkdown(library, dateType, mediaStatus)).write();
  } catch (error) {
    setFailed(error.message);
  }
}

function extractMediaParams(payload: MediaPayload): MediaParams {
  const {
    identifier,
    date,
    "media-status": status,
    notes,
    rating,
    tags,
  } = payload;
  return {
    identifier,
    dateType: getMediaStatus({ date, mediaStatus: status }),
    notes,
    status,
    rating,
    ...(tags && { tags: toArray(tags) }),
  };
}

async function processMedia(mediaParams: MediaParams, library) {
  const mediaExists = checkOutMedia(mediaParams, library);
  if (mediaExists) {
    return await updateMedia(mediaParams, library);
  } else {
    await handleNewMedia({
      mediaParams,
      library,
      mediaStatus: mediaParams.status,
    });
    return library;
  }
}

function toArray(tags: string) {
  return tags.split(",").map((tag) => tag.trim());
}

export default read();
