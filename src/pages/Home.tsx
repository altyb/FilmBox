import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { RatingMeter } from "@/components/media/RatingMeter";
import { useT } from "@/lib/language";
import { listQuery, trendingQuery, readTrendingCache, backdropUrl, backdropSrcSet, titleOf, type MediaSummary, type MediaType, type Paged } from "@/lib/tmdb";
import { BentoHero } from "@/components/home/BentoHero";
import { SectionHead } from "@/components/common/SectionHead";
import { PosterRail } from "@/components/media/PosterRail";
import { PosterRailSkeleton, ErrorState } from "@/components/common/States";
import { hideBoot } from "@/lib/boot";
import { useEffect } from "react";

type Variant = "plain" | "band" | "ticket";
type RailQuery = { queryKey: readonly unknown[]; queryFn: () => Promise<MediaSummary[] | Paged<MediaSummary>> };

/** One rail = one query. Keeping them independent means a single failing
 *  endpoint costs one shelf, not the whole page. Three looks (bento-cutout
 *  style): plain; "band" — a surface band whose top edge dips down in the
 *  middle to hold the title; "ticket" — a band with notches cut in its sides. */
const Rail = ({
  title,
  to,
  type,
  query,
  variant = "plain",
}: {
  title: string;
  to: string;
  type: MediaType;
  query: RailQuery;
  variant?: Variant;
}) => {
  const { t } = useT();
  const { data, isPending, isError, refetch } = useQuery<MediaSummary[] | Paged<MediaSummary>, Error, MediaSummary[]>({
    queryKey: query.queryKey,
    queryFn: query.queryFn,
    staleTime: 15 * 60_000,
    select: (d) => (Array.isArray(d) ? d : d.results),
  });
  const body = isPending ? (
    <PosterRailSkeleton />
  ) : isError ? (
    <ErrorState onRetry={() => refetch()} />
  ) : (
    <PosterRail items={data.slice(0, 12)} type={type} />
  );

  if (variant === "band")
    return (
      <section className="cv-auto reveal relative rounded-[2rem] bg-surface px-4 pb-5 pt-20 sm:px-8 sm:pt-24">
        <div className="dip px-6 pb-3 pt-2 sm:px-10">
          <h2 className="marquee whitespace-nowrap text-2xl sm:text-4xl">{title}</h2>
        </div>
        <Link
          to={to}
          className="label press absolute end-4 top-4 z-10 rounded-full bg-background px-4 py-2 transition-colors hover:bg-foreground hover:text-background sm:end-6 sm:top-6"
        >
          {t.viewAll}
        </Link>
        {body}
      </section>
    );

  if (variant === "ticket")
    return (
      <section className="cv-auto ticket reveal rounded-[2rem] bg-surface px-5 pb-5 pt-6 [--ny:2.6rem] sm:px-10 sm:pt-7 sm:[--ny:3rem]">
        <SectionHead title={title} to={to} className="mb-5" />
        {body}
      </section>
    );

  return (
    <section className="cv-auto reveal space-y-5 px-1 sm:px-3">
      <SectionHead title={title} to={to} />
      {body}
    </section>
  );
};

/** Top rated as a bento: one big still with a cut-out corner holding the
 *  rank and rating, four smaller stills around it. */
