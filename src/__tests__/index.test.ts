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

  test("works, imdb, movie", async () => {
    const setFailedSpy = jest.spyOn(core, "setFailed");
    const setOutputSpy = jest.spyOn(core, "setOutput");
    Object.defineProperty(github, "context", {
      value: {
        payload: {
          inputs: {
            identifier: "https://www.imdb.com/title/tt10954718/",
            "media-status": "watched",
            date: "2022-01-02",
          },
        },
      },
    });
    await read();
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
            "contentRating": "PG",
            "dateFinished": "2022-01-02T00:00:00.000Z",
            "description": "Dog Man, half dog and half man, he is sworn to protect and serve as he doggedly pursues the feline supervillain Petey the Cat.",
            "format": "movie",
            "genres": [
              "Animation",
              "Action",
              "Adventure",
            ],
            "identifier": "https://www.imdb.com/title/tt10954718/",
            "image": "movie-dog-man.jpg",
            "status": "watched",
            "thumbnail": "https://m.media-amazon.com/images/M/MV5BZTBiOTViYzktMTM5Mi00ZTdmLWE0ZjQtNDk3NTc3NmM5Y2I3XkEyXkFqcGc@._V1_.jpg",
            "title": "Dog Man",
          },
        ],
      ]
    `);
  });

  test("works, imdb, tv", async () => {
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

  test("works, rotten tomatoes, tv", async () => {
    const exportVariableSpy = jest.spyOn(core, "exportVariable");
    const setFailedSpy = jest.spyOn(core, "setFailed");
    const setOutputSpy = jest.spyOn(core, "setOutput");
    Object.defineProperty(github, "context", {
      value: {
        payload: {
          inputs: {
            identifier: "https://www.rottentomatoes.com/tv/fleabag",
            "media-status": "watched",
            date: "2025-01-05",
            rating: "⭐️⭐️⭐️⭐️⭐️",
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
            "dateFinished": "2025-01-05T00:00:00.000Z",
            "description": "A dry-witted woman, known only as Fleabag, has no filter as she navigates life and love in London while trying to cope with tragedy. The angry, grief-riddled woman tries to heal while rejecting anyone who tries to help her, but Fleabag continues to keep up her bravado through it all. Comic actress Phoebe Waller-Bridge stars as the titular character on the series, which is based on Waller-Bridge's 2013 one-woman show of the same name.",
            "format": "tvseries",
            "genres": [
              "Comedy",
              "Drama",
            ],
            "identifier": "https://www.rottentomatoes.com/tv/fleabag",
            "image": "tvseries-fleabag.jpg",
            "rating": "⭐️⭐️⭐️⭐️⭐️",
            "status": "watched",
            "thumbnail": "https://resizing.flixster.com/-XZAfHZM39UwaGJIFWKAE8fS0ak=/v3/t/assets/p13139614_b_v13_ad.jpg",
            "title": "Fleabag",
          },
        ],
      ]
    `);
  });

  test("works, rotten tomatoes, movie", async () => {
    const exportVariableSpy = jest.spyOn(core, "exportVariable");
    const setFailedSpy = jest.spyOn(core, "setFailed");
    const setOutputSpy = jest.spyOn(core, "setOutput");
    Object.defineProperty(github, "context", {
      value: {
        payload: {
          inputs: {
            identifier: "https://www.rottentomatoes.com/m/dog_man",
            "media-status": "want to watch",
            date: "2025-01-05",
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
        "want to watch",
      ]
    `);
    expect(returnWriteFile.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "my-media.json",
        [
          {
            "contentRating": "PG",
            "dateAdded": "2025-01-05T00:00:00.000Z",
            "description": "When a faithful police dog and his human police officer owner are injured together on the job, a harebrained but life-saving surgery fuses the two of them together and Dog Man is born. Dog Man is sworn to protect and serve--and fetch, sit and roll over. As Dog Man embraces his new identity and strives to impress his Chief (Lil Rel Howery, Get Out, Free Guy), he must stop the pretty evil plots of feline supervillain Petey the Cat (Pete Davidson; Saturday Night Live, The King of Staten Island). Petey's latest plan is to clone himself, creating the kitten Lil Petey, to double his ability to do crime stuff. Things get complicated, though, when Lil Petey forges an unexpected bond with Dog Man. When Lil Petey falls into the clutches of a common enemy, Dog Man and Petey reluctantly join forces in an action-packed race against time to rescue the young kitten. In the process, they discover the power of family (and kittens!) to bring even the most hostile foes together.",
            "format": "movie",
            "genres": [
              "Kids & Family",
              "Comedy",
              "Adventure",
              "Animation",
            ],
            "identifier": "https://www.rottentomatoes.com/m/dog_man",
            "image": "movie-dog-man.jpg",
            "status": "want to watch",
            "thumbnail": "https://resizing.flixster.com/HPdK25sm6ORpv8lKoGQhenwqpNI=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzL2YwMjdlMTNkLTkzYzEtNDFjYy05NzU1LTEyZWRlYzExMDBjYy5qcGc=",
            "title": "Dog Man",
          },
        ],
      ]
    `);
  });
});
