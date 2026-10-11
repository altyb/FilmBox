import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Languages, Moon, Search, Sun } from "lucide-react";
import { cn, centerOf } from "@/lib/utils";
import { useT, useLanguageStore } from "@/lib/language";
import { useThemeStore } from "@/lib/preferences";

gsap.registerPlugin(useGSAP);

// Search (overlay + autocomplete) only loads the first time it is opened.
const SearchOverlay = lazy(() => import("@/components/search/SearchOverlay"));

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Run a DOM change inside a View Transition that reveals the new state as a
 *  circle growing out of `from`. Browsers without the API just apply it. */
const circleReveal = (from: Element | null, apply: () => void) => {
  const html = document.documentElement;
  // Colour transitions would replay the switch a second time after the
  // snapshot (the "flash"), so they're frozen until it settles.
  html.classList.add("vt-reveal");
  const done = () => requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove("vt-reveal")));
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };
  if (!doc.startViewTransition || reducedMotion()) {
    apply();
    return done();
  }
  const { x, y } = centerOf(from);
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  html.style.setProperty("--vt-x", `${x}px`);
  html.style.setProperty("--vt-y", `${y}px`);
  const vt = doc.startViewTransition(() => flushSync(apply));
  vt.ready
    .then(() =>
      html.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 650, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" },
      ),
    )
    .catch(() => {});
  vt.finished.finally(done);
};

/* ------------------------------------------------------------------ menu */

/** The menu's links + the TMDB credit; rendered in the menu shape (corners)
 *  or in the island (docked). `item` is the class GSAP staggers. */
const MenuLinks = ({ item, className, style }: { item: string; className?: string; style?: React.CSSProperties }) => {
  const { t } = useT();
  const { pathname } = useLocation();
  const links = [
    { to: "/", label: t.home },
    { to: "/movie", label: t.movies },
    { to: "/tv", label: t.tvShows },
    { to: "/watchlist", label: t.watchlist },
  ];
  return (
    <nav aria-label={t.menu} style={{ visibility: "hidden", ...style }} className={cn("grid gap-1 p-2", className)}>
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className={cn(
            item,
            "rounded-[1.25rem] px-4 py-3 text-base font-semibold text-black transition-colors hover:bg-black/5",
            pathname === l.to && "bg-black/[0.06]",
          )}
        >
          {l.label}
        </Link>
      ))}
      {/* TMDB's terms require this attribution wherever their data is shown. */}
      <a
        href="https://www.themoviedb.org/"
        target="_blank"
        rel="noreferrer noopener"
        className={cn(item, "label px-4 pb-2 pt-2 text-black/45 transition-colors hover:text-black")}
      >
        {t.poweredBy} TMDB
      </a>
    </nav>
  );
};

/** One white shape: closed it is the menu button's pill, open it stretches
 *  (width, height and corner radius together, slight wobble) into the panel,
 *  so edges, radius and shadow can never drift apart. Docked, the button only
 *  toggles — the island itself drops down into the panel (see TopBar). */
const LiquidMenu = ({ docked, open, onToggle }: { docked: boolean; open: boolean; onToggle: () => void }) => {
  const { t } = useT();
  const root = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP(
    () => {
      const btn = root.current!.querySelector<HTMLElement>(".menu-btn")!;
      const nav = root.current!.querySelector<HTMLElement>(".menu-panel")!;
      const closed = { width: btn.offsetWidth, height: btn.offsetHeight, borderRadius: btn.offsetHeight / 2 };
      const bars = { duration: 0.35, ease: "power3.inOut" };
      gsap.to(".bar-1", { y: open ? 6 : 0, rotate: open ? 45 : 0, ...bars });
      gsap.to(".bar-2", { scaleX: open ? 0 : 1, opacity: open ? 0 : 1, ...bars });
      gsap.to(".bar-3", { y: open ? -6 : 0, rotate: open ? -45 : 0, ...bars });
      if (open && !docked) {
        gsap.set(nav, { autoAlpha: 1 });
        gsap.fromTo(
          ".menu-shape",
          closed,
          { width: nav.offsetWidth, height: nav.offsetHeight, borderRadius: 28, duration: 0.7, ease: "elastic.out(1, 0.8)", overwrite: true },
        );
        gsap.fromTo(
          ".menu-item",
          { y: -8, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.04, duration: 0.35, delay: 0.12, ease: "power3.out", overwrite: true },
        );
      } else {
        gsap.to(".menu-item", { autoAlpha: 0, duration: 0.12, overwrite: true });
        gsap.to(".menu-shape", { ...closed, duration: 0.4, ease: "power3.inOut", overwrite: true });
        gsap.set(nav, { autoAlpha: 0, delay: 0.4 });
      }
    },
    { scope: root, dependencies: [open, docked] },
  );

  const squish = contextSafe((el: HTMLElement) =>
    gsap.fromTo(el, { scale: 0.86 }, { scale: 1, duration: 0.6, ease: "elastic.out(1.2, 0.4)" }),
  );

  return (
    <div ref={root} className="pointer-events-auto relative h-12 w-14 sm:h-14 sm:w-16">
      <div
        className={cn(
          "menu-shape absolute start-0 top-0 h-12 w-14 overflow-hidden rounded-full bg-white transition-shadow duration-300 sm:h-14 sm:w-16",
          docked ? "shadow-none" : "shadow-[0_10px_36px_rgb(0_0_0/0.25)]",
        )}
      >
        <MenuLinks item="menu-item" className="menu-panel absolute start-0 top-0 w-56 pt-14 sm:pt-16" />
      </div>

      <button
        type="button"
        aria-label={t.menu}
        aria-expanded={open}
        onClick={(e) => {
          squish(e.currentTarget);
          onToggle();
        }}
        className="menu-btn absolute start-0 top-0 z-10 flex h-12 w-14 items-center justify-center rounded-full text-black sm:h-14 sm:w-16"
      >
        <span aria-hidden="true" className="relative block h-3.5 w-5">
          {["bar-1 top-0", "bar-2 top-1.5", "bar-3 top-3"].map((c) => (
            <span key={c} className={cn("absolute inset-x-0 h-0.5 rounded-full bg-current", c)} />
          ))}
        </span>
      </button>
    </div>
  );
};

