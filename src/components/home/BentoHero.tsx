import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";
import { hideBoot } from "@/lib/boot";
import { formatRuntime, yearFrom } from "@/lib/format";
import {
  backdropUrl,
  backdropSrcSet,
  posterSrcSet,
  posterUrl,
  titleOf,
  dateOf,
  mediaTypeOf,
  fetchTitle,
  pickTrailer,
  type MediaSummary,
} from "@/lib/tmdb";
import { TrailerButton } from "@/components/media/TrailerButton";
import { WatchlistButton } from "@/components/media/WatchlistButton";

gsap.registerPlugin(useGSAP);
/** Hero stills: on phones they sit under dark veils, so a lighter file is enough. Keep in sync with the preload in main.tsx. */
export const HERO_SIZES = "(max-width: 768px) 60vw, 100vw";

const hrefFor = (item: MediaSummary) => `/${mediaTypeOf(item)}/${item.id}`;

/** Liquid pager: a white blob flows between 01/02/03. Two blobs (fast lead,
 *  elastic trail) under an SVG goo filter stretch and merge like a drop. */
const LiquidPager = ({ slides, index, onSelect }: { slides: MediaSummary[]; index: number; onSelect: (i: number) => void }) => {
  const root = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP(
    () => {
      const btn = root.current?.querySelectorAll<HTMLElement>("[data-slide]")[index];
      if (!btn) return;
      gsap.to(".goo-lead", { y: btn.offsetTop, duration: 0.45, ease: "power3.out" });
      gsap.to(".goo-trail", { y: btn.offsetTop, duration: 1, ease: "elastic.out(1, 0.5)", delay: 0.06 });
    },
    { scope: root, dependencies: [index] },
  );

  const press = contextSafe((el: HTMLElement) =>
    gsap.fromTo(el, { scale: 0.8 }, { scale: 1, duration: 0.7, ease: "elastic.out(1.2, 0.4)" }),
  );

  return (
    <div ref={root} className="absolute end-4 top-1/2 z-20 -translate-y-1/2 sm:end-6">
      <svg aria-hidden="true" className="absolute h-0 w-0">
        <filter id="hero-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
        </filter>
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ filter: "url(#hero-goo)" }}>
        <span className="goo-trail absolute inset-x-0 top-0 h-12 rounded-full bg-white sm:h-14" />
        <span className="goo-lead absolute inset-x-0 top-0 h-12 rounded-full bg-white sm:h-14" />
      </div>
      <div className="relative flex flex-col gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            data-slide
            type="button"
            aria-label={titleOf(s)}
            aria-current={i === index}
            onClick={(e) => {
              press(e.currentTarget);
              onSelect(i);
            }}
            className={cn(
              "label flex h-12 w-9 items-center justify-center rounded-full border text-[0.7rem] tabular-nums transition-colors duration-300 sm:h-14 sm:w-11",
              i === index ? "border-transparent text-black delay-150" : "border-white/45 text-white hover:border-white",
            )}
          >
            {String(i + 1).padStart(2, "0")}
          </button>
        ))}
      </div>
    </div>
  );
};

/** All slide stills stacked (so they preload); the active one zooms and fades
 *  in, the others fade out. No animated blur: it repaints the whole still each
 *  frame and stutters on phones. */
const HeroBackdrops = ({ slides, index }: { slides: MediaSummary[]; index: number }) => {
  const root = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useGSAP(
    () => {
      const imgs = gsap.utils.toArray<HTMLElement>("[data-bg]");
      // First still: on screen at once (it is the LCP image) - the zoom/fade
      // entrance is only for later slide changes.
      if (first.current) {
        first.current = false;
        imgs.forEach((img, i) => gsap.set(img, { opacity: i === index ? 1 : 0 }));
        return;
      }
      imgs.forEach((img, i) =>
        i === index
          ? gsap.fromTo(
              img,
              { opacity: 0, scale: 1.12 },
              { opacity: 1, scale: 1, duration: 1.2, ease: "power3.out", overwrite: true },
            )
          : gsap.to(img, { opacity: 0, scale: 1.04, duration: 0.8, ease: "power2.in", overwrite: true }),
      );
    },
    { scope: root, dependencies: [index] },
  );

  return (
    <div ref={root} className="absolute inset-0">
      {slides.map((s, i) => {
        const src = backdropUrl(s.backdrop_path);
        return src ? (
          <img
            key={s.id}
            data-bg
            src={src}
            srcSet={backdropSrcSet(s.backdrop_path)}
            sizes={HERO_SIZES}
            alt=""
            aria-hidden="true"
            fetchPriority={i === 0 ? "high" : "low"}
            onLoad={i === 0 ? hideBoot : undefined}
            onError={i === 0 ? hideBoot : undefined}
            style={{ opacity: 0 }}
            className="absolute inset-0 h-full w-full object-cover will-change-transform"
          />
        ) : (
          <span key={s.id} data-bg className="absolute inset-0" />
        );
      })}
    </div>
  );
};

