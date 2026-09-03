import { cn } from "@/lib/utils";

/** A film cell with the lamp behind it: frame, two sprockets, one warm light. */
export const Logo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={cn("h-6 w-6", className)}
  >
    <rect x="1.75" y="3.75" width="20.5" height="16.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="4.25" y="6.5" width="2" height="2" fill="currentColor" />
    <rect x="4.25" y="15.5" width="2" height="2" fill="currentColor" />
    <rect x="17.75" y="6.5" width="2" height="2" fill="currentColor" />
    <rect x="17.75" y="15.5" width="2" height="2" fill="currentColor" />
    <circle cx="12" cy="12" r="3.75" className="fill-primary" />
  </svg>
);
