import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatRuntime,
  formatStatus,
  yearFrom,
} from "@/lib/format";
import {
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
import { TrailerDialog } from "@/components/media/TrailerDialog";
import { WatchlistButton } from "@/components/media/WatchlistButton";
import { PersonCard } from "@/components/media/PersonCard";
import { PosterRail } from "@/components/media/PosterRail";
import { SectionHead } from "@/components/common/SectionHead";
import { SpecList } from "@/components/common/SpecList";
import { ErrorState, LineSkeleton, PosterRailSkeleton } from "@/components/common/States";

/** Providers are region-specific; TMDB keys them by ISO country. */
const region = () => {
  const tag = navigator.language?.split("-")[1];
  return tag && tag.length === 2 ? tag.toUpperCase() : "US";
};

const SeasonRow = ({ tvId, season }: { tvId: string; season: Season }) => {
  const [open, setOpen] = useState(false);
  const { t, lang } = useT();

  const { data: episodes } = useQuery<Episode[]>({
    queryKey: ["season", tvId, season.season_number, lang],
    queryFn: () => fetchSeason(tvId, season.season_number),
    enabled: open,
    staleTime: 10 * 60_000,
  });

  return (
    /* <details> gives keyboard support and the open/close semantics for free. */
    <details
      className="group border border-border bg-surface"
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="flex cursor-pointer list-none items-center gap-4 p-3 transition-colors duration-200 hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        <span className="relative h-20 w-14 shrink-0 overflow-hidden border border-border bg-surface-2">
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
        <span className="label shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90" aria-hidden="true">
          ▸
        </span>
      </summary>

      <ul className="divide-y divide-border border-t border-border">
        {!episodes
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
  });

  // TMDB's Arabic catalogue is patchy; backfill an empty synopsis rather than
  // rendering an empty block.
  const needsFallback = lang === "ar" && !!data && !data.overview;
  const { data: fallback } = useQuery({
    queryKey: ["title-en", type, id],
    queryFn: () => fetchEnglishOverview(type, id),
    enabled: needsFallback,
  });

  useEffect(() => {
    if (data) document.title = `${titleOf(data)} · ${t.brand}`;
  }, [data, t.brand]);

  if (isPending) {
    return (
      <div className="container py-16">
        <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <div className="shimmer hidden aspect-[2/3] w-full lg:block" />
          <div className="space-y-4">
            <div className="shimmer h-14 w-3/4" />
            <LineSkeleton className="w-1/3" />
            <LineSkeleton />
            <LineSkeleton className="w-5/6" />
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
    { label: t.originalLanguage, value: data.spoken_languages?.[0]?.english_name ?? data.original_language?.toUpperCase() },
    { label: t.budget, value: data.budget ? formatCurrency(data.budget, lang) : null },
    { label: t.revenue, value: data.revenue ? formatCurrency(data.revenue, lang) : null },
    { label: t.votes, value: data.vote_count ? formatNumber(data.vote_count, lang) : null },
  ];

  return (
    <div>
      {/* ---- projected backdrop ---- */}
      <section className="relative isolate overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10">
          {backdrop && (
            <img src={backdrop} alt="" aria-hidden="true" fetchPriority="high" className="projected h-full w-full object-cover" />
          )}
          <div className="beam absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/25" />
        </div>

        <div className="container grid gap-8 py-12 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-12 lg:py-16">
          <div className="film-gate relative mx-auto w-40 border border-border bg-surface p-[3px] shadow-2xl sm:w-48 lg:mx-0 lg:w-full">
            <div className="aspect-[2/3] overflow-hidden bg-surface-2">
              {poster && <img src={poster} alt={name} width={500} height={750} fetchPriority="high" className="h-full w-full object-cover" />}
            </div>
          </div>

          <div className="min-w-0">
            <p className="label text-primary">{type === "tv" ? t.tvShows : t.movies}</p>
            <h1 className="marquee mt-3 text-balance text-[clamp(2rem,6vw,4rem)]">{name}</h1>
            {data.tagline && (
              <p className="mt-3 text-pretty text-sm italic text-muted-foreground sm:text-base">“{data.tagline}”</p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <RatingMeter value={data.vote_average} />
              {year && <span className="label text-muted-foreground tabular-nums">{year}</span>}
              {runtime && <span className="label text-muted-foreground">{runtime}</span>}
              {data.genres?.map((g) => (
                <Link
                  key={g.id}
                  to={`/${type}?genre=${g.id}`}
                  className="label border border-border px-2 py-0.5 text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
                >
                  {g.name}
                </Link>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <TrailerDialog trailer={pickTrailer(data.videos?.results)} />
              <WatchlistButton
                entry={{
                  id: data.id,
                  mediaType: type,
                  title: name,
                  posterPath: data.poster_path ?? null,
                  year,
                  rating: data.vote_average ?? null,
                }}
              />
              {data.external_ids?.imdb_id && (
                <a
                  href={`https://www.imdb.com/title/${data.external_ids.imdb_id}/`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="label press inline-flex items-center gap-2 border border-border px-5 py-3 transition-colors duration-200 hover:border-primary hover:text-primary"
                >
                  IMDb
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
        {/* ---- main column ---- */}
        <div className="min-w-0 space-y-14">
          {overview && (
            <section className="space-y-4">
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
                        <Link key={`${g.label}-${p.id}`} to={`/person/${p.id}`} className="text-sm font-medium transition-colors duration-200 hover:text-primary">
                          {p.name}
                        </Link>
                      ))}
                    </p>
                  </div>
                ))}
            </section>
          )}

          {data.credits?.cast && data.credits.cast.length > 0 && (
            <section className="space-y-4">
              <SectionHead title={t.cast} />
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
                    alt=""
                    width={390}
                    height={219}
                    loading="lazy"
                    className="h-auto w-[17rem] shrink-0 border border-border object-cover sm:w-[22rem]"
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
            <div className="border border-border bg-surface p-4">
              <p className="label text-primary">{t.whereToWatch}</p>
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
                          className="h-8 w-8 border border-border object-cover"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="label mt-4 text-muted-foreground">{t.providersRegion} {region()}</p>
            </div>
          )}

          <div className="border border-border bg-surface p-4">
            <p className="label mb-4 text-primary">{t.brand} · {String(data.id).padStart(6, "0")}</p>
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
                      <span className="h-5 w-10 border border-border" aria-hidden="true" />
                    )}
                    <span className="text-xs text-muted-foreground">{c.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.homepage && (
            <a
              href={data.homepage}
              target="_blank"
              rel="noreferrer noopener"
              className={cn("label inline-flex items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-primary")}
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
