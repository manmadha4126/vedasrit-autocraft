import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ inverted: _inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn("flex shrink-0 items-center", className)} aria-label="Vedasrit Autocraft home">
      <img src="/favicon.png" alt="Vedasrit Autocraft logo" width={64} height={64} className="h-16 w-auto object-contain md:h-20" />
    </Link>
  );
}
