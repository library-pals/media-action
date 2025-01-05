import ogs from "open-graph-scraper";
import { OgObject } from "open-graph-scraper/types/lib/types";
import { TVSeries, Movie } from "schema-dts";
import { NewMedia, MediaParams } from "../types";
//import { writeFileSync } from "fs";

export async function getImdb(
  options: MediaParams
): Promise<NewMedia | undefined> {
  const { notes, inputIdentifier, dateType, status, rating, tags } = options;
  try {
    const ogsOptions = {
      url: inputIdentifier,
    };
    const { result } = await ogs(ogsOptions);

    //    writeFileSync("imdb.json", JSON.stringify(result, null, 2));

    const parsedResultMetadata = parseResult(result);

    return {
      identifier: inputIdentifier,
      ...dateType,
      status,
      ...(rating && { rating }),
      ...(notes && { notes }),
      ...(tags && { tags }),
      ...parsedResultMetadata,
    };
  } catch (error) {
    throw new Error(`Failed to get media from IMDB: ${error.result.error}`);
  }
}

/* istanbul ignore next @preserve */
function parseResult(result: OgObject): Partial<NewMedia> {
  if (!result.jsonLD) {
    return parseOgMetatagResult(result);
  }

  const schema = result.jsonLD[0] as TVSeries | Movie;
  const title = safeToString(schema.name);
  const format = schema["@type"].toLocaleLowerCase();
  const thumbnail = safeToString(schema.image);
  return {
    title,
    description: safeToString(schema.description),
    datePublished: safeToString(schema.datePublished),
    thumbnail,
    genres: parseCategories(schema.genre),
    format,
    contentRating: safeToString(schema.contentRating),
    image: setImage(title, thumbnail, format),
  };
}

function setImage(
  title: string = "",
  thumbnail: string = "",
  type: string = ""
): string {
  if (!thumbnail) return "";
  const thumbnailExtension = thumbnail.split(".").pop() || "";
  const formattedTitle = title.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-");
  const relativePath: string[] = [];

  if (type) relativePath.push(type);
  if (type && formattedTitle) relativePath.push("-");
  if (formattedTitle) relativePath.push(formattedTitle);
  if (thumbnailExtension) relativePath.push(`.${thumbnailExtension}`);

  return relativePath.join("");
}

export function parseOgMetatagResult(result: OgObject): {
  title?: string;
  description?: string;
  publishedDate?: string;
  thumbnail: string;
} {
  return {
    title: result.ogTitle,
    description: result.ogDescription,
    thumbnail: result?.ogImage?.[0]?.url ?? "",
  };
}

function safeToString(value): string | undefined {
  return value?.toString() ?? undefined;
}

function parseCategories(genre): string[] {
  if (!genre) return [];
  if (genre.includes("&amp;")) {
    return genre.split("&amp;").map((a) => a.trim());
  }
  return genre
    .toString()
    .split(",")
    .map((g) => g.trim())
    .filter((g) => g);
}
