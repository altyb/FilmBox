import { lazy, Suspense, type ReactNode } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";
import type { Video } from "@/lib/tmdb";

// The dialog (Radix + the player shell) is its own chunk, fetched right after
// the page paints instead of riding in the main bundle.
const TrailerDialog = lazy(() => import("./TrailerDialog").then((m) => ({ default: m.TrailerDialog })));

const DEFAULT_TRIGGER = "label press inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-background";

/** Drop-in for TrailerDialog: renders a look-alike button until the dialog
 *  chunk has loaded (a few ms), then the real thing. */
export const TrailerButton = (props: { trailer: Video | null; className?: string; children?: ReactNode }) => {
  const { t } = useT();
  const fallback = (
    <span aria-hidden="true" className={props.children ? props.className : cn(DEFAULT_TRIGGER, props.className)}>
      {props.children ?? (
        <>
          <Play className="rtl-flip h-3.5 w-3.5 fill-current" aria-hidden="true" />
          {t.watchTrailer}
        </>
      )}
    </span>
  );
  return (
    <Suspense fallback={fallback}>
      <TrailerDialog {...props} />
    </Suspense>
  );
};
