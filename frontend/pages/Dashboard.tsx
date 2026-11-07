import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ListChecks,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { Activity, Stats, WorkflowSummary } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const METRICS: { key: keyof Stats; label: string; icon: LucideIcon; testid: string }[] = [
  { key: "workflows", label: "Workflows", icon: ListChecks, testid: "metric-workflows" },
  { key: "pending", label: "Pending tasks", icon: Clock, testid: "metric-pending" },
  { key: "in_progress", label: "In progress", icon: Loader2, testid: "metric-in-progress" },
  { key: "completed", label: "Completed", icon: CheckCircle2, testid: "metric-completed" },
];

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  plan_generated: Sparkles,
  workflow_created: ListChecks,
  task_completed: CheckCircle2,
  content_saved: Save,
  status_changed: ArrowRight,
};

function ErrorNote({ onRetry, testid }: { onRetry: () => void; testid: string }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-muted-foreground"
      data-testid={testid}
    >
      <span>Can’t reach the server right now — your data is safe.</span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </Button>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [quickPrompt, setQuickPrompt] = useState("");

  const statsQ = useQuery({ queryKey: ["stats"], queryFn: () => apiGet<Stats>("/stats") });
  const workflowsQ = useQuery({
    queryKey: ["workflows"],
    queryFn: () => apiGet<WorkflowSummary[]>("/workflows"),
  });
  const activityQ = useQuery({
    queryKey: ["activity"],
    queryFn: () => apiGet<Activity[]>("/activity"),
  });

  const launchAssistant = () => {
    const trimmed = quickPrompt.trim();
    navigate(trimmed ? `/assistant?prefill=${encodeURIComponent(trimmed)}` : "/assistant");
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything FlowPilot is tracking for you, at a glance.
          </p>
        </div>
        <Link to="/assistant" className={buttonVariants({ variant: "outline", size: "sm" })} data-testid="dashboard-open-assistant-link">
          <Sparkles className="h-4 w-4" />
          Ask the Assistant
        </Link>
      </div>

      {/* Quick AI trigger */}
      <Card data-testid="dashboard-quick-trigger">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <Input
            value={quickPrompt}
            onChange={(e) => setQuickPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && launchAssistant()}
            placeholder="Describe a chore — “plan a week of Instagram content for my bakery”"
            className="min-h-11 flex-1"
            aria-label="Quick AI instruction"
            data-testid="dashboard-quick-input"
          />
          <Button onClick={launchAssistant} className="min-h-11" data-testid="dashboard-quick-submit-btn">
            <Sparkles className="h-4 w-4" />
            Plan with AI
          </Button>
        </CardContent>
      </Card>

      {/* Metric grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {METRICS.map(({ key, label, icon: Icon, testid }) => (
          <Card key={key} data-testid={testid}>
            <CardContent className="flex items-center gap-3 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                {statsQ.isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="font-heading text-2xl font-semibold tabular-nums" data-testid={`${testid}-value`}>
                    {statsQ.data?.[key] ?? 0}
                  </p>
                )}
                <p className="truncate text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {statsQ.isError && <ErrorNote onRetry={() => statsQ.refetch()} testid="dashboard-stats-error" />}

      {/* Main split: workflows | activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2" aria-label="Active workflows">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Workflows</h2>
            <Link to="/workflows" className="text-sm text-primary hover:underline" data-testid="dashboard-all-workflows-link">
              View all
            </Link>
          </div>
          {workflowsQ.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : workflowsQ.isError ? (
            <ErrorNote onRetry={() => workflowsQ.refetch()} testid="dashboard-workflows-error" />
          ) : workflowsQ.data && workflowsQ.data.length > 0 ? (
            <div className="space-y-3">
              {workflowsQ.data.slice(0, 4).map((wf) => {
                const progress = wf.task_count > 0 ? Math.round((wf.completed_count / wf.task_count) * 100) : 0;
                return (
                  <Link key={wf.id} to={`/workflows/${wf.id}`} data-testid={`dashboard-workflow-card-${wf.id}`}>
                    <Card className="transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] motion-reduce:transform-none">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-heading font-semibold">{wf.title}</h3>
                            <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                              {wf.description || "No description"}
                            </p>
                          </div>
                          <Badge variant={wf.status === "completed" ? "default" : "secondary"} className="shrink-0">
                            {wf.status}
                          </Badge>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${progress}%` }}
                              data-testid={`dashboard-workflow-progress-${wf.id}`}
                            />
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">
                            {wf.completed_count}/{wf.task_count}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <Sparkles className="h-8 w-8 text-primary" />
                <p className="font-medium">No workflows yet</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Describe a chore to the AI Assistant and confirm the plan it drafts.
                </p>
                <Link to="/assistant" className={buttonVariants({ size: "sm" })} data-testid="dashboard-empty-cta">
                  Create your first workflow
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        <section aria-label="Recent activity">
          <h2 className="mb-3 font-heading text-lg font-semibold">Activity</h2>
          {activityQ.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : activityQ.isError ? (
            <ErrorNote onRetry={() => activityQ.refetch()} testid="dashboard-activity-error" />
          ) : activityQ.data && activityQ.data.length > 0 ? (
            <Card data-testid="dashboard-activity-feed">
              <CardContent className="divide-y p-0">
                {activityQ.data.slice(0, 8).map((a) => {
                  const Icon = ACTIVITY_ICONS[a.type] ?? ArrowRight;
                  return (
                    <div key={a.id} className="flex items-start gap-3 p-4" data-testid={`dashboard-activity-item-${a.id}`}>
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm leading-snug">{a.message}</p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                          {format(new Date(a.created_at), "MMM d, HH:mm")} ·{" "}
                          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Nothing yet — generated plans, confirmed workflows and completed tasks will show up here.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
