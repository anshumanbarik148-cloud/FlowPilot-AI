"""FlowPilot AI domain models — Pydantic v2. Every response model here has a
hand-written mirror in frontend/types.ts; keep the pair in sync in one edit."""

import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

from Backend.lib.dates import utcnow


def new_id() -> str:
    return str(uuid.uuid4())


TaskStatus = Literal["pending", "in_progress", "completed"]
TaskKind = Literal["content", "outreach", "planning", "review", "custom"]
WorkflowStatus = Literal["active", "completed"]
StudioKind = Literal[
    "caption",
    "hashtags",
    "content_plan",
    "product_description",
    "promo_message",
    "reply_draft",
]


# ---------- responses ----------

class Task(BaseModel):
    id: str = Field(default_factory=new_id)
    workflow_id: str | None = None
    title: str
    description: str = ""
    kind: TaskKind = "custom"
    channel: str | None = None
    status: TaskStatus = "pending"
    result: str | None = None
    order: int = 0
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class Workflow(BaseModel):
    id: str = Field(default_factory=new_id)
    title: str
    description: str = ""
    source: str = "assistant"
    status: WorkflowStatus = "active"
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class WorkflowSummary(Workflow):
    task_count: int = 0
    pending_count: int = 0
    in_progress_count: int = 0
    completed_count: int = 0


class WorkflowDetail(Workflow):
    tasks: list[Task] = []


class Activity(BaseModel):
    id: str = Field(default_factory=new_id)
    type: str
    message: str
    workflow_id: str | None = None
    created_at: datetime = Field(default_factory=utcnow)


class Stats(BaseModel):
    workflows: int
    tasks: int
    pending: int
    in_progress: int
    completed: int


class StudioOutputItem(BaseModel):
    label: str
    text: str


class StudioOutput(BaseModel):
    kind: str
    outputs: list[StudioOutputItem]


class PlanResponse(BaseModel):
    title: str
    summary: str = ""
    steps: list["PlanStep"]


# ---------- requests ----------

class PlanStep(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(default="", max_length=600)
    kind: TaskKind = "custom"
    channel: str | None = Field(default=None, max_length=60)


class PlanRequest(BaseModel):
    instruction: str = Field(min_length=8, max_length=2000)


class WorkflowCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(default="", max_length=2000)
    source: str = Field(default="assistant", max_length=40)
    steps: list[PlanStep] = Field(default_factory=list, max_length=12)


class TaskUpdate(BaseModel):
    status: TaskStatus | None = None
    result: str | None = Field(default=None, max_length=8000)


class StudioGenerateRequest(BaseModel):
    kind: StudioKind
    brief: str = Field(min_length=3, max_length=4000)
    tone: str | None = Field(default=None, max_length=80)
    platform: str | None = Field(default=None, max_length=80)
    context: str | None = Field(default=None, max_length=2000)


class RefineRequest(BaseModel):
    text: str = Field(min_length=1, max_length=8000)
    instruction: str = Field(min_length=2, max_length=500)


class RefineResponse(BaseModel):
    text: str


# ---------- calendar ----------

class TodayResponse(BaseModel):
    today: str  # YYYY-MM-DD, anchored on the server


class CalendarEntry(BaseModel):
    id: str = Field(default_factory=new_id)
    task_id: str
    workflow_id: str | None = None
    date: str  # YYYY-MM-DD
    label: str
    text: str
    channel: str | None = None
    created_at: datetime = Field(default_factory=utcnow)


class CalendarResponse(BaseModel):
    today: str
    entries: list[CalendarEntry]


class CalendarDay(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    text: str = Field(min_length=1, max_length=4000)


class CalendarPlanSave(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    brief: str = Field(default="", max_length=4000)
    start_date: date
    days: list[CalendarDay] = Field(min_length=1, max_length=14)
    channel: str | None = Field(default=None, max_length=60)
    workflow_id: str | None = None


class CalendarPlanSaved(BaseModel):
    task: Task
    entries: list[CalendarEntry]


# ---------- templates ----------

class Template(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    description: str = ""
    steps: list["PlanStep"]
    builtin: bool = False
    created_at: datetime = Field(default_factory=utcnow)


class TemplateFromWorkflow(BaseModel):
    workflow_id: str
    name: str | None = Field(default=None, max_length=160)


# ---------- integrations ----------

class IntegrationStatus(BaseModel):
    slug: str
    name: str
    connected: bool


class StudioSaveRequest(BaseModel):
    kind: StudioKind
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=20000)
    brief: str = Field(default="", max_length=4000)
    channel: str | None = Field(default=None, max_length=60)
    workflow_id: str | None = None
