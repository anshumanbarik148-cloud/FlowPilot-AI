import { Briefcase } from "lucide-react";
import { StudioForm, StudioHeader } from "@/components/studios/StudioForm";
import type { StudioKindConfig } from "@/components/studios/StudioForm";

const KINDS: StudioKindConfig[] = [
  {
    kind: "product_description",
    tab: "Product description",
    blurb: "A short punchy version and a full store-ready version of your product copy.",
    briefLabel: "What is the product?",
    briefPlaceholder: "e.g. Winter Trio gift set — three 8oz soy candles, hand-poured, burns 45+ hours",
    toneLabel: "Tone",
    toneOptions: ["Persuasive", "Premium", "Warm", "Minimalist"],
    contextLabel: "Extra details (optional)",
    contextPlaceholder: "Materials, sizes, price, shipping perks…",
  },
  {
    kind: "promo_message",
    tab: "Promo message",
    blurb: "An email and an SMS blasting your offer — sized for each channel.",
    briefLabel: "What is the offer?",
    briefPlaceholder: "e.g. Black Friday: 25% off everything with code BF25, Friday to Sunday",
    toneLabel: "Tone",
    toneOptions: ["Exciting", "Exclusive", "Friendly", "Urgent"],
    channelLabel: "Preferred channel",
    channelOptions: ["Email", "SMS", "Instagram", "Both email + SMS"],
  },
  {
    kind: "reply_draft",
    tab: "Reply draft",
    blurb: "Empathetic, concrete customer reply drafts for tricky messages.",
    briefLabel: "What did the customer say / what is the situation?",
    briefPlaceholder: "e.g. A customer's candle arrived cracked and they are asking for a refund",
    toneLabel: "Tone",
    toneOptions: ["Empathetic", "Professional", "Apologetic", "Friendly"],
    contextLabel: "Policy & next-step details (optional)",
    contextPlaceholder: "e.g. We replace damaged items free, refunds within 30 days…",
  },
];

export default function BusinessStudio() {
  return (
    <div className="space-y-6">
      <StudioHeader
        icon={<Briefcase className="h-5 w-5" />}
        title="Business Studio"
        blurb="Product descriptions, promotional messages and customer reply drafts — generated from one short brief, saved to your history."
      />
      <StudioForm kinds={KINDS} testidPrefix="business" />
    </div>
  );
}
