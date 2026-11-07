// Mirrors the backend response models in Backend/models/models.py.
export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskKind = "content" | "outreach" | "planning" | "review" | "custom";
export type WorkflowStatus = "active" | "completed";
export type StudioKind =
  | "caption"
  | "hashtags"
  | "content_plan"
  | "product_description"
  | "promo_message"
  | "reply_draft";

export interface Task {
  id: string;
  workflow_id: string | null;
  title: string;
  description: string;
  kind: TaskKind;
  channel: string | null;
  status: TaskStatus;
  result: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowSummary {
  id: string;
  title: string;
  description: string;
  source: string;
  status: WorkflowStatus;
  created_at: string;
  updated_at: string;
  task_count: number;
  pending_count: number;
  in_progress_count: number;
  completed_count: number;
}

export interface WorkflowDetail extends WorkflowSummary {
  tasks: Task[];
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  workflow_id: string | null;
  created_at: string;
}

export interface Stats {
  workflows: number;
  tasks: number;
  pending: number;
  in_progress: number;
  completed: number;
}

export interface StudioOutputItem { label: string; text: string }
export interface StudioOutput { kind: StudioKind; outputs: StudioOutputItem[] }
export interface PlanStep { title: string; description: string; kind: TaskKind; channel: string | null }
export interface PlanResponse { title: string; summary: string; steps: PlanStep[] }
