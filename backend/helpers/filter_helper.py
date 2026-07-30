"""All query-builders for filtering endpoints live here. DRY: same rules everywhere."""
import re
from typing import Optional, Dict, Any
from .time_helper import range_since

MAX_SEARCH_LEN = 80


def safe_regex(q: str) -> str:
    """Escape user input and cap length before feeding to $regex — SEC-003."""
    return re.escape((q or "")[:MAX_SEARCH_LEN])


def build_lead_query(user: dict, *, status=None, priority=None, assigned_to=None, q=None) -> Dict[str, Any]:
    query: Dict[str, Any] = {"company_id": user["company_id"]}
    if user["role"] == "agent":
        query["assigned_to"] = user["id"]
    elif assigned_to:
        query["assigned_to"] = assigned_to
    if status:   query["status"] = status
    if priority: query["priority"] = priority
    if q:
        s = safe_regex(q)
        query["$or"] = [
            {"name":  {"$regex": s, "$options": "i"}},
            {"email": {"$regex": s, "$options": "i"}},
            {"notes": {"$regex": s, "$options": "i"}},
        ]
    return query


def build_task_query(user: dict, *, status=None, priority=None, assigned_to=None, lead_id=None, due_before=None, q=None) -> Dict[str, Any]:
    query: Dict[str, Any] = {"company_id": user["company_id"]}
    if user["role"] == "agent":
        query["assigned_to"] = user["id"]
    elif assigned_to:
        query["assigned_to"] = assigned_to
    if status:   query["status"] = status
    if priority: query["priority"] = priority
    if lead_id:  query["lead_id"] = lead_id
    if due_before: query["due_date"] = {"$lte": due_before}
    if q:
        s = safe_regex(q)
        query["$or"] = [
            {"title":       {"$regex": s, "$options": "i"}},
            {"description": {"$regex": s, "$options": "i"}},
        ]
    return query


def build_analytics_match(user: dict, *, range_key: str = "14d", user_id: Optional[str] = None) -> Dict[str, Any]:
    match: Dict[str, Any] = {"company_id": user["company_id"]}
    since = range_since(range_key)
    if since:
        match["created_at"] = {"$gte": since}
    if user_id:
        match["user_id"] = user_id
    return match


def build_chat_history_match(user: dict, *, range_key: str = "14d", user_id=None, cached_only=None, q=None) -> Dict[str, Any]:
    match: Dict[str, Any] = {"company_id": user["company_id"]}
    since = range_since(range_key)
    if since: match["created_at"] = {"$gte": since}
    if user_id: match["user_id"] = user_id
    if cached_only is True: match["cache_hit"] = True
    if q: match["message"] = {"$regex": safe_regex(q), "$options": "i"}
    return match
