import { readFile } from "fs/promises";
import { NewMedia } from "./types";

export default async function returnReadFile(
  fileName: string
): Promise<NewMedia[]> {
  try {
    const contents = await readFile(fileName, "utf-8");
    if (contents === "" || !contents) return [];
    return JSON.parse(contents);
  } catch (error) {
    throw new Error(error);
  }
}
