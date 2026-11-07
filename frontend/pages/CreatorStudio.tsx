import { Wand2 } from "lucide-react";
import { StudioForm, StudioHeader } from "@/components/studios/StudioForm";
import type { StudioKindConfig } from "@/components/studios/StudioForm";

const KINDS: StudioKindConfig[] = [
  {
    kind: "caption",
    tab: "Captions",
    blurb: "Three ready-to-post caption options with a hook, body and soft CTA.",
    briefLabel: "What is the post about?",
    briefPlaceholder: "e.g. Announcing our winter candle launch — limited batch, drops Friday",
    toneLabel: "Tone",
    toneOptions: ["Playful", "Professional", "Inspirational", "Bold", "Friendly"],
    channelLabel: "Platform",
    channelOptions: ["Instagram", "TikTok", "LinkedIn", "X", "Facebook"],
  },
  {
    kind: "hashtags",
    tab: "Hashtag sets",
    blurb: "Broad, niche and community hashtag groups for maximum reach.",
    briefLabel: "What is the post or niche?",
    briefPlaceholder: "e.g. Hand-poured soy candles, small batch, winter scents",
    channelLabel: "Platform",
    channelOptions: ["Instagram", "TikTok", "LinkedIn", "X"],
  },
  {
    kind: "content_plan",
    tab: "7-day plan",
    blurb: "A full week of content ideas with format, key message and CTA for each day.",
    briefLabel: "What should the week be about?",
    briefPlaceholder: "e.g. Launch week for the new candle line, ending with a bundle offer",
    channelLabel: "Platform",
    channelOptions: ["Instagram", "TikTok", "LinkedIn", "X", "Mixed"],
  },
];

export default function CreatorStudio() {
  return (
    <div className="space-y-6">
      <StudioHeader
        icon={<Wand2 className="h-5 w-5" />}
        title="Creator Studio"
        blurb="Captions, hashtag sets and content plans for your channels — generated from one short brief, saved to your history."
      />
      <StudioForm kinds={KINDS} testidPrefix="creator" />
    </div>
  );
}