/** Small poster card in the lower strip: tag, title, one action. */
const PosterCell = ({ item, tag, i }: { item: MediaSummary; tag: string; i: number }) => {
  const { t } = useT();
  const photo = posterUrl(item.poster_path);
  const year = yearFrom(dateOf(item));

  return (
    <Link
      to={hrefFor(item)}
      style={{ "--i": i } as React.CSSProperties}
      className="stagger-in group relative block min-h-[max(14rem,calc(40svh-4.25rem))] overflow-hidden rounded-[1.25rem] lg:min-h-60"
    >
      {/* the shimmer lives on its own layer: on the link it would replace the
          stagger-in animation and leave the card at opacity 0 */}
      <span aria-hidden="true" className="shimmer absolute inset-0 !rounded-none">
        {photo && (
          <img
            src={photo}
            srcSet={posterSrcSet(item.poster_path)}
            sizes="(min-width: 1024px) 20vw, 50vw"
            alt=""
            width={500}
            height={750}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          />
        )}
      </span>
      <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" aria-hidden="true" />
      <span className="label absolute start-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[0.65rem] text-white/90 backdrop-blur-md">
        {tag}
      </span>
      <span className="absolute inset-x-3 bottom-3 flex flex-col gap-2">
        <span className="marquee line-clamp-2 text-xl text-white sm:text-2xl">{titleOf(item)}</span>
        {year && <span className="label text-[0.65rem] text-white/70 tabular-nums">{year}</span>}
        <span className="label flex w-full items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-[0.7rem] font-bold text-black">
          <Play className="rtl-flip h-3 w-3 fill-current" aria-hidden="true" />
          {t.watch}
        </span>
      </span>
    </Link>
  );
};

/** The home hero, built on one window: a spotlight carousel on top with a
 *  notched play button, two poster cards + the pitch + a round teaser below. */