const TopRatedBento = () => {
  const { t, lang } = useT();
  const { data, isPending, isError, refetch } = useQuery({ ...listQuery("movie", "top_rated", lang), select: (d) => d.results });
  const items = data?.filter((m) => m.backdrop_path).slice(0, 5) ?? [];

  return (
    <section className="cv-auto reveal space-y-5 px-1 sm:px-3">
      <SectionHead title={`${t.topRated} · ${t.movies}`} to="/movie?list=top_rated" />
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:grid-rows-2">
          {(isPending ? Array.from({ length: 5 }, () => null) : items).map((m, i) => {
            const big = i === 0;
            const tile = cn(
              "shimmer group relative block overflow-hidden !rounded-[1.5rem]",
              big ? "col-span-2 aspect-[16/10] !rounded-ee-none lg:row-span-2 lg:aspect-auto" : "aspect-[16/11]",
            );
            if (!m) return <div key={i} className={cn(tile, "shimmer")} />;
            return (
              <Link key={m.id} to={`/movie/${m.id}`} className={tile}>
                <img
                  src={backdropUrl(m.backdrop_path, big ? "w1280" : "w780")!}
                  srcSet={backdropSrcSet(m.backdrop_path)}
                  sizes={big ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <span
                  className={cn(
                    "marquee absolute start-4 text-white",
                    big ? "bottom-[5.5rem] max-w-[85%] text-3xl sm:bottom-24 sm:text-5xl lg:max-w-[75%]" : "bottom-4 max-w-[85%] text-lg sm:text-xl",
                  )}
                >
                  {titleOf(m)}
                </span>
                {big ? (
                  <span className="bite bite-be flex items-center gap-3 p-3 ps-4 [--r:1.5rem]">
                    <span className="marquee text-3xl sm:text-4xl">01</span>
                    <span className="flex flex-col">
                      <span className="label text-muted-foreground">{t.topRated}</span>
                      <RatingMeter value={m.vote_average} />
                    </span>
                    <span className="ms-2 flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:scale-110">
                      <ArrowUpRight className="rtl-flip h-5 w-5" aria-hidden="true" />
                    </span>
                  </span>
                ) : (
                  <span className="label absolute end-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-white backdrop-blur-sm">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

/** Same frame as BentoHero, so nothing jumps when the data lands. */
const HeroSkeleton = () => (
  <section aria-hidden="true" className="p-3 sm:p-5">
    <div className="flex flex-col gap-3 lg:min-h-[calc(100svh-2.5rem)]">
      <div className="relative min-h-[max(24rem,60svh)] overflow-hidden rounded-[1.5rem] bg-surface lg:min-h-[54svh] lg:flex-[1.25]">
        <div className="absolute bottom-0 start-0 w-full max-w-2xl space-y-4 p-5 pb-14 sm:p-8">
          <div className="shimmer h-14 w-4/5 sm:h-20" />
          <div className="shimmer h-3 w-1/2" />
          <div className="flex gap-3 pt-3">
            <div className="shimmer h-11 w-28 !rounded-xl" />
            <div className="shimmer h-11 w-36 !rounded-xl" />
          </div>
        </div>
        <div className="absolute end-4 top-1/2 flex -translate-y-1/2 flex-col gap-2 sm:end-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="shimmer h-12 w-9 !rounded-full sm:h-14 sm:w-11" />
          ))}
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 lg:mt-0 lg:min-h-[17rem] lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2.4fr)]">
        <div className="shimmer min-h-[max(14rem,calc(40svh-4.25rem))] !rounded-[1.25rem] lg:min-h-60" />
        <div className="shimmer min-h-[max(14rem,calc(40svh-4.25rem))] !rounded-[1.25rem] lg:min-h-60" />
        <div className="col-span-2 flex min-h-56 flex-col justify-center gap-4 rounded-[1.25rem] bg-surface px-6 sm:px-10 lg:col-span-1">
          <div className="shimmer h-3 w-56" />
          <div className="shimmer h-12 w-3/4" />
        </div>
      </div>
    </div>
  </section>
);

const Home = () => {
  const { t, lang } = useT();

  const qc = useQueryClient();
  // Interleave so the hero isn't three films then two shows.
  const interleave = (films: MediaSummary[], series: MediaSummary[]) =>
    [films[0], series[0], films[1], series[1], films[2], series[2], films[3]].filter(Boolean);
  const { data: heroItems, isError: heroError, refetch: refetchHero } = useQuery({
    queryKey: ["trending", "all", lang],
    staleTime: 15 * 60_000,
    // Reads the same cache entries the trending rails use — no second request.
    queryFn: async () => {
      const [films, series] = await Promise.all([qc.fetchQuery(trendingQuery("movie", lang)), qc.fetchQuery(trendingQuery("tv", lang))]);
      return interleave(films, series);
    },
    // Repeat visit: the last lists from localStorage, so the hero paints at once.
    initialData: () => {
      const f = readTrendingCache("movie", lang), s = readTrendingCache("tv", lang);
      return f && s ? interleave(f.items, s.items) : undefined;
    },
    initialDataUpdatedAt: () => Math.min(readTrendingCache("movie", lang)?.at ?? 0, readTrendingCache("tv", lang)?.at ?? 0),
  });


  useEffect(() => {
    if (heroError) hideBoot();
  }, [heroError]);

  const rails: { title: string; to: string; type: MediaType; query: RailQuery; variant: Variant }[] = [
    { title: t.trendingFilms, to: "/movie", type: "movie", query: trendingQuery("movie", lang), variant: "plain" },
    { title: t.nowPlaying, to: "/movie?list=now_playing", type: "movie", query: listQuery("movie", "now_playing", lang), variant: "band" },
    { title: t.trendingSeries, to: "/tv", type: "tv", query: trendingQuery("tv", lang), variant: "plain" },
  ];
  const later: typeof rails = [
    { title: t.onTheAir, to: "/tv?list=on_the_air", type: "tv", query: listQuery("tv", "on_the_air", lang), variant: "ticket" },
    { title: t.upcoming, to: "/movie?list=upcoming", type: "movie", query: listQuery("movie", "upcoming", lang), variant: "plain" },
  ];
  const rail = (r: (typeof rails)[number]) => (
    <Rail key={r.query.queryKey.join("-")} title={r.title} to={r.to} type={r.type} query={r.query} variant={r.variant} />
  );

  return (
    <>
      {heroItems ? (
        <BentoHero items={heroItems} />
      ) : heroError ? (
        <div className="container pb-8 pt-28 sm:pt-36">
          <ErrorState onRetry={() => refetchHero()} />
        </div>
      ) : (
        <HeroSkeleton />
      )}

      <div className="space-y-12 px-3 py-12 sm:space-y-16 sm:px-5">
        {rails.map(rail)}
        <TopRatedBento />
        {later.map(rail)}
      </div>

      {/* the closing wordmark, edge to edge — the page's sign-off instead of a footer */}
      <p dir="ltr" aria-hidden="true" className="cv-auto wordmark reveal select-none overflow-hidden px-3 text-center text-foreground/[0.08] sm:px-5">
        FilmBox
      </p>
    </>
  );
};

export default Home;
