import axios from "axios";
import { useLanguageStore } from "./language";

/* The v4 read token is public-by-design (read-only, rate-limited), but it does
 * not belong pinned in source. .env wins; the committed value only keeps a
 * fresh clone runnable. */
const FALLBACK_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxNjY1NWNhZmVjNDNmNzU2YmQxYTU2OGJiYmQ0NjdhOCIsIm5iZiI6MTczMjQyNDE1Ni4wNzgsInN1YiI6IjY3NDJiMWRjZjNmMjkxOTEyZTk1M2MzMSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ._NQM2KGJu6zikmRdh62hKo8vN9ZZByNPh7LJTVtGujo";

const TOKEN = import.meta.env.VITE_TMDB_TOKEN || FALLBACK_TOKEN;
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export const apiLanguage = () =>
  useLanguageStore.getState().language === "ar" ? "ar-SA" : "en-US";

export const tmdbApi = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  headers: { Authorization: `Bearer ${TOKEN}` },
});

/* Read the language per request. The old client baked it in at module load,
 * which is why switching language had to reload the whole page. */
tmdbApi.interceptors.request.use((config) => {
  config.params = { language: apiLanguage(), ...config.params };
  return config;
});

const get = async <T = unknown>(path: string, params?: Record<string, unknown>): Promise<T> =>
  (await tmdbApi.get(path, { params })).data;

/* ------------------------------------------------------------------ images */

export type PosterSize = "w185" | "w342" | "w500" | "original";
export type BackdropSize = "w780" | "w1280" | "original";

export const posterUrl = (path?: string | null, size: PosterSize = "w342") =>
  path ? `${IMAGE_BASE_URL}/${size}${path}` : null;

export const backdropUrl = (path?: string | null, size: BackdropSize = "w1280") =>
  path ? `${IMAGE_BASE_URL}/${size}${path}` : null;

export const profileUrl = (path?: string | null, size: "w185" | "h632" = "w185") =>
  path ? `${IMAGE_BASE_URL}/${size}${path}` : null;

export const logoUrl = (path?: string | null) =>
  path ? `${IMAGE_BASE_URL}/w92${path}` : null;

/* ------------------------------------------------------------------- types */

export type MediaType = "movie" | "tv";

export interface MediaSummary {
  id: number;
  media_type?: MediaType | "person";
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  profile_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  character?: string;
  job?: string;
  known_for_department?: string;
  known_for?: MediaSummary[];
}

