import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import logo from "@/assets/vedasrit-logo.png.asset.json";

export function Logo({ inverted: _inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn("flex shrink-0 items-center", className)} aria-label="Vedasrit Autocraft home">
      <img src={logo.url} alt="Vedasrit Autocraft logo" width={160} height={160} decoding="async" className="h-14 w-auto object-contain [image-rendering:auto] md:h-16" />
    </Link>
  );
}
