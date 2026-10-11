import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";
import { formatDate, formatGender, formatNumber, yearFrom } from "@/lib/format";
import { fetchPerson, profileUrl, posterUrl, backdropUrl, backdropSrcSet, titleOf, dateOf, mediaTypeOf, type MediaSummary } from "@/lib/tmdb";
import { PosterRail } from "@/components/media/PosterRail";
import { PosterGrid } from "@/components/media/PosterGrid";
import { SectionHead } from "@/components/common/SectionHead";
import { SpecList } from "@/components/common/SpecList";
import { ErrorState, LineSkeleton } from "@/components/common/States";
import { safeImdbId } from "@/lib/security";

const byDateDesc = (a: MediaSummary, b: MediaSummary) =>
  (dateOf(b) || "0").localeCompare(dateOf(a) || "0");

/** One credit can appear twice (an actor who also produced). Keyed by
 *  type+id so the grid doesn't render duplicate React keys. */
const dedupe = (items: MediaSummary[]) => {
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = `${mediaTypeOf(i)}-${i.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const Person = () => {
  const { id = "" } = useParams();
  const { t, lang } = useT();
  const [tab, setTab] = useState<"cast" | "crew">("cast");
  const [expanded, setExpanded] = useState(false);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["person", id, lang],
    queryFn: () => fetchPerson(id),
    staleTime: 60 * 60_000,
  });

  useEffect(() => {
    if (data) document.title = `${data.name} · ${t.brand}`;
  }, [data, t.brand]);

  const cast = useMemo(() => dedupe(data?.combined_credits?.cast ?? []).sort(byDateDesc), [data]);
  const crew = useMemo(() => dedupe(data?.combined_credits?.crew ?? []).sort(byDateDesc), [data]);
  const knownFor = useMemo(
    () => dedupe([...(data?.combined_credits?.cast ?? []), ...(data?.combined_credits?.crew ?? [])])
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      .slice(0, 16),
    [data],
  );

  if (isPending) {
    return (
      <div className="container py-16 space-y-4">
        <div className="shimmer h-12 w-1/2 max-w-md" />
        <LineSkeleton />
        <LineSkeleton className="w-4/5" />
      </div>
    );
  }
  if (isError || !data) return <div className="container py-20"><ErrorState onRetry={() => refetch()} /></div>;

  const photo = profileUrl(data.profile_path, "h632");
  const bio = data.biography?.trim();
  const specs = [
    { label: t.knownFor, value: data.known_for_department },
    { label: t.born, value: formatDate(data.birthday, lang) },
    { label: t.died, value: formatDate(data.deathday, lang) },
    { label: t.bornIn, value: data.place_of_birth },
    { label: t.gender, value: formatGender(data.gender, lang) },
    { label: t.rating, value: data.popularity ? formatNumber(Math.round(data.popularity), lang) : null },
    { label: t.filmography, value: formatNumber(cast.length + crew.length, lang) },
  ];

  const list = tab === "cast" ? cast : crew;

  // The hero borrows a still from their best-known work; its poster overlaps the portrait.
  const signature = knownFor.find((m) => m.backdrop_path) ?? knownFor[0];
  const still = backdropUrl(signature?.backdrop_path);
  const sigPoster = posterUrl(signature?.poster_path, "w185");

  return (
    <div>
      {/* ---- hero: one rounded window, portrait set into the bottom-start corner ---- */}
      <section className="shimmer relative isolate mx-3 overflow-hidden !rounded-[1.75rem] !rounded-es-none sm:mx-5">
        <div className="absolute inset-0 -z-10">
          {still && <img src={still} srcSet={backdropSrcSet(signature?.backdrop_path)} sizes="100vw" alt="" aria-hidden="true" fetchPriority="high" className="h-full w-full object-cover opacity-80" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />
        </div>

        <div className="flex min-h-[30rem] flex-col justify-end p-5 pb-6 ps-28 text-white sm:min-h-[34rem] sm:p-10 sm:ps-60 lg:min-h-[min(40rem,76svh)] lg:ps-[19rem]">
          <p className="label text-white/70">{data.known_for_department ?? t.people}</p>
          <h1 className="hero-copy-shadow marquee mt-3 max-w-4xl text-balance text-[clamp(2.25rem,6vw,5rem)]">{data.name}</h1>
          {safeImdbId(data.external_ids?.imdb_id, "nm") && (
            <a
              href={`https://www.imdb.com/name/${safeImdbId(data.external_ids?.imdb_id, "nm")}/`}
              target="_blank"
              rel="noreferrer noopener"
              className="label press mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-white transition-colors duration-200 hover:border-white"
            >
              IMDb <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>

        {/* portrait in the cut-out corner, their signature poster overlapping it */}
        <div className="bite bite-bs p-2.5 [--r:1.5rem] sm:p-3">
          <div className="relative">
            <div className="aspect-[2/3] w-[5.5rem] overflow-hidden rounded-[1rem] bg-surface-2 sm:w-44 lg:w-64">
              {photo && <img src={photo} alt={data.name} width={421} height={632} fetchPriority="high" className="h-full w-full object-cover" />}
            </div>
            {signature && sigPoster && (
              <Link
                to={`/${mediaTypeOf(signature)}/${signature.id}`}
                title={titleOf(signature)}
                className="press absolute -end-3 -top-4 aspect-[2/3] w-10 rotate-6 overflow-hidden rounded-lg shadow-xl ring-2 ring-background transition-transform hover:rotate-0 sm:-end-5 sm:-top-6 sm:w-16 lg:w-20"
              >
                <img src={sigPoster} alt={titleOf(signature)} loading="lazy" className="h-full w-full object-cover" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="container grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
        <div className="min-w-0 space-y-12">
          <section className="reveal space-y-4 rounded-[1.75rem] bg-surface p-6 sm:p-8">
            <SectionHead title={t.biography} />
            {bio ? (
              <>
                <p className={cn("max-w-[68ch] whitespace-pre-line text-pretty leading-relaxed text-foreground/90", !expanded && "line-clamp-6")}>
                  {bio}
                </p>
                {bio.length > 600 && (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="label press rounded-full bg-foreground px-5 py-2.5 text-background transition-opacity duration-200 hover:opacity-85"
                  >
                    {expanded ? t.close : t.viewAll}
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t.noBiography}</p>
            )}
          </section>

          {knownFor.length > 0 && (
            <section className="reveal relative rounded-[1.75rem] bg-surface px-4 pb-4 pt-20 sm:px-6 sm:pt-24">
              <div className="dip px-6 pb-3 pt-2 sm:px-10">
                <h2 className="marquee whitespace-nowrap text-2xl sm:text-4xl">{t.knownFor}</h2>
              </div>
              <PosterRail items={knownFor} showIndex={false} />
            </section>
          )}

          {(cast.length > 0 || crew.length > 0) && (
            <section className="reveal space-y-5">
              <SectionHead title={t.filmography} count={formatNumber(list.length, lang)} />
              <div className="flex gap-2">
                {([["cast", t.actingCredits, cast.length], ["crew", t.crewCredits, crew.length]] as const)
                  .filter(([, , n]) => n > 0)
                  .map(([key, label, n]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={cn(
                        "label press rounded-full border px-4 py-2 transition-colors duration-200 ease-out",
                        tab === key
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                      )}
                    >
                      {label} · {n}
                    </button>
                  ))}
              </div>
              <PosterGrid items={list} />
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="ticket rounded-[1.75rem] bg-surface p-6 [--ny:3.25rem]">
            <p className="label mb-5 text-muted-foreground">{t.people}</p>
            <SpecList items={specs} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Person;
