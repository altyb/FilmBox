
import { useQuery } from "@tanstack/react-query";
import { fetchTrending, fetchPopular } from "@/lib/tmdb";
import { MediaGrid } from "@/components/MediaGrid";
import { HeroSection } from "@/components/HeroSection";

const TvShows = () => {
  const { data: trendingTvShows, isLoading: isLoadingTrending } = useQuery({
    queryKey: ["trending", "tv"],
    queryFn: () => fetchTrending("tv"),
  });

  const { data: popularTvShows, isLoading: isLoadingPopular } = useQuery({
    queryKey: ["popular", "tv"],
    queryFn: () => fetchPopular("tv"),
  });

  if (isLoadingTrending || isLoadingPopular) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!trendingTvShows || !popularTvShows) return null;

  return (
    <div className="min-h-screen bg-background">
      <HeroSection media={trendingTvShows[0]} type="tv" />
      <div className="mx-auto max-w-7xl space-y-12 p-8">
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-foreground">
            Trending TV Shows
          </h2>
          <MediaGrid items={trendingTvShows.slice(1)} type="tv" />
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-semibold text-foreground">
            Popular TV Shows
          </h2>
          <MediaGrid items={popularTvShows} type="tv" />
        </section>
      </div>
    </div>
  );
};

export default TvShows;
