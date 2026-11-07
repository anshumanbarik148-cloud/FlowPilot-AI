import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import type { Task, TaskStatus, WorkflowDetail as WorkflowDetailType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { KindBadge, StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

const COLUMNS: { status: TaskStatus; label: string; icon: typeof Clock }[] = [
  { status: "pending", label: "Pending", icon: Clock },
  { status: "in_progress", label: "In progress", icon: Loader2 },
  { status: "completed", label: "Completed", icon: CheckCircle2 },
];

export default function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [completeTask, setCompleteTask] = useState<Task | null>(null);
  const [resultText, setResultText] = useState("");
  const [copied, setCopied] = useState(false);

  const q = useQuery({
    queryKey: ["workflow", id],
    queryFn: () => apiGet<WorkflowDetailType>(`/workflows/${id}`),
    enabled: Boolean(id),
  });

  const patch = useMutation({
    mutationFn: (p: { taskId: string; status?: TaskStatus; result?: string }) =>
      apiPatch<Task>(`/tasks/${p.taskId}`, {
        status: p.status ?? null,
        result: p.result ?? null,
      }),
    onSuccess: (task) => {
      toast.success(
        task.status === "completed" ? `Completed: ${task.title}` : `Task moved to ${task.status.replace("_", " ")}`,
      );
      qc.invalidateQueries({ queryKey: ["workflow", id] });
      qc.invalidateQueries({ queryKey: ["workflows"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const openCompleteDialog = (task: Task) => {
    setCompleteTask(task);
    setResultText(task.result ?? "");
  };

  const confirmComplete = () => {
    if (!completeTask) return;
    patch.mutate({
      taskId: completeTask.id,
      status: "completed",
      result: resultText.trim() ? resultText.trim() : undefined,
    });
    setCompleteTask(null);
  };

  const copyResult = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        toast.success("Copied to clipboard");
      })
      .catch(() => toast.error("Could not copy — select the text manually."));
  };

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-2/3" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <Card data-testid="workflow-detail-error">
        <CardContent className="flex flex-col items-start gap-3 p-6">
          <p className="text-sm text-muted-foreground">
            {q.isError ? "This workflow could not be loaded — it may not exist yet." : "Loading…"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => q.refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
            <Link to="/workflows" className="text-sm text-primary hover:underline">
              Back to all workflows
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const wf = q.data;
  const progress = wf.tasks.length > 0
    ? Math.round((wf.tasks.filter((t) => t.status === "completed").length / wf.tasks.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Link
        to="/workflows"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        data-testid="workflow-detail-back-link"
      >
        <ArrowLeft className="h-4 w-4" />
        All workflows
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{wf.title}</h1>
          {wf.description && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{wf.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={wf.source === "assistant" ? "default" : "secondary"} className="gap-1">
            {wf.source === "assistant" ? (
              <>
                <Sparkles className="h-3 w-3" /> AI plan
              </>
            ) : (
              "Studio"
            )}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">{progress}% done</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map(({ status, label, icon: Icon }) => {
          const tasks = wf.tasks.filter((t) => t.status === status);
          return (
            <section key={status} aria-label={`${label} tasks`} data-testid={`kanban-column-${status}`}>
              <div className="mb-3 flex items-center gap-2">
                <Icon className={cn("h-4 w-4", status === "in_progress" && "animate-spin motion-reduce:animate-none")} />
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wide">{label}</h2>
                <Badge variant="secondary" className="ml-auto" data-testid={`kanban-count-${status}`}>
                  {tasks.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Card key={task.id} data-testid={`task-card-${task.id}`}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold leading-snug">{task.title}</h3>
                        <StatusBadge status={task.status} />
                      </div>
                      {task.description && (
                        <p className="text-xs leading-relaxed text-muted-foreground">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <KindBadge kind={task.kind} />
                        {task.channel && (
                          <Badge variant="outline" className="text-xs">
                            {task.channel}
                          </Badge>
                        )}
                      </div>
                      {task.result && (
                        <div className="rounded-lg bg-muted/60 p-3" data-testid={`task-result-${task.id}`}>
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                              Result
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Copy result"
                              data-testid={`task-result-copy-${task.id}`}
                              onClick={() => copyResult(task.result!)}
                            >
                              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                          <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{task.result}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 border-t pt-3">
                        <Select
                          value={task.status}
                          onValueChange={(value: string) => {
                            if (value === "completed" && task.status !== "completed") {
                              openCompleteDialog(task);
                            } else if (value !== task.status) {
                              patch.mutate({ taskId: task.id, status: value as TaskStatus });
                            }
                          }}
                        >
                          <SelectTrigger
                            size="sm"
                            className="flex-1"
                            aria-label={`Status for ${task.title}`}
                            data-testid={`task-status-select-${task.id}`}
                          >
                            <SelectValue>{(v: string) => COLUMNS.find((c) => c.status === v)?.label ?? v}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        {task.status !== "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCompleteDialog(task)}
                            data-testid={`task-complete-btn-${task.id}`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Complete
                          </Button>
                        )}
                      </div>
                      <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                        Updated {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {tasks.length === 0 && (
                  <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Nothing here
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Mark-complete dialog */}
      <Dialog
        open={completeTask !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setCompleteTask(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete: {completeTask?.title}</DialogTitle>
            <DialogDescription>
              Attach the generated result or a short note — it is saved with the task in your history.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
            placeholder="Paste or write the result… (optional)"
            className="min-h-32"
            aria-label="Task result"
            data-testid="task-result-input"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCompleteTask(null)} data-testid="task-complete-cancel-btn">
              Cancel
            </Button>
            <Button onClick={confirmComplete} disabled={patch.isPending} data-testid="task-complete-confirm-btn">
              {patch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Mark complete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
