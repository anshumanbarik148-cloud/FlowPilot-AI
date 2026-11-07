import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, ChevronRight, ListChecks, RefreshCw, Sparkles } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { WorkflowSummary } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Workflows() {
  const q = useQuery({
    queryKey: ["workflows"],
    queryFn: () => apiGet<WorkflowSummary[]>("/workflows"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Workflow Manager</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every workflow and its task history — open one to track and complete its tasks.
          </p>
        </div>
        <Link to="/assistant" className={buttonVariants({ variant: "outline", size: "sm" })} data-testid="workflows-new-plan-link">
          <Sparkles className="h-4 w-4" />
          New AI plan
        </Link>
      </div>

      {q.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : q.isError ? (
        <Card data-testid="workflows-error">
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm text-muted-foreground">Can’t reach the server right now — your data is safe.</p>
            <Button variant="outline" size="sm" onClick={() => q.refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : q.data && q.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {q.data.map((wf) => {
            const progress = wf.task_count > 0 ? Math.round((wf.completed_count / wf.task_count) * 100) : 0;
            return (
              <Link key={wf.id} to={`/workflows/${wf.id}`} data-testid={`workflow-card-${wf.id}`}>
                <Card className="h-full transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] motion-reduce:transform-none">
                  <CardContent className="flex h-full flex-col gap-3 p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-heading font-semibold leading-snug">{wf.title}</h2>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {wf.description || "No description"}
                    </p>
                    <div className="mt-auto space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {wf.completed_count} of {wf.task_count} tasks done
                          {wf.pending_count > 0 && ` · ${wf.pending_count} pending`}
                        </span>
                        <span className="font-mono">{formatDistanceToNow(new Date(wf.updated_at), { addSuffix: true })}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                          data-testid={`workflow-progress-${wf.id}`}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant={wf.source === "assistant" ? "default" : "secondary"} className="gap-1">
                          {wf.source === "assistant" ? (
                            <>
                              <Sparkles className="h-3 w-3" /> AI plan
                            </>
                          ) : (
                            <>
                              <ListChecks className="h-3 w-3" /> Studio
                            </>
                          )}
                        </Badge>
                        {wf.status === "completed" && <Badge variant="outline">Completed</Badge>}
                        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                      </div>
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
              Ask the AI Assistant to plan something — confirming its plan creates your first workflow here.
            </p>
            <Link to="/assistant" className={buttonVariants({ size: "sm" })} data-testid="workflows-empty-cta">
              Create your first workflow
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
