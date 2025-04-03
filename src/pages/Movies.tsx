import { useQuery } from "@tanstack/react-query";
import { fetchTrending, fetchPopular } from "@/lib/tmdb";
import { MediaGrid } from "@/components/MediaGrid";
import { HeroSection } from "@/components/HeroSection";
import { useLanguageStore, translations } from "@/lib/language";

const Movies = () => {
  const { language } = useLanguageStore();
  const t = translations[language];

  const { data: trendingMovies, isLoading: isLoadingTrending } = useQuery({
    queryKey: ["trending", "movie"],
    queryFn: () => fetchTrending("movie"),
  });

  const { data: popularMovies, isLoading: isLoadingPopular } = useQuery({
    queryKey: ["popular", "movie"],
    queryFn: () => fetchPopular("movie"),
  });

  if (isLoadingTrending || isLoadingPopular) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!trendingMovies || !popularMovies) return null;

  // Get the first movie for the hero section
  const heroMovie = trendingMovies[0];

  return (
    <div className="min-h-screen bg-background">
      <HeroSection media={heroMovie} type="movie" />
      <div className="mx-auto max-w-7xl space-y-12 p-8">
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-foreground">
            {t.trending} {t.movies}
          </h2>
          <MediaGrid items={trendingMovies.slice(1)} type="movie" />
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-semibold text-foreground">
            {t.popular} {t.movies}
          </h2>
          <MediaGrid items={popularMovies} type="movie" />
        </section>
      </div>
    </div>
  );
};

export default Movies;
