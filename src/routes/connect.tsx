import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { ArrowUp, Bot, Check, ShoppingBag, Square, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { compatLabel, formatPrice, productImage, type Product } from "@/lib/catalog";

export const Route = createFileRoute("/connect")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "CONNECT AI — Car Accessories Assistant | Vedasrit Autocraft" },
      { name: "description", content: "Tell CONNECT your car and get compatible accessory recommendations added straight to your cart." },
      { property: "og:title", content: "CONNECT AI — Vedasrit Autocraft" },
      { property: "og:description", content: "AI assistant that recommends accessories that fit your car." },
    ],
  }),
  component: ConnectPage,
});

const KEY = "autoluxe-connect-chat-v1";
const suggestions = [
  "I have a Hyundai Creta and want better interior lighting.",
  "Suggest seat covers for my Kia Seltos under ₹10,000",
  "Compare dash cams for night driving",
  "What exterior upgrades suit a Mahindra Thar?",
];

function ConnectPage() {
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  useEffect(() => {
    try {
      setInitial(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {
      setInitial([]);
    }
  }, []);
  if (!initial) return <div className="h-[70vh]" />;
  return <Chat initial={initial} />;
}

type ProductLite = Pick<Product, "id" | "name" | "brand" | "price" | "images" | "category_slug" | "compatible_brands" | "compatible_models" | "stock_status" | "rating">;

function Chat({ initial }: { initial: UIMessage[] }) {
  const cart = useCart();
  const cartRef = useRef(cart.items);
  cartRef.current = cart.items;
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const applied = useRef<Set<string>>(new Set());

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages, cart: cartRef.current.map((i) => ({ id: i.id, name: i.name, qty: i.qty })) },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, stop, setMessages, error } = useChat({
    id: "connect",
    messages: initial,
    transport,
    onError: (e) => toast.error(e.message?.includes("402") ? "AI credits exhausted" : e.message?.includes("429") ? "Too many requests — try again shortly" : "CONNECT couldn't respond. Please try again."),
  });
  const busy = status === "submitted" || status === "streaming";

  // Mark tool calls restored from history as already applied
  useEffect(() => {
    initial.forEach((m) => m.parts.forEach((p) => "toolCallId" in p && applied.current.add(p.toolCallId as string)));
  }, [initial]);

  // Apply cart actions from tools
  useEffect(() => {
    for (const m of messages) {
      for (const part of m.parts) {
        if (!part.type.startsWith("tool-") || !("toolCallId" in part)) continue;
        const pt = part as { toolCallId: string; state: string; output?: Record<string, unknown> };
        if (pt.state !== "output-available" || applied.current.has(pt.toolCallId)) continue;
        applied.current.add(pt.toolCallId);
        const o = pt.output as { ok?: boolean; action?: string; product?: ProductLite; product_id?: string; quantity?: number };
        if (!o?.ok) continue;
        if (o.action === "add" && o.product) {
          cart.add({ id: o.product.id, name: o.product.name, price: Number(o.product.price), image: productImage(o.product), compat: compatLabel(o.product) }, o.quantity ?? 1);
          toast.success(`CONNECT added ${o.product.name}`);
        } else if (o.action === "remove" && o.product_id) cart.remove(o.product_id);
        else if (o.action === "set" && o.product_id) cart.setQty(o.product_id, o.quantity ?? 0);
      }
    }
  }, [messages, cart]);

  useEffect(() => {
    if (status === "ready" || status === "error") localStorage.setItem(KEY, JSON.stringify(messages));
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => { if (!busy) inputRef.current?.focus(); }, [busy]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  };

  const clearChat = () => {
    stop();
    setMessages([]);
    localStorage.removeItem(KEY);
  };

  return (
    <div className="bg-secondary">
      <div className="mx-auto grid max-w-7xl gap-0 lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-border bg-ink p-6 text-ink-foreground lg:block">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center bg-primary"><Bot className="h-6 w-6" /></span>
            <div>
              <p className="font-display text-2xl font-bold leading-none tracking-wide">CONNECT</p>
              <p className="text-xs text-ink-muted">Accessory intelligence</p>
            </div>
          </div>
          <button onClick={clearChat} className="mt-8 flex w-full items-center justify-center gap-2 border border-ink-border py-2.5 text-sm font-semibold hover:border-primary">
            <Trash2 className="h-4 w-4" /> Clear chat
          </button>
          <p className="eyebrow mt-8 text-ink-muted">Chat history</p>
          <div className="mt-3 space-y-1">
            {messages.filter((m) => m.role === "user").slice(-8).reverse().map((m) => (
              <p key={m.id} className="truncate border-l-2 border-ink-border px-3 py-1.5 text-sm text-ink-muted">
                {m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}
              </p>
            ))}
            {!messages.length && <p className="text-sm text-ink-muted">No messages yet.</p>}
          </div>
          <div className="mt-8 border border-ink-border p-4 text-sm">
            <p className="font-semibold">Cart: {cart.count} items</p>
            <p className="text-ink-muted">{formatPrice(cart.total)}</p>
            <button onClick={() => cart.setOpen(true)} className="mt-3 w-full bg-primary py-2 text-sm font-semibold">Review cart</button>
          </div>
        </aside>

        <section className="flex h-[calc(100vh-120px)] min-h-[560px] flex-col bg-background">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
            <span className="flex items-center gap-2 font-display text-xl font-bold"><Bot className="h-5 w-5 text-primary" /> CONNECT</span>
            <button onClick={clearChat} className="text-sm text-muted-foreground">Clear</button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10">
            {messages.length === 0 && (
              <div className="mx-auto max-w-2xl pt-10 text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center bg-primary text-primary-foreground"><Bot className="h-8 w-8" /></span>
                <h1 className="mt-5 font-display text-4xl font-bold">How can I upgrade your car today?</h1>
                <p className="mt-2 text-muted-foreground">Tell me your car brand and model — I'll find accessories that fit.</p>
                <div className="mt-8 grid gap-2 sm:grid-cols-2">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => send(s)} className="border border-border p-4 text-left text-sm hover:border-foreground">{s}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((m) => (
                <Message key={m.id} m={m} />
              ))}
              {status === "submitted" && (
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center bg-ink text-ink-foreground"><Bot className="h-4 w-4" /></span>
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce bg-primary" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </span>
                </div>
              )}
              {error && <p className="text-sm text-destructive">Something went wrong. Please send your message again.</p>}
              <div ref={endRef} />
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t border-border p-4">
            <div className="mx-auto flex max-w-3xl items-end gap-2 border border-input bg-background p-2 focus-within:border-foreground">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                rows={1}
                placeholder="Ask about accessories for your car…"
                className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none"
              />
              {busy ? (
                <button type="button" onClick={stop} className="grid h-11 w-11 shrink-0 place-items-center bg-foreground text-background" aria-label="Stop"><Square className="h-4 w-4" /></button>
              ) : (
                <button type="submit" disabled={!input.trim()} className="grid h-11 w-11 shrink-0 place-items-center bg-primary text-primary-foreground disabled:opacity-40" aria-label="Send"><ArrowUp className="h-5 w-5" /></button>
              )}
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">CONNECT recommends only real products from our catalog. Confirm fitment on WhatsApp before ordering.</p>
          </form>
        </section>
      </div>
    </div>
  );
}

function Message({ m }: { m: UIMessage }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-ink px-4 py-3 text-sm text-ink-foreground">{m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}</div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1 space-y-3">
        {m.parts.map((p, i) => {
          if (p.type === "text") return <div key={i} className="prose-sm max-w-none text-sm leading-relaxed [&_li]:ml-4 [&_li]:list-disc [&_p]:my-2 [&_strong]:font-semibold"><ReactMarkdown>{p.text}</ReactMarkdown></div>;
          if (p.type === "reasoning" && p.text) return <details key={i} className="text-xs text-muted-foreground"><summary className="cursor-pointer">Thinking</summary><p className="mt-1 whitespace-pre-wrap">{p.text}</p></details>;
          if (p.type.startsWith("tool-")) return <ToolPart key={i} part={p as unknown as { type: string; state: string; output?: Record<string, unknown> }} />;
          return null;
        })}
      </div>
    </div>
  );
}

