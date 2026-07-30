"""Enrichment / population helpers — run AFTER a DB fetch or event to fill in derived fields."""
from typing import List, Dict, Any
from database import db


async def attach_department_to_chats(company_id: str, rows: List[dict]) -> List[dict]:
    users_map = {u["id"]: u for u in await db.users.find(
        {"company_id": company_id}, {"_id": 0, "id": 1, "department": 1}
    ).to_list(500)}
    for r in rows:
        r["department"] = (users_map.get(r.get("user_id"), {}) or {}).get("department", "") or ""
    return rows


async def enrich_tree_with_docs(company_id: str, tree_doc: dict) -> dict:
    """Attach the linked auto-ingested docs + live counters onto a tree doc."""
    from .tree_helper import tree_included_chars, tree_included_paths
    docs = await db.context_docs.find(
        {"company_id": company_id, "repo_name": tree_doc["repo_name"], "source": "auto-ingest"},
        {"_id": 0, "id": 1, "title": 1, "kind": 1, "included": 1, "content": 1, "updated_at": 1},
    ).to_list(20)
    for d in docs:
        d["chars"] = len(d.get("content") or "")
        d["included"] = d.get("included", True)
        d.pop("content", None)
    tree_doc["docs"] = docs
    tree_doc["included_chars"] = tree_included_chars(tree_doc.get("tree", {}))
    tree_doc["included_files"] = len(tree_included_paths(tree_doc.get("tree", {})))
    return tree_doc


async def group_chats_by_department(company_id: str, range_match: Dict[str, Any]) -> List[dict]:
    """Aggregate chat counts by user, then group by their department."""
    pipeline = [
        {"$match": range_match},
        {"$group": {"_id": "$user_id", "user_name": {"$first": "$user_name"}, "count": {"$sum": 1}}},
    ]
    per_user = await db.chat_logs.aggregate(pipeline).to_list(500)
    users = await db.users.find(
        {"company_id": company_id}, {"_id": 0, "id": 1, "name": 1, "department": 1, "role": 1}
    ).to_list(500)
    users_by_id = {u["id"]: u for u in users}
    dept_map: Dict[str, Dict[str, Any]] = {}
    for r in per_user:
        u = users_by_id.get(r["_id"], {})
        dept = (u.get("department") or "Unassigned").strip() or "Unassigned"
        d = dept_map.setdefault(dept, {"department": dept, "total": 0, "users": []})
        d["total"] += r["count"]
        d["users"].append({"id": r["_id"], "name": u.get("name") or r.get("user_name") or "?",
                           "role": u.get("role", ""), "count": r["count"]})
    # Include zero-activity users too
    for u in users:
        dept = (u.get("department") or "Unassigned").strip() or "Unassigned"
        d = dept_map.setdefault(dept, {"department": dept, "total": 0, "users": []})
        if not any(x["id"] == u["id"] for x in d["users"]):
            d["users"].append({"id": u["id"], "name": u["name"], "role": u.get("role", ""), "count": 0})
    result = list(dept_map.values())
    for d in result:
        d["users"].sort(key=lambda x: (-x["count"], x["name"].lower()))
    result.sort(key=lambda d: (-d["total"], d["department"].lower()))
    return result
