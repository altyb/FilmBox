import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";
import { formatDate, formatGender, formatNumber, yearFrom } from "@/lib/format";
import { fetchPerson, profileUrl, titleOf, dateOf, mediaTypeOf, type MediaSummary } from "@/lib/tmdb";
import { PosterRail } from "@/components/media/PosterRail";
import { PosterGrid } from "@/components/media/PosterGrid";
import { SectionHead } from "@/components/common/SectionHead";
import { SpecList } from "@/components/common/SpecList";
import { ErrorState, LineSkeleton } from "@/components/common/States";

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

  return (
    <div className="container py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-12">
        <div className="space-y-6">
          <div className="film-gate relative mx-auto w-40 border border-border bg-surface p-[3px] shadow-2xl sm:w-48 lg:mx-0 lg:w-full">
            <div className="aspect-[2/3] overflow-hidden bg-surface-2">
              {photo && <img src={photo} alt={data.name} width={421} height={632} fetchPriority="high" className="h-full w-full object-cover" />}
            </div>
          </div>

          <div className="border border-border bg-surface p-4">
            <SpecList items={specs} />
          </div>

          {data.external_ids?.imdb_id && (
            <a
              href={`https://www.imdb.com/name/${data.external_ids.imdb_id}/`}
              target="_blank"
              rel="noreferrer noopener"
              className="label inline-flex items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-primary"
            >
              IMDb <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>

        <div className="min-w-0 space-y-12">
          <div>
            <p className="label text-primary">{t.people}</p>
            <h1 className="marquee mt-3 text-balance text-[clamp(2rem,6vw,4rem)]">{data.name}</h1>
          </div>

          <section className="space-y-4">
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
                    className="label press border border-border px-3 py-1.5 text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
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
            <section className="space-y-4">
              <SectionHead title={t.knownFor} />
              <PosterRail items={knownFor} showIndex={false} />
            </section>
          )}

          {(cast.length > 0 || crew.length > 0) && (
            <section className="space-y-5">
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
                        "label press border px-3 py-1.5 transition-colors duration-200 ease-out",
                        tab === key
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-primary hover:text-primary",
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
      </div>
    </div>
  );
};

export default Person;
