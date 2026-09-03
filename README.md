# Reelify

A projection booth for everything worth watching. Browse films and series, watch
trailers, follow the people who make them — on the TMDB API.

**Design direction:** *Projection* — warm-black auditorium, one amber projector
bulb, static film grain, posters mounted like 35mm slides, metadata printed like
a film-can label. Light mode is the same world in print. The full token contract
lives in [`.tastemaker/style-lock.md`](.tastemaker/style-lock.md).

## Running it

```bash
pnpm install
pnpm dev
```

The app ships with a read-only TMDB v4 token so a fresh clone runs with no
setup. Use your own before deploying:

```bash
cp .env.example .env
# VITE_TMDB_TOKEN=<your token from themoviedb.org/settings/api>
```

| script | |
|---|---|
| `pnpm dev` | dev server |
| `pnpm build` | production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | eslint |

## What it does

**Browse** — trending, popular, top rated, in cinemas, upcoming, on the air and
airing today, for both films and series. Genre, sort, year and minimum-rating
filters run against TMDB `/discover`, with every filter reflected in the URL so
a filtered view is shareable and survives a refresh. Paging is cursor-based and
appends.

**Titles** — synopsis, cast, key crew, spec sheet (status, dates, runtime,
budget, revenue, votes, language), where-to-watch providers for the visitor's
region, stills, recommendations and similar titles. Series get an expandable
season list that loads its episodes on open. One request per title:
`append_to_response` collapses credits, videos, recommendations, similar,
providers, images and external IDs into the details call.

**People** — biography, vitals, known-for, and a full filmography split into
acting and crew credits, deduplicated and sorted newest first.

**Search** — instant suggestions with full keyboard navigation (`/` to focus,
arrows to move, enter to open), scoped tabs for all/films/series/people, and
paged results.

**My Reel** — a watchlist held in `localStorage`. No account needed.

**Bilingual** — English and Arabic with full RTL. Switching language no longer
reloads the page; every query carries the locale and refetches. Where TMDB has
no Arabic synopsis the English one is shown with a note, rather than a blank.

## Stack

React 18 · Vite · TypeScript · Tailwind · TanStack Query · Zustand · Axios ·
Radix Dialog · lucide-react. All motion is CSS.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
