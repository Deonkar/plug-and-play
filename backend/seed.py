"""Demo tenant seeding — idempotent. Skipped entirely if SEED_DEMO_DATA=false."""
import uuid
from datetime import datetime, timezone, timedelta
from database import db
from config import SEED_DEMO_DATA, ADMIN_EMAIL, ADMIN_PASSWORD
from auth import hash_pw
from helpers import now_iso, build_tree
from logger import logger


async def seed_demo():
    if not SEED_DEMO_DATA:
        logger.info("SEED_DEMO_DATA disabled — skipping demo seed")
        return
    company_id = "demo-company"
    existing = await db.companies.find_one({"id": company_id})
    if existing:
        await _seed_demo_tree(company_id)
        return
    logger.info("Seeding demo company...")
    await db.companies.insert_one({
        "id": company_id, "name": "Acme CRM Demo", "created_at": now_iso(),
        "settings": {"llm_provider": "anthropic", "llm_model": "claude-sonnet-4-6"},
    })
    admin_id, a1, a2 = "user-admin", "user-agent-1", "user-agent-2"
    users = [
        {"id": admin_id, "email": ADMIN_EMAIL, "name": "Ava Admin",
         "password_hash": hash_pw(ADMIN_PASSWORD), "role": "super_admin",
         "company_id": company_id, "company_name": "Acme CRM Demo",
         "blocked": False, "token_version": 0, "department": "", "created_at": now_iso()},
        {"id": a1, "email": "alice@acme.demo", "name": "Alice Agent",
         "password_hash": hash_pw("agent123"), "role": "agent",
         "company_id": company_id, "company_name": "Acme CRM Demo",
         "blocked": False, "token_version": 0, "department": "Sales", "created_at": now_iso()},
        {"id": a2, "email": "bob@acme.demo", "name": "Bob Agent",
         "password_hash": hash_pw("agent123"), "role": "agent",
         "company_id": company_id, "company_name": "Acme CRM Demo",
         "blocked": False, "token_version": 0, "department": "Support", "created_at": now_iso()},
    ]
    for u in users:
        await db.users.update_one({"email": u["email"]}, {"$set": u}, upsert=True)

    docs = [
        {"id": "doc-onboard", "company_id": company_id, "kind": "product",
         "title": "Acme CRM — Product Ideology",
         "content": "Acme CRM prioritizes lead urgency by SLA. Escalations trigger when a task is >24h overdue or the lead has priority=urgent with no update in 4h.",
         "created_at": now_iso(), "updated_at": now_iso(), "included": True},
        {"id": "doc-dev", "company_id": company_id, "kind": "dev",
         "title": "Escalation Rules (Dev Reference)",
         "content": "Escalation flag: task.priority=urgent AND now>task.due_date, OR lead.status='hot' with no touch in 48h.",
         "created_at": now_iso(), "updated_at": now_iso(), "included": True},
        {"id": "doc-ideology", "company_id": company_id, "kind": "ideology",
         "title": "Customer-First Playbook",
         "content": "Every interaction should aim to solve, not sell. Empathize first, then explain the resolution with a concrete next step.",
         "created_at": now_iso(), "updated_at": now_iso(), "included": True},
    ]
    for d in docs:
        await db.context_docs.update_one({"id": d["id"]}, {"$set": d}, upsert=True)

    leads = [
        {"id": "lead-01", "name": "Northwind Traders", "email": "cto@northwind.example", "phone": "555-0101",
         "status": "hot", "priority": "urgent", "assigned_to": a1,
         "notes": "Awaiting demo call. Escalated last week.",
         "custom_fields": {"deal_size": "$120K", "industry": "Manufacturing", "region": "EU-West"}},
        {"id": "lead-02", "name": "Contoso Ltd", "email": "buyer@contoso.example", "phone": "555-0102",
         "status": "warm", "priority": "high", "assigned_to": a1, "notes": "Wants 200-seat tier.", "custom_fields": {}},
        {"id": "lead-03", "name": "Fabrikam Inc", "email": "ops@fabrikam.example", "phone": "555-0103",
         "status": "new", "priority": "medium", "assigned_to": a1, "notes": "Inbound webform.", "custom_fields": {}},
        {"id": "lead-04", "name": "Adventure Works", "email": "sales@adventure.example", "phone": "555-0104",
         "status": "hot", "priority": "urgent", "assigned_to": a2,
         "notes": "Ready to sign — waiting on legal review.",
         "custom_fields": {"deal_size": "$45K", "contract_type": "Annual"}},
        {"id": "lead-05", "name": "Wingtip Toys", "email": "founder@wingtip.example", "phone": "555-0105",
         "status": "cold", "priority": "low", "assigned_to": a2, "notes": "Nurture; check back Q2.", "custom_fields": {}},
    ]
    for l in leads:
        l["company_id"] = company_id; l["created_at"] = now_iso()
        await db.leads.update_one({"id": l["id"]}, {"$set": l}, upsert=True)

    today = datetime.now(timezone.utc)
    tasks = [
        {"id": "task-01", "lead_id": "lead-01", "title": "Call Northwind CTO for demo", "description": "Follow up on escalation.",
         "priority": "urgent", "due_date": today.isoformat(), "status": "open", "assigned_to": a1,
         "custom_fields": {"channel": "Video call", "duration_min": 30}},
        {"id": "task-02", "lead_id": "lead-02", "title": "Send Contoso 200-seat pricing", "description": "Custom quote.",
         "priority": "high", "due_date": (today + timedelta(days=1)).isoformat(), "status": "open", "assigned_to": a1, "custom_fields": {}},
        {"id": "task-03", "lead_id": "lead-03", "title": "Qualify Fabrikam webform lead", "description": "BANT questions.",
         "priority": "medium", "due_date": (today + timedelta(days=3)).isoformat(), "status": "open", "assigned_to": a1, "custom_fields": {}},
        {"id": "task-04", "lead_id": "lead-04", "title": "Adventure Works legal follow-up", "description": "Push contract to signature.",
         "priority": "urgent", "due_date": today.isoformat(), "status": "open", "assigned_to": a2,
         "custom_fields": {"blocker": "Legal review", "owner_dept": "Sales"}},
        {"id": "task-05", "lead_id": "lead-05", "title": "Wingtip Q2 nurture email", "description": "Schedule for Apr 1.",
         "priority": "low", "due_date": (today + timedelta(days=45)).isoformat(), "status": "open", "assigned_to": a2, "custom_fields": {}},
    ]
    for t in tasks:
        t["company_id"] = company_id; t["created_at"] = now_iso()
        await db.tasks.update_one({"id": t["id"]}, {"$set": t}, upsert=True)

    await _seed_demo_tree(company_id)
    logger.info("Seed complete.")


