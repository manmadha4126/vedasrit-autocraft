import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, Armchair, Award, BadgeCheck, Bot, Car, Cpu, Gauge, Headphones, Layers, Lightbulb, MessageSquare,
  Shield, ShieldCheck, Sparkles as Spark, Star, Wrench, Zap,
} from "lucide-react";
import hero from "@/assets/hero-car.jpg";
import { ProductCard } from "@/components/site/ProductCard";
import { ConsultationSection } from "@/components/site/ConsultationSection";
import { categoriesQuery, categoryImage, productsQuery, reviewsQuery } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Autoluxe — Upgrade Your Drive With Premium Car Accessories" },
      { name: "description", content: "Premium interior, exterior, lighting, electronics and performance car accessories with guaranteed fit. Ask CONNECT AI and order on WhatsApp." },
      { property: "og:title", content: "Autoluxe — Premium Car Accessories" },
      { property: "og:description", content: "Find accessories that perfectly fit your car and order on WhatsApp." },
    ],
  }),
  component: Home,
});

const heroFeatures = [
  { icon: Gauge, label: ["Performance", "Upgrades"] },
  { icon: Armchair, label: ["Interior", "Enhancements"] },
  { icon: ShieldCheck, label: ["Premium", "Quality"] },
  { icon: Award, label: ["Perfect Fit", "Guaranteed"] },
];

const services = [
  { icon: Armchair, t: "Interior Accessories", c: "interior" },
  { icon: Car, t: "Exterior Accessories", c: "exterior" },
  { icon: Lightbulb, t: "Car Lighting", c: "lighting" },
  { icon: Shield, t: "Car Safety", c: "safety" },
  { icon: Cpu, t: "Car Electronics", c: "electronics" },
  { icon: Spark, t: "Car Care", c: "car-care" },
  { icon: Zap, t: "Performance", c: "performance" },
  { icon: Wrench, t: "Custom Accessories", c: "utility" },
];

const why = [
  { icon: BadgeCheck, t: "Genuine Products", d: "Sourced from authorised brands only." },
  { icon: Layers, t: "Wide Selection", d: "Hundreds of accessories across 9 categories." },
  { icon: Car, t: "Car Compatibility", d: "Every product mapped to exact models." },
  { icon: Bot, t: "Expert Guidance", d: "CONNECT AI plus human specialists." },
  { icon: ShieldCheck, t: "Quality Assurance", d: "Inspected and warranty-backed." },
  { icon: Headphones, t: "Customer Support", d: "Fast answers on WhatsApp & call." },
];

const partners = ["3M", "Philips", "Osram", "Pioneer", "JBL", "70mai", "Michelin", "K&N", "Meguiar's", "Sony"];

