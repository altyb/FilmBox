import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ExternalLink, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";
import { formatCurrency, formatDate, formatNumber, formatRuntime, formatStatus, yearFrom, formatLanguage } from "@/lib/format";
import { posterSrcSet, backdropSrcSet,
  backdropUrl,
  posterUrl,
  logoUrl,
  fetchTitle,
  fetchEnglishOverview,
  fetchSeason,
  pickTrailer,
  titleOf,
  dateOf,
  type MediaType,
  type Episode,
  type Season,
} from "@/lib/tmdb";
import { RatingMeter } from "@/components/media/RatingMeter";
import { TrailerButton } from "@/components/media/TrailerButton";
import { WatchlistButton } from "@/components/media/WatchlistButton";
import { PersonCard } from "@/components/media/PersonCard";
import { PosterRail } from "@/components/media/PosterRail";
import { SectionHead } from "@/components/common/SectionHead";
import { SpecList } from "@/components/common/SpecList";
import { ErrorState, LineSkeleton, PosterRailSkeleton } from "@/components/common/States";
import { safeHttpUrl, safeImdbId } from "@/lib/security";

/** Providers are region-specific; TMDB keys them by ISO country. */
const region = () => {
  const tag = navigator.language?.split("-")[1];
  return tag && tag.length === 2 ? tag.toUpperCase() : "US";
};

