import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Privacy Policy — Vedasrit Autocraft" },
      { name: "description", content: "How Vedasrit Autocraft collects and uses your information." },
      { property: "og:title", content: "Privacy Policy — Vedasrit Autocraft" },
      { property: "og:description", content: "How we handle your data." },
    ],
  }),
  component: () => (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-14 leading-relaxed">
      <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
      <p>We collect only the details needed to process your enquiries and WhatsApp orders: your name, email, phone number and address.</p>
      <p>Your information is stored securely and is never sold. It's used to contact you about your orders and consultations.</p>
      <p>Conversations with CONNECT AI are used only to recommend products during your session. You can clear your chat at any time.</p>
      <p>To update or delete your data, contact us via the details on our Contact page.</p>
    </article>
  ),
});