/* --------------------------------------------------------------- actions */

/** Search, theme, language in one capsule; a soft blob slides under whichever
 *  button the pointer is on. */
const ActionCapsule = ({ onSearch }: { onSearch: (el: HTMLElement) => void }) => {
  const { t, lang } = useT();
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const { theme, setTheme } = useThemeStore();
  const ThemeIcon = theme === "light" ? Sun : Moon;
  const root = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP({ scope: root });
  const follow = contextSafe((el: HTMLElement) =>
    gsap.to(".cap-blob", { x: el.offsetLeft, autoAlpha: 1, duration: 0.45, ease: "elastic.out(1, 0.7)" }),
  );
  const leave = contextSafe(() => gsap.to(".cap-blob", { autoAlpha: 0, duration: 0.2 }));
  const pop = contextSafe((el: HTMLElement) =>
    gsap.fromTo(el.querySelector("svg"), { scale: 0.5, rotate: -90 }, { scale: 1, rotate: 0, duration: 0.6, ease: "back.out(2)" }),
  );

  const btn =
    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-black sm:h-12 sm:w-12";
  const hover = (e: React.PointerEvent<HTMLElement>) => e.pointerType === "mouse" && follow(e.currentTarget);

  return (
    <div
      ref={root}
      onPointerLeave={leave}
      className="pointer-events-auto relative flex rounded-full bg-white p-1 shadow-[0_6px_24px_rgb(0_0_0/0.18)] transition-shadow duration-300 group-data-[docked=true]/bar:shadow-none"
    >
      <span
        aria-hidden="true"
        style={{ visibility: "hidden" }}
        className="cap-blob absolute start-0 top-1 h-10 w-10 rounded-full bg-black/[0.08] sm:h-12 sm:w-12 rtl:end-0 rtl:start-auto"
      />
      <button type="button" title={t.search} aria-label={t.search} onPointerEnter={hover} onClick={(e) => onSearch(e.currentTarget)} className={btn}>
        <Search className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
      <button
        type="button"
        title={t.toggleTheme}
        aria-label={t.toggleTheme}
        onPointerEnter={hover}
        onClick={(e) => {
          const el = e.currentTarget;
          circleReveal(el, () => setTheme(theme === "light" ? "dark" : "light"));
          pop(el);
        }}
        className={btn}
      >
        <ThemeIcon className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
      <button
        type="button"
        title={t.toggleLanguage}
        aria-label={t.toggleLanguage}
        onPointerEnter={hover}
        onClick={(e) => {
          const el = e.currentTarget;
          circleReveal(el, () => setLanguage(lang === "ar" ? "en" : "ar"));
          pop(el);
        }}
        className={btn}
      >
        <Languages className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
    </div>
  );
};

/** Where each piece sits once docked: menu + capsule side by side, centred,
 *  12px from the top. Measured from the untransformed layout. */
const dockTargets = (menu: HTMLElement, caps: HTMLElement) => {
  const GAP = 4;
  const mx = Number(gsap.getProperty(menu, "x")), my = Number(gsap.getProperty(menu, "y"));
  const cx = Number(gsap.getProperty(caps, "x")), cy = Number(gsap.getProperty(caps, "y"));
  const m = menu.getBoundingClientRect(), c = caps.getBoundingClientRect();
  const mLeft = m.left - mx, cLeft = c.left - cx, mTop = m.top - my, cTop = c.top - cy;
  const total = m.width + GAP + c.width;
  const start = (innerWidth - total) / 2;
  const menuFirst = mLeft < cLeft; // LTR: menu on the left; RTL: on the right
  const mTo = menuFirst ? start : start + c.width + GAP;
  const cTo = menuFirst ? start + m.width + GAP : start;
  const top = 12;
  return {
    menu: { x: mTo - mLeft, y: top - mTop },
    caps: { x: cTo - cLeft, y: top - cTop },
    island: { left: start, top, width: total, height: Math.max(m.height, c.height) },
  };
};