const SeasonRow = ({ tvId, season }: { tvId: string; season: Season }) => {
  const [open, setOpen] = useState(false);
  const { t, lang } = useT();

  const { data: episodes, isError, refetch } = useQuery<Episode[]>({
    queryKey: ["season", tvId, season.season_number, lang],
    queryFn: () => fetchSeason(tvId, season.season_number),
    enabled: open,
    staleTime: 60 * 60_000,
  });

  return (
    /* <details> gives keyboard support and the open/close semantics for free. */
    <details
      className="group overflow-hidden rounded-[1.25rem] bg-surface"
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="flex cursor-pointer list-none items-center gap-4 p-3 transition-colors duration-200 hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        <span className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
          {posterUrl(season.poster_path, "w185") && (
            <img src={posterUrl(season.poster_path, "w185")!} alt="" width={56} height={80} loading="lazy" className="h-full w-full object-cover" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{season.name}</span>
          <span className="label mt-1 block text-muted-foreground tabular-nums">
            {formatNumber(season.episode_count, lang)} {t.episodes}
            {season.air_date && ` · ${yearFrom(season.air_date)}`}
          </span>
        </span>
        {/* points along the reading direction when closed, down when open */}
        <ChevronDown
          className="h-4 w-4 shrink-0 -rotate-90 text-muted-foreground transition-transform duration-200 group-open:rotate-0 rtl:rotate-90"
          aria-hidden="true"
        />
      </summary>

      <ul className="divide-y divide-border">
        {isError ? (
          <li className="p-3"><ErrorState onRetry={() => refetch()} /></li>
        ) : !episodes
          ? Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="p-3"><LineSkeleton className="w-2/3" /></li>
            ))
          : episodes.map((ep) => (
              <li key={ep.id} className="flex gap-3 p-3">
                <span className="label w-8 shrink-0 pt-0.5 text-muted-foreground tabular-nums">
                  {String(ep.episode_number).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{ep.name}</span>
                  {ep.overview && (
                    <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
                      {ep.overview}
                    </span>
                  )}
                </span>
                <span className="shrink-0 pt-0.5"><RatingMeter value={ep.vote_average} /></span>
              </li>
            ))}
      </ul>
    </details>
  );
};

const Title = ({ media }: { media: MediaType }) => {
  const { id = "" } = useParams<{ id: string }>();
  const type: MediaType = media;
  const { t, lang } = useT();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["title", type, id, lang],
    queryFn: () => fetchTitle(type, id),
    staleTime: 30 * 60_000,
  });

  // TMDB's Arabic catalogue is patchy; backfill an empty synopsis rather than
  // rendering an empty block.
  const needsFallback = lang === "ar" && !!data && !data.overview;
  const { data: fallback } = useQuery({
    queryKey: ["title-en", type, id],
    queryFn: () => fetchEnglishOverview(type, id),
    enabled: needsFallback,
    staleTime: 60 * 60_000,
  });

  useEffect(() => {
    if (data) document.title = `${titleOf(data)} · ${t.brand}`;
  }, [data, t.brand]);

  // Entrance: the still settles in from a slow zoom, the poster rises, the
  // copy follows line by line. Transform + opacity only.
  const hero = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (!data) return;
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".t-bg", { scale: 1.18, opacity: 0, duration: 1.4 })
        .from(".t-poster", { y: 50, scale: 0.9, opacity: 0, duration: 0.9 }, 0.15)
        .from(".t-line", { y: 26, opacity: 0, stagger: 0.07, duration: 0.7 }, 0.3);
    },
    { scope: hero, dependencies: [data?.id] },
  );

  if (isPending) {
    return (
      <div className="mx-3 rounded-[1.75rem] bg-surface sm:mx-5">
        <div className="container grid gap-8 py-12 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-12 lg:py-16">
          <div className="shimmer mx-auto aspect-[2/3] w-40 !rounded-[1.75rem] sm:w-48 lg:mx-0 lg:w-full" />
          <div className="space-y-4 self-end">
            <LineSkeleton className="w-24" />
            <div className="shimmer h-14 w-3/4" />
            <LineSkeleton className="w-1/3" />
            <div className="flex gap-3 pt-4">
              <div className="shimmer h-11 w-36 !rounded-full" />
              <div className="shimmer h-11 w-40 !rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) return <div className="container py-20"><ErrorState onRetry={() => refetch()} /></div>;

  const name = titleOf(data);
  const year = yearFrom(dateOf(data));
  const backdrop = backdropUrl(data.backdrop_path, "w1280");
  const poster = posterUrl(data.poster_path, "w500");
  const runtime = formatRuntime(data.runtime ?? data.episode_run_time?.[0], lang);
  const overview = data.overview || fallback?.overview;

  const crew = data.credits?.crew ?? [];
  const directors = crew.filter((c) => c.job === "Director" || c.job === "Series Director");
  // One person often holds Writer + Screenplay + Story on the same film.
  const writers = crew
    .filter((c) => ["Writer", "Screenplay", "Story"].includes(c.job))
    .filter((c, i, all) => all.findIndex((o) => o.id === c.id) === i);

  const providers = data["watch/providers"]?.results?.[region()];
  const providerGroups = [
    { label: t.stream, list: providers?.flatrate },
    { label: t.rent, list: providers?.rent },
    { label: t.buy, list: providers?.buy },
  ].filter((g) => g.list?.length);

  const recommendations = data.recommendations?.results ?? [];
  const similar = data.similar?.results ?? [];
  const stills = (data.images?.backdrops ?? []).slice(0, 8);
  // season 0 is the specials bucket; it isn't a season anyone browses by
  const seasons = (data.seasons ?? []).filter((s) => s.season_number > 0);

  const specs = [
    { label: t.status, value: formatStatus(data.status, lang) },
    { label: type === "tv" ? t.firstAired : t.released, value: formatDate(dateOf(data), lang) },
    { label: t.runtime, value: runtime },
    { label: t.seasons, value: data.number_of_seasons ? formatNumber(data.number_of_seasons, lang) : null },
    { label: t.episodes, value: data.number_of_episodes ? formatNumber(data.number_of_episodes, lang) : null },
    { label: t.originalLanguage, value: formatLanguage(data.original_language ?? data.spoken_languages?.[0]?.iso_639_1, lang) },
    { label: t.budget, value: data.budget ? formatCurrency(data.budget, lang) : null },
    { label: t.revenue, value: data.revenue ? formatCurrency(data.revenue, lang) : null },
    { label: t.votes, value: data.vote_count ? formatNumber(data.vote_count, lang) : null },
  ];

  return (
    <div>
      {/* ---- hero: one rounded window, the poster sits in a cut-out corner ---- */}
      <section ref={hero} className="shimmer relative isolate mx-3 overflow-hidden !rounded-[1.75rem] !rounded-ee-none sm:mx-5">
        <div className="absolute inset-0 -z-10">
          {backdrop && (
            <img src={backdrop} srcSet={backdropSrcSet(data.backdrop_path)} sizes="100vw" alt="" aria-hidden="true" fetchPriority="high" className="t-bg no-fade h-full w-full object-cover" />
          )}
          {/* fixed dark veils: the copy is white in both themes, the still decides nothing */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent rtl:bg-gradient-to-l" />
        </div>

        <div className="flex min-h-[32rem] flex-col justify-end p-5 pb-6 pe-24 text-white sm:min-h-[38rem] sm:p-10 sm:pe-52 lg:min-h-[min(44rem,82svh)] lg:pe-[18rem]">
          <p className="t-line label text-white/70">{type === "tv" ? t.tvShows : t.movies}</p>
          <h1 className="t-line hero-copy-shadow marquee mt-3 max-w-4xl text-balance text-[clamp(2.25rem,6vw,5rem)]">{name}</h1>
          {data.tagline && (
            <p className="t-line mt-3 max-w-2xl text-pretty text-sm italic text-white/75 sm:text-base">“{data.tagline}”</p>
          )}

          <div className="t-line mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="rounded-full bg-black/45 px-3 py-1.5 backdrop-blur-sm">
              <RatingMeter value={data.vote_average} className="[&_.bg-border]:bg-white/25 [&_.label]:text-white/90" />
            </span>
            {year && <span className="label text-white/75 tabular-nums">{year}</span>}
            {runtime && <span className="label text-white/75">{runtime}</span>}
            {data.genres?.map((g) => (
              <Link
                key={g.id}
                to={`/${type}?genre=${g.id}`}
                className="label rounded-full bg-white/15 px-3 py-1 text-white/90 backdrop-blur-sm transition-colors duration-200 hover:bg-white hover:text-black"
              >
                {g.name}
              </Link>
            ))}
          </div>

          <div className="t-line mt-7 flex flex-wrap items-center gap-3">
            <TrailerButton trailer={pickTrailer(data.videos?.results)} className="bg-white text-black" />
            <WatchlistButton
              entry={{
                id: data.id,
                mediaType: type,
                title: name,
                posterPath: data.poster_path ?? null,
                year,
                rating: data.vote_average ?? null,
              }}
              className="border-white/30 bg-white/10 text-white backdrop-blur-md hover:border-white"
            />
            {safeImdbId(data.external_ids?.imdb_id, "tt") && (
              <a
                href={`https://www.imdb.com/title/${safeImdbId(data.external_ids?.imdb_id, "tt")}/`}
                target="_blank"
                rel="noreferrer noopener"
                className="label press inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-white transition-colors duration-200 hover:border-white"
              >
                IMDb
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        {/* the poster, set into the bottom-end corner of the window */}
        <div className="t-poster bite bite-be p-2.5 [--r:1.5rem] sm:p-3">
          <div className="aspect-[2/3] w-[4.5rem] overflow-hidden rounded-[1rem] bg-surface-2 sm:w-40 lg:w-60">
            {poster && <img src={poster} srcSet={posterSrcSet(data.poster_path)} sizes="(min-width: 1024px) 15rem, (min-width: 640px) 10rem, 4.5rem" alt={name} width={500} height={750} className="h-full w-full object-cover" />}
          </div>
        </div>
      </section>

      <div className="container grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
        {/* ---- main column ---- */}
        <div className="min-w-0 space-y-14">
          {overview && (
            <section className="ticket reveal space-y-4 rounded-[1.75rem] bg-surface p-6 [--ny:2.6rem] sm:p-8 sm:[--ny:3.1rem]">
              <SectionHead title={t.overview} />
              <p className="max-w-[68ch] text-pretty leading-relaxed text-foreground/90">{overview}</p>
              {needsFallback && fallback?.overview && (
                <p className="label flex items-center gap-2 text-muted-foreground">
                  <Info className="h-3.5 w-3.5" aria-hidden="true" />
                  {t.untranslated}
                </p>
              )}
            </section>
          )}

          {(directors.length > 0 || writers.length > 0) && (
            <section className="flex flex-wrap gap-x-10 gap-y-4">
              {[
                { label: type === "tv" ? t.creator : t.director, people: directors },
                { label: t.writer, people: writers },
              ]
                .filter((g) => g.people.length)
                .map((g) => (
                  <div key={g.label}>
                    <p className="label text-muted-foreground">{g.label}</p>
                    <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                      {g.people.slice(0, 3).map((p) => (
                        <Link key={`${g.label}-${p.id}`} to={`/person/${p.id}`} className="text-sm font-medium transition-colors duration-200 hover:text-foreground">
                          {p.name}
                        </Link>
                      ))}
                    </p>
                  </div>
                ))}
            </section>
          )}

          {data.credits?.cast && data.credits.cast.length > 0 && (
            <section className="reveal relative rounded-[1.75rem] bg-surface px-4 pb-4 pt-20 sm:px-6 sm:pt-24">
              <div className="dip px-6 pb-3 pt-2 sm:px-10">
                <h2 className="marquee whitespace-nowrap text-2xl sm:text-4xl">{t.cast}</h2>
              </div>
              <div className="rail -mx-1 flex gap-3 overflow-x-auto px-1 pb-3">
                {data.credits.cast.slice(0, 20).map((p, i) => (
                  <div key={p.id} className="w-24 shrink-0 sm:w-28">
                    <PersonCard id={p.id} name={p.name} role={p.character} profilePath={p.profile_path} index={i} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {type === "tv" && seasons.length > 0 && (
            <section className="space-y-4">
              <SectionHead title={t.seasons} count={String(seasons.length).padStart(2, "0")} />
              <div className="space-y-2">
                {seasons.map((s) => (
                  <SeasonRow key={s.id} tvId={id} season={s} />
                ))}
              </div>
            </section>
          )}

          {stills.length > 0 && (
            <section className="space-y-4">
              <SectionHead title={t.stills} />
              <div className="rail -mx-1 flex gap-3 overflow-x-auto px-1 pb-3">
                {stills.map((s) => (
                  <img
                    key={s.file_path}
                    src={backdropUrl(s.file_path, "w780")!}
                    srcSet={backdropSrcSet(s.file_path)}
                    sizes="(min-width: 640px) 22rem, 17rem"
                    alt=""
                    width={390}
                    height={219}
                    loading="lazy"
                    className="h-auto w-[17rem] shrink-0 rounded-2xl object-cover sm:w-[22rem]"
                  />
                ))}
              </div>
            </section>
          )}

          {recommendations.length > 0 && (
            <section className="space-y-4">
              <SectionHead title={t.recommended} />
              <PosterRail items={recommendations.slice(0, 20)} type={type} showIndex={false} />
            </section>
          )}

          {similar.length > 0 && (
            <section className="space-y-4">
              <SectionHead title={t.moreLikeThis} />
              <PosterRail items={similar.slice(0, 20)} type={type} showIndex={false} />
            </section>
          )}
        </div>

        {/* ---- spec sheet ---- */}
        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          {providerGroups.length > 0 && (
            <div className="rounded-[1.5rem] bg-surface p-5">
              <p className="label text-muted-foreground">{t.whereToWatch}</p>
              <div className="mt-4 space-y-4">
                {providerGroups.map((g) => (
                  <div key={g.label}>
                    <p className="label text-muted-foreground">{g.label}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {g.list!.map((p) => (
                        <img
                          key={p.provider_id}
                          src={logoUrl(p.logo_path)!}
                          alt={p.provider_name}
                          title={p.provider_name}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="label mt-4 text-muted-foreground">{t.providersRegion} {region()}</p>
            </div>
          )}

          <div className="rounded-[1.5rem] bg-surface p-5">
            <p className="label mb-4 text-muted-foreground">{t.brand} · {String(data.id).padStart(6, "0")}</p>
            <SpecList items={specs} />
          </div>

          {data.production_companies && data.production_companies.length > 0 && (
            <div>
              <p className="label mb-3 text-muted-foreground">{data.networks?.length ? t.network : t.studios}</p>
              <ul className="space-y-2">
                {(data.networks?.length ? data.networks : data.production_companies).slice(0, 6).map((c) => (
                  <li key={c.id} className="flex items-center gap-3">
                    {c.logo_path ? (
                      <img src={logoUrl(c.logo_path)!} alt="" width={40} height={20} loading="lazy" className="h-5 w-10 object-contain opacity-70 dark:invert" />
                    ) : (
                      <span className="h-5 w-10 rounded-md bg-surface-2" aria-hidden="true" />
                    )}
                    <span className="min-w-0 break-words text-xs text-muted-foreground">{c.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {safeHttpUrl(data.homepage) && (
            <a
              href={safeHttpUrl(data.homepage)!}
              target="_blank"
              rel="noreferrer noopener"
              className={cn("label inline-flex items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-foreground")}
            >
              {t.homepage}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Title;
