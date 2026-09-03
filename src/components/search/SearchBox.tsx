import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, X, Film, Tv, User2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";
import { useDebounce } from "@/lib/hooks";
import { search, posterUrl, profileUrl, titleOf, yearOf, type MediaSummary } from "@/lib/tmdb";
import { RatingMeter } from "@/components/media/RatingMeter";

const hrefFor = (item: MediaSummary) =>
  `/${item.media_type === "person" ? "person" : item.media_type ?? "movie"}/${item.id}`;

/** One search control for the whole app. `size="lg"` is the search page's
 *  hero input; the default is the header's. */
export const SearchBox = ({
  size = "sm",
  autoFocus,
  /** Seeds the field when the page owns the query, e.g. /search?q=nolan. */
  initialQuery = "",
  className,
}: {
  size?: "sm" | "lg";
  autoFocus?: boolean;
  initialQuery?: string;
  className?: string;
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t, lang } = useT();
  const listId = useId();

  const debounced = useDebounce(query.trim(), 250);
  const enabled = debounced.length >= 2;

  const { data, isFetching } = useQuery({
    queryKey: ["suggest", debounced, lang],
    queryFn: () => search("multi", debounced),
    enabled,
    staleTime: 60_000,
  });

  const suggestions = (data?.results ?? [])
    .filter((r) => ["movie", "tv", "person"].includes(r.media_type ?? ""))
    .slice(0, 7);

  // "/" focuses search from anywhere. No animation: this fires many times a
  // day and any transition would only make it feel slower.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => setActive(-1), [debounced]);

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  const go = (item: MediaSummary) => {
    setOpen(false);
    setQuery("");
    navigate(hrefFor(item));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && suggestions[active]) return go(suggestions[active]);
    if (query.trim()) {
      setOpen(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
  };

  const lg = size === "lg";

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <form onSubmit={submit} role="search">
        <div
          className={cn(
            "flex items-center gap-3 border border-border bg-surface transition-colors duration-200 ease-out",
            "focus-within:border-primary",
            lg ? "px-5 py-4" : "px-3 py-2",
          )}
        >
          <SearchIcon
            className={cn("shrink-0 text-muted-foreground", lg ? "h-5 w-5" : "h-4 w-4")}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={t.searchPlaceholder}
            aria-label={t.search}
            aria-expanded={open && enabled}
            aria-controls={listId}
            aria-autocomplete="list"
            role="combobox"
            /* 16px floor stops iOS zooming the page on focus */
            className={cn(
              "w-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground",
              "[&::-webkit-search-cancel-button]:hidden",
              lg ? "text-lg" : "text-base",
            )}
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label={t.close}
              className="press shrink-0 text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              <X className={lg ? "h-5 w-5" : "h-4 w-4"} aria-hidden="true" />
            </button>
          ) : (
            <kbd className="label hidden shrink-0 border border-border px-1.5 py-0.5 text-muted-foreground md:block">
              /
            </kbd>
          )}
        </div>
      </form>

      {open && enabled && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(28rem,60vh)] overflow-y-auto border border-border bg-popover shadow-2xl"
        >
          {suggestions.length === 0 ? (
            <p className="label px-4 py-6 text-center text-muted-foreground">
              {isFetching ? t.searching : t.noResults}
            </p>
          ) : (
            suggestions.map((item, i) => {
              const isPerson = item.media_type === "person";
              const img = isPerson
                ? profileUrl(item.profile_path, "w185")
                : posterUrl(item.poster_path, "w185");
              const Icon = isPerson ? User2 : item.media_type === "tv" ? Tv : Film;
              return (
                <button
                  key={`${item.media_type}-${item.id}`}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(item)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-start transition-colors duration-150",
                    i === active ? "bg-surface-2" : "bg-transparent",
                  )}
                >
                  <span className="relative h-14 w-10 shrink-0 overflow-hidden border border-border bg-surface-2">
                    {img ? (
                      <img src={img} alt="" width={40} height={56} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <Icon className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{titleOf(item) || item.name}</span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <Icon className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                      {isPerson ? (
                        <span className="label truncate text-muted-foreground">
                          {item.known_for?.map(titleOf).filter(Boolean).slice(0, 2).join(" · ") ||
                            item.known_for_department}
                        </span>
                      ) : (
                        <>
                          {yearOf(item) && (
                            <span className="label text-muted-foreground tabular-nums">{yearOf(item)}</span>
                          )}
                          <RatingMeter value={item.vote_average} />
                        </>
                      )}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
