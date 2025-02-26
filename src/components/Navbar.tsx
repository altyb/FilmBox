import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { useLanguageStore, translations } from "@/lib/language";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { language, setLanguage } = useLanguageStore();
  const t = translations[language];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("light");
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <nav
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        isScrolled 
          ? "bg-background/80 backdrop-blur-xl shadow-lg" 
          : "bg-gradient-to-b from-background/80 to-transparent"
      )}
    >
      <div className="mx-auto max-w-[2000px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 group"
            >
              <Logo className="w-8 h-8 transition-transform group-hover:scale-110" />
              <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                Flixsy
              </span>
            </Link>
            {/* Language selector for mobile - Always visible */}
            <button
              onClick={toggleLanguage}
              className="md:hidden rounded-full px-3 py-1 hover:bg-primary/10 transition-colors text-sm font-medium border border-primary/20"
              aria-label="Toggle language"
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop navigation and controls */}
            <div className="hidden items-center gap-8 md:flex">
              <Link
                to="/"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === "/" && "text-primary"
                )}
              >
                {t.movies}
              </Link>
              <Link
                to="/tv"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === "/tv" && "text-primary"
                )}
              >
                {t.tvShows}
              </Link>
              <Link
                to="/search"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === "/search" && "text-primary"
                )}
              >
                {t.search}
              </Link>
              {/* Language selector for desktop */}
              <button
                onClick={toggleLanguage}
                className="hidden md:block rounded-full px-3 py-1 hover:bg-primary/10 transition-colors text-sm font-medium border border-primary/20"
                aria-label="Toggle language"
              >
                {language === 'en' ? 'العربية' : 'English'}
              </button>
              <button
                onClick={toggleTheme}
                className="rounded-full p-2 hover:bg-primary/10 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="h-5 w-5 text-primary transition-transform hover:rotate-45" />
                ) : (
                  <Moon className="h-5 w-5 text-primary transition-transform hover:-rotate-45" />
                )}
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={toggleTheme}
                className="rounded-full p-2 hover:bg-primary/10 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="h-5 w-5 text-primary transition-transform hover:rotate-45" />
                ) : (
                  <Moon className="h-5 w-5 text-primary transition-transform hover:-rotate-45" />
                )}
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="rounded-full p-2 hover:bg-primary/10 transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5 text-primary" />
                ) : (
                  <Menu className="h-5 w-5 text-primary" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "absolute left-0 right-0 top-16 bg-background/95 backdrop-blur-xl transition-all duration-300 border-t border-primary/10 md:hidden",
            isMenuOpen 
              ? "translate-y-0 opacity-100" 
              : "translate-y-2 opacity-0 pointer-events-none"
          )}
        >
          <div className="flex flex-col space-y-4 p-6">
            <Link
              to="/"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === "/" && "text-primary"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              {t.movies}
            </Link>
            <Link
              to="/tv"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === "/tv" && "text-primary"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              {t.tvShows}
            </Link>
            <Link
              to="/search"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === "/search" && "text-primary"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              {t.search}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
