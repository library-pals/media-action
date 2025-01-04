import { writeFile } from "fs/promises";
import { NewMedia } from "./types";

export default async function returnWriteFile(
  fileName: string,
  mediaMetadata: NewMedia[]
) {
  try {
    const promise = writeFile(fileName, JSON.stringify(mediaMetadata, null, 2));
    await promise;
  } catch (error) {
    throw new Error(error);
  }
}
