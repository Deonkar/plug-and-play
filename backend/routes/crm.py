"""Leads + tasks CRUD + filtered listings."""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from database import db
from models import LeadIn, TaskIn
from auth import current_user, require_role
from helpers import (
    now_iso, build_lead_query, build_task_query,
    is_lead_escalated, is_task_escalated,
)
from services import log_event

router = APIRouter(tags=["crm"])


@router.get("/leads")
async def list_leads(
    user=Depends(current_user),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    escalated: Optional[bool] = None,
    q: Optional[str] = None,
):
    query = build_lead_query(user, status=status, priority=priority, assigned_to=assigned_to, q=q)
    leads = await db.leads.find(query, {"_id": 0}).to_list(500)
    if escalated is True:
        leads = [l for l in leads if is_lead_escalated(l)]
    elif escalated is False:
        leads = [l for l in leads if not is_lead_escalated(l)]
    return leads


@router.post("/leads")
async def create_lead(inp: LeadIn, user=Depends(require_role("super_admin", "admin"))):
    doc = inp.model_dump()
    doc.update({"id": str(uuid.uuid4()), "company_id": user["company_id"], "created_at": now_iso()})
    await db.leads.insert_one(doc); doc.pop("_id", None)
    await log_event("lead.created", company_id=user["company_id"], actor_id=user["id"],
                    actor_name=user["name"], meta={"lead_id": doc["id"], "name": doc["name"]})
    return doc


@router.get("/tasks")
async def list_tasks(
    user=Depends(current_user),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    lead_id: Optional[str] = None,
    due_before: Optional[str] = None,
    overdue: Optional[bool] = None,
    q: Optional[str] = None,
):
    query = build_task_query(user, status=status, priority=priority, assigned_to=assigned_to,
                             lead_id=lead_id, due_before=due_before, q=q)
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(500)
    if overdue is True:
        now_s = now_iso()
        tasks = [t for t in tasks if t.get("status") != "done" and (t.get("due_date") or "") < now_s]
    return tasks


@router.post("/tasks")
async def create_task(inp: TaskIn, user=Depends(require_role("super_admin", "admin"))):
    doc = inp.model_dump()
    doc.update({"id": str(uuid.uuid4()), "company_id": user["company_id"], "created_at": now_iso()})
    await db.tasks.insert_one(doc); doc.pop("_id", None)
    await log_event("task.created", company_id=user["company_id"], actor_id=user["id"],
                    actor_name=user["name"], meta={"task_id": doc["id"], "title": doc["title"]})
    return doc