/** One top bar on every page: liquid menu at the start, action capsule at the
 *  end. Scroll past the top and both fly to the centre and merge into one
 *  floating island (a white pill stretches in behind them); back at the top
 *  they split out to the corners again. Transform-only. */
export const TopBar = () => {
  const [searchFrom, setSearchFrom] = useState<HTMLElement | null>(null);
  const location = useLocation();
  const home = location.pathname === "/";
  const bar = useRef<HTMLElement>(null);
  const [docked, setDocked] = useState(false);
  const [vw, setVw] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const islandRect = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const islandOpen = useRef(false);

  useEffect(() => setMenuOpen(false), [location.pathname, location.search, docked]);

  // Outside tap / Escape closes the menu. "Outside" is outside the whole bar,
  // so a tap on a link in the island still lands.
  useEffect(() => {
    if (!menuOpen) return;
    const away = (e: PointerEvent) => !bar.current?.contains(e.target as Node) && setMenuOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setDocked(scrollY > 80);
    const onResize = () => setVw(innerWidth);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
    };
  }, []);

  useGSAP(
    () => {
      const menu = bar.current?.querySelector<HTMLElement>("[data-dock=menu]");
      const caps = bar.current?.querySelector<HTMLElement>("[data-dock=caps]");
      if (!menu || !caps) return;
      if (!docked) {
        islandOpen.current = false;
        gsap.set(".island-nav", { autoAlpha: 0 });
        // The island vanishes before the pieces leave, so no empty pill is left behind.
        gsap.set(".dock-island", { autoAlpha: 0, overwrite: true });
        gsap.to([menu, caps], { x: 0, y: 0, duration: 0.7, ease: "back.out(1.3)", overwrite: true });
        return;
      }
      const to = dockTargets(menu, caps);
      islandRect.current = to.island;
      gsap.to(menu, { ...to.menu, duration: 0.8, ease: "elastic.out(0.8, 0.8)", overwrite: true });
      gsap.to(caps, { ...to.caps, duration: 0.8, delay: 0.04, ease: "elastic.out(0.8, 0.8)", overwrite: true });
      // The island only fills the seam once both pieces have landed — never a
      // separate pill of its own.
      gsap.set(".dock-island", { ...to.island, borderRadius: to.island.height / 2 });
      gsap.fromTo(".dock-island", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, delay: 0.38, overwrite: true });
    },
    { scope: bar, dependencies: [docked, vw] },
  );

  // Docked menu: the island itself drops down under both pieces and becomes
  // the panel — one white shape again, never beside the capsule.
  useGSAP(
    () => {
      const r = islandRect.current;
      // Only animate real open/close changes — a stray close here would kill
      // the island's docking animation.
      if (!docked || !r || menuOpen === islandOpen.current) return;
      islandOpen.current = menuOpen;
      const nav = bar.current!.querySelector<HTMLElement>(".island-nav")!;
      if (menuOpen) {
        const w = Math.max(r.width, 240);
        gsap.set(nav, { autoAlpha: 1, width: w, paddingTop: r.height + 6 });
        gsap.to(".dock-island", {
          left: r.left - (w - r.width) / 2,
          width: w,
          height: nav.offsetHeight,
          borderRadius: 28,
          duration: 0.7,
          ease: "elastic.out(1, 0.8)",
          overwrite: true,
        });
        gsap.fromTo(
          ".island-item",
          { y: -8, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.04, duration: 0.35, delay: 0.12, ease: "power3.out", overwrite: true },
        );
      } else {
        gsap.to(".island-item", { autoAlpha: 0, duration: 0.12, overwrite: true });
        gsap.to(".dock-island", { ...r, borderRadius: r.height / 2, duration: 0.4, ease: "power3.inOut", overwrite: true });
        gsap.set(nav, { autoAlpha: 0, delay: 0.4 });
      }
    },
    { scope: bar, dependencies: [menuOpen, docked] },
  );

  // "/" opens search from anywhere, unless the user is typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== "/" || el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      e.preventDefault();
      setSearchFrom(document.querySelector<HTMLElement>("[data-search-trigger]"));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        ref={bar}
        data-docked={docked}
        className="group/bar pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between p-7 sm:p-11"
      >
        <div
          style={{ visibility: "hidden" }}
          className="dock-island absolute overflow-hidden bg-white shadow-[0_10px_36px_rgb(0_0_0/0.28)]"
        >
          <MenuLinks item="island-item" className="island-nav pointer-events-auto absolute left-0 top-0" />
        </div>
        <div data-dock="menu" className="relative">
          <LiquidMenu docked={docked} open={menuOpen} onToggle={() => setMenuOpen((v) => !v)} />
        </div>
        <div data-dock="caps" data-search-trigger className="relative">
          <ActionCapsule onSearch={setSearchFrom} />
        </div>
      </header>
      {/* keeps page content clear of the fixed bar; the home hero sits under it on purpose */}
      {!home && <div aria-hidden="true" className="h-24 sm:h-32" />}
      {searchFrom && (
        <Suspense fallback={null}>
          <SearchOverlay from={searchFrom} onClose={() => setSearchFrom(null)} />
        </Suspense>
      )}
    </>
  );
};
