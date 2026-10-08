import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

type CartLine = { id: string; name: string; qty: number };

function publicDb() {
  const url = process.env['SUPABASE_URL']!;
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

const cols = "id,name,brand,price,category_slug,subcategory,compatible_brands,compatible_models,stock_status,rating,images,description";

export const Route = createFileRoute("/api/chat")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env['LOVABLE_API_KEY'];
        if (!apiKey) return new Response("AI is not configured", { status: 500 });
        let body: { messages: UIMessage[]; cart?: CartLine[] };
        try {
          body = await request.json();
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        if (!Array.isArray(body.messages)) return new Response("Bad request", { status: 400 });
        const messages = body.messages.slice(-40);
        const cart = (body.cart ?? []).slice(0, 50);

        const db = publicDb();
        const { data: cats } = await db.from("categories").select("slug,name,subcategories");

        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
        });

        const getProduct = async (id: string) => {
          const { data } = await db.from("products").select(cols).eq("id", id).maybeSingle();
          return data;
        };

        const system = `You are CONNECT, the expert AI car-accessories assistant for Vedasrit Autocraft, a premium car accessories store in India.
Help customers understand their car and needs, recommend compatible accessories, explain compatibility, compare products and suggest alternatives.
RULES:
- ONLY recommend products returned by the search_products tool. Never invent products, prices or specs.
- Always call search_products before recommending. Pass car_brand/car_model when the user mentions their car. Products with empty compatibility lists are universal and fit any car.
- When the user asks to add/remove/change quantity, call add_to_cart / remove_from_cart / update_cart_quantity with the exact product id.
- Keep replies concise, friendly and structured (short paragraphs or bullets). Prices are in INR (₹).
- Product cards are shown automatically from tool results, so don't repeat full details — refer to products by name and explain why they fit.
- Orders are placed via WhatsApp from the cart; there is no online payment.
Categories: ${(cats ?? []).map((c) => `${c.slug} (${c.name}: ${(c.subcategories as string[]).join(", ")})`).join("; ")}.
Current cart: ${cart.length ? cart.map((c) => `${c.name} ×${c.qty} [id ${c.id}]`).join("; ") : "empty"}.`;

        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          system,
          messages: await convertToModelMessages(messages),
          abortSignal: request.signal,
          stopWhen: stepCountIs(50),
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
          tools: {
            search_products: tool({
              description: "Search the store's product database. All parameters optional; combine them. Returns up to 8 products.",
              inputSchema: z.object({
                query: z.string().nullable().describe("Keywords e.g. 'ambient lighting', 'seat covers'"),
                category: z.string().nullable().describe("Category slug"),
                car_brand: z.string().nullable(),
                car_model: z.string().nullable(),
                max_price: z.number().nullable(),
              }),
              execute: async ({ query, category, car_brand, car_model, max_price }) => {
                let q = db.from("products").select(cols).limit(200);
                if (category) q = q.eq("category_slug", category);
                if (max_price) q = q.lte("price", max_price);
                const { data, error } = await q;
                if (error) return { error: error.message, products: [] };
                const words = (query ?? "").toLowerCase().split(/\s+/).filter((w) => w.length > 2);
                const norm = (s: string) => s.toLowerCase();
                const scored = (data ?? [])
                  .filter((p) => {
                    const uni = !p.compatible_brands.length && !p.compatible_models.length;
                    if (car_model && !uni && !p.compatible_models.map(norm).includes(norm(car_model))) return false;
                    if (car_brand && !uni && !p.compatible_brands.map(norm).some((b: string) => norm(car_brand).includes(b) || b.includes(norm(car_brand)))) return false;
                    return true;
                  })
                  .map((p) => {
                    const hay = [p.name, p.description, p.subcategory, p.category_slug, p.brand].join(" ").toLowerCase();
                    let score = words.reduce((s, w) => s + (hay.includes(w) || hay.includes(w.replace(/s$/, "")) ? 2 : 0), 0);
                    if (car_model && p.compatible_models.map(norm).includes(norm(car_model))) score += 3;
                    score += Number(p.rating) / 5;
                    return { p, score };
                  })
                  .filter((x) => !words.length || x.score >= 2)
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 8)
                  .map(({ p }) => ({ ...p, description: (p.description ?? "").slice(0, 160) }));
                return { products: scored };
              },
            }),
            add_to_cart: tool({
              description: "Add a product to the customer's cart.",
              inputSchema: z.object({ product_id: z.string(), quantity: z.number().int() }),
              execute: async ({ product_id, quantity }) => {
                const p = await getProduct(product_id);
                if (!p) return { ok: false, error: "Product not found" };
                if (p.stock_status === "out_of_stock") return { ok: false, error: "Out of stock" };
                return { ok: true, action: "add", quantity: Math.max(1, Math.min(20, quantity)), product: p };
              },
            }),
            remove_from_cart: tool({
              description: "Remove a product from the customer's cart.",
              inputSchema: z.object({ product_id: z.string() }),
              execute: async ({ product_id }) => ({ ok: true, action: "remove", product_id }),
            }),
            update_cart_quantity: tool({
              description: "Set the quantity of a product already in the cart (0 removes it).",
              inputSchema: z.object({ product_id: z.string(), quantity: z.number().int() }),
              execute: async ({ product_id, quantity }) => ({ ok: true, action: "set", product_id, quantity: Math.max(0, Math.min(99, quantity)) }),
            }),
          },
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages, sendReasoning: true });
      },
    },
  },
});
