import { useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy, Loader2, Save, Wand2 } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import type { StudioKind, StudioOutput, StudioOutputItem, Task, WorkflowSummary } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export interface StudioKindConfig {
  kind: StudioKind;
  tab: string;
  blurb: string;
  briefLabel: string;
  briefPlaceholder: string;
  toneLabel?: string;
  toneOptions?: string[];
  channelLabel?: string;
  channelOptions?: string[];
  contextLabel?: string;
  contextPlaceholder?: string;
}

export function StudioForm({
  kinds,
  testidPrefix,
}: {
  kinds: StudioKindConfig[];
  testidPrefix: string;
}) {
  const [active, setActive] = useState(0);
  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState("any");
  const [channel, setChannel] = useState("none");
  const [context, setContext] = useState("");
  const [workflowId, setWorkflowId] = useState("none");
  const [copied, setCopied] = useState<string | null>(null);

  const cfg = kinds[active];
  const qc = useQueryClient();

  const workflowsQ = useQuery({
    queryKey: ["workflows"],
    queryFn: () => apiGet<WorkflowSummary[]>("/workflows"),
  });

  const generate = useMutation({
    mutationFn: () =>
      apiPost<StudioOutput>("/studio/generate", {
        kind: cfg.kind,
        brief: brief.trim(),
        tone: tone === "any" ? null : tone,
        platform: channel === "none" ? null : channel,
        context: context.trim() ? context.trim() : null,
      }),
    onSuccess: () => toast.success("Content generated — review it before using."),
    onError: (err) => toast.error(errorMessage(err)),
  });

  const save = useMutation({
    mutationFn: (item: StudioOutputItem) =>
      apiPost<Task>("/studio/save", {
        kind: cfg.kind,
        title: item.label,
        content: item.text,
        brief: brief.trim(),
        channel: channel === "none" ? null : channel,
        workflow_id: workflowId === "none" ? null : workflowId,
      }),
    onSuccess: () => {
      toast.success("Saved — find it in your workflow history.");
      qc.invalidateQueries({ queryKey: ["workflows"] });
      qc.invalidateQueries({ queryKey: ["workflow"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const switchTab = (value: string) => {
    setActive(Number(value));
    setBrief("");
    setTone("any");
    setChannel("none");
    setContext("");
  };

  const copy = (item: StudioOutputItem) => {
    navigator.clipboard
      .writeText(item.text)
      .then(() => {
        setCopied(item.label);
        toast.success("Copied to clipboard");
      })
      .catch(() => toast.error("Could not copy — select the text manually."));
  };

  const outputs = generate.data?.outputs ?? [];

  return (
    <Tabs value={String(active)} onValueChange={switchTab}>
      <TabsList className="flex-wrap" data-testid={`${testidPrefix}-tabs`}>
        {kinds.map((k, i) => (
          <TabsTrigger key={k.kind} value={String(i)} data-testid={`${testidPrefix}-tab-${k.kind}`}>
            {k.tab}
          </TabsTrigger>
        ))}
      </TabsList>

      {kinds.map((k, i) => (
        <TabsContent key={k.kind} value={String(i)} className="mt-6">
          <div className="grid items-start gap-6 lg:grid-cols-2">
            {/* Controls */}
            <Card data-testid={`${testidPrefix}-form-${k.kind}`}>
              <CardContent className="space-y-4 p-5 sm:p-6">
                <p className="text-sm text-muted-foreground">{k.blurb}</p>
                <div className="space-y-2">
                  <Label htmlFor={`${k.kind}-brief`}>{k.briefLabel}</Label>
                  <Textarea
                    id={`${k.kind}-brief`}
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder={k.briefPlaceholder}
                    className="min-h-28"
                    data-testid={`${testidPrefix}-brief-input`}
                  />
                </div>
                {k.toneOptions && (
                  <div className="space-y-2">
                    <Label>{k.toneLabel ?? "Tone"}</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="w-full" data-testid={`${testidPrefix}-tone-select`}>
                        <SelectValue>{(v: string) => (v === "any" ? "Any tone" : v)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any tone</SelectItem>
                        {k.toneOptions.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {k.channelOptions && (
                  <div className="space-y-2">
                    <Label>{k.channelLabel ?? "Channel"}</Label>
                    <Select value={channel} onValueChange={setChannel}>
                      <SelectTrigger className="w-full" data-testid={`${testidPrefix}-channel-select`}>
                        <SelectValue>{(v: string) => (v === "none" ? "No preference" : v)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No preference</SelectItem>
                        {k.channelOptions!.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {k.contextLabel && (
                  <div className="space-y-2">
                    <Label htmlFor={`${k.kind}-context`}>{k.contextLabel}</Label>
                    <Textarea
                      id={`${k.kind}-context`}
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder={k.contextPlaceholder}
                      className="min-h-16"
                      data-testid={`${testidPrefix}-context-input`}
                    />
                  </div>
                )}
                <Button
                  onClick={() => generate.mutate()}
                  disabled={generate.isPending || brief.trim().length < 3}
                  className="min-h-11"
                  data-testid={`${testidPrefix}-generate-btn`}
                >
                  {generate.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {generate.isPending ? "Generating…" : "Generate"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Generated by AI — review before publishing. Nothing is auto-posted anywhere.
                </p>
              </CardContent>
            </Card>

            {/* Output */}
            <div className="space-y-3" data-testid={`${testidPrefix}-outputs-${k.kind}`}>
              {generate.isPending &&
                [0, 1].map((n) => (
                  <Card key={n}>
                    <CardContent className="space-y-3 p-5">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      <div className="h-16 w-full animate-pulse rounded bg-muted" />
                    </CardContent>
                  </Card>
                ))}
              {outputs.map((item) => (
                <Card key={item.label} data-testid={`${testidPrefix}-output-card`}>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-heading text-sm font-semibold">{item.label}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copy(item)}
                        data-testid={`${testidPrefix}-copy-btn`}
                      >
                        {copied === item.label ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied === item.label ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed" data-testid={`${testidPrefix}-output-text`}>
                      {item.text}
                    </p>
                    <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center">
                      <Select value={workflowId} onValueChange={setWorkflowId}>
                        <SelectTrigger className="w-full sm:w-56" data-testid={`${testidPrefix}-save-workflow-select`}>
                          <SelectValue>{(v: string) => (v === "none" ? "History only (no workflow)" : workflowsQ.data?.find((w) => w.id === v)?.title ?? "Workflow")}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">History only (no workflow)</SelectItem>
                          {(workflowsQ.data ?? []).map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={() => save.mutate(item)}
                        disabled={save.isPending}
                        className="sm:ml-auto"
                        data-testid={`${testidPrefix}-save-btn`}
                      >
                        {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save to history
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!generate.isPending && outputs.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    Fill in the brief and hit Generate — your AI-drafted content will appear here for
                    review, copying and saving.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function StudioHeader({
  title,
  blurb,
  icon,
}: {
  title: string;
  blurb: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{blurb}</p>
      </div>
    </div>
  );
}
