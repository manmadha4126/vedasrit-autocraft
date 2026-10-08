import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn("flex shrink-0 items-center gap-2", className)} aria-label="Vedasrit Autocraft home">
      <span className="leading-none">
        <span className={cn("block font-display text-2xl font-extrabold italic tracking-tight", inverted ? "text-ink-foreground" : "text-foreground")}>
          VEDAS<span className="text-primary">RIT</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-primary" />
          <span className={cn("font-display text-sm font-bold italic tracking-[0.3em]", inverted ? "text-ink-foreground" : "text-foreground")}>
            AUTO<span className="text-primary">CRAFT</span>
          </span>
          <span className="h-0.5 w-3 bg-primary" />
        </span>
        <span className={cn("mt-0.5 block text-[8px] font-semibold tracking-[0.2em]", inverted ? "text-ink-muted" : "text-muted-foreground")}>
          CUSTOMIZATION · DETAILING · PERFECTION
        </span>
      </span>
    </Link>
  );
}
