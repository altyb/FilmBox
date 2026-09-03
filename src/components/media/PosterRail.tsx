import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PosterCard } from "./PosterCard";
import { useT } from "@/lib/language";
import type { MediaSummary, MediaType } from "@/lib/tmdb";

/** A horizontal reel. Native scroll + snap does the work; the buttons are a
 *  pointer-only affordance on top of it, so touch and keyboard still work. */
export const PosterRail = ({
  items,
  type,
  showIndex = true,
}: {
  items: MediaSummary[];
  type?: MediaType;
  showIndex?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { t, isRtl } = useT();

  const nudge = (forward: boolean) => {
    const el = ref.current;
    if (!el) return;
    // scrollBy's axis is physical, so "forward" flips sign under RTL.
    const distance = el.clientWidth * 0.8 * (forward ? 1 : -1) * (isRtl ? -1 : 1);
    el.scrollBy({ left: distance, behavior: "smooth" });
  };

  return (
    <div className="group/rail relative">
      <div
        ref={ref}
        className="rail -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3"
      >
        {items.map((item, i) => (
          <div
            key={`${item.media_type ?? type}-${item.id}`}
            className="w-[7.5rem] shrink-0 snap-start sm:w-[8.5rem] lg:w-[9.5rem]"
          >
            <PosterCard item={item} type={type} index={i} showIndex={showIndex} />
          </div>
        ))}
      </div>

      {[false, true].map((forward) => (
        <button
          key={String(forward)}
          type="button"
          onClick={() => nudge(forward)}
          aria-label={forward ? t.scrollRight : t.scrollLeft}
          className={[
            "absolute top-[38%] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center",
            "border border-border bg-background/90 text-foreground backdrop-blur",
            "opacity-0 transition-opacity duration-200 ease-out",
            "hover:border-primary hover:text-primary focus-visible:opacity-100",
            "group-hover/rail:opacity-100 md:flex",
            forward ? "end-0" : "start-0",
          ].join(" ")}
        >
          {forward ? (
            <ChevronRight className="rtl-flip h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="rtl-flip h-4 w-4" aria-hidden="true" />
          )}
        </button>
      ))}
    </div>
  );
};
