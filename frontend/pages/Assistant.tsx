import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Loader2, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { apiPost } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import type { PlanResponse, PlanStep, WorkflowDetail } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { KindBadge } from "@/components/StatusBadge";

const PRESETS = [
  "Plan a week of Instagram content for my handmade candle shop",
  "Prepare a product launch: description, promo message and replies to early questions",
  "Organize a 5-day promo for my bakery with daily posts and customer follow-ups",
];

const HOW_IT_WORKS = [
  { step: "1", text: "Describe the goal in your own words." },
  { step: "2", text: "The AI breaks it into small, concrete tasks." },
  { step: "3", text: "Review, edit, then confirm to create the workflow." },
];

export default function Assistant() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const prefill = params.get("prefill") ?? "";

  const [instruction, setInstruction] = useState(prefill);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState<PlanStep[]>([]);

  useEffect(() => {
    if (prefill) setInstruction(prefill);
  }, [prefill]);

  const planMutation = useMutation({
    mutationFn: (value: string) => apiPost<PlanResponse>("/assistant/plan", { instruction: value }),
    onSuccess: (data) => {
      setPlan(data);
      setTitle(data.title);
      setSteps(data.steps);
      toast.success("Workflow plan generated — review it before confirming.");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost<WorkflowDetail>("/workflows", {
        title: title.trim() || plan?.title || "Untitled workflow",
        description: plan?.summary ?? "",
        source: "assistant",
        steps,
      }),
    onSuccess: (data) => {
      toast.success(`Workflow created: ${data.title}`);
      qc.invalidateQueries({ queryKey: ["workflows"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      navigate(`/workflows/${data.id}`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const generate = () => {
    const value = instruction.trim();
    if (value.length < 8) {
      toast.error("Describe the task in a little more detail first.");
      return;
    }
    planMutation.mutate(value);
  };

  const updateStep = (index: number, patch: Partial<PlanStep>) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">AI Assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe a chore in plain language — the AI drafts a plan, you review it, nothing runs silently.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Composer */}
        <Card data-testid="assistant-composer">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <Textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Plan a launch week for my candle shop: captions, hashtags and a promo blast"
              className="min-h-32 text-sm"
              aria-label="Natural-language instruction"
              data-testid="assistant-instruction-input"
            />
            <div className="flex flex-wrap gap-2" data-testid="assistant-presets">
              {PRESETS.map((preset, i) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setInstruction(preset)}
                  className="rounded-full border bg-muted/50 px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                  data-testid={`assistant-preset-${i}`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <Button
              onClick={generate}
              disabled={planMutation.isPending}
              className="min-h-11 w-full sm:w-auto"
              data-testid="assistant-generate-btn"
            >
              {planMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {planMutation.isPending ? "Planning…" : "Generate workflow plan"}
            </Button>
            <p className="text-xs text-muted-foreground">
              The AI drafts a plan first — no task starts until you confirm it.
            </p>
          </CardContent>
        </Card>

        {/* Review pane */}
        <div className="space-y-4" data-testid="assistant-plan-review">
          {!plan ? (
            <Card className="border-dashed">
              <CardContent className="space-y-4 p-6 sm:p-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </span>
                <h2 className="font-heading text-lg font-semibold">Your plan will appear here</h2>
                <ol className="space-y-2.5">
                  {HOW_IT_WORKS.map(({ step, text }) => (
                    <li key={step} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs">
                        {step}
                      </span>
                      {text}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="space-y-4 p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <Badge className="gap-1" data-testid="assistant-plan-badge">
                    <Sparkles className="h-3 w-3" />
                    AI plan
                  </Badge>
                  {plan.summary && (
                    <span className="text-xs text-muted-foreground">{plan.summary}</span>
                  )}
                </div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  aria-label="Workflow title"
                  className="font-heading text-base font-semibold"
                  data-testid="assistant-plan-title-input"
                />
                <div className="space-y-3" data-testid="assistant-plan-steps">
                  {steps.map((step, i) => (
                    <div key={i} className="rounded-lg border bg-muted/30 p-3" data-testid={`assistant-plan-step-${i}`}>
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs text-primary">
                          {i + 1}
                        </span>
                        <Input
                          value={step.title}
                          onChange={(e) => updateStep(i, { title: e.target.value })}
                          className="h-8 border-transparent bg-transparent px-1 font-medium"
                          aria-label={`Task ${i + 1} title`}
                          data-testid={`plan-step-title-${i}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Remove task ${i + 1}`}
                          data-testid={`plan-step-remove-${i}`}
                          onClick={() => setSteps((prev) => prev.filter((_, j) => j !== i))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Textarea
                        value={step.description}
                        onChange={(e) => updateStep(i, { description: e.target.value })}
                        placeholder="What this task involves…"
                        className="mt-2 min-h-16 border-transparent bg-transparent text-sm"
                        aria-label={`Task ${i + 1} description`}
                        data-testid={`plan-step-description-${i}`}
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <KindBadge kind={step.kind} />
                        <Input
                          value={step.channel ?? ""}
                          onChange={(e) =>
                            updateStep(i, { channel: e.target.value.trim() ? e.target.value : null })
                          }
                          placeholder="Channel — e.g. Instagram"
                          className="h-8 w-44 text-xs"
                          aria-label={`Task ${i + 1} channel`}
                          data-testid={`plan-step-channel-${i}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending || steps.length === 0}
                    data-testid="assistant-confirm-btn"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    Confirm & create workflow
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setSteps((prev) => [
                        ...prev,
                        { title: "", description: "", kind: "custom", channel: null },
                      ])
                    }
                    data-testid="assistant-add-step-btn"
                  >
                    <Plus className="h-4 w-4" />
                    Add task
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Every step becomes a Pending task in the Workflow Manager. Edit any line above before confirming.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
