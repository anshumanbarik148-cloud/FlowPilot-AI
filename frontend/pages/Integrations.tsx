import { toast } from "sonner";
import {
  SiGmail,
  SiGoogledrive,
  SiGooglecalendar,
  SiNotion,
} from "@icons-pack/react-simple-icons";
import { Bell, Hash, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const INTEGRATIONS = [
  {
    slug: "gmail",
    name: "Gmail",
    icon: SiGmail,
    desc: "Send promo blasts and customer reply drafts without leaving FlowPilot.",
  },
  {
    slug: "google-drive",
    name: "Google Drive",
    icon: SiGoogledrive,
    desc: "Save generated content plans and copy straight into your Drive folders.",
  },
  {
    slug: "google-calendar",
    name: "Google Calendar",
    icon: SiGooglecalendar,
    desc: "Put content plans and task deadlines on the calendar automatically.",
  },
  {
    slug: "slack",
    name: "Slack",
    icon: Hash,
    desc: "Post a message to your team channel when a workflow finishes.",
  },
  {
    slug: "notion",
    name: "Notion",
    icon: SiNotion,
    desc: "Mirror content plans into a Notion database your team already uses.",
  },
];

export default function Integrations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Integrations</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Deep connections are planned for a future release. Nothing is linked in this build — and
          FlowPilot will never pretend an integration is live.
        </p>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/5" data-testid="integrations-honesty-banner">
        <CardContent className="flex items-start gap-3 p-5">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Honest by design:</span> every action that
            would touch an external service is clearly marked as a demo outcome inside the app. No
            fake connections, no silent automation.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INTEGRATIONS.map(({ slug, name, icon: Icon, desc }) => (
          <Card key={slug} data-testid={`integration-card-${slug}`}>
            <CardContent className="flex h-full flex-col gap-3 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5" />
                </span>
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  data-testid={`integration-badge-${slug}`}
                >
                  Not connected — coming soon
                </Badge>
              </div>
              <h2 className="font-heading font-semibold">{name}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-auto self-start"
                onClick={() =>
                  toast("Noted! The waitlist is a demo — nothing was sent.", {
                    description: `${name} connectivity lands in a future release.`,
                  })
                }
                data-testid={`integration-waitlist-${slug}`}
              >
                <Bell className="h-3.5 w-3.5" />
                Notify me when it’s ready
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
