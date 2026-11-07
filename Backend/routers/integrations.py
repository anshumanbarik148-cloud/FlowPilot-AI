"""Integration status registry — the seam for future Google Drive/Docs, Gmail and Calendar.

Nothing is connected in this build. When a real connection is added, flip `connected` from
stored credentials here; the frontend export menu already reads this endpoint and will
enable "Send to Google Docs" without further UI changes.
"""

from fastapi import APIRouter

from Backend.models.models import IntegrationStatus

router = APIRouter()

INTEGRATIONS = [
    ("google-docs", "Google Docs / Drive"),
    ("gmail", "Gmail"),
    ("google-calendar", "Google Calendar"),
    ("slack", "Slack"),
    ("notion", "Notion"),
]


@router.get("/integrations", response_model=list[IntegrationStatus])
async def list_integrations():
    return [IntegrationStatus(slug=slug, name=name, connected=False) for slug, name in INTEGRATIONS]
