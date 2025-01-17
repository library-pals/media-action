import { setOutput } from "@actions/core";
import { MediaParams, MediaStatus, DateTypes, NewMedia } from "./types";
import { providerAction } from "./index";

export function getMediaStatus({
  date,
  mediaStatus,
}: {
  date?: string;
  mediaStatus?: MediaStatus;
}): DateTypes {
  const dateValue = transformDate(date);
  switch (mediaStatus) {
    case "watching":
      return {
        dateStarted: dateValue,
      };
    case "watched":
      return {
        dateFinished: dateValue,
      };
    case "want to watch":
    default: {
      return {
        dateAdded: dateValue,
      };
    }
  }
}

function transformDate(date?: string): string {
  const dateValue = date ? new Date(date) : new Date();
  return dateValue.toISOString();
}

export function checkOutMedia(
  mediaParams: MediaParams,
  library: NewMedia[]
): boolean {
  const { identifier } = mediaParams;
  if (library === undefined || library.length === 0) return false;
  if (library.filter((media) => lookUp(media, identifier)).length === 0)
    return false;
  else return true;
}

export function lookUp(
  media: NewMedia,
  identifier: MediaParams["identifier"]
): boolean {
  return media.identifier === identifier;
}

export async function updateMedia(
  mediaParams: MediaParams,
  currentMedia: NewMedia[]
): Promise<NewMedia[]> {
  const { identifier, dateType, status, notes, rating, tags } = mediaParams;
  return currentMedia.reduce((arr: NewMedia[], media) => {
    const thisMedia = lookUp(media, identifier);
    if (thisMedia) {
      setOutput("media-title", media.title);
      media = {
        ...media,
        dateAdded: dateType?.dateAdded || media.dateAdded,
        dateStarted: dateType?.dateStarted || media.dateStarted,
        dateFinished: dateType?.dateFinished || media.dateFinished,
        status,
        ...(rating && { rating }),
        ...(notes && { notes: addNotes(notes, media.notes) }),
        ...(tags && { tags }),
      };
    }
    arr.push(media);
    return arr;
  }, []);
}

function addNotes(notes: string, mediaNotes?: string) {
  return `${mediaNotes ? `${mediaNotes}\n\n` : ""}${notes}`;
}

export async function handleNewMedia({
  mediaParams,
  library,
  mediaStatus,
}: {
  mediaParams: MediaParams;
  library: NewMedia[];
  mediaStatus: string;
}): Promise<void> {
  const provider = providerAction.find(({ check }) =>
    check(mediaParams.identifier)
  );
  if (!provider) {
    throw new Error("No provider found for this URL");
  }
  const newMedia = await provider.action.fetchMedia(mediaParams);

  if (!newMedia) {
    throw new Error(`Failed to fetch media for URL: ${mediaParams.identifier}`);
  }

  library.push(newMedia);
  setOutput("media-title", newMedia.title);

  if (mediaStatus === "started") {
    setOutput("now-watching", {
      title: newMedia.title,
      description: newMedia.description,
      format: newMedia.format,
      identifier: newMedia.identifier,
      thumbnail: newMedia.thumbnail,
      image: newMedia.image,
    });
  }

  if (newMedia.thumbnail) {
    setOutput(`media-thumbnail`, newMedia.image);
    setOutput(`media-thumbnail-url`, encode(newMedia.thumbnail));
  }
}

function encode(url: string): string {
  return encodeURI(url);
}

export function sortByDate(array: NewMedia[]): NewMedia[] {
  return array.sort((a, b) => {
    if (a.dateFinished && b.dateFinished) {
      return (
        new Date(a.dateFinished).valueOf() - new Date(b.dateFinished).valueOf()
      );
    } else return 0;
  });
}
