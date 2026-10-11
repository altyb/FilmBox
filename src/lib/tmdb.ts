import axios from "axios";
import { useLanguageStore } from "./language";

/* All TMDB traffic goes through our /api/tmdb proxy (Vercel function in
 * production, vite dev proxy locally). The key lives server-side — the
 * browser never sees it — and every visitor shares the proxy's cache. */
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export const apiLanguage = () =>
  useLanguageStore.getState().language === "ar" ? "ar-SA" : "en-US";

export const tmdbApi = axios.create({ baseURL: "/api/tmdb" });

/* --------------------------------- rate guard -------------------------------
 * Second layer behind the /api/tmdb proxy (which caches + throttles
 * server-side): max 4 concurrent requests, max 30 starts per 10s window, and
 * 429/5xx backoff with Retry-After. Keeps one tab from bursting. */
const WINDOW_MS = 10_000;
const MAX_STARTS_PER_WINDOW = 30;
const MAX_CONCURRENT = 4;
const MAX_RETRIES = 3;

const startTimes: number[] = [];
let inFlight = 0;
const waiters: Array<() => void> = [];

const pumpQueue = () => {
  const now = Date.now();
  while (startTimes.length > 0 && now - startTimes[0] > WINDOW_MS) startTimes.shift();
  while (waiters.length > 0 && inFlight < MAX_CONCURRENT) {
    if (startTimes.length >= MAX_STARTS_PER_WINDOW) break;
    inFlight += 1;
    startTimes.push(Date.now());
    waiters.shift()!();
  }
  if (waiters.length > 0 && startTimes.length >= MAX_STARTS_PER_WINDOW) {
    const wait = WINDOW_MS - (Date.now() - startTimes[0]) + 50;
    setTimeout(pumpQueue, Math.max(wait, 50));
  }
};

const acquireSlot = () =>
  new Promise<void>((resolve) => {
    waiters.push(resolve);
    pumpQueue();
  });

const releaseSlot = () => {
  inFlight = Math.max(0, inFlight - 1);
  pumpQueue();
};

const retryCountOf = (config: object) =>
  (config as Record<string, unknown>).__retryCount as number | undefined ?? 0;

const setRetryCount = (config: object, n: number) => {
  (config as Record<string, unknown>).__retryCount = n;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* Read the language per request. The old client baked it in at module load,
 * which is why switching language had to reload the whole page. */
tmdbApi.interceptors.request.use(async (config) => {
  await acquireSlot();
  config.params = { language: apiLanguage(), ...config.params };
  return config;
});

tmdbApi.interceptors.response.use(
  (response) => {
    releaseSlot();
    return response;
  },
  async (error) => {
    releaseSlot();
    const config = error?.config;
    if (!config) throw error;
    const status: number | undefined = error?.response?.status;
    const retriable = status === 429 || !error.response || (status !== undefined && status >= 500);
    const tries = retryCountOf(config);
    if (!retriable || tries >= MAX_RETRIES) throw error;
    setRetryCount(config, tries + 1);
    const retryAfter = Number(error?.response?.headers?.["retry-after"]);
    const delay =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(1000 * 2 ** tries, 8000) + Math.random() * 500;
    await sleep(delay);
    return tmdbApi(config);
  },
);

const get = async <T = unknown>(path: string, params?: Record<string, unknown>): Promise<T> =>
  (await tmdbApi.get(path, { params })).data;

/* ------------------------------------------------------------------ images */

export type PosterSize = "w185" | "w342" | "w500" | "original";
export type BackdropSize = "w300" | "w780" | "w1280" | "original";

export const posterUrl = (path?: string | null, size: PosterSize = "w342") =>
  path ? `${IMAGE_BASE_URL}/${size}${path}` : null;

export const backdropUrl = (path?: string | null, size: BackdropSize = "w1280") =>
  path ? `${IMAGE_BASE_URL}/${size}${path}` : null;

/** srcset candidates, so each device downloads the smallest file that is
 *  still sharp at its size and pixel density (Lighthouse flagged ~1.8 MB of
 *  oversized images when every tile used one fixed size). */
export const posterSrcSet = (path?: string | null) =>
  path ? (["w185", "w342", "w500"] as const).map((s) => `${IMAGE_BASE_URL}/${s}${path} ${s.slice(1)}w`).join(", ") : undefined;

export const backdropSrcSet = (path?: string | null) =>
  path ? (["w300", "w780", "w1280"] as const).map((s) => `${IMAGE_BASE_URL}/${s}${path} ${s.slice(1)}w`).join(", ") : undefined;

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

/** Shared query options — one cache entry per list page / trending list, used
 *  by the home hero, the home rails and Browse alike, so the same TMDB data is
 *  never fetched twice (Browse page 1 of "top rated" is the home bento's data). */
export const listQuery = (media: MediaType, list: string, lang: string, page = 1) => ({
  queryKey: ["list", media, list, lang, page] as const,
  queryFn: () => fetchList(media, list, page),
  staleTime: 15 * 60_000,
});

/* The last trending lists are kept in localStorage, so a repeat visit paints
 * the home hero and rails straight away (and index.html can preload the hero
 * still before any JS) while a fresh copy loads in the background. */
const trendingKey = (media: MediaType, lang: string) => `filmbox-trending-${media}-${lang}`;

export const readTrendingCache = (media: MediaType, lang: string) => {
  try {
    const v = JSON.parse(localStorage.getItem(trendingKey(media, lang)) ?? "null");
    return v && Array.isArray(v.items) ? (v as { at: number; items: MediaSummary[] }) : null;
  } catch {
    return null;
  }
};

const saveTrendingCache = (media: MediaType, lang: string, items: MediaSummary[]) => {
  try {
    localStorage.setItem(trendingKey(media, lang), JSON.stringify({ at: Date.now(), items: items.slice(0, 20) }));
  } catch {
    /* storage full or blocked: the cache is only a speed-up */
  }
  return items;
};

export const trendingQuery = (media: MediaType, lang: string) => ({
  queryKey: ["trending", media, lang] as const,
  queryFn: () => {
    // index.html already started this request at HTML-parse time on the home
    // page; use it once, fall back to a normal request if it failed.
    const w = window as { __trendingMovie?: Promise<Paged<MediaSummary>> };
    const early = media === "movie" ? w.__trendingMovie : undefined;
    w.__trendingMovie = undefined;
    const fresh = early ? early.then((d) => d.results).catch(() => fetchTrending(media)) : fetchTrending(media);
    return fresh.then((items) => saveTrendingCache(media, lang, items));
  },
  initialData: () => readTrendingCache(media, lang)?.items,
  initialDataUpdatedAt: () => readTrendingCache(media, lang)?.at,
  staleTime: 15 * 60_000,
});

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

/** Keep in sync with the early fetch in index.html (same path + params). */
const TITLE_APPEND = "credits,videos,recommendations,similar,watch/providers,images,external_ids";

export const fetchTitle = (media: MediaType, id: string) => {
  // On a direct load of a title page, index.html already started this exact
  // request at HTML-parse time; use it once, fall back if it failed.
  const w = window as { __earlyTitle?: { key: string; data: Promise<TitleDetails> } };
  const early = w.__earlyTitle?.key === `${media}/${id}` ? w.__earlyTitle.data : undefined;
  w.__earlyTitle = undefined;
  const normal = () => get<TitleDetails>(`/${media}/${id}`, { append_to_response: TITLE_APPEND, include_image_language: "en,null" });
  return early ? early.catch(normal) : normal();
};

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
