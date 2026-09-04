import { useQuery } from "@tanstack/react-query";
import { useT } from "@/lib/language";
import { fetchTrending, fetchList, type MediaSummary, type MediaType } from "@/lib/tmdb";
import { ProjectorHero } from "@/components/home/ProjectorHero";
import { SectionHead } from "@/components/common/SectionHead";
import { PosterRail } from "@/components/media/PosterRail";
import { PosterRailSkeleton, ErrorState } from "@/components/common/States";

/** One rail = one query. Keeping them independent means a single failing
 *  endpoint costs one shelf, not the whole page. */
const Rail = ({
  title,
  to,
  type,
  queryKey,
  queryFn,
}: {
  title: string;
  to: string;
  type: MediaType;
  queryKey: unknown[];
  queryFn: () => Promise<MediaSummary[]>;
}) => {
  const { data, isPending, isError, refetch } = useQuery({ queryKey, queryFn });

  return (
    <section className="space-y-4">
      <SectionHead title={title} to={to} />
      {isPending ? (
        <PosterRailSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <PosterRail items={data.slice(0, 20)} type={type} />
      )}
    </section>
  );
};

const Home = () => {
  const { t, lang } = useT();

  const { data: heroItems, isError: heroError, refetch: refetchHero } = useQuery({
    queryKey: ["trending", "all", lang],
    queryFn: async () => {
      const [films, series] = await Promise.all([fetchTrending("movie"), fetchTrending("tv")]);
      // Interleave so the hero isn't three films then two shows.
      return [films[0], series[0], films[1], series[1], films[2]].filter(Boolean);
    },
  });

  const rails = [
    { title: t.trendingFilms, to: "/movie", type: "movie" as const, key: ["trending", "movie", lang], fn: () => fetchTrending("movie") },
    { title: t.nowPlaying, to: "/movie?list=now_playing", type: "movie" as const, key: ["list", "movie", "now_playing", lang], fn: () => fetchList("movie", "now_playing").then((d) => d.results) },
    { title: t.trendingSeries, to: "/tv", type: "tv" as const, key: ["trending", "tv", lang], fn: () => fetchTrending("tv") },
    { title: t.topRated + " · " + t.movies, to: "/movie?list=top_rated", type: "movie" as const, key: ["list", "movie", "top_rated", lang], fn: () => fetchList("movie", "top_rated").then((d) => d.results) },
    { title: t.onTheAir, to: "/tv?list=on_the_air", type: "tv" as const, key: ["list", "tv", "on_the_air", lang], fn: () => fetchList("tv", "on_the_air").then((d) => d.results) },
    { title: t.upcoming, to: "/movie?list=upcoming", type: "movie" as const, key: ["list", "movie", "upcoming", lang], fn: () => fetchList("movie", "upcoming").then((d) => d.results) },
  ];

  return (
    <>
      {heroItems ? (
        <ProjectorHero items={heroItems} />
      ) : heroError ? (
        <div className="border-b border-border">
          <div className="container py-20">
            <ErrorState onRetry={() => refetchHero()} />
          </div>
        </div>
      ) : (
        <div className="border-b border-border">
          <div className="container py-20">
            <div className="shimmer h-4 w-32" />
            <div className="shimmer mt-6 h-16 w-3/4 max-w-2xl" />
            <div className="shimmer mt-6 h-3 w-full max-w-xl" />
          </div>
        </div>
      )}

      <div className="container space-y-14 py-12 sm:space-y-16">
        {rails.map((r) => (
          <Rail key={r.key.join("-")} title={r.title} to={r.to} type={r.type} queryKey={r.key} queryFn={r.fn} />
        ))}
      </div>
    </>
  );
};

export default Home;
