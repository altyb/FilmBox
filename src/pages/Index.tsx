import { useQuery } from "@tanstack/react-query";
import { HeroSection } from "@/components/HeroSection";
import { MediaGrid } from "@/components/MediaGrid";
import { fetchTrending, fetchPopular } from "@/lib/tmdb";

const Index = () => {
  const { data: trendingMovies } = useQuery({
    queryKey: ["trending", "movie"],
    queryFn: () => fetchTrending("movie"),
  });

  const { data: popularMovies } = useQuery({
    queryKey: ["popular", "movie"],
    queryFn: () => fetchPopular("movie"),
  });

  const { data: popularTvShows } = useQuery({
    queryKey: ["popular", "tv"],
    queryFn: () => fetchPopular("tv"),
  });

  if (!trendingMovies || !popularMovies || !popularTvShows) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get the first 5 trending movies for the hero carousel
  const heroMovies = trendingMovies.slice(0, 5);

  return (
    <div>
      <HeroSection media={heroMovies} type="movie" />
      <div className="container mx-auto px-4 py-8 space-y-12">
        <MediaGrid title="Popular Movies" items={popularMovies} type="movie" />
        <MediaGrid title="Popular TV Shows" items={popularTvShows} type="tv" />
      </div>
    </div>
  );
};

export default Index;
