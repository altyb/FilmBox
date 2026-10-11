import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";

/** Marquee title, a soft "view all" pill at the end of the line. */
export const SectionHead = ({
  title,
  to,
  count,
  className,
}: {
  title: string;
  to?: string;
  count?: string;
  className?: string;
}) => {
  const { t } = useT();
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <h2 className="marquee min-w-0 flex-1 text-2xl sm:text-3xl">{title}</h2>
      {count && <span className="label shrink-0 text-muted-foreground tabular-nums">{count}</span>}
      {to && (
        <Link
          to={to}
          className="label press group inline-flex shrink-0 items-center rounded-full bg-surface-2 px-4 py-2 text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background"
        >
          {t.viewAll}
          <ArrowRight className="rtl-flip ms-1 inline h-3 w-3" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
};
