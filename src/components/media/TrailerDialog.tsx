import { useRef, useState, type ReactNode } from "react";
import { Play, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";
import { safeYoutubeKey } from "@/lib/security";
import type { Video } from "@/lib/tmdb";

/** The trailer is the point of a film page, so it gets the primary button.
 *  The iframe only mounts once the opening animation lands — an always-mounted
 *  YouTube embed loads ~1MB of player on every title page.
 *  Opening: a dark circle grows out of the pressed button to fill the screen,
 *  then the player flies out of that same point. Closing plays it backwards. */
export const TrailerDialog = ({
  trailer,
  className,
  children,
}: {
  trailer: Video | null;
  className?: string;
  /** Custom trigger content; the caller then owns the trigger styling. */
  children?: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const { t } = useT();
  const videoId = safeYoutubeKey(trailer?.key);
  const trigger = useRef<HTMLButtonElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  /** Where the button sits, relative to the screen centre. */
  const origin = () => {
    const r = trigger.current?.getBoundingClientRect();
    const x = r ? r.left + r.width / 2 : window.innerWidth / 2;
    const y = r ? r.top + r.height / 2 : window.innerHeight / 2;
    return { x, y, dx: x - window.innerWidth / 2, dy: y - window.innerHeight / 2 };
  };

  const playIn = () => {
    const { x, y, dx, dy } = origin();
    gsap
      .timeline({ onComplete: () => setReady(true) })
      .fromTo(
        overlay.current,
        { clipPath: `circle(0px at ${x}px ${y}px)` },
        { clipPath: `circle(150vmax at ${x}px ${y}px)`, duration: 0.7, ease: "power3.inOut" },
      )
      .fromTo(
        content.current,
        { xPercent: -50, yPercent: -50, x: dx, y: dy, scale: 0.1, opacity: 0, borderRadius: "999px" },
        { x: 0, y: 0, scale: 1, opacity: 1, borderRadius: "16px", duration: 0.75, ease: "expo.out" },
        0.3,
      );
  };

  const playOut = () => {
    if (closing.current) return;
    closing.current = true;
    setReady(false);
    const { x, y, dx, dy } = origin();
    gsap
      .timeline({
        onComplete: () => {
          closing.current = false;
          setOpen(false);
        },
      })
      .to(content.current, { x: dx, y: dy, scale: 0.1, opacity: 0, borderRadius: "999px", duration: 0.45, ease: "power3.in" })
      .to(overlay.current, { clipPath: `circle(0px at ${x}px ${y}px)`, duration: 0.5, ease: "power3.inOut" }, 0.15);
  };

  if (!trailer || !videoId) {
    return (
      <span className={cn("label inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-muted-foreground", className)}>
        <Play className="rtl-flip h-3.5 w-3.5" aria-hidden="true" />
        {t.noTrailer}
      </span>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => (v ? setOpen(true) : playOut())}>
      <Dialog.Trigger
        ref={trigger}
        className={children ? className : cn(
          "label press inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-background",
          "transition-colors duration-200 ease-out hover:opacity-90",
          className,
        )}
      >
        {children ?? (
          <>
            <Play className="rtl-flip h-3.5 w-3.5 fill-current" aria-hidden="true" />
            {t.watchTrailer}
          </>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay ref={overlay} className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-sm" />
        <Dialog.Content
          ref={content}
          onOpenAutoFocus={playIn}
          className="fixed left-1/2 top-1/2 z-[111] w-[min(72rem,94vw)] overflow-hidden bg-black shadow-2xl"
          style={{ opacity: 0 }}
        >
          <Dialog.Title className="sr-only">{trailer.name}</Dialog.Title>
          <div className="aspect-video w-full bg-black">
            {ready && (
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
                title={trailer.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
          <Dialog.Close
            aria-label={t.close}
            className="press absolute end-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-transform duration-200 hover:scale-105"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
