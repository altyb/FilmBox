import { Link } from "react-router-dom";
import { Film, Tv } from "lucide-react";
import { cn } from "@/lib/utils";
import { posterUrl, titleOf, yearOf, mediaTypeOf, type MediaSummary, type MediaType } from "@/lib/tmdb";
import { RatingMeter } from "./RatingMeter";

interface PosterCardProps {
  item: MediaSummary;
  /** Fallback when the item itself carries no media_type (list endpoints). */
  type?: MediaType;
  /** Drives the staggered entrance and the archive number on the mat. */
  index?: number;
  showIndex?: boolean;
  className?: string;
}

/** A mounted 35mm slide: poster in a paper mat, metadata printed underneath.
 *  Metadata is always visible — the old card hid it behind :hover, which put
 *  it out of reach on every touch device. */
export const PosterCard = ({ item, type, index, showIndex, className }: PosterCardProps) => {
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
          "relative border border-border bg-surface p-[3px]",
          "transition-[border-color,box-shadow] duration-200 ease-out",
          "group-hover:border-primary/60 group-focus-visible:border-primary",
          "group-hover:shadow-[0_12px_36px_-16px_hsl(var(--primary)/0.55)]",
        )}
      >
        {showIndex && index !== undefined && (
          <span className="label absolute -top-px start-1 z-10 bg-surface px-1 leading-4 text-muted-foreground">
            {String(index + 1).padStart(3, "0")}
          </span>
        )}
        <div className="relative aspect-[2/3] overflow-hidden bg-surface-2">
          {src ? (
            <img
              src={src}
              alt={title}
              width={342}
              height={513}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-[filter] duration-300 ease-out group-hover:brightness-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {/* two-line box keeps every meta row in a grid on the same baseline */}
        <h3 className="line-clamp-2 min-h-[2.25rem] text-[13px] font-medium leading-snug transition-colors duration-200 group-hover:text-primary">
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
