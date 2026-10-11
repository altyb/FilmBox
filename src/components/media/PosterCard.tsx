import { Link } from "react-router-dom";
import { Film, Tv } from "lucide-react";
import { cn } from "@/lib/utils";
import { posterUrl, posterSrcSet, titleOf, yearOf, mediaTypeOf, type MediaSummary, type MediaType } from "@/lib/tmdb";
import { RatingMeter } from "./RatingMeter";

interface PosterCardProps {
  item: MediaSummary;
  /** Fallback when the item itself carries no media_type (list endpoints). */
  type?: MediaType;
  /** Drives the staggered entrance and the archive number on the mat. */
  index?: number;
  showIndex?: boolean;
  className?: string;
  /** img `sizes`; rails know their exact tile width, grids default to a share of the viewport. */
  sizes?: string;
}

/** Poster as a soft rounded tile, metadata underneath.
 *  Metadata is always visible — the old card hid it behind :hover, which put
 *  it out of reach on every touch device. */
export const PosterCard = ({ item, type, index, showIndex, className, sizes }: PosterCardProps) => {
  const mediaType = mediaTypeOf(item, type);
  const title = titleOf(item);
  const year = yearOf(item);
  const src = posterUrl(item.poster_path, "w342");
  const Icon = mediaType === "tv" ? Tv : Film;

  return (
    <Link
      to={`/${mediaType}/${item.id}`}
      className={cn("group block press stagger-in", className)}
      style={index !== undefined ? ({ "--i": Math.min(index, 12) } as React.CSSProperties) : undefined}
    >
      <div
        className={cn(
          "relative transition-transform duration-300 ease-out",
          "group-hover:-translate-y-1 group-focus-visible:-translate-y-1",
        )}
      >
        {showIndex && index !== undefined && (
          <span className="label absolute start-2 top-2 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[0.6rem] text-white backdrop-blur-sm">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
        <div className="shimmer relative aspect-[2/3] overflow-hidden !rounded-[1.25rem] bg-surface-2 shadow-[0_10px_30px_-18px_rgb(0_0_0/0.6)] ring-1 ring-inset ring-foreground/5 transition-shadow duration-300 group-hover:shadow-[0_22px_44px_-18px_rgb(0_0_0/0.7)]">
          {src ? (
            <img
              src={src}
              srcSet={posterSrcSet(item.poster_path)}
              sizes={sizes ?? "(min-width: 1024px) 200px, (min-width: 640px) 25vw, 34vw"}
              alt={title}
              width={342}
              height={513}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-2.5 space-y-1 px-0.5">
        {/* two-line box keeps every meta row in a grid on the same baseline */}
        <h3 className="line-clamp-2 min-h-[2.25rem] text-[13px] font-medium leading-snug">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {year && <span className="label text-muted-foreground tabular-nums">{year}</span>}
          <RatingMeter value={item.vote_average} />
        </div>
      </div>
    </Link>
  );
};
