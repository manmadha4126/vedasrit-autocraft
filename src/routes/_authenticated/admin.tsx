import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { carBrandsQuery, categoriesQuery, formatPrice, productImage, productsQuery, settingsQuery, type Product } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Admin Dashboard — Vedasrit Autocraft" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

const input = "w-full border border-input bg-background px-3 py-2 text-sm";

function Admin() {
  const { isAdmin, rolesLoading } = useAuth();
  if (rolesLoading) return <div className="p-20 text-center text-muted-foreground">Loading…</div>;
  if (!isAdmin)
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Admins only</h1>
        <p className="mt-2 text-muted-foreground">Your account doesn't have admin access.</p>
        <Link to="/" className="mt-6 inline-block bg-foreground px-5 py-3 text-background">Go home</Link>
      </div>
    );
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <p className="eyebrow text-primary">Admin</p>
      <h1 className="font-display text-4xl font-bold">Store dashboard</h1>
      <Tabs defaultValue="products" className="mt-8">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1 rounded-none bg-muted p-1">
          {["products", "categories", "cars", "orders", "consultations", "reviews", "customers", "settings"].map((t) => (
            <TabsTrigger key={t} value={t} className="rounded-none capitalize">{t === "cars" ? "Car brands & models" : t}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="products"><ProductsAdmin /></TabsContent>
        <TabsContent value="categories"><CategoriesAdmin /></TabsContent>
        <TabsContent value="cars"><CarsAdmin /></TabsContent>
        <TabsContent value="orders"><OrdersAdmin /></TabsContent>
        <TabsContent value="consultations"><ConsultationsAdmin /></TabsContent>
        <TabsContent value="reviews"><ReviewsAdmin /></TabsContent>
        <TabsContent value="customers"><CustomersAdmin /></TabsContent>
        <TabsContent value="settings"><SettingsAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

async function uploadImage(file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error("Image must be under 10MB");
  const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2 || !data) throw e2 ?? new Error("Could not get image URL");
  return data.signedUrl;
}

type Draft = {
  id?: string; name: string; description: string; category_slug: string; subcategory: string; brand: string; price: string;
  images: string[]; compatible_brands: string[]; compatible_models: string[]; stock_status: string; rating: string; specs: string;
};
const blank: Draft = { name: "", description: "", category_slug: "interior", subcategory: "", brand: "", price: "", images: [], compatible_brands: [], compatible_models: [], stock_status: "in_stock", rating: "4.5", specs: "" };

function ProductsAdmin() {
  const qc = useQueryClient();
  const { data: products } = useQuery(productsQuery);
  const { data: cats } = useQuery(categoriesQuery);
  const { data: brands } = useQuery(carBrandsQuery);
  const [d, setD] = useState<Draft | null>(null);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);

  const edit = (p: Product) =>
    setD({
      id: p.id, name: p.name, description: p.description ?? "", category_slug: p.category_slug, subcategory: p.subcategory ?? "", brand: p.brand ?? "",
      price: String(p.price), images: p.images, compatible_brands: p.compatible_brands, compatible_models: p.compatible_models, stock_status: p.stock_status,
      rating: String(p.rating), specs: Object.entries((p.specifications ?? {}) as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join("\n"),
    });

  const save = async () => {
    if (!d) return;
    if (!d.name.trim() || !(Number(d.price) >= 0) || d.price === "") { toast.error("Name and price are required"); return; }
    const specifications: Record<string, string> = {};
    for (const line of d.specs.split("\n")) {
      const i = line.indexOf(":");
      if (i > 0) specifications[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
    const row = {
      name: d.name.trim(), description: d.description.trim(), category_slug: d.category_slug, subcategory: d.subcategory.trim(), brand: d.brand.trim(),
      price: Number(d.price), images: d.images, compatible_brands: d.compatible_brands, compatible_models: d.compatible_models, stock_status: d.stock_status,
      rating: Math.min(5, Math.max(0, Number(d.rating) || 0)), specifications, updated_at: new Date().toISOString(),
    };
    setBusy(true);
    const { error } = d.id ? await supabase.from("products").update(row).eq("id", d.id) : await supabase.from("products").insert(row);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Product saved");
    setD(null);
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const onFile = async (files: FileList | null) => {
    if (!files || !d) return;
    setBusy(true);
    try {
      const urls = await Promise.all([...files].map(uploadImage));
      setD({ ...d, images: [...d.images, ...urls] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const cat = cats?.find((c) => c.slug === d?.category_slug);
  const list = (products ?? []).filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        <input className={`${input} max-w-xs`} placeholder="Filter products…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <button onClick={() => setD({ ...blank })} className="flex items-center gap-2 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> Add product</button>
      </div>

      {d && (
        <div className="mt-6 border border-foreground p-5">
          <div className="flex justify-between"><p className="font-display text-2xl font-bold">{d.id ? "Edit product" : "New product"}</p><button onClick={() => setD(null)}><X className="h-5 w-5" /></button></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input className={input} placeholder="Product name *" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
            <input className={input} placeholder="Accessory brand" value={d.brand} onChange={(e) => setD({ ...d, brand: e.target.value })} />
            <select className={input} value={d.category_slug} onChange={(e) => setD({ ...d, category_slug: e.target.value, subcategory: "" })}>
              {cats?.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            <select className={input} value={d.subcategory} onChange={(e) => setD({ ...d, subcategory: e.target.value })}>
              <option value="">Subcategory</option>
              {cat?.subcategories.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input className={input} type="number" placeholder="Price (₹) *" value={d.price} onChange={(e) => setD({ ...d, price: e.target.value })} />
            <div className="flex gap-2">
              <select className={input} value={d.stock_status} onChange={(e) => setD({ ...d, stock_status: e.target.value })}>
                <option value="in_stock">In stock</option><option value="low_stock">Few left</option><option value="out_of_stock">Out of stock</option>
              </select>
              <input className={input} type="number" step="0.1" min="0" max="5" placeholder="Rating" value={d.rating} onChange={(e) => setD({ ...d, rating: e.target.value })} />
            </div>
            <textarea className={`${input} md:col-span-2`} rows={3} placeholder="Description" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
            <textarea className={input} rows={4} placeholder={"Specifications (one per line)\nMaterial: Leather"} value={d.specs} onChange={(e) => setD({ ...d, specs: e.target.value })} />
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Images</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {d.images.map((u) => (
                  <div key={u} className="relative"><img src={u} alt="" className="h-16 w-16 object-cover" /><button onClick={() => setD({ ...d, images: d.images.filter((x) => x !== u) })} className="absolute -right-1 -top-1 bg-foreground p-0.5 text-background"><X className="h-3 w-3" /></button></div>
                ))}
                <label className="grid h-16 w-16 cursor-pointer place-items-center border border-dashed border-border"><Upload className="h-4 w-4" /><input type="file" accept="image/*" multiple hidden onChange={(e) => onFile(e.target.files)} /></label>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground">Compatible cars (leave empty for universal fit)</p>
            <div className="mt-2 space-y-2">
              {brands?.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center gap-1.5">
                  <button onClick={() => setD({ ...d, compatible_brands: toggle(d.compatible_brands, b.name) })} className={`px-2 py-1 text-xs font-bold ${d.compatible_brands.includes(b.name) ? "bg-foreground text-background" : "border border-border"}`}>{b.name}</button>
                  {b.car_models.map((m) => (
                    <button key={m.id} onClick={() => setD({ ...d, compatible_models: toggle(d.compatible_models, m.name), compatible_brands: d.compatible_brands.includes(b.name) ? d.compatible_brands : [...d.compatible_brands, b.name] })} className={`px-2 py-1 text-xs ${d.compatible_models.includes(m.name) ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{m.name}</button>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <button disabled={busy} onClick={save} className="mt-5 bg-foreground px-6 py-2.5 text-sm font-semibold text-background disabled:opacity-60">{busy ? "Working…" : "Save product"}</button>
        </div>
      )}

      <div className="mt-6 overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Fits</th><th className="p-3" /></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3"><div className="flex items-center gap-3"><img src={productImage(p)} alt="" className="h-10 w-10 object-cover" /><span className="font-semibold">{p.name}</span></div></td>
                <td className="p-3">{p.category_slug}</td>
                <td className="p-3">{formatPrice(p.price)}</td>
                <td className="p-3">
                  <select className="border border-input bg-background px-2 py-1 text-xs" value={p.stock_status} onChange={async (e) => { await supabase.from("products").update({ stock_status: e.target.value }).eq("id", p.id); qc.invalidateQueries({ queryKey: ["products"] }); }}>
                    <option value="in_stock">In stock</option><option value="low_stock">Few left</option><option value="out_of_stock">Out</option>
                  </select>
                </td>
                <td className="max-w-[200px] truncate p-3 text-xs text-muted-foreground">{p.compatible_models.join(", ") || p.compatible_brands.join(", ") || "Universal"}</td>
                <td className="p-3"><div className="flex gap-2"><button onClick={() => edit(p)} aria-label="Edit"><Pencil className="h-4 w-4" /></button><button onClick={() => del(p.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoriesAdmin() {
  const qc = useQueryClient();
  const { data: cats } = useQuery(categoriesQuery);
  const [n, setN] = useState({ name: "", slug: "", description: "", subs: "" });
  const add = async () => {
    const slug = (n.slug || n.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    if (!n.name.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: n.name.trim(), slug, description: n.description, subcategories: n.subs.split(",").map((s) => s.trim()).filter(Boolean), sort_order: (cats?.length ?? 0) + 1 });
    if (error) { toast.error(error.message); return; }
    setN({ name: "", slug: "", description: "", subs: "" });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };
  const update = async (id: string, patch: Database["public"]["Tables"]["categories"]["Update"]) => {
    const { error } = await supabase.from("categories").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["categories"] });
  };
  const del = async (id: string) => {
    if (!confirm("Delete category? Products in it must be moved first.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error("Can't delete — products still use this category"); return; }
    qc.invalidateQueries({ queryKey: ["categories"] });
  };
  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-2 border border-border p-4 md:grid-cols-4">
        <input className={input} placeholder="Name" value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} />
        <input className={input} placeholder="Description" value={n.description} onChange={(e) => setN({ ...n, description: e.target.value })} />
        <input className={input} placeholder="Subcategories (comma separated)" value={n.subs} onChange={(e) => setN({ ...n, subs: e.target.value })} />
        <button onClick={add} className="bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Add category</button>
      </div>
      {cats?.map((c) => (
        <div key={c.id} className="grid gap-2 border border-border p-4 md:grid-cols-[1fr_2fr_2fr_auto_auto]">
          <input className={input} defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && update(c.id, { name: e.target.value })} />
          <input className={input} defaultValue={c.description ?? ""} onBlur={(e) => e.target.value !== c.description && update(c.id, { description: e.target.value })} />
          <input className={input} defaultValue={c.subcategories.join(", ")} onBlur={(e) => update(c.id, { subcategories: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
          <label className="flex cursor-pointer items-center gap-1 border border-border px-3 text-xs"><Upload className="h-3.5 w-3.5" /> Image
            <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { update(c.id, { image_url: await uploadImage(f) }); } catch (er) { toast.error(String(er)); } }} />
          </label>
          <button onClick={() => del(c.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></button>
        </div>
      ))}
    </div>
  );
}

function CarsAdmin() {
  const qc = useQueryClient();
  const { data: brands } = useQuery(carBrandsQuery);
  const [brand, setBrand] = useState("");
  const [models, setModels] = useState<Record<string, string>>({});
  const refresh = () => qc.invalidateQueries({ queryKey: ["car-brands"] });
  const addBrand = async () => {
    if (!brand.trim()) return;
    const { error } = await supabase.from("car_brands").insert({ name: brand.trim() });
    if (error) { toast.error(error.message); return; }
    setBrand(""); refresh();
  };
  const addModel = async (brand_id: string) => {
    const name = models[brand_id]?.trim();
    if (!name) return;
    const { error } = await supabase.from("car_models").insert({ brand_id, name });
    if (error) { toast.error(error.message); return; }
    setModels({ ...models, [brand_id]: "" }); refresh();
  };
  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-2"><input className={`${input} max-w-xs`} placeholder="New car brand" value={brand} onChange={(e) => setBrand(e.target.value)} /><button onClick={addBrand} className="bg-primary px-4 text-sm font-semibold text-primary-foreground">Add brand</button></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {brands?.map((b) => (
          <div key={b.id} className="border border-border p-4">
            <div className="flex justify-between"><p className="font-display text-xl font-bold">{b.name}</p>
              <button onClick={async () => { if (confirm(`Delete ${b.name}?`)) { await supabase.from("car_brands").delete().eq("id", b.id); refresh(); } }}><Trash2 className="h-4 w-4 text-destructive" /></button></div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {b.car_models.map((m) => (
                <span key={m.id} className="flex items-center gap-1 bg-muted px-2 py-1 text-xs">{m.name}<button onClick={async () => { await supabase.from("car_models").delete().eq("id", m.id); refresh(); }}><X className="h-3 w-3" /></button></span>
              ))}
            </div>
            <div className="mt-3 flex gap-2"><input className={input} placeholder="Add model" value={models[b.id] ?? ""} onChange={(e) => setModels({ ...models, [b.id]: e.target.value })} /><button onClick={() => addModel(b.id)} className="border border-border px-3 text-sm">Add</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => { const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; },
  });
  if (isLoading) return <p className="mt-6 text-muted-foreground">Loading…</p>;
  if (!data?.length) return <p className="mt-6 text-muted-foreground">No WhatsApp orders yet.</p>;
  return (
    <div className="mt-6 space-y-3">
      {data.map((o) => (
        <div key={o.id} className="border border-border p-4 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <div><p className="font-semibold">{o.customer_name} · {o.customer_phone}</p><p className="text-xs text-muted-foreground">{o.customer_address}</p></div>
            <div className="text-right"><p className="font-display text-xl font-bold">{formatPrice(o.total)}</p><p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p></div>
          </div>
          <ul className="mt-2 text-xs">{(o.items as { name: string; qty: number; price: number; compat: string }[]).map((i, k) => <li key={k}>• {i.name} × {i.qty} — {formatPrice(i.price * i.qty)} <span className="text-muted-foreground">({i.compat})</span></li>)}</ul>
          <select className="mt-3 border border-input bg-background px-2 py-1 text-xs" value={o.whatsapp_status} onChange={async (e) => { await supabase.from("orders").update({ whatsapp_status: e.target.value }).eq("id", o.id); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }}>
            <option value="sent_to_whatsapp">Sent to WhatsApp</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
          </select>
        </div>
      ))}
    </div>
  );
}

function ConsultationsAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-consultations"],
    queryFn: async () => { const { data, error } = await supabase.from("consultations").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; },
  });
  if (isLoading) return <p className="mt-6 text-muted-foreground">Loading…</p>;
  if (!data?.length) return <p className="mt-6 text-muted-foreground">No consultation requests yet.</p>;
  return (
    <div className="mt-6 grid gap-3 md:grid-cols-2">
      {data.map((c) => (
        <div key={c.id} className="border border-border p-4 text-sm">
          <div className="flex justify-between"><p className="font-semibold">{c.name}</p><span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span></div>
          <p className="text-xs">{c.phone} · {c.email}</p>
          <p className="mt-2"><b>Car:</b> {c.car_brand} {c.car_model}</p>
          <p><b>Looking for:</b> {c.looking_for}</p>
          <p className="mt-1 text-muted-foreground">{c.message}</p>
          <select className="mt-3 border border-input bg-background px-2 py-1 text-xs" value={c.status} onChange={async (e) => { await supabase.from("consultations").update({ status: e.target.value }).eq("id", c.id); qc.invalidateQueries({ queryKey: ["admin-consultations"] }); }}>
            <option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option>
          </select>
        </div>
      ))}
    </div>
  );
}

function ReviewsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => { const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-reviews"] }); qc.invalidateQueries({ queryKey: ["reviews-public"] }); };
  return (
    <div className="mt-6 space-y-2">
      {data?.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border border-border p-3 text-sm">
          <div className="min-w-0 flex-1"><p className="font-semibold">{r.author_name} · {"★".repeat(r.rating)} <span className="font-normal text-muted-foreground">{r.car}</span></p><p className="text-muted-foreground">{r.review}</p></div>
          <div className="flex gap-2">
            <button onClick={async () => { await supabase.from("reviews").update({ approved: !r.approved }).eq("id", r.id); refresh(); }} className={`px-3 py-1.5 text-xs font-semibold ${r.approved ? "border border-border" : "bg-whatsapp text-primary-foreground"}`}>{r.approved ? "Hide" : "Approve"}</button>
            <button onClick={async () => { await supabase.from("reviews").delete().eq("id", r.id); refresh(); }}><Trash2 className="h-4 w-4 text-destructive" /></button>
          </div>
        </div>
      ))}
      {!data?.length && <p className="text-muted-foreground">No reviews.</p>}
    </div>
  );
}

function CustomersAdmin() {
  const { data } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => { const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; },
  });
  return (
    <div className="mt-6 overflow-x-auto border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">Address</th><th className="p-3">Joined</th></tr></thead>
        <tbody>{data?.map((c) => <tr key={c.id} className="border-t border-border"><td className="p-3 font-semibold">{c.name}</td><td className="p-3">{c.email}</td><td className="p-3">{c.phone}</td><td className="p-3 text-xs">{c.address}</td><td className="p-3 text-xs">{new Date(c.created_at).toLocaleDateString()}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function SettingsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery(settingsQuery);
  const [f, setF] = useState<Record<string, string>>({});
  useEffect(() => {
    if (data) setF({ company_name: data.company_name, about: data.about ?? "", phone: data.phone ?? "", email: data.email ?? "", whatsapp_number: data.whatsapp_number ?? "", address: data.address ?? "", office_hours: data.office_hours ?? "", map_query: data.map_query ?? "" });
  }, [data]);
  const save = async () => {
    const wa = (f["whatsapp_number"] ?? "").replace(/\D/g, "");
    if (wa.length < 8) { toast.error("Enter WhatsApp number with country code, e.g. 919876543210"); return; }
    const { error } = await supabase.from("site_settings").update({ ...f, whatsapp_number: wa, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) { toast.error(error.message); return; }
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["settings"] });
  };
  const fields: [string, string][] = [["company_name", "Company name"], ["phone", "Phone"], ["email", "Email"], ["whatsapp_number", "WhatsApp order number (with country code)"], ["address", "Address"], ["office_hours", "Office timings"], ["map_query", "Google Maps location (search text)"]];
  return (
    <div className="mt-6 max-w-2xl space-y-3">
      {fields.map(([k, l]) => (
        <label key={k} className="block text-xs font-semibold text-muted-foreground">{l}<input className={`${input} mt-1`} value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>
      ))}
      <label className="block text-xs font-semibold text-muted-foreground">About company<textarea rows={4} className={`${input} mt-1`} value={f["about"] ?? ""} onChange={(e) => setF({ ...f, about: e.target.value })} /></label>
      <button onClick={save} className="bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Save settings</button>
    </div>
  );
}
