import { useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCw, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";
import { formatNumber } from "@/lib/format";
import { fetchGenres, listQuery, discover, backdropUrl, backdropSrcSet, LIST_ENDPOINTS, type MediaType, type Paged, type MediaSummary } from "@/lib/tmdb";
import { Select } from "@/components/common/Select";
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

  const { data: genreList, isError: genreError, refetch: refetchGenres } = useQuery({
    queryKey: ["genres", type, lang],
    queryFn: () => fetchGenres(type),
    staleTime: 24 * 60 * 60_000,
  });

  // Unfiltered pages come from the shared per-page cache (listQuery), so a list
  // the home page already loaded shows instantly and isn't fetched again.
  const qc = useQueryClient();
  const query = useInfiniteQuery<Paged<MediaSummary>>({
    queryKey: ["browse", type, list, genres.join(","), sort, year, minRating, lang],
    queryFn: ({ pageParam }) =>
      filtered
        ? discover(type, { genres, sort: sortFor(type, sort), year, minRating }, pageParam as number)
        : qc.fetchQuery(listQuery(type, list, lang, pageParam as number)),
    initialPageParam: 1,
    staleTime: 10 * 60_000,
    // TMDB hard-caps browse at page 500 regardless of total_pages.
    getNextPageParam: (last) =>
      last.page < Math.min(last.total_pages, 500) ? last.page + 1 : undefined,
  });

  // TMDB's pages shift between requests (rankings move), so a title can come
  // back on the next page too — keep only its first appearance.
  const items = useMemo(() => {
    const seen = new Set<number>();
    return (query.data?.pages.flatMap((p) => p.results) ?? []).filter((m) => !seen.has(m.id) && !!seen.add(m.id));
  }, [query.data]);

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

  const listLabel = (l: string) =>
    t[l === "top_rated" ? "topRated" : l === "now_playing" ? "nowPlaying" : l === "on_the_air" ? "onTheAir" : l === "airing_today" ? "airingToday" : l === "upcoming" ? "upcoming" : "popular"];

  // List tabs: one capsule, a solid blob slides under the active tab.
  const tabs = useRef<HTMLDivElement>(null);
  const activeTab = filtered ? -1 : lists.indexOf(list);
  useGSAP(
    () => {
      const btn = tabs.current?.querySelectorAll<HTMLElement>("[data-tab]")[activeTab];
      if (!btn) return void gsap.to(".tab-blob", { autoAlpha: 0, duration: 0.2 });
      gsap.to(".tab-blob", { x: btn.offsetLeft, width: btn.offsetWidth, autoAlpha: 1, duration: 0.6, ease: "elastic.out(1, 0.75)" });
    },
    { scope: tabs, dependencies: [activeTab, lang] },
  );

  const lead = items.find((m) => m.backdrop_path);
  const heading = filtered ? t.filters : listLabel(list);

  return (
    <div className="space-y-6 overflow-x-clip px-3 pb-6 sm:px-5">
      {/* ---- header window: the list's top still, its name, a Films/Series switch in the cut-out ---- */}
      <section className="shimmer relative isolate flex min-h-[15rem] items-end overflow-hidden !rounded-[1.75rem] !rounded-ee-none sm:min-h-[19rem]">
        {lead && (
          <img
            key={lead.id}
            src={backdropUrl(lead.backdrop_path)!}
            srcSet={backdropSrcSet(lead.backdrop_path)}
            sizes="100vw"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
        <div className="p-5 pb-20 text-white sm:p-8 sm:pb-8 sm:pe-[17rem]">
          <p className="label text-white/70">{type === "tv" ? t.tvShows : t.movies}</p>
          <h1 className="hero-copy-shadow marquee mt-2 text-[clamp(2.25rem,6vw,4.5rem)]">{heading}</h1>
          {query.data && (
            <p className="label mt-3 text-white/75 tabular-nums">
              {formatNumber(query.data.pages[0].total_results, lang)} {t.results}
            </p>
          )}
        </div>
        <div className="bite bite-be p-2 [--r:1.5rem] sm:p-2.5">
          <div className="flex rounded-full bg-surface-2 p-1">
            {(["movie", "tv"] as const).map((m) => (
              <Link
                key={m}
                to={`/${m}`}
                aria-current={m === type ? "page" : undefined}
                className={cn(
                  "label press rounded-full px-4 py-2.5 transition-colors duration-200 sm:px-5",
                  m === type ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "tv" ? t.tvShows : t.movies}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---- list tabs ---- */}
      <div ref={tabs} className="rail relative flex w-fit max-w-full overflow-x-auto rounded-full bg-surface p-1">
        <span aria-hidden="true" style={{ visibility: "hidden" }} className="tab-blob absolute start-0 top-1 h-[calc(100%-0.5rem)] rounded-full bg-foreground rtl:end-0 rtl:start-auto" />
        {lists.map((l, i) => (
          <button
            key={l}
            data-tab
            type="button"
            onClick={() => setParam("list", l === "popular" ? null : l)}
            aria-pressed={i === activeTab}
            className={cn(
              "label press relative shrink-0 rounded-full px-4 py-2.5 transition-colors duration-300 sm:px-5",
              i === activeTab ? "text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {listLabel(l)}
          </button>
        ))}
      </div>

      {/* ---- filters: a ticket band ---- */}
      <div className="notches relative z-10 space-y-4 rounded-[1.75rem] bg-surface p-4 [--ny:2.4rem] sm:p-5 sm:[--ny:2.6rem]">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="label flex items-center gap-2 px-2 text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            {t.filters}
          </span>
          <Select
            label={t.sortBy}
            className="w-full sm:w-[15.5rem]"
            value={sort}
            onChange={(v) => setParam("sort", v)}
            options={SORTS.map((s) => ({
              value: s.value,
              // TV has no revenue data — this sort orders by vote count there.
              label: type === "tv" && s.value === "revenue.desc" ? t.sortMostVoted : t[s.key],
            }))}
          />
          <Select
            label={t.year}
            className="w-full sm:w-[11rem]"
            value={year ? String(year) : ""}
            onChange={(v) => setParam("year", v)}
            options={[{ value: "", label: t.anyYear }, ...YEARS.map((y) => ({ value: String(y), label: String(y) }))]}
          />
          <Select
            label={t.minRating}
            className="w-full sm:w-[13rem]"
            value={minRating ? String(minRating) : ""}
            onChange={(v) => setParam("rating", v)}
            options={[{ value: "", label: t.any }, ...[5, 6, 7, 8, 9].map((r) => ({ value: String(r), label: `≥ ${r}.0` }))]}
          />
          {filtered && (
            <button
              type="button"
              onClick={() => setParams(new URLSearchParams(), { replace: true })}
              className="label press flex h-11 items-center gap-1.5 rounded-full px-4 text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              {t.clearFilters}
            </button>
          )}
        </div>

        {genreError ? (
          <button
            type="button"
            onClick={() => refetchGenres()}
            className="label press inline-flex items-center gap-1.5 text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <RotateCw className="h-3 w-3" aria-hidden="true" />
            {t.retry}
          </button>
        ) : genreList && (
          <div className="rail -mb-2 flex gap-2 overflow-x-auto pb-2">
            {genreList.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGenre(g.id)}
                aria-pressed={genres.includes(g.id)}
                className={cn(
                  "label press shrink-0 rounded-full px-4 py-2.5 transition-colors duration-200 ease-out",
                  genres.includes(g.id)
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ---- results ---- */}
      <div className="px-1 pt-2 sm:px-3">
        {query.isPending ? (
          <PosterGridSkeleton />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState title={t.noResults} hint={t.tryDifferent} />
        ) : (
          <>
            <PosterGrid items={items} type={type} showIndex />
            <div className="mt-12 flex justify-center">
              {query.hasNextPage ? (
                <button
                  type="button"
                  onClick={() => query.fetchNextPage()}
                  disabled={query.isFetchingNextPage}
                  className="label press min-w-52 rounded-full bg-foreground px-6 py-3.5 text-background transition-opacity duration-200 ease-out hover:opacity-85 disabled:opacity-60"
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
