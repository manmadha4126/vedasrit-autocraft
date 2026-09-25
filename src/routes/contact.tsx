import { createFileRoute } from "@tanstack/react-router";
import { ConsultationSection } from "@/components/site/ConsultationSection";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Free Consultation — Autoluxe" },
      { name: "description", content: "Call, WhatsApp or request a free consultation to find accessories that fit your car." },
      { property: "og:title", content: "Contact Autoluxe" },
      { property: "og:description", content: "Request a free car accessories consultation." },
    ],
  }),
  component: ConsultationSection,
});
