import { read } from "../index";
import * as github from "@actions/github";
import * as core from "@actions/core";
import returnWriteFile from "../write-file";
import { promises } from "fs";

const mockReadFile = JSON.stringify([]);

jest.mock("@actions/core", () => {
  return {
    setFailed: jest.fn(),
    exportVariable: jest.fn(),
    getInput: jest.fn(),
    warning: jest.fn(),
    setOutput: jest.fn(),
    summary: {
      addRaw: () => ({
        write: jest.fn(),
      }),
    },
  };
});
jest.mock("../write-file");

const defaultOptions = {
  filename: "my-media.json",
  //"required-metadata": "title,pageCount,authors,description",
  //"time-zone": "America/New_York",
  //"set-image": "true",
};

describe("index", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.spyOn(promises, "readFile").mockResolvedValue(mockReadFile);
    jest
      .spyOn(core, "getInput")
      .mockImplementation((v) => defaultOptions[v] || undefined);
  });

  test("works, watched", async () => {
    const exportVariableSpy = jest.spyOn(core, "exportVariable");
    const setFailedSpy = jest.spyOn(core, "setFailed");
    const setOutputSpy = jest.spyOn(core, "setOutput");
    Object.defineProperty(github, "context", {
      value: {
        payload: {
          inputs: {
            identifier: "https://www.imdb.com/title/tt7908628/",
            "media-status": "watched",
            date: "2022-01-02",
          },
        },
      },
    });
    await read();
    expect(exportVariableSpy.mock.calls).toMatchInlineSnapshot(`[]`);
    expect(setFailedSpy).not.toHaveBeenCalled();
    expect(setOutputSpy.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "media-status",
        "watched",
      ]
    `);
    expect(returnWriteFile.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "my-media.json",
        [
          {
            "contentRating": "TV-MA",
            "dateFinished": "2022-01-02T00:00:00.000Z",
            "datePublished": "2019-03-27",
            "description": "A look into the nightly lives of four vampires who have lived together on Staten Island for over a century.",
            "format": "tvseries",
            "genres": [
              "Comedy",
              "Fantasy",
              "Horror",
            ],
            "identifier": "https://www.imdb.com/title/tt7908628/",
            "image": "tvseries-what-we-do-in-the-shadows.jpg",
            "status": "watched",
            "thumbnail": "https://m.media-amazon.com/images/M/MV5BNDhiYTVlYjUtMDc4OC00NzBmLWE5YTYtNDBjZDc4MzM3YzNmXkEyXkFqcGc@._V1_.jpg",
            "title": "What We Do in the Shadows",
          },
        ],
      ]
    `);
  });
});
