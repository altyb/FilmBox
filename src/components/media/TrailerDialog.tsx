import { useState } from "react";
import { Play, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";
import type { Video } from "@/lib/tmdb";

/** The trailer is the point of a film page, so it gets the primary button.
 *  The iframe only mounts while the dialog is open — an always-mounted
 *  YouTube embed loads ~1MB of player on every title page. */
export const TrailerDialog = ({
  trailer,
  className,
}: {
  trailer: Video | null;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const { t } = useT();

  if (!trailer) {
    return (
      <span className={cn("label inline-flex items-center gap-2 border border-border px-5 py-3 text-muted-foreground", className)}>
        <Play className="rtl-flip h-3.5 w-3.5" aria-hidden="true" />
        {t.noTrailer}
      </span>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className={cn(
          "label press inline-flex items-center gap-2 border border-primary bg-primary px-5 py-3 text-primary-foreground",
          "transition-colors duration-200 ease-out hover:bg-transparent hover:text-primary",
          className,
        )}
      >
        <Play className="rtl-flip h-3.5 w-3.5 fill-current" aria-hidden="true" />
        {t.watchTrailer}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-background/90 backdrop-blur-sm data-[state=open]:animate-overlay-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[111] w-[min(64rem,94vw)] -translate-x-1/2 -translate-y-1/2",
            "border border-border bg-background p-1 shadow-2xl",
            "data-[state=open]:animate-content-in",
          )}
        >
          <Dialog.Title className="sr-only">{trailer.name}</Dialog.Title>
          <div className="aspect-video w-full bg-black">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0`}
              title={trailer.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
          <Dialog.Close
            aria-label={t.close}
            className="press absolute -top-11 end-0 flex h-9 w-9 items-center justify-center border border-border bg-background transition-colors duration-200 hover:border-primary hover:text-primary"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
