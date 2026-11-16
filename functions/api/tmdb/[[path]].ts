/* GET /api/tmdb/<tmdb-path>?<params> — server-side TMDB proxy (Cloudflare Pages Function).
 * The TMDB token lives in the TMDB_TOKEN secret, never in the client bundle. Only allowlisted
 * paths and params are forwarded; responses are cached at the Cloudflare edge so every visitor
 * shares one upstream request. */

const TMDB_BASE = "https://api.themoviedb.org/3";

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

const json = (status: number, body: string, headers: Record<string, string> = {}) =>
  new Response(body, { status, headers: { "Content-Type": "application/json", ...headers } });

export const onRequestGet: PagesFunction<{ TMDB_TOKEN?: string }> = async ({ request, env, params, waitUntil }) => {
  if (!env.TMDB_TOKEN) return json(500, '{"error":"tmdb_not_configured"}');

  const raw = params.path;
  const tmdbPath = (Array.isArray(raw) ? raw.join("/") : raw || "").replace(/^\/+|\/+$/g, "");
  if (!tmdbPath || !PATH_ALLOW.some((re) => re.test(tmdbPath))) return json(403, '{"error":"path_not_allowed"}');

  const q = new URLSearchParams();
  for (const [k, v] of new URL(request.url).searchParams) if (PARAM_ALLOW.has(k) && v !== "") q.set(k, v);
  if (!q.has("language")) q.set("language", "en-US");
  q.sort();

  const ttl = ttlFor(tmdbPath);
  const cache = caches.default;
  const key = new Request(`https://filmbox.cache/${tmdbPath}?${q}`);
  const hit = await cache.match(key);
  if (hit) return new Response(hit.body, { status: 200, headers: { ...Object.fromEntries(hit.headers), "X-Cache": "HIT" } });

  let up: Response;
  try {
    up = await fetch(`${TMDB_BASE}/${tmdbPath}?${q}`, {
      headers: { Authorization: `Bearer ${env.TMDB_TOKEN}`, Accept: "application/json" },
    });
  } catch {
    return json(502, '{"error":"upstream_unreachable"}');
  }
  const body = (await up.text()) || "{}";
  if (up.status !== 200) {
    const h: Record<string, string> = { "Cache-Control": "no-store", "X-Cache": "MISS" };
    const ra = up.headers.get("retry-after");
    if (ra) h["Retry-After"] = ra;
    return json(up.status, body, h);
  }
  const res = json(200, body, { "Cache-Control": `public, max-age=60, s-maxage=${ttl}, stale-while-revalidate=120`, "X-Cache": "MISS" });
  waitUntil(cache.put(key, res.clone()));
  return res;
};
