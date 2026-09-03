import { Link } from "react-router-dom";
import { useT } from "@/lib/language";
import { Logo } from "@/components/brand/Logo";

export const SiteFooter = () => {
  const { t } = useT();
  return (
    <footer className="mt-24 border-t border-border">
      <div className="container flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Logo className="h-5 w-5 text-foreground" />
          <div>
            <p className="marquee text-base leading-none">{t.brand}</p>
            <p className="label mt-1.5 text-muted-foreground">{t.tagline}</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label={t.menu}>
          {[
            { to: "/movie", label: t.movies },
            { to: "/tv", label: t.tvShows },
            { to: "/search", label: t.search },
            { to: "/watchlist", label: t.watchlist },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="label text-muted-foreground transition-colors duration-200 hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* TMDB's terms require this attribution wherever their data is shown. */}
      <div className="border-t border-border">
        <p className="label container py-4 text-muted-foreground">
          {t.poweredBy}{" "}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noreferrer noopener"
            className="text-foreground underline decoration-border underline-offset-4 transition-colors duration-200 hover:text-primary hover:decoration-primary"
          >
            TMDB
          </a>
          . {" "}This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  );
};