function Home() {
  const { data: cats } = useQuery(categoriesQuery);
  const { data: products, isLoading } = useQuery(productsQuery);
  const { data: reviews } = useQuery(reviewsQuery);
  const counts = (slug: string) => products?.filter((p) => p.category_slug === slug).length ?? 0;
  const featured = products ? [...products].sort((a, b) => Number(b.rating) - Number(a.rating)).slice(0, 8) : [];

  return (
    <>
      {/* HERO — mirrors the reference composition */}
      <section className="relative overflow-hidden bg-secondary">
        <img src={hero} alt="White performance coupe with black wheels" width={1920} height={1024} className="absolute inset-y-0 left-0 h-full w-full object-cover object-[15%_center] lg:w-[64%] lg:object-[0%_center]" />
        <div className="absolute inset-y-0 left-0 hidden w-[64%] bg-gradient-to-r from-transparent via-transparent to-secondary lg:block" />
        <div className="absolute inset-0 bg-background/70 lg:hidden" />
        <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center px-4 py-16 lg:grid-cols-[1.05fr_1fr]">
          <div className="hidden lg:block" />
          <div className="animate-rise">
            <div className="flex items-center gap-4">
              <span className="h-0.5 w-12 bg-primary" />
              <span className="eyebrow text-foreground">Premium Automotive Accessories</span>
              <span className="hidden h-0.5 w-12 bg-primary sm:block" />
            </div>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[0.95] tracking-tight md:text-6xl xl:text-[4.5rem]">
              Upgrade Your Drive
              <span className="mt-1 block text-4xl md:text-5xl xl:text-[3.4rem]">
                With Premium <span className="text-primary">Car Accessories</span>
              </span>
            </h1>
            <span className="mt-6 block h-0.5 w-20 bg-primary" />
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-foreground/80">
              Discover premium accessories, performance upgrades, interior enhancements and styling solutions designed to elevate every drive.
            </p>
            <div className="mt-8 grid max-w-xl grid-cols-2 gap-y-6 sm:grid-cols-4">
              {heroFeatures.map((f, i) => (
                <div key={i} className={`flex flex-col items-center text-center ${i > 0 ? "sm:border-l sm:border-foreground/15" : ""}`}>
                  <f.icon className="h-9 w-9 text-primary" strokeWidth={1.6} />
                  <span className="mt-2 text-sm font-semibold leading-tight">{f.label[0]}<br />{f.label[1]}</span>
                </div>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/shop" className="group inline-flex items-center gap-3 bg-primary px-8 py-4 font-display text-lg font-bold uppercase text-primary-foreground shadow-[0_12px_30px_-12px_var(--primary)] hover:bg-primary-deep">
                Explore Accessories <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
              <Link to="/connect" className="inline-flex items-center gap-3 border-2 border-foreground bg-background/60 px-6 py-4 font-display text-lg font-bold uppercase hover:bg-foreground hover:text-background">
                <Bot className="h-5 w-5" /> Talk to Connect AI
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES + CONNECT */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="grid grid-cols-2 border-l border-t border-border sm:grid-cols-4 lg:grid-cols-8">
            {services.map((s) => (
              <Link key={s.t} to="/shop" search={{ category: s.c }} className="group flex flex-col items-center gap-3 border-b border-r border-border px-3 py-7 text-center hover:bg-ink hover:text-ink-foreground">
                <s.icon className="h-8 w-8 text-primary" strokeWidth={1.5} />
                <span className="text-sm font-semibold leading-tight">{s.t}</span>
              </Link>
            ))}
          </div>

          <div className="mt-12 grid overflow-hidden bg-ink text-ink-foreground lg:grid-cols-2">
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center bg-primary"><Bot className="h-6 w-6" /></span>
                <span className="font-display text-3xl font-bold tracking-wide">CONNECT</span>
                <span className="border border-ink-border px-2 py-0.5 text-[10px] font-bold tracking-widest text-ink-muted">AI</span>
              </div>
              <h2 className="mt-6 font-display text-4xl font-bold leading-tight">Your personal accessory expert — tell it your car, get parts that fit.</h2>
              <p className="mt-4 text-ink-muted">CONNECT recommends real products from our catalog, explains compatibility, compares options and adds them straight to your cart.</p>
              <Link to="/connect" className="mt-8 inline-flex items-center gap-2 bg-primary px-6 py-3.5 font-semibold hover:bg-primary-deep">
                Start chatting <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3 border-t border-ink-border p-8 md:p-12 lg:border-l lg:border-t-0">
              <div className="ml-auto max-w-xs bg-primary px-4 py-3 text-sm">I have a Hyundai Creta and want better interior lighting.</div>
              <div className="max-w-sm border border-ink-border px-4 py-3 text-sm text-ink-muted">
                Based on your <b className="text-ink-foreground">Creta</b>, I recommend the <b className="text-ink-foreground">OEM-fit ambient lighting kit</b> — plug-and-play, 64 colours. Want me to add it to your cart?
              </div>
              <div className="ml-auto max-w-xs bg-primary px-4 py-3 text-sm">Yes, add it.</div>
              <div className="flex items-center gap-2 text-xs text-ink-muted"><MessageSquare className="h-4 w-4" /> Added to cart ✓</div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-primary">Shop by category</p>
            <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Everything your car deserves</h2>
          </div>
          <Link to="/shop" className="flex items-center gap-2 font-semibold hover:text-primary">View all products <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cats?.map((c, i) => (
            <Link key={c.id} to="/shop" search={{ category: c.slug }} className={`group relative flex min-h-[280px] flex-col justify-end overflow-hidden bg-ink text-ink-foreground ${i < 2 ? "lg:min-h-[340px]" : ""}`}>
              <img src={categoryImage(c)} alt={c.name} loading="lazy" width={1024} height={768} className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
              <div className="relative p-6">
                <span className="bg-primary px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">{counts(c.slug)} products</span>
                <h3 className="mt-3 font-display text-2xl font-bold">{c.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{c.description}</p>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold">Shop now <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <p className="eyebrow text-primary">Top rated</p>
          <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Best-selling upgrades</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-80 animate-pulse bg-muted" />)
              : featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="border border-border p-8">
            <p className="eyebrow text-primary">Customer ratings</p>
            <div className="mt-4 flex items-end gap-3">
              <span className="font-display text-7xl font-bold leading-none">4.8</span>
              <span className="pb-2 text-muted-foreground">/ 5</span>
            </div>
            <div className="mt-2 flex gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-5 w-5 fill-star text-star" />)}</div>
            <p className="mt-2 text-base text-muted-foreground">Based on 2,400+ verified customer reviews</p>
          </div>
          <div className="grid grid-cols-2 bg-ink text-ink-foreground lg:col-span-2">
            {[
              ["18,500+", "Customers Served"],
              ["42,000+", "Accessories Sold"],
              ["35+", "Car Brands Supported"],
              ["12", "Years of Experience"],
            ].map(([n, l], i) => (
              <div key={l} className={`p-8 ${i % 2 ? "border-l border-ink-border" : ""} ${i > 1 ? "border-t border-ink-border" : ""}`}>
                <p className="font-display text-5xl font-bold text-primary">{n}</p>
                <p className="mt-1 text-sm text-ink-muted">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {reviews?.map((r) => (
            <figure key={r.id} className="border border-border p-6">
              <div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-star text-star" />)}</div>
              <blockquote className="mt-3 text-sm leading-relaxed">"{r.review}"</blockquote>
              <figcaption className="mt-4 text-sm"><b>{r.author_name}</b><span className="block text-xs text-muted-foreground">{r.car}</span></figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-14">
          <p className="eyebrow text-center text-muted-foreground">Trusted brands we stock</p>
          <div className="mt-6 grid grid-cols-2 border-l border-t border-border sm:grid-cols-5">
            {partners.map((b) => (
              <div key={b} className="grid h-20 place-items-center border-b border-r border-border font-display text-xl font-bold text-muted-foreground transition hover:text-foreground">{b}</div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="border-t border-border bg-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-center font-display text-4xl font-bold">Why choose Autoluxe</h2>
          <div className="mt-10 grid grid-cols-2 gap-px bg-border md:grid-cols-3 lg:grid-cols-6">
            {why.map((w) => (
              <div key={w.t} className="bg-background p-6 text-center">
                <w.icon className="mx-auto h-8 w-8 text-primary" strokeWidth={1.5} />
                <h3 className="mt-3 font-display text-lg font-bold">{w.t}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{w.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ConsultationSection />
    </>
  );
}
