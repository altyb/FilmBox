import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Grain } from "@/components/layout/Grain";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PosterGridSkeleton } from "@/components/common/States";
import Home from "@/pages/Home";

/* Everything but the landing page is code-split — the details page pulls in
 * the dialog and the season loader that the home page never needs. */
const Browse = lazy(() => import("@/pages/Browse"));
const Title = lazy(() => import("@/pages/Title"));
const Person = lazy(() => import("@/pages/Person"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const Watchlist = lazy(() => import("@/pages/Watchlist"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const RouteFallback = () => (
  <div className="container py-16">
    <PosterGridSkeleton count={7} />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <Grain />
        <div className="flex min-h-[100dvh] flex-col">
          <SiteHeader />
          <main id="main" className="flex-1">
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/movie" element={<Browse media="movie" />} />
                <Route path="/tv" element={<Browse media="tv" />} />
                <Route path="/movie/:id" element={<Title media="movie" />} />
                <Route path="/tv/:id" element={<Title media="tv" />} />
                <Route path="/person/:id" element={<Person />} />
                {/* the old /actor/:id links */}
                <Route path="/actor/:id" element={<Person />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <SiteFooter />
        </div>
      </BrowserRouter>
  </QueryClientProvider>
);

export default App;
