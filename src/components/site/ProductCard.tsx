import { Link } from "@tanstack/react-router";
import { ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import { compatLabel, formatPrice, productImage, stockLabel, type Product } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

export function ProductCard({ p, compact = false }: { p: Product; compact?: boolean }) {
  const { add } = useCart();
  const out = p.stock_status === "out_of_stock";
  const onAdd = () => {
    add({ id: p.id, name: p.name, price: Number(p.price), image: productImage(p), compat: compatLabel(p) });
    toast.success(`${p.name} added to cart`);
  };
  return (
    <article className="group flex flex-col border border-border bg-card transition hover:border-foreground hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)]">
      <Link to="/product/$id" params={{ id: p.id }} className="relative block aspect-[4/3] overflow-hidden bg-muted">
        <img src={productImage(p)} alt={p.name} loading="lazy" width={1024} height={768} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className={cn("absolute left-0 top-0 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider", out ? "bg-muted-foreground text-background" : p.stock_status === "low_stock" ? "bg-primary text-primary-foreground" : "bg-foreground text-background")}>
          {stockLabel[p.stock_status] ?? p.stock_status}
        </span>
      </Link>
      <div className={cn("flex flex-1 flex-col", compact ? "p-3" : "p-4")}>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider">{p.brand}</span>
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-star text-star" /> {Number(p.rating).toFixed(1)}</span>
        </div>
        <Link to="/product/$id" params={{ id: p.id }} className="mt-1.5 line-clamp-2 font-display text-lg font-semibold leading-tight hover:text-primary">
          {p.name}
        </Link>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">Fits: {compatLabel(p)}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <span className="font-display text-xl font-bold">{formatPrice(p.price)}</span>
          <div className="flex gap-1.5">
            {!compact && (
              <Link to="/product/$id" params={{ id: p.id }} className="border border-border px-3 py-2 text-xs font-semibold hover:border-foreground">
                Details
              </Link>
            )}
            <button disabled={out} onClick={onAdd} className="flex items-center gap-1.5 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-deep disabled:opacity-40">
              <ShoppingBag className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
