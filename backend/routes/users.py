"""User management routes (admin-only mutations)."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from database import db
from models import InviteUserIn, BlockIn, LimitIn, DepartmentIn
from auth import hash_pw, current_user, require_role, user_to_out
from helpers import now_iso
from services import log_event

router = APIRouter(tags=["users"])


@router.get("/users")
async def list_users(user=Depends(require_role("super_admin", "admin"))):
    users = await db.users.find({"company_id": user["company_id"]}, {"_id": 0, "password_hash": 0}).to_list(500)
    return [user_to_out(u) for u in users]


@router.post("/users")
async def create_user(inp: InviteUserIn, user=Depends(require_role("super_admin", "admin"))):
    email = inp.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email exists")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid, "email": email, "name": inp.name,
        "password_hash": hash_pw(inp.password), "role": inp.role,
        "company_id": user["company_id"], "company_name": user["company_name"],
        "blocked": False, "token_version": 0,
        "department": (inp.department or "").strip(),
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    await log_event("user.created", company_id=user["company_id"], actor_id=user["id"],
                    actor_name=user["name"], meta={"new_user_id": uid, "email": email, "role": inp.role})
    return user_to_out(doc)


@router.patch("/users/{uid}/block")
async def toggle_block(uid: str, inp: BlockIn, user=Depends(require_role("super_admin", "admin"))):
    target = await db.users.find_one({"id": uid, "company_id": user["company_id"]})
    if not target: raise HTTPException(404, "User not found")
    if target["id"] == user["id"]: raise HTTPException(400, "Cannot block yourself")
    await db.users.update_one({"id": uid}, {"$set": {"blocked": inp.blocked}, "$inc": {"token_version": 1}})
    await log_event("user.blocked" if inp.blocked else "user.unblocked",
                    company_id=user["company_id"], actor_id=user["id"], actor_name=user["name"],
                    meta={"target_id": uid})
    return {"ok": True}


@router.patch("/users/{uid}/limit")
async def set_token_limit(uid: str, inp: LimitIn, user=Depends(require_role("super_admin", "admin"))):
    target = await db.users.find_one({"id": uid, "company_id": user["company_id"]})
    if not target: raise HTTPException(404, "User not found")
    await db.users.update_one({"id": uid}, {"$set": {"token_limit": max(0, int(inp.token_limit))}})
    await log_event("user.limit_set", company_id=user["company_id"], actor_id=user["id"],
                    actor_name=user["name"], meta={"target_id": uid, "limit": inp.token_limit})
    return {"ok": True}


@router.post("/users/{uid}/reset-usage")
async def reset_usage(uid: str, user=Depends(require_role("super_admin", "admin"))):
    target = await db.users.find_one({"id": uid, "company_id": user["company_id"]})
    if not target: raise HTTPException(404, "User not found")
    await db.users.update_one({"id": uid}, {"$set": {"token_used": 0}})
    await log_event("user.usage_reset", company_id=user["company_id"], actor_id=user["id"],
                    actor_name=user["name"], meta={"target_id": uid})
    return {"ok": True}


@router.patch("/users/{uid}/department")
async def set_department(uid: str, inp: DepartmentIn, user=Depends(require_role("super_admin", "admin"))):
    target = await db.users.find_one({"id": uid, "company_id": user["company_id"]})
    if not target: raise HTTPException(404, "User not found")
    dept = (inp.department or "").strip()
    await db.users.update_one({"id": uid}, {"$set": {"department": dept}})
    await log_event("user.department_set", company_id=user["company_id"], actor_id=user["id"],
                    actor_name=user["name"], meta={"target_id": uid, "department": dept})
    return {"ok": True}


@router.get("/departments")
async def list_departments(user=Depends(current_user)):
    rows = await db.users.find({"company_id": user["company_id"]}, {"_id": 0, "department": 1}).to_list(500)
    return sorted({(r.get("department") or "").strip() for r in rows if (r.get("department") or "").strip()})
