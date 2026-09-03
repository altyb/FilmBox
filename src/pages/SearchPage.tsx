import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";
import { formatNumber } from "@/lib/format";
import { search, type Paged, type MediaSummary, type SearchScope } from "@/lib/tmdb";
import { SearchBox } from "@/components/search/SearchBox";
import { PosterGrid } from "@/components/media/PosterGrid";
import { PersonCard } from "@/components/media/PersonCard";
import { PosterGridSkeleton, EmptyState, ErrorState } from "@/components/common/States";

const SCOPES: { value: SearchScope; key: "all" | "movies" | "tvShows" | "people" }[] = [
  { value: "multi", key: "all" },
  { value: "movie", key: "movies" },
  { value: "tv", key: "tvShows" },
  { value: "person", key: "people" },
];

const SearchPage = () => {
  const [params, setParams] = useSearchParams();
  const { t, lang } = useT();
  const query = params.get("q")?.trim() ?? "";
  const scope = (params.get("type") as SearchScope) || "multi";

  useEffect(() => {
    document.title = query ? `${query} · ${t.brand}` : `${t.search} · ${t.brand}`;
  }, [query, t.brand, t.search]);

  const results = useInfiniteQuery<Paged<MediaSummary>>({
    queryKey: ["search", scope, query, lang],
    queryFn: ({ pageParam }) => search(scope, query, pageParam as number),
    initialPageParam: 1,
    enabled: query.length > 0,
    getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
  });

  // The old page keyed on `page` and threw away everything before it, so
  // "Load more" replaced the results instead of appending them.
  const items = useMemo(() => {
    const flat = results.data?.pages.flatMap((p) => p.results) ?? [];
    return scope === "multi"
      ? flat.filter((r) => ["movie", "tv", "person"].includes(r.media_type ?? ""))
      : flat;
  }, [results.data, scope]);

  const people = items.filter((i) => i.media_type === "person" || scope === "person");
  const titles = items.filter((i) => i.media_type !== "person" && scope !== "person");

  const setScope = (value: SearchScope) => {
    const next = new URLSearchParams(params);
    if (value === "multi") next.delete("type");
    else next.set("type", value);
    setParams(next, { replace: true });
  };

  return (
    <div className="container py-10 sm:py-14">
      <h1 className="marquee text-[clamp(2rem,5vw,3.25rem)]">{t.search}</h1>
      <SearchBox size="lg" autoFocus={!query} initialQuery={query} className="mt-6 max-w-3xl" />

      <div className="mt-6 flex flex-wrap gap-2">
        {SCOPES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setScope(s.value)}
            className={cn(
              "label press border px-3 py-1.5 transition-colors duration-200 ease-out",
              scope === s.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary",
            )}
          >
            {t[s.key]}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {!query ? (
          <EmptyState title={t.startTyping} hint={t.searchHint} />
        ) : results.isPending ? (
          <PosterGridSkeleton />
        ) : results.isError ? (
          <ErrorState onRetry={() => results.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState title={t.noResults} hint={t.tryDifferent} />
        ) : (
          <>
            <p className="label mb-6 text-muted-foreground">
              {formatNumber(results.data.pages[0].total_results, lang)} {t.results} — {t.resultsFor} “{query}”
            </p>

            {titles.length > 0 && <PosterGrid items={titles} showIndex />}

            {people.length > 0 && (
              <div className={cn(titles.length > 0 && "mt-12")}>
                {titles.length > 0 && <h2 className="marquee mb-5 text-xl">{t.people}</h2>}
                <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {people.map((p, i) => (
                    <PersonCard
                      key={`person-${p.id}`}
                      id={p.id}
                      name={p.name ?? ""}
                      role={p.known_for_department}
                      profilePath={p.profile_path ?? null}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12 flex justify-center">
              {results.hasNextPage ? (
                <button
                  type="button"
                  onClick={() => results.fetchNextPage()}
                  disabled={results.isFetchingNextPage}
                  className="label press min-w-52 border border-border px-6 py-3 transition-colors duration-200 ease-out hover:border-primary hover:text-primary disabled:opacity-60"
                >
                  {results.isFetchingNextPage ? `${t.loading}…` : t.loadMore}
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

export default SearchPage;
