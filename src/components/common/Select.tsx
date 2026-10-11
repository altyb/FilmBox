import { useEffect, useId, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
}

/** A pill that stretches open into its option list — the same one-shape
 *  morph as the menu (width/height/radius together), so the trigger and the
 *  list never look like two pieces. Listbox semantics: arrows / Home / End
 *  move, Enter / Space pick, Escape or an outside tap closes. */
export const Select = ({
  label,
  value,
  options,
  onChange,
  className,
}: {
  /** Accessible name, also shown as a small caption inside the pill. */
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open, options, value]);

  // keep the highlighted option in view while arrowing through a long list
  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  useGSAP(
    () => {
      const btn = root.current!.querySelector<HTMLElement>(".sel-btn")!;
      const panel = root.current!.querySelector<HTMLElement>(".sel-panel")!;
      const closed = { width: btn.offsetWidth, height: btn.offsetHeight, borderRadius: btn.offsetHeight / 2 };
      gsap.to(".sel-chevron", { rotate: open ? 180 : 0, duration: 0.3, ease: "power3.out" });
      if (open) {
        gsap.set(panel, { autoAlpha: 1 });
        gsap.fromTo(
          ".sel-shape",
          closed,
          {
            width: Math.max(btn.offsetWidth, panel.offsetWidth),
            height: panel.offsetHeight,
            borderRadius: 24,
            duration: 0.6,
            ease: "elastic.out(1, 0.85)",
            overwrite: true,
          },
        );
        gsap.fromTo(".sel-opt", { y: -6, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.015, duration: 0.25, delay: 0.08, overwrite: true });
      } else {
        gsap.to(".sel-shape", { ...closed, duration: 0.3, ease: "power3.inOut", overwrite: true });
        gsap.set(panel, { autoAlpha: 0 });
      }
    },
    { scope: root, dependencies: [open] },
  );

  const pick = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
    root.current?.querySelector<HTMLElement>(".sel-btn")?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    const last = options.length - 1;
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      return setOpen(true);
    }
    if (!open) return;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(active + 1, last),
      ArrowUp: Math.max(active - 1, 0),
      Home: 0,
      End: last,
    };
    if (e.key in moves) {
      e.preventDefault();
      setActive(moves[e.key]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(active);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={root} className={cn("relative z-0 h-11 focus-within:z-30", open && "z-30", className)}>
      {/* the one white shape: the pill closed, the panel open */}
      <div className="sel-shape pointer-events-none absolute start-0 top-0 h-11 w-full rounded-full bg-foreground shadow-[0_12px_40px_-12px_rgb(0_0_0/0.45)]" />

      <button
        type="button"
        className="sel-btn relative flex h-11 w-full items-center gap-2 rounded-full ps-4 pe-3 text-background outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${label}: ${current?.label}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKey}
      >
        <span className="label shrink-0 text-background/55">{label}</span>
        <span className="min-w-0 flex-1 truncate text-start text-sm font-semibold">{current?.label}</span>
        <ChevronDown className="sel-chevron h-4 w-4 shrink-0" aria-hidden="true" />
      </button>

      <div style={{ visibility: "hidden" }} className="sel-panel absolute start-0 top-0 w-max min-w-full pt-12">
        <ul
          ref={list}
          id={id}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          className="rail max-h-72 overflow-y-auto p-1.5 pt-0"
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onPointerEnter={() => setActive(i)}
              onClick={() => pick(i)}
              className={cn(
                "sel-opt flex cursor-pointer items-center gap-3 rounded-[1.1rem] px-3.5 py-2.5 text-sm text-background transition-colors",
                i === active && "bg-background/10",
                o.value === value && "font-semibold",
              )}
            >
              <span className="flex-1 whitespace-nowrap">{o.label}</span>
              <Check className={cn("h-4 w-4", o.value === value ? "opacity-100" : "opacity-0")} aria-hidden="true" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
