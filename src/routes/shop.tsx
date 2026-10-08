import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { carBrandsQuery, categoriesQuery, productsQuery } from "@/lib/catalog";

type Search = {
  q?: string | undefined;
  category?: string | undefined;
  car?: string | undefined;
  model?: string | undefined;
  brand?: string | undefined;
  rating?: number | undefined;
  max?: number | undefined;
  sort?: string | undefined;
};

export const Route = createFileRoute("/shop")({
  staticData: { sitemap: true },
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    category: typeof s["category"] === "string" ? s["category"] : undefined,
    car: typeof s["car"] === "string" ? s["car"] : undefined,
    model: typeof s["model"] === "string" ? s["model"] : undefined,
    brand: typeof s["brand"] === "string" ? s["brand"] : undefined,
    rating: s["rating"] ? Number(s["rating"]) : undefined,
    max: s["max"] ? Number(s["max"]) : undefined,
    sort: typeof s["sort"] === "string" ? s["sort"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Car Accessories — Vedasrit Autocraft" },
      { name: "description", content: "Browse interior, exterior, lighting, electronics and performance accessories filtered by your car brand and model." },
      { property: "og:title", content: "Shop Car Accessories — Vedasrit Autocraft" },
      { property: "og:description", content: "Filter accessories by car brand, model, category, price and rating." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: products, isLoading, error } = useQuery(productsQuery);
  const { data: cats } = useQuery(categoriesQuery);
  const { data: brands } = useQuery(carBrandsQuery);
  const [mobile, setMobile] = useState(false);

  const set = (patch: Partial<Search>) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  const models = brands?.find((b) => b.name === s.car)?.car_models ?? [];
  const productBrands = useMemo(() => [...new Set(products?.map((p) => p.brand).filter(Boolean) as string[])].sort(), [products]);
  const maxPrice = useMemo(() => Math.max(1000, ...(products?.map((p) => Number(p.price)) ?? [0])), [products]);

  const list = useMemo(() => {
    if (!products) return [];
    const q = s.q?.toLowerCase().trim();
    let r = products.filter((p) => {
      if (s.category && p.category_slug !== s.category) return false;
      if (s.brand && p.brand !== s.brand) return false;
      if (s.rating && Number(p.rating) < s.rating) return false;
      if (s.max && Number(p.price) > s.max) return false;
      const universal = !p.compatible_brands.length && !p.compatible_models.length;
      if (s.car && !universal && !p.compatible_brands.includes(s.car)) return false;
      if (s.model && !universal && !p.compatible_models.includes(s.model)) return false;
      if (q) {
        const hay = [p.name, p.description, p.brand, p.subcategory, p.category_slug, ...p.compatible_brands, ...p.compatible_models].join(" ").toLowerCase();
        if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    if (s.sort === "price-asc") r = [...r].sort((a, b) => Number(a.price) - Number(b.price));
    if (s.sort === "price-desc") r = [...r].sort((a, b) => Number(b.price) - Number(a.price));
    if (s.sort === "rating") r = [...r].sort((a, b) => Number(b.rating) - Number(a.rating));
    return r;
  }, [products, s]);

  const cat = cats?.find((c) => c.slug === s.category);
  const active = Object.entries(s).filter(([k, v]) => v !== undefined && k !== "sort");
  const sel = "w-full border border-input bg-background px-3 py-2 text-sm";

  const Filters = (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2 text-muted-foreground">Your car</p>
        <select className={sel} value={s.car ?? ""} onChange={(e) => set({ car: e.target.value || undefined, model: undefined })}>
          <option value="">All car brands</option>
          {brands?.map((b) => <option key={b.id}>{b.name}</option>)}
        </select>
        <select className={`${sel} mt-2`} value={s.model ?? ""} disabled={!models.length} onChange={(e) => set({ model: e.target.value || undefined })}>
          <option value="">All models</option>
          {models.map((m) => <option key={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div>
        <p className="eyebrow mb-2 text-muted-foreground">Category</p>
        <div className="space-y-1">
          <button onClick={() => set({ category: undefined })} className={`block w-full px-2 py-1.5 text-left text-sm ${!s.category ? "bg-foreground text-background" : "hover:bg-muted"}`}>All categories</button>
          {cats?.map((c) => (
            <button key={c.id} onClick={() => set({ category: c.slug })} className={`block w-full px-2 py-1.5 text-left text-sm ${s.category === c.slug ? "bg-foreground text-background" : "hover:bg-muted"}`}>{c.name}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="eyebrow mb-2 text-muted-foreground">Max price: ₹{(s.max ?? maxPrice).toLocaleString("en-IN")}</p>
        <input type="range" min={500} max={maxPrice} step={500} value={s.max ?? maxPrice} onChange={(e) => set({ max: Number(e.target.value) >= maxPrice ? undefined : Number(e.target.value) })} className="w-full accent-primary" />
      </div>
      <div>
        <p className="eyebrow mb-2 text-muted-foreground">Accessory brand</p>
        <select className={sel} value={s.brand ?? ""} onChange={(e) => set({ brand: e.target.value || undefined })}>
          <option value="">All brands</option>
          {productBrands.map((b) => <option key={b}>{b}</option>)}
        </select>
      </div>
      <div>
        <p className="eyebrow mb-2 text-muted-foreground">Rating</p>
        <div className="flex gap-1">
          {[undefined, 4, 4.5].map((r) => (
            <button key={String(r)} onClick={() => set({ rating: r })} className={`flex-1 border px-2 py-1.5 text-sm ${s.rating === r ? "border-foreground bg-foreground text-background" : "border-border"}`}>{r ? `${r}★+` : "Any"}</button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="bg-ink text-ink-foreground">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <p className="eyebrow text-primary">Shop</p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">{cat?.name ?? (s.q ? `Results for "${s.q}"` : "All Accessories")}</h1>
          {cat?.description && <p className="mt-2 max-w-2xl text-ink-muted">{cat.description}</p>}
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">{Filters}</aside>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <p className="text-sm text-muted-foreground">{isLoading ? "Loading…" : `${list.length} products`}</p>
            <div className="flex gap-2">
              <button onClick={() => setMobile(!mobile)} className="flex items-center gap-2 border border-border px-3 py-2 text-sm lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Filters</button>
              <select className="border border-input bg-background px-3 py-2 text-sm" value={s.sort ?? ""} onChange={(e) => set({ sort: e.target.value || undefined })}>
                <option value="">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </div>
          </div>
          {mobile && <div className="border-b border-border py-6 lg:hidden">{Filters}</div>}
          {active.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {active.map(([k, v]) => (
                <button key={k} onClick={() => set({ [k]: undefined } as Partial<Search>)} className="flex items-center gap-1 bg-muted px-2.5 py-1 text-xs font-semibold">
                  {k === "category" ? cats?.find((c) => c.slug === v)?.name : k === "max" ? `≤ ₹${v}` : k === "rating" ? `${v}★+` : String(v)} <X className="h-3 w-3" />
                </button>
              ))}
              <button onClick={() => navigate({ search: {} })} className="text-xs font-semibold text-primary">Clear all</button>
            </div>
          )}
          {error && <p className="mt-10 text-destructive">Couldn't load products. Please refresh.</p>}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {isLoading && Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-80 animate-pulse bg-muted" />)}
            {list.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          {!isLoading && list.length === 0 && (
            <div className="mt-10 border border-dashed border-border p-12 text-center">
              <p className="font-display text-2xl font-bold">No matching accessories</p>
              <p className="mt-2 text-sm text-muted-foreground">Try removing a filter, or ask CONNECT AI to find something for your car.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
