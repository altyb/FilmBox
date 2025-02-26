import { Movie, TvShow } from "@/lib/tmdb";
import { MediaCard } from "./MediaCard";

interface MediaGridProps {
  items: (Movie | TvShow)[];
  type: "movie" | "tv";
}

export const MediaGrid = ({ items, type }: MediaGridProps) => {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
      {items.map((item) => (
        <MediaCard key={item.id} media={item} type={type} />
      ))}
    </div>
  );
};
