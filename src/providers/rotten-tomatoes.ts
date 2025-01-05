import { BaseProvider } from "./base-provider";
import { MediaParams, NewMedia } from "../types";

export class RottenTomatoesProvider extends BaseProvider {
  async getRottenTomatoes(options: MediaParams): Promise<NewMedia | undefined> {
    return this.fetchMedia(options);
  }

  get description(): string | undefined {
    return (
      // The description in the OG metadata is more descriptive than the JSON-LD
      this.parsedOgMetadata.description || this.parsedJsonLDMetadata.description
    );
  }
}
