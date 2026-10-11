import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { X } from "lucide-react";
import { useT } from "@/lib/language";
import { SearchBox } from "@/components/search/SearchBox";
import { centerOf } from "@/lib/utils";


/** Full-screen search that zooms out of the search button: a circle grows
 *  from the button to cover the screen, then the field rises in. */
const SearchOverlay = ({ from, onClose }: { from: HTMLElement | null; onClose: () => void }) => {
  const { t } = useT();
  const root = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const first = useRef(location.key);
  const leaving = useRef(false);

  const { contextSafe } = useGSAP(
    () => {
      const { x, y } = centerOf(from);
      gsap
        .timeline()
        .fromTo(
          root.current,
          { clipPath: `circle(0px at ${x}px ${y}px)` },
          { clipPath: `circle(150vmax at ${x}px ${y}px)`, duration: 0.6, ease: "power3.inOut" },
        )
        .fromTo(".search-rise", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.5, ease: "power3.out" }, 0.3);
    },
    { scope: root },
  );

  const close = contextSafe(() => {
    if (leaving.current) return;
    leaving.current = true;
    const { x, y } = centerOf(from);
    gsap
      .timeline({ onComplete: onClose })
      .to(".search-rise", { y: -16, autoAlpha: 0, duration: 0.2, ease: "power2.in" })
      .to(root.current, { clipPath: `circle(0px at ${x}px ${y}px)`, duration: 0.5, ease: "power3.inOut" }, 0.1);
  });

  // Picking a result navigates; close instantly so the new page isn't behind a curtain.
  useEffect(() => {
    if (location.key !== first.current) onClose();
  }, [location.key, onClose]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = overflow;
    };
  }, [close]);

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={t.search}
      style={{ clipPath: "circle(0px at 100% 0%)" }}
      className="pointer-events-auto fixed inset-0 z-[60] overflow-y-auto bg-background"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-5 pb-16 pt-24 sm:pt-32">
        <p className="search-rise marquee text-[clamp(2.25rem,7vw,4.5rem)]">{t.search}</p>
        <SearchBox size="lg" autoFocus className="search-rise" />
      </div>
      <button
        type="button"
        onClick={close}
        aria-label={t.close}
        className="search-rise press absolute end-7 top-7 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background sm:end-11 sm:top-11 sm:h-14 sm:w-14"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
};

export default SearchOverlay;
