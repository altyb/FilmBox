import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";
import { useWatchlist, type SavedTitle } from "@/lib/preferences";

export const WatchlistButton = ({
  entry,
  className,
}: {
  entry: Omit<SavedTitle, "addedAt">;
  className?: string;
}) => {
  const { t } = useT();
  // Subscribe to items, not has() — a selector returning a function never
  // re-renders when the list changes.
  const saved = useWatchlist((s) =>
    s.items.some((i) => i.id === entry.id && i.mediaType === entry.mediaType),
  );
  const toggle = useWatchlist((s) => s.toggle);
  const Icon = saved ? BookmarkCheck : Bookmark;

  return (
    <button
      type="button"
      onClick={() => toggle(entry)}
      aria-pressed={saved}
      className={cn(
        "label press inline-flex items-center gap-2 border px-5 py-3 transition-colors duration-200 ease-out",
        saved
          ? "border-primary text-primary"
          : "border-border text-foreground hover:border-primary hover:text-primary",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {saved ? t.inList : t.addToList}
    </button>
  );
};