export interface Paged<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
}

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
  order?: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string | null;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
  runtime: number | null;
  air_date: string | null;
  vote_average: number;
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface TitleDetails extends MediaSummary {
  tagline?: string;
  status?: string;
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  budget?: number;
  revenue?: number;
  homepage?: string;
  original_language?: string;
  genres?: Genre[];
  seasons?: Season[];
  production_companies?: { id: number; name: string; logo_path: string | null; origin_country: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  spoken_languages?: { english_name: string; iso_639_1: string; name: string }[];
  networks?: { id: number; name: string; logo_path: string | null }[];
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  videos?: { results: Video[] };
  recommendations?: Paged<MediaSummary>;
  similar?: Paged<MediaSummary>;
  images?: { backdrops: { file_path: string }[] };
  external_ids?: { imdb_id?: string | null };
  "watch/providers"?: {
    results: Record<string, { link: string; flatrate?: WatchProvider[]; rent?: WatchProvider[]; buy?: WatchProvider[] }>;
  };
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  known_for_department: string;
  gender: number;
  popularity: number;
  homepage: string | null;
  combined_credits?: { cast: MediaSummary[]; crew: MediaSummary[] };
  images?: { profiles: { file_path: string }[] };
  external_ids?: { imdb_id?: string | null };
}

/* --------------------------------------------------------------- endpoints */

export const fetchTrending = (media: MediaType, window: "day" | "week" = "week") =>
  get<Paged<MediaSummary>>(`/trending/${media}/${window}`).then((d) => d.results);

/** Every list the app browses, keyed by the tab the user clicks. */
export const LIST_ENDPOINTS = {
  movie: {
    popular: "/movie/popular",
    top_rated: "/movie/top_rated",
    now_playing: "/movie/now_playing",
    upcoming: "/movie/upcoming",
  },
  tv: {
    popular: "/tv/popular",
    top_rated: "/tv/top_rated",
    on_the_air: "/tv/on_the_air",
    airing_today: "/tv/airing_today",
  },
} as const;

export type MovieList = keyof (typeof LIST_ENDPOINTS)["movie"];
export type TvList = keyof (typeof LIST_ENDPOINTS)["tv"];

export const fetchList = (media: MediaType, list: string, page = 1) => {
  const endpoints: Record<string, string> = LIST_ENDPOINTS[media];
  return get<Paged<MediaSummary>>(endpoints[list] ?? LIST_ENDPOINTS[media].popular, { page });
};

export interface DiscoverFilters {
  genres?: number[];
  sort?: string;
  year?: number | null;
  minRating?: number;
}

export const discover = (media: MediaType, filters: DiscoverFilters, page = 1) => {
  /* Sorting by rating with no vote floor is a TMDB trap: it returns obscure
   * titles sitting on a single 10/10 vote. TMDB's own Top Rated list uses a
   * few hundred; 200 is enough to keep real films at the top. */
  const sort = filters.sort || "popularity.desc";
  const voteFloor = Math.max(
    sort.startsWith("vote_average") ? 200 : 0,
    filters.minRating ? 50 : 0,
  );

  return get<Paged<MediaSummary>>(`/discover/${media}`, {
    page,
    include_adult: false,
    sort_by: sort,
    ...(filters.genres?.length ? { with_genres: filters.genres.join(",") } : {}),
    ...(filters.year
      ? media === "movie"
        ? { primary_release_year: filters.year }
        : { first_air_date_year: filters.year }
      : {}),
    ...(filters.minRating ? { "vote_average.gte": filters.minRating } : {}),
    ...(voteFloor ? { "vote_count.gte": voteFloor } : {}),
  });
};

export const fetchGenres = (media: MediaType) =>
  get<{ genres: Genre[] }>(`/genre/${media}/list`).then((d) => d.genres);

export const fetchTitle = (media: MediaType, id: string) =>
  get<TitleDetails>(`/${media}/${id}`, {
    append_to_response: "credits,videos,recommendations,similar,watch/providers,images,external_ids",
    include_image_language: "en,null",
  });

/** TMDB's Arabic catalogue is sparse — plenty of titles have no ar overview.
 *  Used to backfill the synopsis rather than showing an empty block. */
export const fetchEnglishOverview = (media: MediaType, id: string) =>
  get<{ overview: string; tagline?: string }>(`/${media}/${id}`, { language: "en-US" });

export const fetchSeason = (id: string, seasonNumber: number) =>
  get<{ episodes: Episode[] }>(`/tv/${id}/season/${seasonNumber}`).then((d) => d.episodes);

export const fetchPerson = (id: string) =>
  get<PersonDetails>(`/person/${id}`, {
    append_to_response: "combined_credits,images,external_ids",
  });

export type SearchScope = "multi" | "movie" | "tv" | "person";

export const search = (scope: SearchScope, query: string, page = 1) =>
  get<Paged<MediaSummary>>(`/search/${scope}`, { query, page, include_adult: false });

/* ----------------------------------------------------------------- helpers */

export const titleOf = (item: MediaSummary) => item.title || item.name || "";

export const dateOf = (item: MediaSummary) => item.release_date || item.first_air_date || "";

export const yearOf = (item: MediaSummary) => {
  const d = dateOf(item);
  return d ? d.slice(0, 4) : null;
};

/** search/multi and combined_credits both carry media_type; list endpoints don't. */
export const mediaTypeOf = (item: MediaSummary, fallback: MediaType = "movie"): MediaType =>
  item.media_type === "movie" || item.media_type === "tv"
    ? item.media_type
    : item.title !== undefined || item.release_date !== undefined
      ? "movie"
      : item.name !== undefined || item.first_air_date !== undefined
        ? "tv"
        : fallback;

/** The one trailer worth autoplaying: official YouTube trailer, newest first. */
export const pickTrailer = (videos?: Video[]): Video | null => {
  if (!videos?.length) return null;
  const yt = videos.filter((v) => v.site === "YouTube");
  const rank = (v: Video) =>
    (v.type === "Trailer" ? 0 : v.type === "Teaser" ? 1 : 2) + (v.official ? 0 : 0.5);
  return [...yt].sort(
    (a, b) => rank(a) - rank(b) || +new Date(b.published_at) - +new Date(a.published_at),
  )[0] ?? null;
};
