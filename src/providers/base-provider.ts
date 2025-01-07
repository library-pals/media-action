import ogs from "open-graph-scraper";
import { NewMedia, MediaParams } from "../types";
import { OgObject } from "open-graph-scraper/types/lib/types";
import { TVSeries, Movie, TVSeason, TVEpisode } from "schema-dts";
import { warning } from "@actions/core";

type MediaTypes = TVSeries | TVSeason | TVEpisode | Movie;

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
    try {
      const ogsOptions = { url: options.identifier };
      const { result } = await ogs(ogsOptions);

      this.parsedOgMetadata = this.parseOg(result);
      this.parsedJsonLDMetadata = this.parseJsonLd(result);

      return this.buildMediaObject(options);
    } catch (error) {
      throw new Error(`Failed to get media: ${error.message}`);
    }
  }

  protected setImage(): string | undefined {
    if (!this.thumbnail) return "";

    try {
      const url = new URL(this.thumbnail);
      const thumbnailExtension = this.getThumbnailExtension(url.pathname);
      const relativePath = this.buildRelativePath();

      return `${relativePath}.${thumbnailExtension}`;
    } catch (error) {
      warning(`Invalid URL: ${error.message}`);
      return undefined;
    }
  }

  protected buildRelativePath(): string {
    return [this.format, this.slugify(this.title)].filter(Boolean).join("-");
  }

  protected getThumbnailExtension(pathname: string): string {
    const extension = pathname.includes(".")
      ? pathname.split(".").pop()?.toLowerCase()
      : "";
    const imageExtensions = new Set(["jpg", "jpeg", "png", "gif"]);
    return extension && imageExtensions.has(extension) ? extension : "jpg";
  }

  protected slugify(string?: string): string {
    if (!string) return "";
    return string
      .toLowerCase()
      .replace(/[,:]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "-");
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

    const schema = result.jsonLD[0] as MediaTypes;
    if (!schema) {
      return {};
    }

    return {
      title: this.getModifiedTitle(schema),
      description: this.safeToString(schema.description),
      thumbnail: this.safeToString(schema.image),
      genres: this.parseGenres(schema.genre),
      format: schema["@type"].toLocaleLowerCase(),
      contentRating: this.safeToString(schema.contentRating),
    };
  }

  protected getModifiedTitle(schema: MediaTypes): string | undefined {
    const mediaTitle = this.safeToString(schema.name);
    const seasonName = this.getSeasonName(schema);
    const seriesName = this.getSeriesName(schema);

    return [seriesName, seasonName, mediaTitle].filter(Boolean).join(", ");
  }

  protected getSeasonName(schema: MediaTypes): string | undefined {
    if (
      schema["@type"] === "TVEpisode" &&
      schema.partOfSeason &&
      typeof schema.partOfSeason === "object"
    ) {
      return this.safeToString(
        (schema.partOfSeason as { name?: unknown }).name
      );
    }
    return undefined;
  }

  protected getSeriesName(schema: MediaTypes): string | undefined {
    if (
      (schema["@type"] === "TVEpisode" || schema["@type"] === "TVSeason") &&
      schema.partOfSeries &&
      typeof schema.partOfSeries === "object"
    ) {
      return this.safeToString(
        (schema.partOfSeries as { name?: unknown }).name
      );
    }
    return undefined;
  }

  protected buildMediaObject({
    notes,
    identifier,
    dateType,
    status,
    rating,
    tags,
  }: MediaParams): NewMedia {
    const image = this.setImage();
    return {
      identifier,
      ...dateType,
      status,
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
  }
}
