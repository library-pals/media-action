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

  const testCases = [
    {
      description: "imdb, movie",
      identifier: "https://www.imdb.com/title/tt10954718/",
      mediaStatus: "watched",
      date: "2022-01-02",
    },
    {
      description: "imdb, tv",
      identifier: "https://www.imdb.com/title/tt7908628/",
      mediaStatus: "watched",
      date: "2022-01-02",
    },
    {
      description: "rotten tomatoes, tv",
      identifier: "https://www.rottentomatoes.com/tv/what_we_do_in_the_shadows",
      mediaStatus: "watched",
      date: "2025-01-05",
    },
    {
      description: "rotten tomatoes, movie",
      identifier: "https://www.rottentomatoes.com/m/dog_man",
      mediaStatus: "want to watch",
      date: "2025-01-05",
    },
  ];

  test.each(testCases)(
    "$description",
    async ({ identifier, mediaStatus, date }) => {
      const setFailedSpy = jest.spyOn(core, "setFailed");
      const setOutputSpy = jest.spyOn(core, "setOutput");
      Object.defineProperty(github, "context", {
        value: {
          payload: {
            inputs: {
              identifier,
              "media-status": mediaStatus,
              date,
            },
          },
        },
      });
      await read();
      expect(setFailedSpy).not.toHaveBeenCalled();
      expect(setOutputSpy.mock.calls[0]).toMatchSnapshot();
      expect(returnWriteFile.mock.calls[0]).toMatchSnapshot();
    }
  );
});
