"""Workflow Manager: workflows + tasks + dashboard stats. All routes under /api."""

import logging
import uuid

from fastapi import APIRouter, HTTPException

from Backend.lib.dates import as_utc, utcnow
from Backend.lib.db import db
from Backend.models.models import (
    Stats,
    Task,
    TaskUpdate,
    Workflow,
    WorkflowCreate,
    WorkflowDetail,
    WorkflowSummary,
)

router = APIRouter()
log = logging.getLogger(__name__)


async def log_activity(activity_type: str, message: str, workflow_id: str | None = None) -> None:
    await db.activities.insert_one(
        {
            "id": str(uuid.uuid4()),
            "type": activity_type,
            "message": message,
            "workflow_id": workflow_id,
            "created_at": utcnow(),
        }
    )


def _task(doc: dict) -> Task:
    return Task(
        id=doc["id"],
        workflow_id=doc.get("workflow_id"),
        title=doc["title"],
        description=doc.get("description", ""),
        kind=doc.get("kind", "custom"),
        channel=doc.get("channel"),
        status=doc.get("status", "pending"),
        result=doc.get("result"),
        order=doc.get("order", 0),
        created_at=as_utc(doc["created_at"]),
        updated_at=as_utc(doc["updated_at"]),
    )


def _workflow(doc: dict) -> Workflow:
    return Workflow(
        id=doc["id"],
        title=doc["title"],
        description=doc.get("description", ""),
        source=doc.get("source", "assistant"),
        status=doc.get("status", "active"),
        created_at=as_utc(doc["created_at"]),
        updated_at=as_utc(doc["updated_at"]),
    )


@router.get("/workflows", response_model=list[WorkflowSummary])
async def list_workflows():
    workflow_docs = await db.workflows.find().sort("created_at", -1).to_list(500)
    task_docs = await db.tasks.find().to_list(5000)
    counts: dict[str, dict[str, int]] = {}
    for t in task_docs:
        wf_id = t.get("workflow_id")
        if not wf_id:
            continue
        bucket = counts.setdefault(wf_id, {"task_count": 0, "pending_count": 0, "in_progress_count": 0, "completed_count": 0})
        bucket["task_count"] += 1
        bucket[f"{t.get('status', 'pending')}_count"] += 1
    summaries = []
    for doc in workflow_docs:
        wf = _workflow(doc)
        c = counts.get(wf.id, {"task_count": 0, "pending_count": 0, "in_progress_count": 0, "completed_count": 0})
        summaries.append(WorkflowSummary(**wf.model_dump(), **c))
    return summaries


@router.post("/workflows", response_model=WorkflowDetail)
async def create_workflow(input: WorkflowCreate):
    now = utcnow()
    workflow = Workflow(title=input.title, description=input.description, source=input.source)
    await db.workflows.insert_one(workflow.model_dump())

    task_docs = []
    for i, step in enumerate(input.steps):
        task = Task(
            workflow_id=workflow.id,
            title=step.title,
            description=step.description,
            kind=step.kind,
            channel=step.channel,
            order=i,
        )
        task_docs.append(task.model_dump())
    if task_docs:
        await db.tasks.insert_many(task_docs)

    await log_activity(
        "workflow_created",
        f"Confirmed the AI plan and created workflow: {workflow.title}",
        workflow.id,
    )
    tasks = [Task(**d) for d in task_docs]
    return WorkflowDetail(**workflow.model_dump(), tasks=tasks)


@router.get("/workflows/{workflow_id}", response_model=WorkflowDetail)
async def get_workflow(workflow_id: str):
    doc = await db.workflows.find_one({"id": workflow_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Workflow not found")
    wf = _workflow(doc)
    task_docs = await db.tasks.find({"workflow_id": workflow_id}).sort("order", 1).to_list(200)
    tasks = [_task(d) for d in task_docs]
    return WorkflowDetail(**wf.model_dump(), tasks=tasks)


@router.patch("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, input: TaskUpdate):
    doc = await db.tasks.find_one({"id": task_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Task not found")

    update: dict = {"updated_at": utcnow()}
    if input.status is not None:
        update["status"] = input.status
    if input.result is not None:
        update["result"] = input.result

    await db.tasks.update_one({"id": task_id}, {"$set": update})
    fresh = await db.tasks.find_one({"id": task_id})
    assert fresh is not None

    old_status = doc.get("status", "pending")
    new_status = fresh["status"]
    if new_status == "completed" and old_status != "completed":
        await log_activity("task_completed", f"Completed task: {doc['title']}", doc.get("workflow_id"))
    elif new_status != old_status:
        await log_activity("status_changed", f"Moved '{doc['title']}' to {new_status.replace('_', ' ')}", doc.get("workflow_id"))
    return _task(fresh)


@router.get("/stats", response_model=Stats)
async def get_stats():
    workflows = await db.workflows.count_documents({})
    pending = await db.tasks.count_documents({"status": "pending"})
    in_progress = await db.tasks.count_documents({"status": "in_progress"})
    completed = await db.tasks.count_documents({"status": "completed"})
    return Stats(workflows=workflows, tasks=pending + in_progress + completed, pending=pending, in_progress=in_progress, completed=completed)
