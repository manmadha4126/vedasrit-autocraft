import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatPrice, settingsQuery, waLink } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";

export function CartSheet() {
  const { items, open, setOpen, setQty, remove, total, count, clear } = useCart();
  const { user, profile, refetchProfile } = useAuth();
  const { data: s } = useQuery(settingsQuery);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) setForm({ name: profile.name ?? "", phone: profile.phone ?? "", address: profile.address ?? "" });
  }, [profile]);

  const order = async () => {
    if (!user) {
      setOpen(false);
      navigate({ to: "/auth", search: { redirect: "/" } });
      toast.info("Please sign in to place your WhatsApp order");
      return;
    }
    const name = form.name.trim(), phone = form.phone.trim(), address = form.address.trim();
    if (name.length < 2 || phone.replace(/\D/g, "").length < 7 || address.length < 5) {
      toast.error("Please add your name, phone and address");
      return;
    }
    if (!s?.whatsapp_number) {
      toast.error("WhatsApp ordering isn't configured yet");
      return;
    }
    setBusy(true);
    // Open window synchronously-ish to avoid popup blockers
    const win = window.open("", "_blank");
    try {
      await supabase.from("profiles").update({ name, phone, address }).eq("id", user.id);
      const payload = items.map((i) => ({ id: i.id, name: i.name, compat: i.compat, qty: i.qty, price: i.price }));
      const { error } = await supabase.from("orders").insert({
        user_id: user.id,
        customer_name: name,
        customer_phone: phone,
        customer_address: address,
        items: payload,
        total,
      });
      if (error) throw error;
      const lines = [
        `Customer Name: ${name}`,
        `Customer Address: ${address}`,
        `Customer Contact: ${phone}`,
        "",
        "*CAR ACCESSORIES ORDER*",
        "",
        ...items.flatMap((i, idx) => [
          `${idx + 1}. Product Name: ${i.name}`,
          `   Compatible Car/Model: ${i.compat}`,
          `   Quantity: ${i.qty}`,
          `   Price: ${formatPrice(i.price * i.qty)}`,
          "",
        ]),
        `Total Items: ${count}`,
        `Order Total: ${formatPrice(total)}`,
      ];
      const url = waLink(s.whatsapp_number, lines.join("\n"));
      if (win) win.location.href = url;
      else window.location.href = url;
      refetchProfile();
      clear();
      setOpen(false);
      toast.success("Order sent to WhatsApp");
    } catch (e) {
      win?.close();
      toast.error(e instanceof Error ? e.message : "Could not place order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="font-display text-2xl">Your Cart ({count})</SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            <p className="font-display text-xl font-semibold">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Find accessories that fit your car, or ask CONNECT for recommendations.</p>
            <div className="mt-2 flex gap-2">
              <Link to="/shop" onClick={() => setOpen(false)} className="bg-foreground px-4 py-2.5 text-sm font-semibold text-background">Browse</Link>
              <Link to="/connect" onClick={() => setOpen(false)} className="border border-border px-4 py-2.5 text-sm font-semibold">Ask CONNECT</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {items.map((i) => (
                <div key={i.id} className="flex gap-3 border-b border-border pb-4">
                  <img src={i.image} alt={i.name} className="h-20 w-20 shrink-0 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold">{i.name}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">Fits: {i.compat}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <button onClick={() => setQty(i.id, i.qty - 1)} className="p-1.5" aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-8 text-center text-sm font-semibold">{i.qty}</span>
                        <button onClick={() => setQty(i.id, i.qty + 1)} className="p-1.5" aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <span className="font-bold">{formatPrice(i.price * i.qty)}</span>
                    </div>
                  </div>
                  <button onClick={() => remove(i.id)} className="self-start text-muted-foreground hover:text-destructive" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {user && (
                <div className="space-y-2 bg-muted p-4">
                  <p className="eyebrow text-muted-foreground">Order details</p>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" maxLength={100} className="w-full border border-input bg-background px-3 py-2 text-sm" />
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" maxLength={20} className="w-full border border-input bg-background px-3 py-2 text-sm" />
                  <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" maxLength={300} rows={2} className="w-full border border-input bg-background px-3 py-2 text-sm" />
                </div>
              )}
            </div>
            <div className="border-t border-border p-5">
              <div className="flex justify-between text-sm"><span>Total items</span><span>{count}</span></div>
              <div className="mt-1 flex justify-between font-display text-2xl font-bold"><span>Total</span><span>{formatPrice(total)}</span></div>
              <button onClick={order} disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 bg-whatsapp py-3.5 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
                <MessageCircle className="h-5 w-5" /> {busy ? "Preparing…" : user ? "Order on WhatsApp" : "Sign in to order on WhatsApp"}
              </button>
              <p className="mt-2 text-center text-xs text-muted-foreground">No online payment — we confirm availability & price on WhatsApp.</p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
