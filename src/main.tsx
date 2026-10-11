import { createRoot } from "react-dom/client";
import App from "./App";
import gsap from "gsap";
import "@fontsource/anton/400.css";
import "@fontsource/archivo/400.css";
import "@fontsource/archivo/500.css";
import "@fontsource/archivo/600.css";
import "@fontsource/archivo/700.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "./index.css";
import { queryClient } from "@/lib/queryClient";
import { trendingQuery } from "@/lib/tmdb";
import { useLanguageStore } from "@/lib/language";

// Reduced motion: every GSAP tween jumps straight to its end state.
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) gsap.globalTimeline.timeScale(1000);

// Tag images as they land (or fail) so CSS can fade them in over their shimmer.
// Capture phase: load/error don't bubble.
const tag = (cls: string) => (e: Event) => {
  if (e.target instanceof HTMLImageElement) e.target.classList.add(cls);
};
document.addEventListener("load", tag("is-loaded"), true);
document.addEventListener("error", tag("is-failed"), true);

// Home's hero needs both trending lists; ask for them before React mounts.
// (The film list was already started by index.html, see trendingQuery.)
if (location.pathname === "/") {
  const lang = useLanguageStore.getState().language;
  void queryClient.prefetchQuery(trendingQuery("movie", lang));
  void queryClient.prefetchQuery(trendingQuery("tv", lang));
}

createRoot(document.getElementById("root")!).render(<App />);
