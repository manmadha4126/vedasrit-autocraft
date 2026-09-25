import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { carBrandsQuery, settingsQuery, waLink } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  phone: z.string().trim().regex(/^[+\d\s-]{7,20}$/, "Enter a valid phone number"),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email").max(255)]),
  car_brand: z.string().max(60),
  car_model: z.string().max(60),
  looking_for: z.string().trim().max(200),
  message: z.string().trim().max(1000),
});

const empty = { name: "", phone: "", email: "", car_brand: "", car_model: "", looking_for: "", message: "" };

export function ConsultationSection() {
  const { data: s } = useQuery(settingsQuery);
  const { data: brands } = useQuery(carBrandsQuery);
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | typeof empty>(null);
  const models = brands?.find((b) => b.name === f.car_brand)?.car_models ?? [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(f);
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    const { error } = await supabase.from("consultations").insert(r.data);
    setBusy(false);
    if (error) { toast.error("Could not send your request. Please try again."); return; }
    setDone(f);
    setF(empty);
  };

  const input = "w-full border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground";
  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="mt-1 text-xs text-destructive">{errors[k]}</p> : null);

  return (
    <section id="contact" className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="eyebrow text-primary">Visit · Call · WhatsApp</p>
          <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">{s?.company_name ?? "Autoluxe"}</h2>
          <p className="mt-4 max-w-md text-ink-muted">{s?.about}</p>
          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex gap-3"><Phone className="h-5 w-5 text-primary" /><a href={`tel:${s?.phone}`}>{s?.phone}</a></li>
            <li className="flex gap-3"><Mail className="h-5 w-5 text-primary" /><a href={`mailto:${s?.email}`}>{s?.email}</a></li>
            <li className="flex gap-3"><MessageCircle className="h-5 w-5 text-primary" /><a href={waLink(s?.whatsapp_number, "Hi!")} target="_blank" rel="noreferrer">WhatsApp +{s?.whatsapp_number}</a></li>
            <li className="flex gap-3"><MapPin className="h-5 w-5 text-primary" />{s?.address}</li>
            <li className="flex gap-3"><Clock className="h-5 w-5 text-primary" />{s?.office_hours}</li>
          </ul>
          {s?.map_query && (
            <iframe
              title="Store location"
              className="mt-8 h-56 w-full border border-ink-border grayscale"
              loading="lazy"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(s.map_query)}&z=14&output=embed`}
            />
          )}
        </div>

        <div className="border border-ink-border bg-background p-6 text-foreground md:p-8">
          {done ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-14 w-14 text-whatsapp" />
              <h3 className="mt-4 font-display text-3xl font-bold">Request received</h3>
              <p className="mt-2 max-w-sm text-muted-foreground">Thanks {done.name.split(" ")[0]}! Our accessory expert will call you shortly. Want a faster answer?</p>
              <a
                href={waLink(s?.whatsapp_number, `Hi, I just requested a consultation.\nName: ${done.name}\nCar: ${done.car_brand} ${done.car_model}\nLooking for: ${done.looking_for}`)}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 bg-whatsapp px-5 py-3 font-semibold text-primary-foreground"
              >
                <MessageCircle className="h-5 w-5" /> Continue on WhatsApp
              </a>
              <button onClick={() => setDone(null)} className="mt-3 text-sm text-muted-foreground underline">Send another request</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <p className="eyebrow text-primary">Free consultation</p>
              <h3 className="mt-2 font-display text-3xl font-bold">Not sure what fits your car?</h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div><input className={input} placeholder="Name *" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /><Err k="name" /></div>
                <div><input className={input} placeholder="Phone number *" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /><Err k="phone" /></div>
                <div className="sm:col-span-2"><input className={input} placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /><Err k="email" /></div>
                <select className={input} value={f.car_brand} onChange={(e) => setF({ ...f, car_brand: e.target.value, car_model: "" })}>
                  <option value="">Car brand</option>
                  {brands?.map((b) => <option key={b.id}>{b.name}</option>)}
                </select>
                <select className={input} value={f.car_model} onChange={(e) => setF({ ...f, car_model: e.target.value })} disabled={!models.length}>
                  <option value="">Car model</option>
                  {models.map((m) => <option key={m.id}>{m.name}</option>)}
                </select>
                <input className={`${input} sm:col-span-2`} placeholder="What accessories are you looking for?" value={f.looking_for} onChange={(e) => setF({ ...f, looking_for: e.target.value })} />
                <textarea className={`${input} sm:col-span-2`} rows={4} placeholder="Message" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
              </div>
              <button disabled={busy} className="mt-6 w-full bg-primary py-3.5 font-display text-lg font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary-deep disabled:opacity-60">
                {busy ? "Sending…" : "Request Consultation"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