export const BentoHero = ({ items }: { items: MediaSummary[] }) => {
  const { t, lang } = useT();
  const slides = items.slice(0, 3);
  const [cards, teaser] = [items.slice(3, 5), items[5]];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Autoplay: next still every 7s. Restarts after a manual pick (keyed on
  // index), pauses while the pointer or focus is on the hero or the tab is in
  // the background, and stays off for reduced motion.
  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  useEffect(() => {
    if (paused || hidden || slides.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % slides.length), 7000);
    return () => clearTimeout(id);
  }, [index, paused, hidden, slides.length]);
  const featured = slides[index] ?? slides[0];

  const type = featured ? mediaTypeOf(featured) : "movie";
  const { data: details } = useQuery({
    queryKey: ["hero", type, featured?.id, lang],
    queryFn: () => fetchTitle(type, String(featured!.id)),
    enabled: !!featured,
    staleTime: 30 * 60_000,
  });

  const copy = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.from(".copy-line", { y: 28, opacity: 0, stagger: 0.08, duration: 0.8, ease: "power3.out" });
    },
    { scope: copy, dependencies: [featured?.id] },
  );

  if (!featured) return null;

  const title = titleOf(featured);
  const year = yearFrom(dateOf(featured));
  const runtime = formatRuntime(details?.runtime ?? details?.episode_run_time?.[0], lang);
  const genres = details?.genres?.slice(0, 2).map((g) => g.name) ?? [];
  const meta = [year, ...genres, runtime].filter(Boolean).join(" · ");
  const trailer = pickTrailer(details?.videos?.results);
  const teaserImg = teaser ? backdropUrl(teaser.backdrop_path) ?? posterUrl(teaser.poster_path, "w500") : null;

  return (
    <section aria-label={t.nowShowing} className="p-3 sm:p-5">
      <div className="flex flex-col gap-3 lg:min-h-[calc(100svh-2.5rem)]">
        {/* ---- spotlight ---- */}
        <div
          className="relative z-10 min-h-[max(24rem,60svh)] lg:min-h-[54svh] lg:flex-[1.25]"
          onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setPaused(false)}
        >
          <div className="shimmer absolute inset-0 overflow-hidden !rounded-[1.5rem]">
          <HeroBackdrops slides={slides} index={index} />
          {/* theme-independent veil behind the copy, bottom start only */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent ltr:sm:bg-gradient-to-tr rtl:sm:bg-gradient-to-tl"
          />
          </div>

          {slides.length > 1 && <LiquidPager slides={slides} index={index} onSelect={setIndex} />}

          <div ref={copy} className="absolute inset-x-0 bottom-0 z-10 p-5 pb-14 pe-16 sm:p-8 sm:pb-12 sm:pe-24 lg:pb-10">
            <h1 className="copy-line hero-copy-shadow marquee max-w-3xl text-balance text-white text-[clamp(2.25rem,6vw,4.5rem)]">{title}</h1>
            {meta && <p className="copy-line hero-copy-shadow label mt-3 text-white/75">{meta}</p>}
            <div className="copy-line mt-6 flex flex-wrap items-center gap-3">
              <Link
                to={hrefFor(featured)}
                className="label press inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-black transition-opacity duration-200 hover:opacity-90"
              >
                <Play className="rtl-flip h-3.5 w-3.5 fill-current" aria-hidden="true" />
                {t.watch}
              </Link>
              <WatchlistButton
                entry={{
                  id: featured.id,
                  mediaType: type,
                  title,
                  posterPath: featured.poster_path,
                  year: year || null,
                  rating: featured.vote_average ?? null,
                }}
                className="rounded-xl border-white/30 bg-white/15 text-white backdrop-blur-md hover:border-white hover:text-white"
              />
            </div>
          </div>

          {/* Concave fillets where the notch meets the still's bottom edge, so the
              cut-out curves in instead of meeting it at a sharp corner. One path:
              fillet r=18 → notch arc R=52 → fillet, scaled to the notch size per
              breakpoint (R = button/2 + padding: 38 / 44 / 52px). */}
          <svg
            aria-hidden="true"
            viewBox="0 0 135.292 52"
            className="pointer-events-none absolute -bottom-px left-1/2 z-10 h-[38px] -translate-x-1/2 text-background sm:h-[44px] lg:h-[52px]"
          >
            <path
              fill="currentColor"
              d="M0 52A18 18 0 0 0 17.394 38.629A52 52 0 0 1 117.898 38.629A18 18 0 0 0 135.292 52Z"
            />
          </svg>
          {/* the notch: a page-coloured bite with the trailer button in it */}
          <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2 rounded-full bg-background p-2.5 sm:p-3">
            {trailer ? (
              <TrailerButton
                trailer={trailer}
                className="press flex h-14 w-14 items-center justify-center rounded-full bg-black text-white transition-transform hover:scale-105 sm:h-16 sm:w-16 lg:h-20 lg:w-20"
              >
                <Play className="rtl-flip h-6 w-6 fill-current" aria-hidden="true" />
                <span className="sr-only">{t.watchTrailer}</span>
              </TrailerButton>
            ) : (
              <Link
                to={hrefFor(featured)}
                aria-label={title}
                className="press flex h-14 w-14 items-center justify-center rounded-full bg-black text-white sm:h-16 sm:w-16 lg:h-20 lg:w-20"
              >
                <Play className="rtl-flip h-6 w-6 fill-current" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>

        {/* ---- lower strip ---- */}
        <div className="mt-8 grid grid-cols-2 gap-3 lg:mt-0 lg:min-h-[17rem] lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2.4fr)]">
          {cards.map((item, i) => (
            <PosterCell key={item.id} item={item} tag={i === 0 ? t.recommended : t.trendingSeries} i={i + 1} />
          ))}

          {/* the pitch over a full still that fades into the page where the text sits */}
          <Link
            to={teaser ? hrefFor(teaser) : "/movie"}
            className="shimmer group relative col-span-2 flex min-h-56 items-center overflow-hidden !rounded-[1.25rem] px-6 py-10 sm:px-10 lg:col-span-1 lg:py-8"
          >
            {teaserImg && (
              <img
                src={teaserImg}
                srcSet={backdropSrcSet(teaser?.backdrop_path)}
                sizes="(min-width: 1024px) 55vw, 100vw"
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            )}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/0 rtl:bg-gradient-to-l"
            />
            <div className="relative max-w-md">
              <p className="text-sm text-muted-foreground">{t.heroTagline}</p>
              <p className="marquee mt-3 text-balance text-foreground text-[clamp(2rem,3.4vw,3.5rem)]">{t.heroHeadline}</p>
            </div>
            {teaser && (
              <span className="label absolute bottom-4 end-4 rounded-full bg-black/50 px-3 py-1.5 text-white backdrop-blur-md">
                {titleOf(teaser)}
              </span>
            )}
          </Link>
        </div>
      </div>
    </section>
  );
};
