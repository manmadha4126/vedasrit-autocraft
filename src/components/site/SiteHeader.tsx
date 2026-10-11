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
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 sm:gap-4 sm:px-4 sm:py-3 lg:gap-8">
        <Logo className="[&_img]:h-11 sm:[&_img]:h-16 md:[&_img]:h-20" />
        <form onSubmit={submit} className="col-span-1 flex min-w-0 sm:order-3 sm:col-span-3 lg:order-none lg:col-span-1">
          <div className="flex w-full items-center border border-input bg-background focus-within:border-foreground">
            <Search className="ml-3 hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search accessory, car brand, model or product type…"
              className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-xs outline-none sm:px-3 sm:py-2.5 sm:text-sm"
              aria-label="Search products"
            />
            <button type="submit" aria-label="Search" className="bg-foreground px-2.5 py-1.5 text-sm font-semibold text-background hover:bg-primary sm:px-5 sm:py-2.5">
              <Search className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
        </form>
        <div className="flex items-center justify-end gap-1 sm:gap-4">
          <div className="hidden flex-col lg:flex">
            <a href={`tel:${s?.phone?.replace(/\s/g, "") ?? ""}`} className="flex items-center gap-2 whitespace-nowrap font-display text-lg font-bold hover:text-primary">
              <Phone className="h-5 w-5 text-primary" /> {s?.phone}
            </a>
            <a href={`https://wa.me/${s?.whatsapp_number ?? ""}`} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex w-fit items-center gap-2 rounded-full border-2 border-[#25D366] py-1 pl-1 pr-4 text-sm font-semibold leading-none text-[#128C7E] transition hover:bg-[#25D366] hover:text-background">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#25D366]">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-background" aria-hidden="true">
                  <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.56.93.95-3.47-.22-.36A9.4 9.4 0 0 1 2.6 12.1c0-5.2 4.24-9.44 9.46-9.44a9.4 9.4 0 0 1 9.44 9.45c0 5.21-4.24 9.45-9.45 9.45M20.1 4.03A11.3 11.3 0 0 0 12.05.7C5.8.7.7 5.8.7 12.1c0 2 .52 3.96 1.52 5.68L.6 23.7l6.05-1.59a11.3 11.3 0 0 0 5.4 1.38h.01c6.27 0 11.36-5.1 11.36-11.38 0-3.04-1.18-5.9-3.33-8.05" />
                </svg>
              </span>
              WhatsApp us
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
