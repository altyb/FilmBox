/* GET /api/tmdb/<tmdb-path>?<params> — server-side TMDB proxy.
 * (vercel.json rewrites /api/tmdb/<path> to this file as ?path=<path>: plain
 * Vercel functions do not route catch-all [...path] filenames.)
 *
 * Why: the TMDB key lives here (server env), never in the client bundle, and
 * every visitor shares the same cache instead of each burning quota.
 *
 * Three cache layers, first hit wins:
 *  1. Vercel edge  — `s-maxage` on 200s, shared across all instances (free).
 *  2. In-memory LRU — per instance, absorbs bursts without a round-trip.
 *  3. Upstash Redis — only when UPSTASH_REDIS_REST_URL/TOKEN are set; survives
 *     cold starts and is shared across all instances.
 *
 * Upstream guard: max 30 TMDB starts / 10s per instance (TMDB allows ~40).
 * A 429 from TMDB is forwarded with its Retry-After — the client already
 * backs off and retries. Only GET, only allowlisted paths + params. */

type Query = Record<string, string | string[] | undefined>;
type Req = { method?: string; query: Query };
type Res = {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

const TMDB_BASE = "https://api.themoviedb.org/3";

/* ------------------------------- allowlists ------------------------------ */

const PATH_ALLOW = [
  /^trending\/(movie|tv)\/(day|week)$/,
  /^(movie|tv)\/(popular|top_rated|now_playing|upcoming|on_the_air|airing_today)$/,
  /^discover\/(movie|tv)$/,
  /^genre\/(movie|tv)\/list$/,
  /^(movie|tv)\/\d+$/,
  /^tv\/\d+\/season\/\d+$/,
  /^person\/\d+$/,
  /^search\/(multi|movie|tv|person)$/,
];

/* Unknown params are stripped, not rejected — forward-compatible and safe. */
const PARAM_ALLOW = new Set([
  "language",
  "page",
  "sort_by",
  "with_genres",
  "primary_release_year",
  "first_air_date_year",
  "vote_average.gte",
  "vote_count.gte",
  "query",
  "include_adult",
  "append_to_response",
  "include_image_language",
]);

/* TTL per endpoint family. Mirrors the client's staleTime choices. */
const ttlFor = (path: string): number => {
  if (/^genre\//.test(path)) return 24 * 3600;
  if (/^person\//.test(path)) return 3600;
  if (/^tv\/\d+\/season\//.test(path)) return 3600;
  if (/^(movie|tv)\/\d+$/.test(path)) return 3600;
  if (/^search\//.test(path)) return 300;
  return 900; // trending, lists, discover
};

/* --------------------------------- memory -------------------------------- */

const MEM_MAX = 500;
type MemEntry = { exp: number; status: number; body: string };
const mem = new Map<string, MemEntry>();

const memGet = (key: string): MemEntry | null => {
  const e = mem.get(key);
  if (!e) return null;
  if (Date.now() > e.exp) {
    mem.delete(key);
    return null;
  }
  mem.delete(key); // LRU refresh
  mem.set(key, e);
  return e;
};

const memSet = (key: string, status: number, body: string, ttl: number) => {
  if (body.length > 2_000_000) return; // never cache huge payloads
  if (mem.size >= MEM_MAX) mem.delete(mem.keys().next().value!);
  mem.set(key, { exp: Date.now() + ttl * 1000, status, body });
};

/* --------------------------------- redis --------------------------------- */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const redisOn = () => REDIS_URL.length > 0 && REDIS_TOKEN.length > 0;

const withTimeout = (ms: number) => {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, done: () => clearTimeout(t) };
};

const redisGet = async (key: string): Promise<MemEntry | null> => {
  if (!redisOn()) return null;
  const { signal, done } = withTimeout(600);
  try {
    const r = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      signal,
    });
    const data = (await r.json()) as { result?: string | null };
    if (!data?.result) return null;
    const parsed = JSON.parse(data.result) as { exp: number; status: number; body: string };
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  } finally {
    done();
  }
};

const redisSet = (key: string, status: number, body: string, ttl: number) => {
  if (!redisOn() || body.length > 2_000_000) return;
  const { signal, done } = withTimeout(600);
  const value = JSON.stringify({ exp: Date.now() + ttl * 1000, status, body });
  fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(["SETEX", key, ttl, value]),
    signal,
  })
    .catch(() => {})
    .finally(done);
};

