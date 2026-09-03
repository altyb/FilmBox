import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";
import { formatRuntime, yearFrom } from "@/lib/format";
import {
  backdropUrl,
  posterUrl,
  titleOf,
  dateOf,
  mediaTypeOf,
  fetchTitle,
  pickTrailer,
  type MediaSummary,
} from "@/lib/tmdb";
import { RatingMeter } from "@/components/media/RatingMeter";
import { TrailerDialog } from "@/components/media/TrailerDialog";

const INTERVAL = 7000;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The projector: one backdrop thrown on the wall, the poster mounted in a
 *  35mm gate beside it. Auto-advance stops on hover, on focus, and whenever
 *  the visitor has asked for reduced motion. */
export const ProjectorHero = ({ items }: { items: MediaSummary[] }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const { t, lang } = useT();
  const liveRef = useRef<HTMLDivElement>(null);

  const slides = items.slice(0, 5);
  const current = slides[index];
  const type = current ? mediaTypeOf(current) : "movie";

  useEffect(() => {
    if (slides.length <= 1 || paused || prefersReducedMotion()) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL);
    return () => clearInterval(id);
  }, [slides.length, paused]);

  // Only the visible slide's trailer is fetched — one request, not five.
  const { data: details } = useQuery({
    queryKey: ["hero", type, current?.id, lang],
    queryFn: () => fetchTitle(type, String(current!.id)),
    enabled: !!current,
    staleTime: 5 * 60_000,
  });

  if (!current) return null;

  const title = titleOf(current);
  const year = yearFrom(dateOf(current));
  const runtime = formatRuntime(details?.runtime ?? details?.episode_run_time?.[0], lang);
  const backdrop = backdropUrl(current.backdrop_path, "w1280");
  const poster = posterUrl(current.poster_path, "w500");

  return (
    <section
      className="relative isolate overflow-hidden border-b border-border"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label={t.nowShowing}
    >
      {/* the projected image */}
      <div className="absolute inset-0 -z-10">
        {backdrop && (
          <img
            key={backdrop}
            src={backdrop}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            className="projected h-full w-full object-cover blur-[1px] motion-safe:animate-[cell-in_700ms_cubic-bezier(0.23,1,0.32,1)_forwards]"
          />
        )}
        <div className="beam absolute inset-0" />
        <div className="projection-veil absolute inset-0" />
      </div>

      <div className="container grid gap-8 py-12 sm:py-16 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:items-end lg:gap-12 lg:py-20">
        {/* poster in the film gate */}
        <div className="film-gate relative hidden w-full max-w-[15rem] border border-border bg-surface p-[3px] shadow-2xl lg:block">
          <div className="aspect-[2/3] overflow-hidden bg-surface-2">
            {poster && (
              <img
                key={poster}
                src={poster}
                alt={title}
                width={500}
                height={750}
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>

        <div ref={liveRef} aria-live="polite" className="min-w-0">
          <p className="label text-primary">
            {t.nowShowing}
            <span className="mx-2 text-muted-foreground" aria-hidden="true">/</span>
            <span className="tabular-nums text-muted-foreground">
              {String(index + 1).padStart(2, "0")} — {String(slides.length).padStart(2, "0")}
            </span>
          </p>

          <h1 className="marquee mt-4 text-balance text-[clamp(2.25rem,7vw,4.75rem)]">
            {title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <RatingMeter value={current.vote_average} />
            {year && <span className="label text-muted-foreground tabular-nums">{year}</span>}
            {runtime && <span className="label text-muted-foreground">{runtime}</span>}
            <span className="label text-muted-foreground">
              {type === "tv" ? t.tvShows : t.movies}
            </span>
          </div>

          {current.overview && (
            <p className="mt-5 line-clamp-3 max-w-[60ch] text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              {current.overview}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <TrailerDialog trailer={pickTrailer(details?.videos?.results)} />
            <Link
              to={`/${type}/${current.id}`}
              className="label press inline-flex items-center gap-2 border border-border px-5 py-3 transition-colors duration-200 ease-out hover:border-primary hover:text-primary"
            >
              {t.overview}
              <ArrowRight className="rtl-flip h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {/* film-strip indicators */}
          {slides.length > 1 && (
            <div className="mt-8 flex items-center gap-1.5">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={titleOf(slide)}
                  aria-current={i === index}
                  className={cn(
                    "h-[3px] transition-[width,background-color] duration-300 ease-out",
                    i === index ? "w-10 bg-primary" : "w-4 bg-border hover:bg-muted-foreground",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
