"""Admin views: analytics, chat history, event log, marketing leads (platform owner only)."""
from typing import Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from database import db
from auth import require_role
from config import PLATFORM_OWNER_EMAIL
from helpers import (
    now_iso, iso_days_ago, range_since, DAYS_MAP,
    build_analytics_match, build_chat_history_match,
    attach_department_to_chats, group_chats_by_department,
)
from services import list_events

router = APIRouter(tags=["admin"])


@router.get("/analytics/overview")
async def analytics_overview(
    user=Depends(require_role("super_admin", "admin")),
    range: str = "14d",
    user_id: Optional[str] = None,
):
    cid = user["company_id"]
    base_match = build_analytics_match(user, range_key=range, user_id=user_id)
    total_msgs = await db.chat_logs.count_documents(base_match)
    cache_hits = await db.chat_logs.count_documents({**base_match, "cache_hit": True})
    users_count = await db.users.count_documents({"company_id": cid})

    per_user = await db.chat_logs.aggregate([
        {"$match": base_match},
        {"$group": {"_id": "$user_id", "user_name": {"$first": "$user_name"},
                    "user_role": {"$first": "$user_role"},
                    "tokens_in": {"$sum": "$tokens_in"}, "tokens_out": {"$sum": "$tokens_out"},
                    "queries": {"$sum": 1}}},
        {"$sort": {"tokens_out": -1}},
    ]).to_list(100)
    for x in per_user: x["user_id"] = x.pop("_id")

    top_prompts_rows = await db.chat_logs.aggregate([
        {"$match": base_match},
        {"$group": {"_id": "$message", "count": {"$sum": 1}, "tokens": {"$sum": "$tokens_out"}}},
        {"$sort": {"count": -1}}, {"$limit": 10},
    ]).to_list(10)
    top_prompts = [{"message": r["_id"], "count": r["count"], "tokens": r["tokens"]} for r in top_prompts_rows]

    ts_days = DAYS_MAP.get(range, 30) if range != "all" else 30
    since = (datetime.now(timezone.utc) - timedelta(days=ts_days)).isoformat()
    ts_match = {**base_match, "created_at": {"$gte": since}}
    ts_rows = await db.chat_logs.aggregate([
        {"$match": ts_match},
        {"$group": {"_id": {"$substr": ["$created_at", 0, 10]}, "queries": {"$sum": 1},
                    "tokens": {"$sum": {"$add": ["$tokens_in", "$tokens_out"]}}}},
        {"$sort": {"_id": 1}},
    ]).to_list(50)
    ts = [{"date": r["_id"], "queries": r["queries"], "tokens": r["tokens"]} for r in ts_rows]

    return {
        "total_messages": total_msgs, "cache_hits": cache_hits,
        "cache_hit_rate": (cache_hits / total_msgs) if total_msgs else 0,
        "users_count": users_count, "per_user": per_user,
        "top_prompts": top_prompts, "time_series": ts,
        "filters": {"range": range, "user_id": user_id},
    }


@router.get("/admin/chats")
async def admin_chat_history(
    user=Depends(require_role("super_admin", "admin")),
    user_id: Optional[str] = None,
    department: Optional[str] = None,
    range: str = "14d",
    cached_only: Optional[bool] = None,
    q: Optional[str] = None,
    limit: int = 200,
):
    dept_user_ids = None
    if department:
        rows = await db.users.find(
            {"company_id": user["company_id"], "department": department}, {"_id": 0, "id": 1}
        ).to_list(500)
        dept_user_ids = {r["id"] for r in rows}
        if not dept_user_ids:
            return {"items": [], "total": 0,
                    "filters": {"user_id": user_id, "department": department, "range": range,
                                "cached_only": cached_only, "q": q}}
    match = build_chat_history_match(user, range_key=range, user_id=user_id, cached_only=cached_only, q=q)
    if dept_user_ids:
        if user_id:
            if user_id not in dept_user_ids:
                return {"items": [], "total": 0,
                        "filters": {"user_id": user_id, "department": department, "range": range,
                                    "cached_only": cached_only, "q": q}}
            match["user_id"] = user_id
        else:
            match["user_id"] = {"$in": list(dept_user_ids)}

    rows = await db.chat_logs.find(
        match,
        {"_id": 0, "id": 1, "user_id": 1, "user_name": 1, "user_role": 1,
         "message": 1, "answer": 1, "tokens_in": 1, "tokens_out": 1,
         "cache_hit": 1, "created_at": 1},
    ).sort("created_at", -1).to_list(min(limit, 500))
    rows = await attach_department_to_chats(user["company_id"], rows)
    total = await db.chat_logs.count_documents(match)
    return {"items": rows, "total": total,
            "filters": {"user_id": user_id, "department": department, "range": range,
                        "cached_only": cached_only, "q": q}}


@router.get("/admin/chats/summary")
async def admin_chat_summary(user=Depends(require_role("super_admin", "admin")), range: str = "14d"):
    match = build_analytics_match(user, range_key=range)
    return {"departments": await group_chats_by_department(user["company_id"], match), "range": range}


@router.get("/admin/events")
async def admin_events(
    user=Depends(require_role("super_admin", "admin")),
    range: str = "7d",
    types: Optional[str] = None,
    limit: int = 200,
):
    """Full audit-log for the tenant."""
    since = range_since(range)
    type_list = [t.strip() for t in (types or "").split(",") if t.strip()] or None
    events = await list_events(user["company_id"], since=since, types=type_list, limit=limit)
    return {"items": events, "total": len(events), "filters": {"range": range, "types": type_list}}


# Platform-owner only marketing leads
@router.get("/admin/contact")
async def list_contact(user=Depends(require_role("super_admin", "admin"))):
    if not PLATFORM_OWNER_EMAIL or user.get("email", "").lower() != PLATFORM_OWNER_EMAIL:
        raise HTTPException(403, "Forbidden")
    return await db.contact_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.get("/admin/waitlist")
async def list_waitlist(user=Depends(require_role("super_admin", "admin"))):
    if not PLATFORM_OWNER_EMAIL or user.get("email", "").lower() != PLATFORM_OWNER_EMAIL:
        raise HTTPException(403, "Forbidden")
    return await db.waitlist.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@router.get("/admin/estimates")
async def list_estimates(user=Depends(require_role("super_admin", "admin"))):
    if not PLATFORM_OWNER_EMAIL or user.get("email", "").lower() != PLATFORM_OWNER_EMAIL:
        raise HTTPException(403, "Forbidden")
    return await db.services_estimates.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
