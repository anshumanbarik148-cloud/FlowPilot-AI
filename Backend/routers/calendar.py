"""Content calendar: 7-day plans saved onto real dates."""

from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Query

from Backend.lib.dates import as_utc, today_iso, utcnow
from Backend.lib.db import db
from Backend.models.models import (
    CalendarEntry,
    CalendarPlanSave,
    CalendarPlanSaved,
    CalendarResponse,
    Task,
    TodayResponse,
    new_id,
)

router = APIRouter()

MAX_RANGE_DAYS = 62


def _entry(doc: dict) -> CalendarEntry:
    return CalendarEntry(
        id=doc["id"],
        task_id=doc["task_id"],
        workflow_id=doc.get("workflow_id"),
        date=doc["date"],
        label=doc.get("label", ""),
        text=doc.get("text", ""),
        channel=doc.get("channel"),
        created_at=as_utc(doc["created_at"]),
    )


@router.get("/today", response_model=TodayResponse)
async def get_today():
    return TodayResponse(today=today_iso())


@router.get("/calendar", response_model=CalendarResponse)
async def list_calendar(start: date = Query(...), end: date = Query(...)):
    if end < start:
        raise HTTPException(status_code=422, detail="end must be on or after start")
    if (end - start).days > MAX_RANGE_DAYS:
        raise HTTPException(status_code=422, detail=f"Range is limited to {MAX_RANGE_DAYS} days")
    docs = (
        await db.calendar_entries.find({"date": {"$gte": start.isoformat(), "$lte": end.isoformat()}})
        .sort([("date", 1), ("created_at", 1)])
        .to_list(1000)
    )
    return CalendarResponse(today=today_iso(), entries=[_entry(d) for d in docs])


@router.post("/calendar/plans", response_model=CalendarPlanSaved)
async def save_plan(input: CalendarPlanSave):
    workflow_id = None
    if input.workflow_id:
        wf = await db.workflows.find_one({"id": input.workflow_id})
        if not wf:
            raise HTTPException(status_code=404, detail="Workflow not found")
        workflow_id = wf["id"]
        await db.workflows.update_one({"id": workflow_id}, {"$set": {"updated_at": utcnow()}})

    channel = input.channel.strip()[:60] if input.channel and input.channel.strip() else None
    dated = [(input.start_date + timedelta(days=i), day) for i, day in enumerate(input.days)]
    result = "\n\n".join(f"{d.strftime('%a %b %d')} — {day.label}\n{day.text}" for d, day in dated)

    task = Task(
        workflow_id=workflow_id,
        title=input.title,
        description=input.brief[:600],
        kind="planning",
        channel=channel,
        status="completed",
        result=result,
    )
    await db.tasks.insert_one(task.model_dump())

    entries = [
        CalendarEntry(
            task_id=task.id,
            workflow_id=workflow_id,
            date=d.isoformat(),
            label=day.label,
            text=day.text,
            channel=channel,
        )
        for d, day in dated
    ]
    await db.calendar_entries.insert_many([e.model_dump() for e in entries])
    await db.activities.insert_one(
        {
            "id": new_id(),
            "type": "calendar_saved",
            "message": f"Scheduled a {len(entries)}-day plan from {dated[0][0].strftime('%b %d')}: {input.title[:100]}",
            "workflow_id": workflow_id,
            "created_at": utcnow(),
        }
    )
    return CalendarPlanSaved(task=task, entries=entries)
