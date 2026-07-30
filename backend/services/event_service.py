"""Event bus + audit log. Every meaningful state change goes through log_event()."""
from typing import Optional, Dict, Any, List
from database import db
from helpers import now_iso
from logger import logger


async def log_event(event_type: str, *,
                    company_id: str = "",
                    actor_id: str = "",
                    actor_name: str = "",
                    meta: Optional[Dict[str, Any]] = None,
                    level: str = "info"):
    """Persist an audit-log entry and mirror to the process logger."""
    doc = {
        "type": event_type,
        "company_id": company_id or "",
        "actor_id": actor_id or "",
        "actor_name": actor_name or "",
        "meta": meta or {},
        "level": level,
        "at": now_iso(),
    }
    try:
        await db.event_logs.insert_one(doc)
    except Exception as e:
        logger.warning(f"event_log insert failed: {e}")
    logger.info(f"event={event_type} actor={actor_name or actor_id or '-'} company={company_id or '-'} meta={meta or {}}")


async def list_events(company_id: str, *, since: Optional[str] = None,
                      types: Optional[List[str]] = None, limit: int = 200) -> List[dict]:
    match: Dict[str, Any] = {"company_id": company_id}
    if since: match["at"] = {"$gte": since}
    if types: match["type"] = {"$in": types}
    rows = await db.event_logs.find(match, {"_id": 0}).sort("at", -1).to_list(min(limit, 500))
    return rows


async def prune_old_events(retention_days: int):
    from helpers import iso_days_ago
    cutoff = iso_days_ago(retention_days)
    r = await db.event_logs.delete_many({"at": {"$lt": cutoff}})
    if r.deleted_count:
        logger.info(f"pruned {r.deleted_count} event_logs older than {retention_days}d")
    return r.deleted_count
