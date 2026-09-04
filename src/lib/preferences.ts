import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MediaType } from "./tmdb";

/* ------------------------------------------------------------------- theme */

export type Theme = "dark" | "light" | "system";

const systemPrefersLight = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: light)").matches;

export const applyTheme = (theme: Theme) => {
  const light = theme === "light" || (theme === "system" && systemPrefersLight());
  document.documentElement.classList.toggle("light", light);
  document.documentElement.setAttribute("data-theme", light ? "light" : "dark");
};

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: "filmbox-theme",
      onRehydrateStorage: () => (state) => applyTheme(state?.theme ?? "dark"),
    },
  ),
);

/* --------------------------------------------------------------- watchlist */

export interface SavedTitle {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  year: string | null;
  rating: number | null;
  addedAt: number;
}

interface WatchlistState {
  items: SavedTitle[];
  toggle: (item: Omit<SavedTitle, "addedAt">) => void;
  remove: (mediaType: MediaType, id: number) => void;
  has: (mediaType: MediaType, id: number) => boolean;
}

export const useWatchlist = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) =>
        set((s) => {
          const exists = s.items.some((i) => i.id === item.id && i.mediaType === item.mediaType);
          return {
            items: exists
              ? s.items.filter((i) => !(i.id === item.id && i.mediaType === item.mediaType))
              : [{ ...item, addedAt: Date.now() }, ...s.items],
          };
        }),
      remove: (mediaType, id) =>
        set((s) => ({ items: s.items.filter((i) => !(i.id === id && i.mediaType === mediaType)) })),
      has: (mediaType, id) =>
        get().items.some((i) => i.id === id && i.mediaType === mediaType),
    }),
    { name: "filmbox-watchlist" },
  ),
);
