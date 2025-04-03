import { useQuery } from "@tanstack/react-query";
import { HeroSection } from "@/components/HeroSection";
import { MediaGrid } from "@/components/MediaGrid";
import { fetchTrending, fetchPopular } from "@/lib/tmdb";
import { useLanguageStore, translations } from "@/lib/language";

const Index = () => {
  const { language } = useLanguageStore();
  const t = translations[language];

  const { data: trendingMovies } = useQuery({
    queryKey: ["trending", "movie"],
    queryFn: () => fetchTrending("movie"),
  });

  const { data: trendingTvShows } = useQuery({
    queryKey: ["trending", "tv"],
    queryFn: () => fetchTrending("tv"),
  });

  const { data: popularMovies } = useQuery({
    queryKey: ["popular", "movie"],
    queryFn: () => fetchPopular("movie"),
  });

  const { data: popularTvShows } = useQuery({
    queryKey: ["popular", "tv"],
    queryFn: () => fetchPopular("tv"),
  });

  if (!trendingMovies || !trendingTvShows || !popularMovies || !popularTvShows) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  // Combine trending movies and TV shows for a diverse hero carousel
  const heroItems = [...trendingMovies.slice(0, 3), ...trendingTvShows.slice(0, 2)];

  return (
    <div>
      <HeroSection media={heroItems} type="movie" />
      <div className="container mx-auto px-4 py-8 space-y-12">
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-foreground">
            {t.trending} {t.movies}
          </h2>
          <MediaGrid items={trendingMovies.slice(0, 12)} type="movie" />
        </section>
        
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-foreground">
            {t.trending} {t.tvShows}
          </h2>
          <MediaGrid items={trendingTvShows.slice(0, 12)} type="tv" />
        </section>
        
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-foreground">
            {t.popular} {t.movies}
          </h2>
          <MediaGrid items={popularMovies.slice(0, 12)} type="movie" />
        </section>
        
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-foreground">
            {t.popular} {t.tvShows}
          </h2>
          <MediaGrid items={popularTvShows.slice(0, 12)} type="tv" />
        </section>
      </div>
    </div>
  );
};

export default Index;
