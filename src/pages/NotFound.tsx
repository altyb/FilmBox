import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useT } from "@/lib/language";
import { Logo } from "@/components/brand/Logo";

const NotFound = () => {
  const { t } = useT();
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = `404 · ${t.brand}`;
  }, [t.brand]);

  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <Logo className="h-10 w-10 text-foreground" />
      <p className="marquee mt-8 text-[clamp(4rem,18vw,10rem)] leading-none text-primary">404</p>
      <h1 className="marquee mt-4 text-2xl">{t.notFound}</h1>
      <p className="mt-3 max-w-sm text-pretty text-sm text-muted-foreground">{t.notFoundHint}</p>
      <code className="label mt-4 max-w-full break-all border border-border bg-surface px-2 py-1 text-muted-foreground">{pathname}</code>
      <Link
        to="/"
        className="label press mt-8 border border-primary bg-primary px-6 py-3 text-primary-foreground transition-colors duration-200 hover:bg-transparent hover:text-primary"
      >
        {t.backHome}
      </Link>
    </div>
  );
};

export default NotFound;
