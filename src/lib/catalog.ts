import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import interior from "@/assets/cat-interior.jpg";
import exterior from "@/assets/cat-exterior.jpg";
import electronics from "@/assets/cat-electronics.jpg";
import lighting from "@/assets/cat-lighting.jpg";
import audio from "@/assets/cat-audio.jpg";
import care from "@/assets/cat-care.jpg";
import performance from "@/assets/cat-performance.jpg";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Settings = Database["public"]["Tables"]["site_settings"]["Row"];

export const categoryImages: Record<string, string> = {
  interior,
  exterior,
  electronics,
  audio,
  safety: electronics,
  lighting,
  "car-care": care,
  performance,
  utility: exterior,
};

export function categoryImage(c: Pick<Category, "slug" | "image_url">) {
  return c.image_url || categoryImages[c.slug] || exterior;
}

export function productImage(p: Pick<Product, "images" | "category_slug">) {
  return p.images?.[0] || categoryImages[p.category_slug] || exterior;
}

export function formatPrice(n: number | string) {
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function compatLabel(p: Pick<Product, "compatible_brands" | "compatible_models">) {
  if (!p.compatible_models.length && !p.compatible_brands.length) return "Universal fit";
  if (p.compatible_models.length) return p.compatible_models.join(", ");
  return p.compatible_brands.join(", ");
}

export const stockLabel: Record<string, string> = {
  in_stock: "In stock",
  low_stock: "Few left",
  out_of_stock: "Out of stock",
};

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data as Settings | null;
  },
  staleTime: 60_000,
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").order("sort_order");
    if (error) throw error;
    return data;
  },
  staleTime: 60_000,
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase.from("products").select("*").order("created_at");
    if (error) throw error;
    return data;
  },
  staleTime: 30_000,
});

export const carBrandsQuery = queryOptions({
  queryKey: ["car-brands"],
  queryFn: async () => {
    const { data, error } = await supabase.from("car_brands").select("id,name,car_models(id,name)").order("name");
    if (error) throw error;
    return data;
  },
  staleTime: 60_000,
});

export const reviewsQuery = queryOptions({
  queryKey: ["reviews-public"],
  queryFn: async () => {
    const { data, error } = await supabase.from("reviews").select("*").eq("approved", true).order("created_at", { ascending: false }).limit(12);
    if (error) throw error;
    return data;
  },
});

export function waLink(number: string | null | undefined, text: string) {
  const n = (number || "").replace(/\D/g, "");
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
