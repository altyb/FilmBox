import { useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useT } from "@/lib/language";
import { formatNumber } from "@/lib/format";
import { useWatchlist } from "@/lib/preferences";
import { PosterCard } from "@/components/media/PosterCard";
import { SectionHead } from "@/components/common/SectionHead";
import { EmptyState } from "@/components/common/States";

const Watchlist = () => {
  const { t, lang } = useT();
  const items = useWatchlist((s) => s.items);
  const remove = useWatchlist((s) => s.remove);

  useEffect(() => {
    document.title = `${t.watchlist} · ${t.brand}`;
  }, [t]);

  return (
    <div className="container py-10 sm:py-14">
      <h1 className="marquee text-[clamp(2rem,5vw,3.25rem)]">{t.watchlist}</h1>

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title={t.emptyList}
            hint={t.emptyListHint}
            action={{ label: t.movies, to: "/movie" }}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <SectionHead title={t.watchlist} count={formatNumber(items.length, lang)} />
          <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
            {items.map((item, i) => (
              <div key={`${item.mediaType}-${item.id}`} className="group/item relative">
                <PosterCard
                  item={{
                    id: item.id,
                    media_type: item.mediaType,
                    title: item.title,
                    poster_path: item.posterPath,
                    vote_average: item.rating ?? undefined,
                    release_date: item.year ? `${item.year}-01-01` : undefined,
                  }}
                  type={item.mediaType}
                  index={i}
                />
                <button
                  type="button"
                  onClick={() => remove(item.mediaType, item.id)}
                  aria-label={`${t.remove}: ${item.title}`}
                  className="press absolute end-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center border border-border bg-background/90 text-muted-foreground opacity-0 backdrop-blur transition-[opacity,color,border-color] duration-200 hover:border-destructive hover:text-destructive focus-visible:opacity-100 group-hover/item:opacity-100"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
