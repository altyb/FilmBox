import { Link } from "react-router-dom";
import { User2 } from "lucide-react";
import { profileUrl } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

export const PersonCard = ({
  id,
  name,
  role,
  profilePath,
  index,
  className,
}: {
  id: number;
  name: string;
  role?: string | null;
  profilePath: string | null;
  index?: number;
  className?: string;
}) => {
  const src = profileUrl(profilePath, "w185");
  return (
    <Link
      to={`/person/${id}`}
      className={cn("group block press stagger-in", className)}
      style={index !== undefined ? ({ "--i": Math.min(index, 12) } as React.CSSProperties) : undefined}
    >
      <div className="relative transition-transform duration-300 ease-out group-hover:-translate-y-1">
        <div className="shimmer relative aspect-[1/1] overflow-hidden !rounded-full bg-surface-2 ring-1 ring-inset ring-foreground/5">
          {src ? (
            <img
              src={src}
              alt={name}
              width={185}
              height={185}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-top grayscale transition-[filter] duration-300 ease-out group-hover:grayscale-0"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User2 className="h-7 w-7 text-muted-foreground/60" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>
      <div className="mt-2">
        <p className="line-clamp-1 text-[13px] font-medium leading-snug">
          {name}
        </p>
        {role && <p className="label mt-0.5 line-clamp-1 text-muted-foreground">{role}</p>}
      </div>
    </Link>
  );
};
