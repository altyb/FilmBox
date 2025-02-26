import { Movie, TvShow, getImageUrl } from "@/lib/tmdb";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";

interface HeroSectionProps {
  media: Movie | TvShow;
  type: "movie" | "tv";
}

export const HeroSection = ({ media, type }: HeroSectionProps) => {
  const title = type === "movie" ? (media as Movie).title : (media as TvShow).name;
  const releaseDate = type === "movie" 
    ? (media as Movie).release_date 
    : (media as TvShow).first_air_date;

  return (
    <div className="relative h-[60vh] w-full">
      <img
        src={getImageUrl(media.backdrop_path, "original")}
        alt={title}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            {title}
          </h1>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-lg font-medium text-white">
                {media.vote_average.toFixed(1)}
              </span>
            </div>
            <span className="text-lg text-white/80">
              {new Date(releaseDate).getFullYear()}
            </span>
          </div>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            {media.overview}
          </p>
          <Link
            to={`/${type}/${media.id}`}
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};
