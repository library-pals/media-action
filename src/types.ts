export type MediaStatus = "want to watch" | "watching" | "watched" | "summary";

export type MediaPayload = {
  identifier: string;
  date: string;
  "media-status": MediaStatus;
  notes: string;
  rating: string;
  tags: string;
};

export type MediaParams = {
  filename: string;
  inputIdentifier: string;
  dateType: DateTypes;
  notes: string;
  status: MediaStatus;
  rating: string;
  tags?: string[];
};

export type ActionInputs = {
  filename: string;
};

export type DateTypes = {
  dateAdded?: string;
  dateStarted?: string;
  dateFinished?: string;
};

export type NewMedia = {
  identifier: string;
  title?: string;
  description?: string;
  dateAdded?: string;
  dateStarted?: string;
  dateFinished?: string;
  notes?: string;
  rating?: string;
  tags?: string[];
  thumbnail?: string;
  image?: string;
  status: string;
  datePublished?: string;
  genres?: string[];
  format?: string;
  contentRating?: string;
};
