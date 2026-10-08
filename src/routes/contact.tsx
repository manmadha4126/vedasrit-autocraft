import { createFileRoute } from "@tanstack/react-router";
import { ConsultationSection } from "@/components/site/ConsultationSection";

export const Route = createFileRoute("/contact")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Contact & Free Consultation — Vedasrit Autocraft" },
      { name: "description", content: "Call, WhatsApp or request a free consultation to find accessories that fit your car." },
      { property: "og:title", content: "Contact Vedasrit Autocraft" },
      { property: "og:description", content: "Request a free car accessories consultation." },
    ],
  }),
  component: ConsultationSection,
});
