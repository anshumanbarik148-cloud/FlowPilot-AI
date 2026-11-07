"""Workflow templates: reusable task-step blueprints (no generated results)."""

from fastapi import APIRouter, HTTPException

from Backend.lib.dates import as_utc, utcnow
from Backend.lib.db import db
from Backend.models.models import (
    PlanStep,
    Task,
    Template,
    TemplateFromWorkflow,
    Workflow,
    WorkflowDetail,
    new_id,
)

router = APIRouter()

BUILTIN_TEMPLATES: list[dict] = [
    {
        "id": "tpl-builtin-weekly-social",
        "name": "Weekly social content sprint",
        "description": "Plan, write and schedule a full week of social posts in one sitting.",
        "steps": [
            {"title": "Pick this week's theme and key offer", "description": "One theme, one message, one CTA for the week.", "kind": "planning", "channel": None},
            {"title": "Generate a 7-day content plan", "description": "Use Creator Studio's 7-day plan and save it to the calendar.", "kind": "planning", "channel": "Instagram"},
            {"title": "Write captions for the top 3 posts", "description": "Hook-first captions with a soft CTA.", "kind": "content", "channel": "Instagram"},
            {"title": "Prepare hashtag sets", "description": "Broad, niche and local sets to rotate through the week.", "kind": "content", "channel": "Instagram"},
            {"title": "Review and schedule everything", "description": "Final read-through, then schedule in your posting tool.", "kind": "review", "channel": None},
        ],
    },
    {
        "id": "tpl-builtin-product-launch",
        "name": "Product launch kit",
        "description": "Store copy, launch announcement and a promo message for a new product.",
        "steps": [
            {"title": "Write the product description", "description": "Short punchy version plus full store-ready copy.", "kind": "content", "channel": "Store"},
            {"title": "Draft the launch announcement post", "description": "Caption announcing the product with launch date.", "kind": "content", "channel": "Instagram"},
            {"title": "Prepare the launch promo message", "description": "Email + SMS with the launch offer.", "kind": "outreach", "channel": "Email"},
            {"title": "Prepare answers to likely customer questions", "description": "Reply drafts for sizing, shipping and returns.", "kind": "outreach", "channel": "Email"},
            {"title": "Final review before launch day", "description": "Check prices, links and codes across all copy.", "kind": "review", "channel": None},
        ],
    },
    {
        "id": "tpl-builtin-inbox-catchup",
        "name": "Customer inbox catch-up",
        "description": "Work through pending customer messages with consistent, warm replies.",
        "steps": [
            {"title": "List the open customer messages", "description": "Group them: orders, refunds, product questions.", "kind": "planning", "channel": "Email"},
            {"title": "Draft replies for refund and damage requests", "description": "Empathetic replies with one concrete next step.", "kind": "outreach", "channel": "Email"},
            {"title": "Draft replies for product questions", "description": "Helpful answers that link to the right product.", "kind": "outreach", "channel": "Email"},
            {"title": "Review tone and send", "description": "Read each draft once more before sending.", "kind": "review", "channel": None},
        ],
    },
    {
        "id": "tpl-builtin-seasonal-sale",
        "name": "Seasonal sale campaign",
        "description": "Announce, promote and wrap up a limited-time sale.",
        "steps": [
            {"title": "Define the offer, dates and code", "description": "e.g. 25% off, Friday–Sunday, code SALE25.", "kind": "planning", "channel": None},
            {"title": "Write the sale promo email and SMS", "description": "Clear offer, deadline and CTA.", "kind": "outreach", "channel": "Email"},
            {"title": "Create teaser and countdown posts", "description": "Captions for the 2 days before the sale and the last day.", "kind": "content", "channel": "Instagram"},
            {"title": "Plan the last-chance reminder", "description": "Short reminder message for the final hours.", "kind": "outreach", "channel": "SMS"},
            {"title": "Review results and note learnings", "description": "What sold, what message worked best.", "kind": "review", "channel": None},
        ],
    },
]


async def ensure_builtin_templates() -> None:
    """Upsert the starter templates so every database has them."""
    for tpl in BUILTIN_TEMPLATES:
        await db.templates.update_one(
            {"id": tpl["id"]},
            {"$set": {**tpl, "builtin": True}, "$setOnInsert": {"created_at": utcnow()}},
            upsert=True,
        )


def _template(doc: dict) -> Template:
    return Template(
        id=doc["id"],
        name=doc["name"],
        description=doc.get("description", ""),
        steps=[PlanStep(**s) for s in doc.get("steps", [])],
        builtin=bool(doc.get("builtin", False)),
        created_at=as_utc(doc["created_at"]),
    )


async def _log(activity_type: str, message: str, workflow_id: str | None = None) -> None:
    await db.activities.insert_one(
        {"id": new_id(), "type": activity_type, "message": message, "workflow_id": workflow_id, "created_at": utcnow()}
    )


@router.get("/templates", response_model=list[Template])
async def list_templates():
    docs = await db.templates.find().sort([("builtin", -1), ("created_at", -1)]).to_list(200)
    return [_template(d) for d in docs]


@router.post("/templates", response_model=Template)
async def create_from_workflow(input: TemplateFromWorkflow):
    wf = await db.workflows.find_one({"id": input.workflow_id})
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    task_docs = await db.tasks.find({"workflow_id": wf["id"]}).sort("order", 1).to_list(50)
    if not task_docs:
        raise HTTPException(status_code=400, detail="This workflow has no tasks to save as a template")
    steps = [
        PlanStep(
            title=t["title"][:160],
            description=(t.get("description") or "")[:600],
            kind=t.get("kind", "custom"),
            channel=t.get("channel"),
        )
        for t in task_docs[:12]
    ]
    name = (input.name or "").strip() or wf["title"]
    template = Template(name=name[:160], description=(wf.get("description") or "")[:600], steps=steps)
    await db.templates.insert_one(template.model_dump())
    await _log("template_created", f"Saved workflow as template: {template.name}", wf["id"])
    return template


@router.post("/templates/{template_id}/use", response_model=WorkflowDetail)
async def use_template(template_id: str):
    doc = await db.templates.find_one({"id": template_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Template not found")
    tpl = _template(doc)
    workflow = Workflow(title=tpl.name, description=tpl.description, source="template")
    await db.workflows.insert_one(workflow.model_dump())
    tasks = [
        Task(workflow_id=workflow.id, title=s.title, description=s.description, kind=s.kind, channel=s.channel, order=i)
        for i, s in enumerate(tpl.steps)
    ]
    if tasks:
        await db.tasks.insert_many([t.model_dump() for t in tasks])
    await _log("workflow_created", f"Created workflow from template: {tpl.name}", workflow.id)
    return WorkflowDetail(**workflow.model_dump(), tasks=tasks)


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    doc = await db.templates.find_one({"id": template_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Template not found")
    if doc.get("builtin"):
        raise HTTPException(status_code=400, detail="Built-in templates can't be deleted")
    await db.templates.delete_one({"id": template_id})
    return {"deleted": template_id}
