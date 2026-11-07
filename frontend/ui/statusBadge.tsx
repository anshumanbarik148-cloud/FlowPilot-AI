import { CalendarClock, CircleDot, PenLine, Send, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskKind, TaskStatus } from "@/types";

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  in_progress: {
    label: "In progress",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  completed: {
    label: "Completed",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn("gap-1.5", cfg.className)} data-testid={`status-pill-${status}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {cfg.label}
    </Badge>
  );
}

export const KIND_META: Record<TaskKind, { label: string; icon: LucideIcon }> = {
  content: { label: "Content", icon: PenLine },
  outreach: { label: "Outreach", icon: Send },
  planning: { label: "Planning", icon: CalendarClock },
  review: { label: "Review", icon: ShieldCheck },
  custom: { label: "Task", icon: CircleDot },
};

export function KindBadge({ kind }: { kind: TaskKind }) {
  const meta = KIND_META[kind] ?? KIND_META.custom;
  const Icon = meta.icon;
  return (
    <Badge variant="secondary" className="gap-1.5" data-testid={`kind-pill-${kind}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}
