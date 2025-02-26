import { useState, useEffect, useRef } from "react";
import { Search, X, Film, Tv, Star as LucideStar, User2, User2 as PersonIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguageStore, translations } from "@/lib/language";
import { tmdbApi } from "@/lib/tmdb";

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  media_type: "movie" | "tv" | "person";
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  profile_path: string | null;
  vote_average: number;
  known_for_department?: string;
  known_for?: {
    title?: string;
    name?: string;
    media_type: "movie" | "tv";
  }[];
}

export const SearchSection = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const t = translations[language];

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await tmdbApi.get("/search/multi", {
          params: {
            query,
            include_adult: false,
            page: 1,
          },
        });
        const results = response.data.results
          .filter((item: any) => ["movie", "tv", "person"].includes(item.media_type))
          .slice(0, 6);
        setSuggestions(results);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (result: SearchResult) => {
    navigate(`/${result.media_type}/${result.id}`);
    setShowSuggestions(false);
    setQuery("");
  };

  return (
    <div className="relative bg-gradient-to-b from-background to-background/50 pt-20 pb-32">
      <div className="absolute inset-0 bg-grid-white/5 bg-[size:3rem_3rem] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
      <div className="relative mx-auto max-w-3xl px-4" ref={searchRef}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            {language === 'ar' ? 'اكتشف عالم الترفيه' : 'Discover Entertainment'}
          </h1>
          <p className="mt-4 text-lg text-foreground/80">
            {language === 'ar' 
              ? 'ابحث عن أفلامك ومسلسلاتك المفضلة' 
              : 'Search for your favorite movies and TV shows'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="relative overflow-hidden rounded-2xl bg-background/80 backdrop-blur-xl border border-primary/10 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-3 px-6 py-4">
                <Search className="h-6 w-6 text-primary" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={t.search}
                  className="flex-1 bg-transparent text-lg outline-none placeholder:text-foreground/50"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="rounded-full p-1 hover:bg-foreground/10 transition-colors"
                  >
                    <X className="h-5 w-5 text-foreground/50" />
                  </button>
                )}
              </div>
              {query && (
                <button
                  type="submit"
                  className="px-8 py-4 bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  {t.search}
                </button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showSuggestions && query.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute inset-x-0 top-full mt-2 z-50"
              >
                <div className="rounded-xl border border-primary/10 bg-background/95 backdrop-blur-xl shadow-xl overflow-hidden">
                  {loading ? (
                    <div className="p-4 text-center text-foreground/60">
                      {language === 'ar' ? 'جاري البحث...' : 'Searching...'}
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="py-2">
                      {suggestions.map((result) => (
                        <button
                          key={`${result.media_type}-${result.id}`}
                          onClick={() => handleSuggestionClick(result)}
                          className="w-full px-4 py-3 text-start hover:bg-primary/5 transition-colors flex items-center gap-4"
                        >
                          <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {result.media_type === "person" ? (
                              result.profile_path ? (
                                <img
                                  src={`https://image.tmdb.org/t/p/w185${result.profile_path}`}
                                  alt={result.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-muted">
                                  <PersonIcon className="h-6 w-6 text-foreground/30" />
                                </div>
                              )
                            ) : (
                              result.poster_path ? (
                                <img
                                  src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                                  alt={result.title || result.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-muted">
                                  {result.media_type === "movie" ? (
                                    <Film className="h-6 w-6 text-foreground/30" />
                                  ) : (
                                    <Tv className="h-6 w-6 text-foreground/30" />
                                  )}
                                </div>
                              )
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{result.title || result.name}</div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-foreground/60">
                              {result.media_type === "person" ? (
                                <>
                                  <PersonIcon className="h-4 w-4 shrink-0" />
                                  <span>{result.known_for_department}</span>
                                  {result.known_for && result.known_for.length > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate">
                                        {result.known_for.map(work => work.title || work.name).join(", ")}
                                      </span>
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  {result.media_type === "movie" ? (
                                    <Film className="h-4 w-4 shrink-0" />
                                  ) : (
                                    <Tv className="h-4 w-4 shrink-0" />
                                  )}
                                  <span>
                                    {new Date(
                                      result.release_date || result.first_air_date || ""
                                    ).getFullYear()}
                                  </span>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <LucideStar className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                    {result.vote_average.toFixed(1)}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-foreground/60">
                      {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
};
