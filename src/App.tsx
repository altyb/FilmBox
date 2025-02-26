import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";
import MediaDetails from "./pages/MediaDetails"; // updated import statement
import ActorDetails from "./pages/ActorDetails";
import TvShows from "./pages/TvShows";
import { Navbar } from "./components/Navbar"; 
import { ScrollToTop } from "@/components/ScrollToTop";
import { Loader } from "@/components/ui/Loader";
import { useLanguageStore } from "./lib/language";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  const { language } = useLanguageStore();

  useEffect(() => {
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
  }, [language]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router>
          <ScrollToTop />
          <Loader />
          <div className="min-h-screen">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/search" element={<Search />} />
                <Route path="/tv" element={<TvShows />} />
                <Route path="/:type/:id" element={<MediaDetails />} />
                <Route path="/actor/:id" element={<ActorDetails />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