function ToolPart({ part }: { part: { type: string; state: string; output?: Record<string, unknown> } }) {
  const name = part.type.replace("tool-", "");
  if (part.state !== "output-available") {
    return <p className="text-xs text-muted-foreground">{name === "search_products" ? "Searching the catalog…" : "Updating your cart…"}</p>;
  }
  const out = part.output as { products?: ProductLite[]; ok?: boolean; action?: string; product?: ProductLite; error?: string };
  if (name === "search_products") {
    if (!out.products?.length) return <p className="text-xs text-muted-foreground">No matching products found.</p>;
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {out.products.map((p) => <MiniCard key={p.id} p={p} />)}
      </div>
    );
  }
  if (!out.ok) return <p className="text-xs text-destructive">Couldn't update cart: {out.error}</p>;
  return (
    <p className="inline-flex items-center gap-1.5 bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
      <Check className="h-3.5 w-3.5" />
      {out.action === "add" ? `Added ${out.product?.name} to cart` : out.action === "remove" ? "Removed from cart" : "Cart quantity updated"}
    </p>
  );
}

function MiniCard({ p }: { p: ProductLite }) {
  const { add } = useCart();
  return (
    <div className="flex gap-3 border border-border p-2.5">
      <img src={productImage(p)} alt={p.name} className="h-20 w-20 shrink-0 object-cover" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Link to="/product/$id" params={{ id: p.id }} className="line-clamp-2 text-sm font-semibold leading-tight hover:text-primary">{p.name}</Link>
        <span className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">Fits: {compatLabel(p)}</span>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-sm font-bold">{formatPrice(p.price)} <span className="ml-1 inline-flex items-center text-[11px] font-normal text-muted-foreground"><Star className="mr-0.5 h-3 w-3 fill-star text-star" />{Number(p.rating).toFixed(1)}</span></span>
          <button
            disabled={p.stock_status === "out_of_stock"}
            onClick={() => { add({ id: p.id, name: p.name, price: Number(p.price), image: productImage(p), compat: compatLabel(p) }); toast.success("Added to cart"); }}
            className="flex items-center gap-1 bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground disabled:opacity-40"
          >
            <ShoppingBag className="h-3 w-3" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
