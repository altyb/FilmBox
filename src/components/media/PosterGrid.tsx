import { PosterCard } from "./PosterCard";
import type { MediaSummary, MediaType } from "@/lib/tmdb";

export const PosterGrid = ({
  items,
  type,
  showIndex,
}: {
  items: MediaSummary[];
  type?: MediaType;
  showIndex?: boolean;
}) => (
  <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
    {items.map((item, i) => (
      <PosterCard
        key={`${item.media_type ?? type}-${item.id}`}
        item={item}
        type={type}
        index={i}
        showIndex={showIndex}
      />
    ))}
  </div>
);
