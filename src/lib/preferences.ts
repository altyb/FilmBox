import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MediaType } from "./tmdb";

/* ------------------------------------------------------------------- theme */

/** Two states only. The first visit follows the device's setting; after
 *  that the user's own choice sticks. (Old saved "system" values resolve to
 *  whatever the device is set to.) */
export type Theme = "dark" | "light";

const systemPrefersLight = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: light)").matches;

const resolve = (theme: string | undefined): Theme =>
  theme === "light" || theme === "dark" ? theme : systemPrefersLight() ? "light" : "dark";

export const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.setAttribute("data-theme", theme);
};

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: resolve(undefined),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: "filmbox-theme",
      merge: (saved, current) => ({ ...current, theme: resolve((saved as { theme?: string } | undefined)?.theme) }),
      onRehydrateStorage: () => (state) => applyTheme(resolve(state?.theme)),
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
