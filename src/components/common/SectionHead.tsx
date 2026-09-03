import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";

/** Marquee lettering, then an amber rule that runs to the end of the line.
 *  The rule is what makes a section read as a title card rather than an <h2>. */
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
      <h2 className="marquee shrink-0 text-xl sm:text-2xl">{title}</h2>
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
      {count && <span className="label shrink-0 text-muted-foreground tabular-nums">{count}</span>}
      {to && (
        <Link
          to={to}
          className="label group shrink-0 text-muted-foreground transition-colors duration-200 hover:text-primary"
        >
          {t.viewAll}
          <ArrowRight className="rtl-flip ms-1 inline h-3 w-3" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
};
