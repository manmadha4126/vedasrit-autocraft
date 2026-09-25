import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import heroImg from "@/assets/cat-interior.jpg";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" && s.redirect.startsWith("/") && !s.redirect.startsWith("//") ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or Register — Autoluxe" },
      { name: "description", content: "Create your Autoluxe account to save your details and order on WhatsApp." },
      { property: "og:title", content: "Sign in — Autoluxe" },
      { property: "og:description", content: "Sign in to order car accessories on WhatsApp." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z.string().trim().regex(/^[+\d\s-]{7,20}$/, "Enter a valid phone"),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [f, setF] = useState({ name: "", phone: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect ?? "/account" });
    });
    const { data } = supabase.auth.onAuthStateChange((e, session) => {
      if (e === "SIGNED_IN" && session) navigate({ to: redirect ?? "/account" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate, redirect]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const r = signupSchema.safeParse(f);
        if (!r.success) throw new Error(r.error.issues[0].message);
        const { data, error } = await supabase.auth.signUp({
          email: r.data.email,
          password: r.data.password,
          options: { emailRedirectTo: window.location.origin + (redirect ?? "/account"), data: { name: r.data.name, phone: r.data.phone } },
        });
        if (error) throw error;
        if (!data.session) toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Google sign-in failed");
  };

  const input = "w-full border border-input px-3 py-3 text-sm outline-none focus:border-foreground";
  return (
    <div className="grid min-h-[80vh] lg:grid-cols-2">
      <div className="relative hidden bg-ink lg:block">
        <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
        <div className="absolute bottom-0 p-12 text-ink-foreground">
          <h2 className="font-display text-5xl font-bold">Your garage,<br /><span className="text-primary">upgraded.</span></h2>
          <p className="mt-3 max-w-sm text-ink-muted">Save your details once, order on WhatsApp in one tap.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md">
          <div className="grid grid-cols-2 border border-border">
            {(["in", "up"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`py-3 text-sm font-semibold ${mode === m ? "bg-foreground text-background" : ""}`}>{m === "in" ? "Sign in" : "Create account"}</button>
            ))}
          </div>
          <form onSubmit={submit} className="mt-6 space-y-3">
            {mode === "up" && (
              <>
                <input className={input} placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
                <input className={input} placeholder="Phone number" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
              </>
            )}
            <input className={input} type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
            <input className={input} type="password" placeholder="Password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
            <button disabled={busy} className="w-full bg-primary py-3.5 font-semibold text-primary-foreground hover:bg-primary-deep disabled:opacity-60">
              {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
            </button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div>
          <button onClick={google} className="flex w-full items-center justify-center gap-3 border border-border py-3 text-sm font-semibold hover:border-foreground">
            <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.7 2.3 2.4 6.6 2.4 12s4.3 9.7 9.6 9.7c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" /></svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
