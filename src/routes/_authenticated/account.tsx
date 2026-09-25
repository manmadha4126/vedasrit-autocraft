import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My Account — Autoluxe" }, { name: "robots", content: "noindex" }] }),
  component: Account,
});

function Account() {
  const { user, profile, isAdmin, refetchProfile } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", phone: "", address: "" });
  useEffect(() => { if (profile) setF({ name: profile.name ?? "", phone: profile.phone ?? "", address: profile.address ?? "" }); }, [profile]);

  const orders = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ name: f.name.trim().slice(0, 100), phone: f.phone.trim().slice(0, 20), address: f.address.trim().slice(0, 300) }).eq("id", user.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    refetchProfile();
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const input = "w-full border border-input px-3 py-2.5 text-sm";
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow text-primary">My account</p>
          <h1 className="font-display text-4xl font-bold">Hello{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <Link to="/admin" className="bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Admin dashboard</Link>}
          <button onClick={signOut} className="border border-border px-4 py-2.5 text-sm font-semibold">Sign out</button>
        </div>
      </div>
      <div className="mt-10 grid gap-8 md:grid-cols-[1fr_1.4fr]">
        <form onSubmit={save} className="space-y-3 border border-border p-6">
          <p className="font-display text-xl font-bold">Delivery details</p>
          <p className="text-xs text-muted-foreground">Used to fill your WhatsApp orders.</p>
          <input className={input} placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className={input} placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <textarea className={input} rows={3} placeholder="Address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
          <button className="bg-foreground px-5 py-2.5 text-sm font-semibold text-background">Save</button>
        </form>
        <div className="border border-border p-6">
          <p className="font-display text-xl font-bold">My WhatsApp orders</p>
          {orders.isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}
          {orders.data?.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No orders yet. <Link to="/shop" className="text-primary">Start shopping</Link></p>}
          <div className="mt-4 space-y-3">
            {orders.data?.map((o) => (
              <div key={o.id} className="border-b border-border pb-3 text-sm">
                <div className="flex justify-between font-semibold"><span>{new Date(o.created_at).toLocaleString()}</span><span>{formatPrice(o.total)}</span></div>
                <p className="text-xs text-muted-foreground">{(o.items as { name: string; qty: number }[]).map((i) => `${i.name} × ${i.qty}`).join(", ")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
