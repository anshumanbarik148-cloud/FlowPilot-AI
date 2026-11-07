"""Activity history feed (dashboard + workflow history)."""

from fastapi import APIRouter, Query

from Backend.lib.dates import as_utc
from Backend.lib.db import db
from Backend.models.models import Activity

router = APIRouter()


@router.get("/activity", response_model=list[Activity])
async def list_activity(limit: int = Query(default=30, ge=1, le=100)):
    docs = await db.activities.find().sort("created_at", -1).to_list(limit)
    return [
        Activity(
            id=d["id"],
            type=d.get("type", "custom"),
            message=d.get("message", ""),
            workflow_id=d.get("workflow_id"),
            created_at=as_utc(d["created_at"]),
        )
        for d in docs
    ]
