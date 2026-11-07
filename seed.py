"""Seed FlowPilot AI with a realistic demo workspace.

Run once:  cd /app/backend && python seed.py
Idempotent — skips when data already exists. Not imported by server.py.
"""

import asyncio
from datetime import timedelta

from Backend.lib.db import db, ensure_indexes
from Backend.lib.dates import utcnow

NOW = utcnow()


def ago(**kwargs) -> object:
    return NOW - timedelta(**kwargs)


WORKFLOW_1 = {
    "id": "wf-seed-launch-week",
    "title": "Launch week content — Aurora Candle Co.",
    "description": "Confirmed from the AI plan for: plan a launch week of Instagram content for my candle shop, including captions, hashtags and a promo blast.",
    "source": "assistant",
    "status": "active",
    "created_at": ago(days=3),
    "updated_at": ago(hours=5),
}

WORKFLOW_2 = {
    "id": "wf-seed-black-friday",
    "title": "Black Friday promo + customer replies",
    "description": "Prepared store copy, a Black Friday promotion and a customer reply draft ahead of the sale weekend.",
    "source": "studio",
    "status": "active",
    "created_at": ago(days=2),
    "updated_at": ago(hours=2),
}

TASKS = [
    {
        "id": "task-seed-01",
        "workflow_id": WORKFLOW_1["id"],
        "title": "Draft 3 launch captions for Instagram",
        "description": "Hook-first captions announcing the new winter candle line.",
        "kind": "content",
        "channel": "Instagram",
        "status": "completed",
        "result": (
            "1. Something warm is coming. Our new Winter Escape collection drops Friday — "
            "hand-poured, small batch, gone fast. Set your reminder.\n\n"
            "2. The one where your living room smells like a cabin retreat. Winter Escape "
            "launches this week — 3 scents, limited run.\n\n"
            "3. We poured 200 candles for this launch. Last year they sold out in a weekend. "
            "Winter Escape arrives Friday at 10am."
        ),
        "order": 0,
        "created_at": ago(days=3),
        "updated_at": ago(days=2, hours=12),
    },
    {
        "id": "task-seed-02",
        "workflow_id": WORKFLOW_1["id"],
        "title": "Generate hashtag sets for launch posts",
        "description": "Broad, niche and community hashtag groups for the launch posts.",
        "kind": "content",
        "channel": "Instagram",
        "status": "completed",
        "result": (
            "Broad reach: #candles #candlelover #homefragrance #homedecor #cozyhome "
            "#selfcare #giftideas #smallbatch #handmade #winter\n\n"
            "Niche targeted: #soywaxcandles #candlebusiness #candlesofinstagram #luxurycandles "
            "#scentedcandles #candleaddict #handpoured #apothecary #slowliving #wintercandles\n\n"
            "Community / local: #shoplocal #makersgonnamake #smallshoplove #buyhandmade "
            "#supportsmallbusiness #madein[city] #localmarket #candlemaker"
        ),
        "order": 1,
        "created_at": ago(days=3),
        "updated_at": ago(days=2, hours=11),
    },
    {
        "id": "task-seed-03",
        "workflow_id": WORKFLOW_1["id"],
        "title": "Plan the 7-day launch content calendar",
        "description": "Map reels, carousels and stories across launch week with a daily theme.",
        "kind": "planning",
        "channel": "Instagram",
        "status": "in_progress",
        "result": None,
        "order": 2,
        "created_at": ago(days=2, hours=20),
        "updated_at": ago(hours=5),
    },
    {
        "id": "task-seed-04",
        "workflow_id": WORKFLOW_1["id"],
        "title": "Draft the launch-day promo blast",
        "description": "Email + SMS announcing Winter Escape is live, with the launch bundle code.",
        "kind": "outreach",
        "channel": "Email",
        "status": "pending",
        "result": None,
        "order": 3,
        "created_at": ago(days=2, hours=20),
        "updated_at": ago(days=2, hours=20),
    },
    {
        "id": "task-seed-05",
        "workflow_id": WORKFLOW_1["id"],
        "title": "Review and schedule all launch posts",
        "description": "Final pass on captions and hashtags, then schedule everything.",
        "kind": "review",
        "channel": "Instagram",
        "status": "pending",
        "result": None,
        "order": 4,
        "created_at": ago(days=2, hours=20),
        "updated_at": ago(days=2, hours=20),
    },
    {
        "id": "task-seed-06",
        "workflow_id": WORKFLOW_2["id"],
        "title": "Write the Shopify description for the Winter Trio set",
        "description": "Store-ready description for the three-candle gift bundle.",
        "kind": "content",
        "channel": "Store",
        "status": "completed",
        "result": (
            "Meet the Winter Trio — three hand-poured soy candles that turn cold evenings "
            "into a retreat. Frosted Pine brings the forest indoors, Spiced Orange warms the "
            "kitchen, and Vanilla Ember keeps movie nights going long after the credits. "
            "Each 8oz candle burns clean for 45+ hours. Poured in small batches, boxed in "
            "recycled kraft, ready to gift."
        ),
        "order": 0,
        "created_at": ago(days=2),
        "updated_at": ago(days=1, hours=20),
    },
    {
        "id": "task-seed-07",
        "workflow_id": WORKFLOW_2["id"],
        "title": "Prepare the Black Friday promo message",
        "description": "Email and SMS for the Black Friday 25% off sale.",
        "kind": "outreach",
        "channel": "Email",
        "status": "completed",
        "result": (
            "EMAIL — Subject: The only Black Friday deal that smells this good\n\n"
            "Hi {first_name}, from Friday to Sunday the whole shop is 25% off — including the "
            "Winter Trio gift set. Stock is limited to what we poured this month, so browse "
            "early. Code BF25 at checkout.\n\n"
            "SMS: Black Friday at Aurora Candle Co: 25% off everything until Sunday with code "
            "BF25. Small-batch stock is limited — shop early."
        ),
        "order": 1,
        "created_at": ago(days=1, hours=22),
        "updated_at": ago(days=1, hours=10),
    },
    {
        "id": "task-seed-08",
        "workflow_id": WORKFLOW_2["id"],
        "title": "Draft reply to the refund request email",
        "description": "Customer's candle arrived cracked — needs a warm, concrete reply.",
        "kind": "outreach",
        "channel": "Email",
        "status": "pending",
        "result": None,
        "order": 2,
        "created_at": ago(hours=6),
        "updated_at": ago(hours=6),
    },
]

