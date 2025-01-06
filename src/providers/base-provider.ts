import ogs from "open-graph-scraper";
import { NewMedia, MediaParams } from "../types";
import { OgObject } from "open-graph-scraper/types/lib/types";
import { TVSeries, Movie, TVSeason, TVEpisode } from "schema-dts";
import { warning } from "@actions/core";
// import { writeFileSync } from "fs";

export class BaseProvider {
  protected parsedOgMetadata: Partial<NewMedia> = {};
  protected parsedJsonLDMetadata: Partial<NewMedia> = {};

  get title(): string | undefined {
    return this.parsedJsonLDMetadata.title || this.parsedOgMetadata.title;
  }

  get description(): string | undefined {
    return (
      this.parsedJsonLDMetadata.description || this.parsedOgMetadata.description
    );
  }

  get thumbnail(): string | undefined {
    return (
      this.parsedJsonLDMetadata.thumbnail || this.parsedOgMetadata.thumbnail
    );
  }

  get genres(): string[] | undefined {
    return this.parsedJsonLDMetadata.genres;
  }

  get format(): string | undefined {
    return this.parsedJsonLDMetadata.format || this.parsedOgMetadata.format;
  }

  get contentRating(): string | undefined {
    return this.parsedJsonLDMetadata.contentRating;
  }

  async fetchMedia(options: MediaParams): Promise<NewMedia | undefined> {
    const { notes, inputIdentifier, dateType, status, rating, tags } = options;
    try {
      const ogsOptions = { url: inputIdentifier };
      const { result } = await ogs(ogsOptions);

      this.parsedOgMetadata = this.parseOg(result);
      this.parsedJsonLDMetadata = this.parseJsonLd(result);

      // writeFileSync(`${this.title}.json`, JSON.stringify(result, null, 2));

      const image = this.setImage(this.title, this.thumbnail, this.format);

      return {
        identifier: inputIdentifier,
        status,
        ...dateType,
        // From the provider
        ...(this.title && { title: this.title }),
        ...(this.description && { description: this.description }),
        ...(this.thumbnail && { thumbnail: this.thumbnail }),
        ...(this.genres && { genres: this.genres }),
        ...(this.format && { format: this.format }),
        ...(this.contentRating && { contentRating: this.contentRating }),
        // From the viewer's input
        ...(notes && { notes }),
        ...(rating && { rating }),
        ...(tags && { tags }),
        ...(image && { image }),
      };
    } catch (error) {
      throw new Error(`Failed to get media: ${error.message}`);
    }
  }

  protected setImage(
    title: string = "",
    thumbnail: string = "",
    type: string = ""
  ): string | undefined {
    if (!thumbnail) return "";

    try {
      const url = new URL(thumbnail);
      const pathname = url.pathname;
      let thumbnailExtension = pathname.includes(".")
        ? pathname.split(".").pop()?.toLowerCase()
        : "";

      const imageExtensions = new Set(["jpg", "jpeg", "png", "gif"]);
      if (!thumbnailExtension || !imageExtensions.has(thumbnailExtension)) {
        thumbnailExtension = "jpg"; // Default to JPG if no valid extension is found
      }

      const formattedTitle = title
        .toLowerCase()
        .replace(/,/g, "")
        .replace(/:/g, "")
        .replace(/[^a-zA-Z0-9]/g, "-");
      const relativePath = [type, formattedTitle].filter(Boolean).join("-");

      return `${relativePath}.${thumbnailExtension}`;
    } catch (error) {
      warning("Invalid URL:", error);
      return;
    }
  }

  protected parseOg(result: OgObject): {
    title?: string;
    description?: string;
    thumbnail?: string;
    format?: string;
  } {
    return {
      title: result.ogTitle,
      description: result.ogDescription,
      thumbnail: result?.ogImage?.[0]?.url,
      format: result.ogType,
    };
  }

  protected safeToString(value: unknown): string | undefined {
    return value?.toString() ?? undefined;
  }

  protected parseGenres(genre: unknown): string[] {
    if (!genre) return [];
    if (Array.isArray(genre)) {
      return genre.map((g) => g.toString());
    }
    return [];
  }

  protected parseJsonLd(result: OgObject): Partial<NewMedia> {
    if (!result.jsonLD) {
      return {};
    }

    const schema = result.jsonLD[0] as TVSeries | TVSeason | Movie;
    if (!schema) {
      return {};
    }

    const title = this.getModifiedTitle(schema);

    return {
      title,
      description: this.safeToString(schema.description),
      thumbnail: this.safeToString(schema.image),
      genres: this.parseGenres(schema.genre),
      format: schema["@type"].toLocaleLowerCase(),
      contentRating: this.safeToString(schema.contentRating),
    };
  }

  protected getModifiedTitle(
    schema: TVSeries | TVSeason | TVEpisode | Movie
  ): string | undefined {
    const mediaTitle = this.safeToString(schema.name);

    const seasonName = this.safeToString(
      schema["@type"] === "TVEpisode" &&
        schema.partOfSeason &&
        typeof schema.partOfSeason === "object"
        ? (schema.partOfSeason as { name?: unknown }).name
        : undefined
    );

    const seriesName = this.safeToString(
      (schema["@type"] === "TVEpisode" || schema["@type"] === "TVSeason") &&
        schema.partOfSeries &&
        typeof schema.partOfSeries === "object"
        ? (schema.partOfSeries as { name?: unknown }).name
        : undefined
    );

    return [seriesName, seasonName, mediaTitle].filter(Boolean).join(", ");
  }
}
