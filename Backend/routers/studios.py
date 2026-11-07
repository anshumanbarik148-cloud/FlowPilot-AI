"""Creator & Business studios: AI content generation + save-as-task."""

import logging

from fastapi import APIRouter, HTTPException

import llm
from Backend.lib.dates import utcnow
from Backend.lib.db import db
from Backend.models.models import (
    StudioGenerateRequest,
    StudioOutput,
    StudioSaveRequest,
    Task,
    new_id,
)

router = APIRouter()
log = logging.getLogger(__name__)

KIND_LABELS = {
    "caption": "Captions",
    "hashtags": "Hashtag sets",
    "content_plan": "Content plan",
    "product_description": "Product description",
    "promo_message": "Promotional message",
    "reply_draft": "Customer reply draft",
}

OUTREACH_KINDS = {"promo_message", "reply_draft"}


def _clean(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = value.strip()
    return cleaned[:60] or None


@router.post("/studio/generate", response_model=StudioOutput)
async def generate(input: StudioGenerateRequest):
    try:
        outputs = await llm.generate_studio(
            input.kind, input.brief, input.tone, input.platform, input.context
        )
    except llm.AiUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return StudioOutput(kind=input.kind, outputs=outputs)


@router.post("/studio/save", response_model=Task)
async def save_output(input: StudioSaveRequest):
    now = utcnow()
    workflow_id = None
    if input.workflow_id:
        wf = await db.workflows.find_one({"id": input.workflow_id})
        if not wf:
            raise HTTPException(status_code=404, detail="Workflow not found")
        workflow_id = wf["id"]
        await db.workflows.update_one({"id": workflow_id}, {"$set": {"updated_at": now}})

    task = Task(
        workflow_id=workflow_id,
        title=input.title[:200],
        description=input.brief[:600],
        kind="outreach" if input.kind in OUTREACH_KINDS else "content",
        channel=_clean(input.channel),
        status="completed",
        result=input.content,
    )
    await db.tasks.insert_one(task.model_dump())
    await db.activities.insert_one(
        {
            "id": new_id(),
            "type": "content_saved",
            "message": f"Saved {KIND_LABELS[input.kind].lower()}: {input.title[:120]}",
            "workflow_id": workflow_id,
            "created_at": now,
        }
    )
    return task
