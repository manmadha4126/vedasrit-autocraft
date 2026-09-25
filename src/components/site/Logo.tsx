import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn("flex shrink-0 items-center gap-2", className)} aria-label="Autoluxe home">
      <span className="grid h-9 w-9 place-items-center bg-primary font-display text-lg font-bold text-primary-foreground">A</span>
      <span className="leading-none">
        <span className={cn("block font-display text-xl font-bold tracking-wide", inverted ? "text-ink-foreground" : "text-foreground")}>
          AUTO<span className="text-primary">LUXE</span>
        </span>
        <span className={cn("block text-[10px] font-semibold tracking-[0.25em]", inverted ? "text-ink-muted" : "text-muted-foreground")}>
          CAR ACCESSORIES
        </span>
      </span>
    </Link>
  );
}
