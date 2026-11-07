"""AI Assistant: natural-language instruction -> reviewable workflow plan."""

import logging

from fastapi import APIRouter, HTTPException

import llm
from Backend.lib.db import db
from Backend.lib.dates import utcnow
from Backend.models.models import PlanRequest, PlanResponse, new_id

router = APIRouter()
log = logging.getLogger(__name__)


@router.post("/assistant/plan", response_model=PlanResponse)
async def create_plan(input: PlanRequest):
    try:
        plan = await llm.plan_workflow(input.instruction)
    except llm.AiUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    await db.activities.insert_one(
        {
            "id": new_id(),
            "type": "plan_generated",
            "message": f"AI drafted a plan: {plan['title']}",
            "workflow_id": None,
            "created_at": utcnow(),
        }
    )
    return PlanResponse(**plan)
