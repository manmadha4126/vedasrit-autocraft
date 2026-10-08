import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Vedasrit Autocraft" },
      { name: "description", content: "Terms for browsing and ordering accessories from Vedasrit Autocraft." },
      { property: "og:title", content: "Terms & Conditions — Vedasrit Autocraft" },
      { property: "og:description", content: "Ordering terms for Vedasrit Autocraft." },
    ],
  }),
  component: () => (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-14 leading-relaxed">
      <h1 className="font-display text-4xl font-bold">Terms & Conditions</h1>
      <p>Orders placed through this website are enquiries sent via WhatsApp. An order is confirmed only after our team confirms availability, final price and fitment with you.</p>
      <p>Prices shown are indicative and may change. No online payment is collected on this website.</p>
      <p>Compatibility information is provided in good faith; please confirm with our team for special variants.</p>
      <p>Warranty terms are as provided by each manufacturer.</p>
    </article>
  ),
});
