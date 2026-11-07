"""Server-side date helpers. The pod clock is UTC — anchor "today" here, never in the browser."""

import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo


def today_iso(tz: str | None = None) -> str:
    """Today's date as YYYY-MM-DD in `tz` (default: APP_TZ env, else UTC)."""
    zone = tz or os.environ.get("APP_TZ", "UTC")
    return datetime.now(ZoneInfo(zone)).strftime("%Y-%m-%d")


def utcnow() -> datetime:
    """Aware UTC now — always store aware so Pydantic serialises with the offset."""
    return datetime.now(timezone.utc)


def as_utc(dt: datetime) -> datetime:
    """Motor hands naive datetimes back from BSON — normalise on read before use."""
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)
