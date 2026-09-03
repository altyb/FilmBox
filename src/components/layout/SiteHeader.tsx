import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon, Monitor, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT, useLanguageStore } from "@/lib/language";
import { useThemeStore, type Theme } from "@/lib/preferences";
import { Logo } from "@/components/brand/Logo";
import { SearchBox } from "@/components/search/SearchBox";

const THEME_CYCLE: Theme[] = ["dark", "light", "system"];
const THEME_ICON = { dark: Moon, light: Sun, system: Monitor };

export const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t, lang } = useT();
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const { theme, setTheme } = useThemeStore();
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname, location.search]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { to: "/", label: t.home, end: true },
    { to: "/movie", label: t.movies },
    { to: "/tv", label: t.tvShows },
    { to: "/watchlist", label: t.watchlist },
  ];

  const ThemeIcon = THEME_ICON[theme];

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "label relative py-1 transition-colors duration-200 ease-out",
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
      // the amber marquee underline
      "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-primary",
      "after:origin-[var(--underline-origin,left)] after:transition-transform after:duration-200 after:ease-out",
      isActive ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100",
    );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300 ease-out",
        scrolled ? "border-b border-border bg-background/90 backdrop-blur-xl" : "border-b border-transparent bg-background",
      )}
      style={{ ["--underline-origin" as string]: lang === "ar" ? "right" : "left" }}
    >
      <a
        href="#main"
        className="label sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:border focus:border-primary focus:bg-background focus:px-3 focus:py-2"
      >
        {t.home}
      </a>

      <div className="container flex h-16 items-center gap-4">
        <Link to="/" className="press flex shrink-0 items-center gap-2.5">
          <Logo className="h-6 w-6 text-foreground" />
          <span className="marquee text-xl tracking-tight">{t.brand}</span>
        </Link>

        <nav className="ms-4 hidden items-center gap-6 md:flex" aria-label={t.menu}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <SearchBox className="hidden w-64 lg:block xl:w-80" />

          <button
            type="button"
            onClick={() => setLanguage(lang === "en" ? "ar" : "en")}
            aria-label={t.toggleLanguage}
            className="label press flex h-9 items-center gap-1.5 border border-border px-2.5 transition-colors duration-200 hover:border-primary hover:text-primary"
          >
            <Languages className="h-3.5 w-3.5" aria-hidden="true" />
            {lang === "en" ? "ع" : "EN"}
          </button>

          <button
            type="button"
            onClick={() => setTheme(THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % 3])}
            aria-label={t.toggleTheme}
            className="press flex h-9 w-9 items-center justify-center border border-border transition-colors duration-200 hover:border-primary hover:text-primary"
          >
            <ThemeIcon className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={t.menu}
            aria-expanded={open}
            className="press flex h-9 w-9 items-center justify-center border border-border transition-colors duration-200 hover:border-primary hover:text-primary md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container space-y-4 py-4">
            <SearchBox />
            <nav className="grid gap-1" aria-label={t.menu}>
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    cn(
                      "label border-s-2 py-2.5 ps-3 transition-colors duration-200",
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
