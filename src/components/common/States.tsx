import { Link } from "react-router-dom";
import { RotateCw, SearchX, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";

/* ---------------------------------------------------------------- skeleton */

export const PosterSkeleton = ({ index = 0 }: { index?: number }) => (
  <div className="stagger-in" style={{ "--i": Math.min(index, 12) } as React.CSSProperties}>
    <div className="shimmer aspect-[2/3] w-full !rounded-[1.25rem]" />
    <div className="mt-2 space-y-1.5">
      <div className="shimmer h-3 w-4/5" />
      <div className="shimmer h-2.5 w-1/2" />
    </div>
  </div>
);

export const PosterGridSkeleton = ({ count = 14 }: { count?: number }) => (
  <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
    {Array.from({ length: count }, (_, i) => (
      <PosterSkeleton key={i} index={i} />
    ))}
  </div>
);

export const PosterRailSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="flex gap-3 overflow-hidden">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="w-[7.5rem] shrink-0 sm:w-[8.5rem] lg:w-[9.5rem]">
        <PosterSkeleton index={i} />
      </div>
    ))}
  </div>
);

export const LineSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("shimmer h-3 w-full", className)} />
);

/* ------------------------------------------------------------------ states */

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center rounded-[1.75rem] bg-surface px-6 py-16 text-center">
    {children}
  </div>
);

export const ErrorState = ({ onRetry }: { onRetry?: () => void }) => {
  const { t } = useT();
  return (
    <Frame>
      <Clapperboard className="mb-4 h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <p className="marquee text-xl">{t.somethingWentWrong}</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground text-pretty">{t.errorHint}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="label press mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-background transition-opacity duration-200 hover:opacity-85"
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
          {t.retry}
        </button>
      )}
    </Frame>
  );
};

export const EmptyState = ({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: { label: string; to: string };
}) => (
  <Frame>
    <SearchX className="mb-4 h-8 w-8 text-muted-foreground" aria-hidden="true" />
    <p className="marquee text-xl">{title}</p>
    {hint && <p className="mt-2 max-w-sm text-sm text-muted-foreground text-pretty">{hint}</p>}
    {action && (
      <Link
        to={action.to}
        className="label press mt-5 rounded-full bg-foreground px-5 py-2.5 text-background transition-opacity duration-200 hover:opacity-85"
      >
        {action.label}
      </Link>
    )}
  </Frame>
);
