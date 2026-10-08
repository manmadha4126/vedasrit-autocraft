import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, MessageCircle, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProductCard } from "@/components/site/ProductCard";
import { compatLabel, formatPrice, productImage, productsQuery, settingsQuery, stockLabel, waLink } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/product/$id")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Product Details — Vedasrit Autocraft" },
      { name: "description", content: "Product details, specifications and car compatibility." },
      { property: "og:title", content: "Product Details — Vedasrit Autocraft" },
      { property: "og:description", content: "Check compatibility and order on WhatsApp." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: products, isLoading } = useQuery(productsQuery);
  const { data: s } = useQuery(settingsQuery);
  const { add, setOpen } = useCart();
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const p = products?.find((x) => x.id === id);

  const reviews = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*").eq("product_id", id).eq("approved", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="mx-auto h-[60vh] max-w-7xl animate-pulse bg-muted" />;
  if (!p)
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-bold">Product not found</h1>
        <Link to="/shop" className="mt-6 inline-block bg-foreground px-5 py-3 text-background">Back to shop</Link>
      </div>
    );

  const images = p.images.length ? p.images : [productImage(p)];
  const related = products!.filter((x) => x.category_slug === p.category_slug && x.id !== p.id).slice(0, 4);
  const out = p.stock_status === "out_of_stock";
  const specs = Object.entries((p.specifications ?? {}) as Record<string, string>);

  const addToCart = () => {
    add({ id: p.id, name: p.name, price: Number(p.price), image: productImage(p), compat: compatLabel(p) }, qty);
    toast.success("Added to cart", { action: { label: "View cart", onClick: () => setOpen(true) } });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link to="/shop" search={{ category: p.category_slug }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Back to {p.subcategory || "shop"}</Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-[4/3] overflow-hidden border border-border bg-muted">
            <img src={images[img]} alt={p.name} className="h-full w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((src, i) => (
                <button key={i} onClick={() => setImg(i)} className={`h-20 w-24 overflow-hidden border-2 ${i === img ? "border-primary" : "border-transparent"}`}><img src={src} alt="" className="h-full w-full object-cover" /></button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="eyebrow text-primary">{p.brand} · {p.subcategory}</p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight">{p.name}</h1>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-star text-star" /> {Number(p.rating).toFixed(1)}</span>
            <span className="text-muted-foreground">·</span>
            <span className={out ? "text-destructive" : "text-whatsapp"}>{stockLabel[p.stock_status]}</span>
          </div>
          <p className="mt-6 font-display text-4xl font-bold">{formatPrice(p.price)}</p>
          <p className="mt-5 leading-relaxed text-muted-foreground">{p.description}</p>

          <div className="mt-6 border border-border p-4">
            <p className="eyebrow text-muted-foreground">Compatible with</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {!p.compatible_models.length && !p.compatible_brands.length ? (
                <span className="flex items-center gap-1 bg-muted px-2.5 py-1 text-sm font-semibold"><Check className="h-4 w-4 text-whatsapp" /> Universal fit — all cars</span>
              ) : (
                (p.compatible_models.length ? p.compatible_models : p.compatible_brands).map((m) => (
                  <span key={m} className="bg-muted px-2.5 py-1 text-sm font-semibold">{m}</span>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="flex items-center border border-border">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3" aria-label="Decrease"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty(Math.min(99, qty + 1))} className="p-3" aria-label="Increase"><Plus className="h-4 w-4" /></button>
            </div>
            <button disabled={out} onClick={addToCart} className="flex flex-1 items-center justify-center gap-2 bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-deep disabled:opacity-40">
              <ShoppingBag className="h-5 w-5" /> Add to cart
            </button>
            <a href={waLink(s?.whatsapp_number, `Hi, I'm interested in: ${p.name} (${formatPrice(p.price)}). Is it compatible with my car?`)} target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-whatsapp px-4 py-3 font-semibold text-whatsapp">
              <MessageCircle className="h-5 w-5" /> Ask
            </a>
          </div>

          {specs.length > 0 && (
            <table className="mt-8 w-full text-sm">
              <tbody>
                {specs.map(([k, v]) => (
                  <tr key={k} className="border-b border-border"><td className="py-2.5 text-muted-foreground">{k}</td><td className="py-2.5 text-right font-semibold">{String(v)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ReviewsBlock productId={p.id} reviews={reviews.data ?? []} />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-3xl font-bold">You may also like</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}
    </div>
  );
}

function ReviewsBlock({ productId, reviews }: { productId: string; reviews: { id: string; author_name: string; rating: number; review: string; car: string | null }[] }) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [car, setCar] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (text.trim().length < 5) { toast.error("Please write a few words"); return; }
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id, product_id: productId, rating, review: text.trim().slice(0, 1000), car: car.trim().slice(0, 60),
      author_name: profile?.name || user.email?.split("@")[0] || "Customer",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setText(""); setCar("");
    toast.success("Thanks! Your review will appear after approval.");
    qc.invalidateQueries({ queryKey: ["reviews", productId] });
  };

  return (
    <section className="mt-16 grid gap-8 border-t border-border pt-10 lg:grid-cols-2">
      <div>
        <h2 className="font-display text-3xl font-bold">Customer reviews</h2>
        {reviews.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No reviews yet — be the first.</p>}
        <div className="mt-4 space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border border-border p-4">
              <div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-star text-star" />)}</div>
              <p className="mt-2 text-sm">{r.review}</p>
              <p className="mt-2 text-xs text-muted-foreground">{r.author_name}{r.car ? ` · ${r.car}` : ""}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        {user ? (
          <form onSubmit={submit} className="border border-border p-5">
            <p className="font-display text-xl font-bold">Write a review</p>
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}><Star className={`h-6 w-6 ${n <= rating ? "fill-star text-star" : "text-border"}`} /></button>
              ))}
            </div>
            <input value={car} onChange={(e) => setCar(e.target.value)} placeholder="Your car (optional)" className="mt-3 w-full border border-input px-3 py-2 text-sm" />
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="How did it fit and perform?" className="mt-3 w-full border border-input px-3 py-2 text-sm" />
            <button disabled={busy} className="mt-3 bg-foreground px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-60">{busy ? "Submitting…" : "Submit review"}</button>
          </form>
        ) : (
          <div className="border border-dashed border-border p-6 text-sm">
            <Link to="/auth" className="font-semibold text-primary">Sign in</Link> to write a review.
          </div>
        )}
      </div>
    </section>
  );
}