ACTIVITIES = [
    {
        "id": "act-seed-01",
        "type": "plan_generated",
        "message": "AI drafted a plan: Launch week content — Aurora Candle Co.",
        "workflow_id": None,
        "created_at": ago(days=3),
    },
    {
        "id": "act-seed-02",
        "type": "workflow_created",
        "message": "Confirmed the AI plan and created workflow: Launch week content — Aurora Candle Co.",
        "workflow_id": WORKFLOW_1["id"],
        "created_at": ago(days=3, minutes=-5),
    },
    {
        "id": "act-seed-03",
        "type": "task_completed",
        "message": "Completed task: Draft 3 launch captions for Instagram",
        "workflow_id": WORKFLOW_1["id"],
        "created_at": ago(days=2, hours=12),
    },
    {
        "id": "act-seed-04",
        "type": "task_completed",
        "message": "Completed task: Generate hashtag sets for launch posts",
        "workflow_id": WORKFLOW_1["id"],
        "created_at": ago(days=2, hours=11),
    },
    {
        "id": "act-seed-05",
        "type": "content_saved",
        "message": "Saved product description: Winter Trio gift set",
        "workflow_id": WORKFLOW_2["id"],
        "created_at": ago(days=1, hours=20),
    },
    {
        "id": "act-seed-06",
        "type": "workflow_created",
        "message": "Created workflow from the Business Studio: Black Friday promo + customer replies",
        "workflow_id": WORKFLOW_2["id"],
        "created_at": ago(days=2),
    },
    {
        "id": "act-seed-07",
        "type": "task_completed",
        "message": "Completed task: Prepare the Black Friday promo message",
        "workflow_id": WORKFLOW_2["id"],
        "created_at": ago(days=1, hours=10),
    },
]


async def main() -> None:
    await ensure_indexes()
    if await db.workflows.count_documents({}):
        print("Seed skipped — workflows already exist")
        return
    await db.workflows.insert_many([WORKFLOW_1, WORKFLOW_2])
    await db.tasks.insert_many(TASKS)
    await db.activities.insert_many(ACTIVITIES)
    print(f"Seeded 2 workflows, {len(TASKS)} tasks, {len(ACTIVITIES)} activities")


if __name__ == "__main__":
    asyncio.run(main())
