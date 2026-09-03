import { cn } from "@/lib/utils";
import { formatRating } from "@/lib/format";

/** A light meter, not a star: five segments, one per two points of the score.
 *  Colour is never the only signal — the numeral carries it too. */
export const RatingMeter = ({
  value,
  className,
  showValue = true,
}: {
  value?: number | null;
  className?: string;
  showValue?: boolean;
}) => {
  const rating = formatRating(value);
  if (!rating) return null;

  const lit = Math.round((value as number) / 2);

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className="flex items-center gap-[2px]"
        role="img"
        aria-label={`${rating} / 10`}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={cn(
              "block h-[3px] w-[5px]",
              i < lit ? "bg-primary" : "bg-border",
            )}
          />
        ))}
      </span>
      {showValue && (
        <span className="label text-muted-foreground tabular-nums" aria-hidden="true">
          {rating}
        </span>
      )}
    </span>
  );
};
