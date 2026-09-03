import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";
import { formatNumber } from "@/lib/format";
import { fetchGenres, fetchList, discover, LIST_ENDPOINTS, type MediaType, type Paged, type MediaSummary } from "@/lib/tmdb";
import { PosterGrid } from "@/components/media/PosterGrid";
import { PosterGridSkeleton, ErrorState, EmptyState } from "@/components/common/States";

const YEARS = Array.from({ length: new Date().getFullYear() + 1 - 1950 + 1 }, (_, i) => new Date().getFullYear() + 1 - i);

const SORTS = [
  { value: "popularity.desc", key: "sortPopular" },
  { value: "vote_average.desc", key: "sortRating" },
  { value: "primary_release_date.desc", key: "sortNewest" },
  { value: "revenue.desc", key: "sortRevenue" },
  { value: "title.asc", key: "sortTitle" },
] as const;

/** TV uses different field names for two of the sorts. */
const sortFor = (media: MediaType, sort: string) =>
  media === "tv"
    ? sort.replace("primary_release_date", "first_air_date").replace("title.asc", "name.asc").replace("revenue.desc", "vote_count.desc")
    : sort;

const Browse = ({ media }: { media: MediaType }) => {
  const type: MediaType = media;
  const [params, setParams] = useSearchParams();
  const { t, lang } = useT();

  const lists = Object.keys(LIST_ENDPOINTS[type]);
  const list = params.get("list") && lists.includes(params.get("list")!) ? params.get("list")! : "popular";
  const genres = params.get("genre")?.split(",").filter(Boolean).map(Number) ?? [];
  const sort = params.get("sort") ?? "popularity.desc";
  const year = params.get("year") ? Number(params.get("year")) : null;
  const minRating = params.get("rating") ? Number(params.get("rating")) : 0;

  const filtered = genres.length > 0 || !!year || minRating > 0 || params.has("sort");

  const { data: genreList } = useQuery({
    queryKey: ["genres", type, lang],
    queryFn: () => fetchGenres(type),
    staleTime: 24 * 60 * 60_000,
  });

  const query = useInfiniteQuery<Paged<MediaSummary>>({
    queryKey: ["browse", type, list, genres.join(","), sort, year, minRating, lang],
    queryFn: ({ pageParam }) =>
      filtered
        ? discover(type, { genres, sort: sortFor(type, sort), year, minRating }, pageParam as number)
        : fetchList(type, list, pageParam as number),
    initialPageParam: 1,
    // TMDB hard-caps browse at page 500 regardless of total_pages.
    getNextPageParam: (last) =>
      last.page < Math.min(last.total_pages, 500) ? last.page + 1 : undefined,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.results) ?? [],
    [query.data],
  );

  useEffect(() => {
    document.title = `${type === "tv" ? t.tvShows : t.movies} · ${t.brand}`;
  }, [type, t]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const toggleGenre = (id: number) => {
    const next = genres.includes(id) ? genres.filter((g) => g !== id) : [...genres, id];
    setParam("genre", next.join(","));
  };

  const selectClass =
    "label h-9 border border-border bg-surface px-2.5 text-foreground outline-none transition-colors duration-200 hover:border-primary focus-visible:border-primary";

  return (
    <div className="container py-10">
      <h1 className="marquee text-[clamp(2rem,5vw,3.25rem)]">
        {type === "tv" ? t.tvShows : t.movies}
      </h1>

      {/* named lists */}
      <div className="mt-6 flex flex-wrap gap-2">
        {lists.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setParam("list", l === "popular" ? null : l)}
            className={cn(
              "label press border px-3 py-1.5 transition-colors duration-200 ease-out",
              !filtered && list === l
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary",
            )}
          >
            {t[l === "top_rated" ? "topRated" : l === "now_playing" ? "nowPlaying" : l === "on_the_air" ? "onTheAir" : l === "airing_today" ? "airingToday" : l === "upcoming" ? "upcoming" : "popular"]}
          </button>
        ))}
      </div>

      {/* filters */}
      <div className="mt-8 space-y-4 border-y border-border py-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="label flex items-center gap-2 text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            {t.filters}
          </span>

          <label className="sr-only" htmlFor="sort">{t.sortBy}</label>
          <select id="sort" className={selectClass} value={sort} onChange={(e) => setParam("sort", e.target.value)}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{t[s.key]}</option>
            ))}
          </select>

          <label className="sr-only" htmlFor="year">{t.year}</label>
          <select id="year" className={selectClass} value={year ?? ""} onChange={(e) => setParam("year", e.target.value)}>
            <option value="">{t.anyYear}</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <label className="sr-only" htmlFor="rating">{t.minRating}</label>
          <select id="rating" className={selectClass} value={minRating || ""} onChange={(e) => setParam("rating", e.target.value)}>
            <option value="">{t.minRating}: {t.any}</option>
            {[5, 6, 7, 8, 9].map((r) => <option key={r} value={r}>≥ {r}.0</option>)}
          </select>

          {filtered && (
            <button
              type="button"
              onClick={() => setParams(new URLSearchParams(), { replace: true })}
              className="label press flex items-center gap-1.5 border border-border px-3 py-1.5 text-muted-foreground transition-colors duration-200 hover:border-destructive hover:text-destructive"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              {t.clearFilters}
            </button>
          )}
        </div>

        {genreList && (
          <div className="rail -mb-2 flex gap-2 overflow-x-auto pb-2">
            {genreList.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGenre(g.id)}
                aria-pressed={genres.includes(g.id)}
                className={cn(
                  "label press shrink-0 border px-3 py-1.5 transition-colors duration-200 ease-out",
                  genres.includes(g.id)
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
                )}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        {query.isPending ? (
          <PosterGridSkeleton />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState title={t.noResults} hint={t.tryDifferent} />
        ) : (
          <>
            <p className="label mb-5 text-muted-foreground">
              {formatNumber(query.data.pages[0].total_results, lang)} {t.results}
            </p>
            <PosterGrid items={items} type={type} showIndex />

            <div className="mt-12 flex justify-center">
              {query.hasNextPage ? (
                <button
                  type="button"
                  onClick={() => query.fetchNextPage()}
                  disabled={query.isFetchingNextPage}
                  className="label press min-w-52 border border-border px-6 py-3 transition-colors duration-200 ease-out hover:border-primary hover:text-primary disabled:opacity-60"
                >
                  {query.isFetchingNextPage ? `${t.loading}…` : t.loadMore}
                </button>
              ) : (
                <p className="label text-muted-foreground">{t.endOfList}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Browse;
