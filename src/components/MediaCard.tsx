
import { getImageUrl, Movie, TvShow } from "@/lib/tmdb";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";

interface MediaCardProps {
  media: Movie | TvShow;
  type: "movie" | "tv";
}

export const MediaCard = ({ media, type }: MediaCardProps) => {
  const title = type === "movie" ? (media as Movie).title : (media as TvShow).name;
  const releaseDate = type === "movie" 
    ? (media as Movie).release_date 
    : (media as TvShow).first_air_date;

  return (
    <Link
      to={`/${type}/${media.id}`}
      className="group relative overflow-hidden rounded-lg bg-white/5 transition-transform hover:scale-105"
    >
      <div className="aspect-[2/3] w-full overflow-hidden">
        <img
          src={getImageUrl(media.poster_path, "w500")}
          alt={title}
          className="h-full w-full object-cover transition-transform group-hover:scale-110"
          loading="lazy"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
        <div className="absolute bottom-0 p-4 text-white">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="mt-2 flex items-center gap-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{media.vote_average.toFixed(1)}</span>
            <span className="text-sm opacity-75">
              {new Date(releaseDate).getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
