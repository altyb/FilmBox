import { Suspense, lazy, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { TopBar } from "@/components/layout/TopBar";
import { hideBoot } from "@/lib/boot";
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


const RouteFallback = () => (
  <div className="container py-16">
    <PosterGridSkeleton count={7} />
  </div>
);

/** Each route enters with a short rise; keyed by path so it replays. CSS-only,
 *  transform + opacity, so it stays on the compositor. */
const PageIn = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  // Home lifts the splash when its first still lands; every other page has
  // nothing worth waiting for.
  useEffect(() => {
    if (pathname !== "/") hideBoot();
  }, [pathname]);
  return (
    <div key={pathname} className="page-in">
      {children}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <div className="flex min-h-[100dvh] flex-col">
          <TopBar />
          <main id="main" className="flex-1 pb-16">
            <PageIn>
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
            </PageIn>
          </main>
        </div>
      </BrowserRouter>
  </QueryClientProvider>
);

export default App;
