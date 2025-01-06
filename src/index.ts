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
    const {
      identifier: inputIdentifier,
      date,
      "media-status": mediaStatus,
      notes,
      rating,
      tags,
    } = payload;
    // Set inputs
    const filename: ActionInputs["filename"] = getInput("filename");

    const dateType = getMediaStatus({
      date,
      mediaStatus,
    });
    setOutput("media-status", mediaStatus);

    let library = await returnReadFile(filename);

    const mediaParams: MediaParams = {
      filename,
      inputIdentifier,
      dateType,
      notes,
      status: mediaStatus,
      rating,
      ...(tags && { tags: toArray(tags) }),
    };

    if (mediaStatus !== "summary") {
      const mediaExists = checkOutMedia(mediaParams, library);

      if (mediaExists) {
        library = await updateMedia(mediaParams, library);
      } else {
        await handleNewMedia({ mediaParams, library, mediaStatus });
      }

      library = sortByDate(library);

      await returnWriteFile(filename, library);
    }

    /*await summary
      .addRaw(summaryMarkdown(library, dateType, mediaStatus))
      .write();*/
  } catch (error) {
    setFailed(error);
  }
}

function toArray(tags: string) {
  return tags.split(",").map((tag) => tag.trim());
}

export default read();
