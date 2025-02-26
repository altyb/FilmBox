import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { SearchSection } from "@/components/SearchSection";
import { MediaCard } from "@/components/MediaCard";
import { searchMedia } from "@/lib/tmdb";
import { useLanguageStore, translations } from "@/lib/language";
import { Button } from "@/components/ui/button";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { language } = useLanguageStore();
  const t = translations[language];
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["search", query, page],
    queryFn: () => searchMedia(query, page),
    enabled: !!query,
    keepPreviousData: true
  });

  const searchResults = data?.results || [];
  const hasMorePages = data?.total_pages ? page < data.total_pages : false;

  const loadMore = () => {
    if (hasMorePages) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <SearchSection />
      {query && (
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : searchResults?.length ? (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold">
                {language === 'ar' ? 'نتائج البحث' : 'Search Results'} ({searchResults.length})
              </h2>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
                {searchResults.map((item) => (
                  <MediaCard 
                    key={item.id} 
                    media={item} 
                    type={item.media_type as "movie" | "tv"} 
                  />
                ))}
              </div>
              {hasMorePages && (
                <div className="flex justify-center mt-8">
                  <Button 
                    onClick={loadMore}
                    disabled={isFetching}
                    variant="outline"
                    size="lg"
                    className="min-w-[200px]"
                  >
                    {isFetching ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
                    ) : (
                      language === 'ar' ? 'عرض المزيد' : 'Load More'
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-foreground/80">
                {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
              </h2>
              <p className="mt-2 text-foreground/60">
                {language === 'ar' 
                  ? 'جرب استخدام كلمات مختلفة' 
                  : 'Try using different keywords'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