async def _seed_demo_tree(company_id: str):
    demo_repo = "acme-crm-app"
    if await db.context_trees.find_one({"company_id": company_id, "repo_name": demo_repo}):
        return
    demo_files = [
        {"path": "README.md", "size": 1240}, {"path": "package.json", "size": 980},
        {"path": "backend/server.py", "size": 12480}, {"path": "backend/models/lead.py", "size": 1560},
        {"path": "backend/models/task.py", "size": 1340}, {"path": "backend/routes/auth.py", "size": 2200},
        {"path": "backend/routes/crm.py", "size": 3100}, {"path": "backend/routes/chat.py", "size": 4820},
        {"path": "backend/db.py", "size": 870}, {"path": "frontend/src/App.js", "size": 1420},
        {"path": "frontend/src/pages/Overview.jsx", "size": 3480}, {"path": "frontend/src/pages/CRM.jsx", "size": 4210},
        {"path": "frontend/src/pages/Analytics.jsx", "size": 5320}, {"path": "frontend/src/components/Chat.jsx", "size": 6100},
        {"path": "frontend/src/lib/api.js", "size": 640}, {"path": "frontend/src/lib/auth.js", "size": 980},
        {"path": "docs/architecture.md", "size": 2400}, {"path": "docs/escalation-rules.md", "size": 1180},
    ]
    tree = build_tree(demo_files)
    await db.context_trees.update_one(
        {"company_id": company_id, "repo_name": demo_repo},
        {"$set": {"id": str(uuid.uuid4()), "company_id": company_id, "repo_name": demo_repo,
                  "tree": tree, "file_count": len(demo_files),
                  "total_chars": sum(f["size"] for f in demo_files),
                  "created_at": now_iso(), "updated_at": now_iso()}},
        upsert=True,
    )
    demo_docs = [
        ("Architecture", "React + FastAPI + MongoDB. Auth via JWT. Chat streams from Claude Sonnet 4.6."),
        ("Database Schema", "users, leads, tasks, context_docs, context_trees, chat_logs, event_logs collections."),
        ("Module Map", "backend/server.py — app entry; routes/* per domain; helpers/* for filters + trees; services/* for llm+slack+events."),
    ]
    for title, content in demo_docs:
        full = f"{demo_repo} — {title}"
        await db.context_docs.update_one(
            {"company_id": company_id, "title": full},
            {"$set": {"id": str(uuid.uuid4()), "company_id": company_id, "title": full,
                      "content": content, "kind": "dev", "created_at": now_iso(),
                      "updated_at": now_iso(), "source": "auto-ingest", "repo_name": demo_repo,
                      "included": True}},
            upsert=True,
        )
