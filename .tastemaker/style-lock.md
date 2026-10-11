# FilmBox — style lock

Direction: **Projection** (Cinema Noir / Projector). Chosen by the user from three
options on 2026-09-03. Every later screen reuses these tokens rather than
re-deriving them.

## Concept

The app is a projection booth. Content is film run through a projector onto a
wall: a warm-black auditorium, one amber bulb, static emulsion grain, posters
mounted like 35mm slides in a paper mat, and metadata printed like a film-can
label. Light mode is the same world in print — the same frames on paper.

Explicitly not: the dark-blue/slate streaming-service clone the previous build was.

## Colour contract

Verified with `tastemaker/scripts/check_contrast.py --matrix`.

**Dark (native mode)**
| role | hex | HSL token |
|---|---|---|
| background | `#0B0A09` | `30 10% 4%` |
| surface | `#15120E` | `34 20% 7%` |
| surface-2 | `#1E1A15` | `33 18% 10%` |
| foreground | `#F4EFE6` | `39 39% 93%` |
| muted-foreground | `#A0937F` | `36 15% 56%` |
| primary (amber) | `#E8A33D` | `36 79% 57%` |
| primary-foreground | `#140F07` | `37 48% 5%` |
| border | `#2C251D` | `32 21% 14%` |

Text-safe (>=4.5:1): fg/bg **17.27**, fg/surface **16.30**, bg/primary **9.17**,
surface/primary **8.66**, primary/primary-fg **8.84**, muted-fg/bg **6.57**.
Decorative only: border against bg/surface (1.24–1.31) — a hairline, never a
state signal on its own.

**Light**
| role | hex | HSL token |
|---|---|---|
| background | `#F4F0E7` | `42 37% 93%` |
| surface | `#FFFCF5` | `42 100% 98%` |
| foreground | `#16130E` | `38 22% 7%` |
| muted-foreground | `#6A6153` | `37 12% 37%` |
| primary (amber) | `#925A15` | `33 75% 33%` |
| border | `#DBD2C0` | `40 27% 81%` |

Text-safe: fg/bg **16.29**, fg/surface **18.08**, bg/primary **5.00**,
surface/primary **5.45**, muted-fg/bg **5.36**.
`#E8A33D` was tried first and failed here at **4.11:1** on paper — darkened
within the same hue family until it cleared the text floor, per the lock rule.

Toggle: real three-state control (dark / light / system), persisted in
`filmbox-theme` and applied by an inline script before first paint.

## Type

| role | Latin | Arabic |
|---|---|---|
| display / marquee | **Anton**, uppercase, `-0.015em`, `0.92` leading | **IBM Plex Sans Arabic 700**, sentence case, `0` tracking, `1.15` leading |
| UI / body | **Archivo** 400–700 | **IBM Plex Sans Arabic** 400–700 |
| metadata | **DM Mono** 400/500, `0.14em`, uppercase | DM Mono digits, `0.04em` |

Anton has no Arabic glyphs, so `.marquee` swaps family *and* drops the
uppercase/negative-tracking treatment under `[dir="rtl"]` — both are meaningless
in Arabic script.

## Shape, space, motion

- `--radius: 14px`. Mature and rounded (durj-style): windows `16px`,
  cards `16px`, image wells `8–12px`, actions pill (`999px`). Sharp 2px is gone.
- Hero window keeps its still fully clear: full-opacity image with only a
  light bottom gradient grounding the copy (no beam, no full veil there).
- Card = still/poster in a rounded mat inside a rounded 1px border. Mat goes
  amber on hover; cards lift `-2px` with a soft amber shadow; images settle-zoom
  `scale(1.04–1.05)` over 500ms on hover (transform-only, fine pointers).
- One-shot `.window-in`: the shell settles from `scale(1.015)` over 600ms
  (`cubic-bezier(0.05,0.7,0.1,1)`), first paint only. Lists keep the 40ms
  `.stagger-in`. Nothing over 600ms except the shimmer loop.
- `.film-gate` sprocket strips only on hero/detail posters, never on grid cards
  (too noisy under ~150px).
- `.spec-row` dotted leaders for every key/value pair.
- Grain: a static SVG `feTurbulence` tile at 0.05 / 0.035 opacity,
  `mix-blend-mode: overlay`. Never animated.
- Backdrops: `--backdrop-opacity` 0.45 dark / 0.90 light. Readability comes
  from `.projection-veil` — solid ground on the side the copy sits on, clearing
  to bare image on the other (direction flips under RTL) — **not** from fading
  the picture.
- Easing: `--ease-out: cubic-bezier(.23,1,.32,1)`, `--ease-in-out: cubic-bezier(.77,0,.175,1)`.
- Durations: press 160ms, hover/colour 180–200ms, dialog 220ms, list stagger
  40ms/item, image settle-zoom 500ms.
- Hover transforms gated behind `@media (hover: hover) and (pointer: fine)`.
- All motion is CSS (off the main thread). `framer-motion` was removed.
- Hover transforms gated behind `@media (hover: hover) and (pointer: fine)`.
- One global `prefers-reduced-motion` block drops movement, keeps opacity.

## RTL

Logical properties throughout (`inset-inline`, `ms-*`, `start-*`); no
`space-x-*` reversal hacks. The previous build's `[dir=rtl] svg { scaleX(-1) }`
is gone — only `.rtl-flip` (chevrons, arrows, play triangles) mirrors.
Arabic formats use `ar-u-nu-latn-ca-gregory`: Latin digits and the Gregorian
calendar, because `ar-SA` renders a 2024 release date as "19 Rabi' II 1446".

## Assets

All imagery is TMDB's own (posters, backdrops, stills, profiles, provider and
studio logos) — no stock photography was fetched, and none belongs here. Icons
are **lucide-react**, already in the project; no new icon set was added. The
logo mark is new: a film cell (frame + four sprockets) with an amber lamp at
its centre, built from primitives, reused as the favicon.
