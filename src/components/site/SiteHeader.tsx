import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart";
import { settingsQuery } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const { count, setOpen } = useCart();
  const { data: s } = useQuery(settingsQuery);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/shop", search: { q: q.trim() || undefined } });
  };

  const nav = [
    { to: "/shop", label: "Shop All" },
    { to: "/shop", label: "Interior", search: { category: "interior" } },
    { to: "/shop", label: "Exterior", search: { category: "exterior" } },
    { to: "/shop", label: "Lighting", search: { category: "lighting" } },
    { to: "/shop", label: "Electronics", search: { category: "electronics" } },
    { to: "/shop", label: "Car Care", search: { category: "car-care" } },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 lg:gap-8">
        <Logo />
        <form onSubmit={submit} className="order-3 col-span-3 flex min-w-0 lg:order-none lg:col-span-1">
          <div className="flex w-full items-center border border-input bg-background focus-within:border-foreground">
            <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search accessory, car brand, model or product type…"
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
              aria-label="Search products"
            />
            <button type="submit" className="bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-primary">
              Search
            </button>
          </div>
        </form>
        <div className="flex items-center justify-end gap-1 sm:gap-4">
          <div className="hidden flex-col lg:flex">
            <a href={`tel:${s?.phone?.replace(/\s/g, "") ?? ""}`} className="flex items-center gap-2 whitespace-nowrap font-display text-lg font-bold hover:text-primary">
              <Phone className="h-5 w-5 text-primary" /> {s?.phone}
            </a>
            <a href={`https://wa.me/${s?.whatsapp_number ?? ""}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary">
              <Mail className="h-3.5 w-3.5 text-primary" /> WhatsApp us
            </a>
          </div>
          <Link to={user ? "/account" : "/auth"} className="grid h-10 w-10 place-items-center border border-transparent hover:border-border" aria-label="Account">
            <User className="h-5 w-5" />
          </Link>
          <button onClick={() => setOpen(true)} className="relative grid h-10 w-10 place-items-center border border-transparent hover:border-border" aria-label="Open cart">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
      <nav className="hidden border-t border-border md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-7 px-4 text-sm font-semibold">
          {nav.map((n) => (
            <Link key={n.label} to={n.to} search={"search" in n ? n.search : {}} className="border-b-2 border-transparent py-2.5 hover:border-primary hover:text-primary">
              {n.label}
            </Link>
          ))}
          <Link to="/connect" className="ml-auto flex items-center gap-2 py-2.5 text-primary">
            <span className="h-2 w-2 bg-primary" /> Talk to CONNECT AI
          </Link>
          <Link to="/contact" className="py-2.5 hover:text-primary">Contact</Link>
        </div>
      </nav>
    </header>
  );
}
