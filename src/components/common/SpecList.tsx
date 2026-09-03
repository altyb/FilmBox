import { cn } from "@/lib/utils";

export interface Spec {
  label: string;
  value: React.ReactNode;
}

/** Film-can spec sheet: label, dotted leader, value. The leader is what makes
 *  a stack of key/value pairs read as a printed can label. */
export const SpecList = ({ items, className }: { items: Spec[]; className?: string }) => {
  const rows = items.filter((i) => i.value !== null && i.value !== undefined && i.value !== "");
  if (!rows.length) return null;

  return (
    <dl className={cn("space-y-2.5", className)}>
      {rows.map((row) => (
        <div key={row.label} className="spec-row">
          <dt className="label text-muted-foreground">{row.label}</dt>
          <span className="leader" aria-hidden="true" />
          <dd className="font-mono text-xs text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
};
