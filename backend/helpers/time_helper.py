from datetime import datetime, timezone, timedelta

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def iso_days_ago(days: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

DAYS_MAP = {"7d": 7, "14d": 14, "30d": 30}

def range_since(range_key: str):
    """Returns ISO 'since' string for a range key, or None for 'all'."""
    days = DAYS_MAP.get(range_key)
    return iso_days_ago(days) if days is not None else None
