import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Youtube } from "lucide-react";
import { Logo } from "./Logo";
import { categoriesQuery, settingsQuery, waLink } from "@/lib/catalog";

export function SiteFooter() {
  const { data: s } = useQuery(settingsQuery);
  const { data: cats } = useQuery(categoriesQuery);
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo inverted />
          <p className="mt-5 text-sm leading-relaxed text-ink-muted">{s?.about}</p>
          <div className="mt-5 flex gap-2">
            {[Instagram, Facebook, Youtube].map((I, i) => (
              <a key={i} href="#" aria-label="Social link" className="grid h-9 w-9 place-items-center border border-ink-border hover:border-primary hover:text-primary">
                <I className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="eyebrow text-ink-muted">Quick Links</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/shop" className="hover:text-primary">Shop All</Link></li>
            <li><Link to="/connect" className="hover:text-primary">CONNECT AI Assistant</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Consultation & Contact</Link></li>
            <li><Link to="/account" className="hover:text-primary">My Account</Link></li>
            <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-primary">Terms & Conditions</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="eyebrow text-ink-muted">Categories</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {cats?.map((c) => (
              <li key={c.id}><Link to="/shop" search={{ category: c.slug }} className="hover:text-primary">{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="eyebrow text-ink-muted">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-primary" /> {s?.phone}</li>
            <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-primary" /> {s?.email}</li>
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" /> {s?.address}</li>
          </ul>
          <a href={waLink(s?.whatsapp_number, "Hi, I'd like help choosing car accessories.")} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 bg-whatsapp px-4 py-2.5 text-sm font-semibold text-primary-foreground">
            <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
          </a>
        </div>
      </div>
      <div className="border-t border-ink-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-ink-muted sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} {s?.company_name ?? "Vedasrit Autocraft"}. All rights reserved.</span>
          <span>Browse · Find compatible · Add to cart · Order on WhatsApp</span>
        </div>
      </div>
    </footer>
  );
}