/* ------------------------------ upstream guard ---------------------------- */

const WINDOW_MS = 10_000;
const MAX_STARTS_PER_WINDOW = 30;
const MAX_CONCURRENT = 8;

const starts: number[] = [];
let inFlight = 0;
const waiters: Array<() => void> = [];

const pump = () => {
  const now = Date.now();
  while (starts.length > 0 && now - starts[0] > WINDOW_MS) starts.shift();
  while (waiters.length > 0 && inFlight < MAX_CONCURRENT) {
    if (starts.length >= MAX_STARTS_PER_WINDOW) break;
    inFlight += 1;
    starts.push(Date.now());
    waiters.shift()!();
  }
  if (waiters.length > 0 && starts.length >= MAX_STARTS_PER_WINDOW) {
    const wait = WINDOW_MS - (Date.now() - starts[0]) + 50;
    setTimeout(pump, Math.max(wait, 50));
  }
};

const acquire = () =>
  new Promise<void>((resolve) => {
    waiters.push(resolve);
    pump();
  });

const release = () => {
  inFlight = Math.max(0, inFlight - 1);
  pump();
};

/* --------------------------------- handler -------------------------------- */

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

export default async function handler(req: Req, res: Res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const token = process.env.TMDB_TOKEN || "";
  if (!token) return res.status(500).json({ error: "tmdb_not_configured" });

  const rawPath = req.query.path;
  const tmdbPath = (Array.isArray(rawPath) ? rawPath.join("/") : rawPath || "").replace(
    /^\/+|\/+$/g,
    "",
  );
  if (!tmdbPath || !PATH_ALLOW.some((re) => re.test(tmdbPath))) {
    return res.status(403).json({ error: "path_not_allowed" });
  }

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query)) {
    if (k === "path" || !PARAM_ALLOW.has(k)) continue;
    const val = first(v);
    if (val !== undefined && val !== "") params.set(k, val);
  }
  if (!params.has("language")) params.set("language", "en-US");
  params.sort();

  const ttl = ttlFor(tmdbPath);
  const cacheKey = `filmbox:tmdb:${tmdbPath}?${params.toString()}`;

  const serve = (status: number, body: string, hit: string) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Cache", hit);
    res.setHeader(
      "Cache-Control",
      status === 200
        ? `public, max-age=60, s-maxage=${ttl}, stale-while-revalidate=120`
        : "no-store",
    );
    return res.status(status).json(JSON.parse(body));
  };

  const cached = memGet(cacheKey) ?? (await redisGet(cacheKey));
  if (cached) {
    if (memGet(cacheKey) === null) memSet(cacheKey, cached.status, cached.body, ttl);
    return serve(cached.status, cached.body, "HIT");
  }

  await acquire();
  try {
    const upstream = await fetch(`${TMDB_BASE}/${tmdbPath}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const body = await upstream.text();
    if (upstream.status === 429) {
      const retryAfter = upstream.headers.get("retry-after");
      if (retryAfter) res.setHeader("Retry-After", retryAfter);
      return serve(429, body || '{"error":"rate_limited"}', "MISS");
    }
    if (upstream.status === 200) {
      memSet(cacheKey, 200, body, ttl);
      redisSet(cacheKey, 200, body, ttl);
    }
    return serve(upstream.status, body || "{}", "MISS");
  } catch {
    return res.status(502).json({ error: "upstream_unreachable" });
  } finally {
    release();
  }
}
