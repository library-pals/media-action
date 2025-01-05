import { BaseProvider } from "./base-provider";
import { MediaParams, NewMedia } from "../types";

export class ImdbProvider extends BaseProvider {
  async getImdb(options: MediaParams): Promise<NewMedia | undefined> {
    return this.fetchMedia(options);
  }
}
