from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import json
import hashlib
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Literal, Dict, Any

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# --------- Config ---------
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = "HS256"
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Company OS")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("companyos")


# --------- Models ---------
def now_iso():
    return datetime.now(timezone.utc).isoformat()


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    company_name: str  # will create tenant


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    company_id: str
    company_name: str
    blocked: bool = False


class ContextDocIn(BaseModel):
    title: str
    content: str  # markdown
    kind: str = "general"  # dev / product / ideology / general


class LeadIn(BaseModel):
    name: str
    email: str
    phone: str = ""
    status: str = "new"
    priority: str = "medium"
    assigned_to: Optional[str] = None  # user_id
    notes: str = ""


class TaskIn(BaseModel):
    lead_id: str
    title: str
    description: str = ""
    priority: str = "medium"  # low, medium, high, urgent
    due_date: str  # ISO
    status: str = "open"  # open / done
    assigned_to: str  # user_id


class ChatIn(BaseModel):
    message: str
    session_id: Optional[str] = None


class BlockIn(BaseModel):
    blocked: bool


class SettingsIn(BaseModel):
    llm_provider: str = "anthropic"
    llm_model: str = "claude-sonnet-4-6"
    api_key_override: Optional[str] = None
    slack_webhook_url: Optional[str] = None


class IngestFile(BaseModel):
    path: str
    content: str


class IngestIn(BaseModel):
    repo_name: str
    files: List[IngestFile]


# --------- Auth Helpers ---------
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_token(user_id: str, hours: int = 24 * 7) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=hours),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_user_by_id(uid: str) -> Optional[dict]:
    return await db.users.find_one({"id": uid}, {"_id": 0})


async def current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    user = await get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(401, "User not found")
    if user.get("blocked"):
        raise HTTPException(403, "User is blocked")
    return user


def require_role(*roles):
    async def dep(user=Depends(current_user)):
        if user["role"] not in roles:
            raise HTTPException(403, f"Requires role: {roles}")
        return user
    return dep


def user_to_out(u: dict) -> dict:
    return {
        "id": u["id"],
        "email": u["email"],
        "name": u["name"],
        "role": u["role"],
        "company_id": u["company_id"],
        "company_name": u.get("company_name", ""),
        "blocked": u.get("blocked", False),
    }


# --------- Auth Endpoints ---------
@api.post("/auth/register")
async def register(inp: RegisterIn):
    email = inp.email.lower()
    exists = await db.users.find_one({"email": email})
    if exists:
        raise HTTPException(400, "Email already registered")
    company_id = str(uuid.uuid4())
    await db.companies.insert_one({
        "id": company_id,
        "name": inp.company_name,
        "created_at": now_iso(),
        "settings": {"llm_provider": "anthropic", "llm_model": "claude-sonnet-4-6"},
    })
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": email,
        "name": inp.name,
        "password_hash": hash_pw(inp.password),
        "role": "super_admin",  # first user of a company
        "company_id": company_id,
        "company_name": inp.company_name,
        "blocked": False,
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    token = make_token(user_id)
    return {"token": token, "user": user_to_out(doc)}


@api.post("/auth/login")
async def login(inp: LoginIn):
    email = inp.email.lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_pw(inp.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    if user.get("blocked"):
        raise HTTPException(403, "User is blocked")
    token = make_token(user["id"])
    return {"token": token, "user": user_to_out(user)}


@api.get("/auth/me")
async def me(user=Depends(current_user)):
    return user_to_out(user)


# --------- Users Management ---------
@api.get("/users")
async def list_users(user=Depends(require_role("super_admin", "admin"))):
    users = await db.users.find({"company_id": user["company_id"]}, {"_id": 0, "password_hash": 0}).to_list(500)
    return [user_to_out(u) for u in users]


class InviteUserIn(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: Literal["admin", "agent"]


@api.post("/users")
async def create_user(inp: InviteUserIn, user=Depends(require_role("super_admin", "admin"))):
    email = inp.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email exists")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid, "email": email, "name": inp.name,
        "password_hash": hash_pw(inp.password),
        "role": inp.role, "company_id": user["company_id"],
        "company_name": user["company_name"], "blocked": False,
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    return user_to_out(doc)


@api.patch("/users/{uid}/block")
async def toggle_block(uid: str, inp: BlockIn, user=Depends(require_role("super_admin", "admin"))):
    target = await db.users.find_one({"id": uid, "company_id": user["company_id"]})
    if not target:
        raise HTTPException(404, "User not found")
    if target["id"] == user["id"]:
        raise HTTPException(400, "Cannot block yourself")
    await db.users.update_one({"id": uid}, {"$set": {"blocked": inp.blocked}})
    return {"ok": True}


# --------- Context Docs ---------
@api.get("/context")
async def list_context(user=Depends(current_user)):
    docs = await db.context_docs.find({"company_id": user["company_id"]}, {"_id": 0}).to_list(200)
    return docs


@api.post("/context")
async def create_context(inp: ContextDocIn, user=Depends(require_role("super_admin", "admin"))):
    doc = {
        "id": str(uuid.uuid4()),
        "company_id": user["company_id"],
        "title": inp.title,
        "content": inp.content,
        "kind": inp.kind,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.context_docs.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/context/{doc_id}")
async def update_context(doc_id: str, inp: ContextDocIn, user=Depends(require_role("super_admin", "admin"))):
    r = await db.context_docs.update_one(
        {"id": doc_id, "company_id": user["company_id"]},
        {"$set": {"title": inp.title, "content": inp.content, "kind": inp.kind, "updated_at": now_iso()}}
    )
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}


@api.delete("/context/{doc_id}")
async def delete_context(doc_id: str, user=Depends(require_role("super_admin", "admin"))):
    await db.context_docs.delete_one({"id": doc_id, "company_id": user["company_id"]})
    return {"ok": True}


# --------- CRM ---------
@api.get("/leads")
async def list_leads(user=Depends(current_user)):
    q = {"company_id": user["company_id"]}
    if user["role"] == "agent":
        q["assigned_to"] = user["id"]
    leads = await db.leads.find(q, {"_id": 0}).to_list(500)
    return leads


@api.post("/leads")
async def create_lead(inp: LeadIn, user=Depends(require_role("super_admin", "admin"))):
    doc = inp.model_dump()
    doc.update({"id": str(uuid.uuid4()), "company_id": user["company_id"], "created_at": now_iso()})
    await db.leads.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/tasks")
async def list_tasks(user=Depends(current_user)):
    q = {"company_id": user["company_id"]}
    if user["role"] == "agent":
        q["assigned_to"] = user["id"]
    tasks = await db.tasks.find(q, {"_id": 0}).to_list(500)
    return tasks


@api.post("/tasks")
async def create_task(inp: TaskIn, user=Depends(require_role("super_admin", "admin"))):
    doc = inp.model_dump()
    doc.update({"id": str(uuid.uuid4()), "company_id": user["company_id"], "created_at": now_iso()})
    await db.tasks.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.patch("/tasks/{task_id}/done")
async def mark_task_done(task_id: str, user=Depends(current_user)):
    q = {"id": task_id, "company_id": user["company_id"]}
    if user["role"] == "agent":
        q["assigned_to"] = user["id"]
    r = await db.tasks.update_one(q, {"$set": {"status": "done"}})
    if r.matched_count == 0:
        raise HTTPException(404, "Task not found or no permission")
    return {"ok": True}


# --------- Chat / LLM ---------
def build_system_prompt(context_docs: List[dict], user: dict, leads: List[dict], tasks: List[dict]) -> str:
    parts = [
        f"You are the AI assistant for {user['company_name']} — a plug-and-play Company OS chatbot.",
        f"You are talking to: {user['name']} (role: {user['role']}, id: {user['id']}).",
        "Answer questions strictly based on the context docs and CRM data provided below.",
        "Be concise, actionable, and reference lead/task IDs when relevant.",
        "",
        "=== COMPANY CONTEXT DOCUMENTS ===",
    ]
    for d in context_docs:
        parts.append(f"\n### [{d['kind']}] {d['title']}\n{d['content']}\n")
    parts.append("\n=== USER'S ASSIGNED LEADS ===")
    if not leads:
        parts.append("(no leads assigned)")
    for l in leads:
        parts.append(f"- Lead {l['id'][:8]} | {l['name']} | status={l['status']} | priority={l['priority']} | notes: {l.get('notes','')}")
    parts.append("\n=== USER'S TASKS ===")
    if not tasks:
        parts.append("(no tasks)")
    for t in tasks:
        parts.append(f"- Task {t['id'][:8]} | {t['title']} | priority={t['priority']} | status={t['status']} | due={t.get('due_date','')} | lead={t.get('lead_id','')[:8]}")
    parts.append("\nOnly reveal data listed above. Never fabricate leads/tasks/users.")
    return "\n".join(parts)


def cache_key(company_id: str, user_role: str, user_id: str, message: str) -> str:
    # Agents cache per-user (access control); admins share cache across role
    scope = user_id if user_role == "agent" else f"role:{user_role}"
    raw = f"{company_id}|{scope}|{message.strip().lower()}"
    return hashlib.sha256(raw.encode()).hexdigest()


@api.post("/chat")
async def chat_endpoint(inp: ChatIn, user=Depends(current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    company_id = user["company_id"]
    message = inp.message.strip()
    if not message:
        raise HTTPException(400, "Empty message")

    session_id = inp.session_id or str(uuid.uuid4())
    ck = cache_key(company_id, user["role"], user["id"], message)

    # 1) Cache lookup
    cached = await db.prompt_cache.find_one({"key": ck}, {"_id": 0})
    cache_hit = False
    if cached and (datetime.now(timezone.utc) - datetime.fromisoformat(cached["created_at"])).total_seconds() < 3600:
        answer = cached["answer"]
        tokens_in = cached.get("tokens_in", 0)
        tokens_out = cached.get("tokens_out", 0)
        cache_hit = True
    else:
        # 2) Load context + user's scoped CRM data
        context_docs = await db.context_docs.find({"company_id": company_id}, {"_id": 0}).to_list(200)
        lead_q = {"company_id": company_id}
        task_q = {"company_id": company_id}
        if user["role"] == "agent":
            lead_q["assigned_to"] = user["id"]
            task_q["assigned_to"] = user["id"]
        leads = await db.leads.find(lead_q, {"_id": 0}).to_list(200)
        tasks = await db.tasks.find(task_q, {"_id": 0}).to_list(200)

        # 3) LLM call
        settings = (await db.companies.find_one({"id": company_id}, {"_id": 0}) or {}).get("settings", {})
        provider = settings.get("llm_provider", "anthropic")
        model = settings.get("llm_model", "claude-sonnet-4-6")
        api_key = settings.get("api_key_override") or EMERGENT_LLM_KEY

        system_prompt = build_system_prompt(context_docs, user, leads, tasks)
        chat = LlmChat(
            api_key=api_key,
            session_id=f"{user['id']}-{session_id}",
            system_message=system_prompt,
        ).with_model(provider, model)

        try:
            answer = await chat.send_message(UserMessage(text=message))
        except Exception as e:
            logger.exception("LLM error")
            raise HTTPException(500, f"LLM error: {str(e)}")

        # Approximate token counts (chars/4 heuristic)
        tokens_in = max(1, (len(system_prompt) + len(message)) // 4)
        tokens_out = max(1, len(answer) // 4)

        await db.prompt_cache.update_one(
            {"key": ck},
            {"$set": {
                "key": ck, "company_id": company_id, "user_id": user["id"],
                "answer": answer, "tokens_in": tokens_in, "tokens_out": tokens_out,
                "created_at": now_iso(), "message": message,
            }},
            upsert=True,
        )

    # 4) Log analytics
    await db.chat_logs.insert_one({
        "id": str(uuid.uuid4()),
        "company_id": company_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_role": user["role"],
        "session_id": session_id,
        "message": message,
        "answer": answer,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "cache_hit": cache_hit,
        "created_at": now_iso(),
    })

    return {
        "answer": answer,
        "session_id": session_id,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "cache_hit": cache_hit,
    }


@api.get("/chat/history")
async def chat_history(session_id: Optional[str] = None, user=Depends(current_user)):
    q = {"company_id": user["company_id"], "user_id": user["id"]}
    if session_id:
        q["session_id"] = session_id
    logs = await db.chat_logs.find(q, {"_id": 0}).sort("created_at", 1).to_list(200)
    return logs


# --------- Analytics ---------
@api.get("/analytics/overview")
async def analytics_overview(user=Depends(require_role("super_admin", "admin"))):
    cid = user["company_id"]
    total_msgs = await db.chat_logs.count_documents({"company_id": cid})
    cache_hits = await db.chat_logs.count_documents({"company_id": cid, "cache_hit": True})
    users_count = await db.users.count_documents({"company_id": cid})

    # tokens per user
    pipeline = [
        {"$match": {"company_id": cid}},
        {"$group": {
            "_id": "$user_id",
            "user_name": {"$first": "$user_name"},
            "user_role": {"$first": "$user_role"},
            "tokens_in": {"$sum": "$tokens_in"},
            "tokens_out": {"$sum": "$tokens_out"},
            "queries": {"$sum": 1},
        }},
        {"$sort": {"tokens_out": -1}},
    ]
    per_user = await db.chat_logs.aggregate(pipeline).to_list(100)
    for x in per_user:
        x["user_id"] = x.pop("_id")

    # top prompts
    top_pipeline = [
        {"$match": {"company_id": cid}},
        {"$group": {"_id": "$message", "count": {"$sum": 1}, "tokens": {"$sum": "$tokens_out"}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    top_prompts = await db.chat_logs.aggregate(top_pipeline).to_list(10)
    top_prompts = [{"message": x["_id"], "count": x["count"], "tokens": x["tokens"]} for x in top_prompts]

    # time series (last 14 days)
    since = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
    ts_pipeline = [
        {"$match": {"company_id": cid, "created_at": {"$gte": since}}},
        {"$group": {"_id": {"$substr": ["$created_at", 0, 10]}, "queries": {"$sum": 1}, "tokens": {"$sum": {"$add": ["$tokens_in", "$tokens_out"]}}}},
        {"$sort": {"_id": 1}},
    ]
    ts = await db.chat_logs.aggregate(ts_pipeline).to_list(50)
    ts = [{"date": x["_id"], "queries": x["queries"], "tokens": x["tokens"]} for x in ts]

    return {
        "total_messages": total_msgs,
        "cache_hits": cache_hits,
        "cache_hit_rate": (cache_hits / total_msgs) if total_msgs else 0,
        "users_count": users_count,
        "per_user": per_user,
        "top_prompts": top_prompts,
        "time_series": ts,
    }


# --------- Escalations ---------
def is_task_escalated(t: dict) -> bool:
    if t.get("status") == "done":
        return False
    if t.get("priority") != "urgent":
        return False
    try:
        due = datetime.fromisoformat(t["due_date"].replace("Z", "+00:00"))
        return datetime.now(timezone.utc) > due
    except Exception:
        return False


def is_lead_escalated(l: dict) -> bool:
    # Lead is escalated if status hot and no touch in 48h
    if l.get("status") != "hot":
        return False
    try:
        last = datetime.fromisoformat((l.get("last_touched_at") or l["created_at"]).replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - last) > timedelta(hours=48)
    except Exception:
        return False


async def send_slack(company_id: str, text: str):
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    url = (company or {}).get("settings", {}).get("slack_webhook_url")
    if not url:
        return
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5) as hc:
            await hc.post(url, json={"text": text})
    except Exception as e:
        logger.warning(f"Slack send failed: {e}")


@api.get("/escalations")
async def get_escalations(user=Depends(current_user)):
    q_task = {"company_id": user["company_id"], "priority": "urgent", "status": {"$ne": "done"}}
    q_lead = {"company_id": user["company_id"], "status": "hot"}
    if user["role"] == "agent":
        q_task["assigned_to"] = user["id"]
        q_lead["assigned_to"] = user["id"]
    tasks = await db.tasks.find(q_task, {"_id": 0}).to_list(200)
    leads = await db.leads.find(q_lead, {"_id": 0}).to_list(200)

    esc_tasks = [t for t in tasks if is_task_escalated(t)]
    esc_leads = [l for l in leads if is_lead_escalated(l)]

    # Fire Slack pings for newly seen escalations (dedupe per task/day)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for t in esc_tasks:
        key = f"task:{t['id']}:{today}"
        exists = await db.slack_sent.find_one({"key": key})
        if not exists:
            await db.slack_sent.insert_one({"key": key, "company_id": user["company_id"], "sent_at": now_iso()})
            await send_slack(user["company_id"], f":rotating_light: Escalation — task *{t['title']}* (lead {t.get('lead_id','')[:8]}) is overdue and marked urgent.")
    for l in esc_leads:
        key = f"lead:{l['id']}:{today}"
        exists = await db.slack_sent.find_one({"key": key})
        if not exists:
            await db.slack_sent.insert_one({"key": key, "company_id": user["company_id"], "sent_at": now_iso()})
            await send_slack(user["company_id"], f":warning: Escalation — hot lead *{l['name']}* untouched in 48h.")

    return {"tasks": esc_tasks, "leads": esc_leads, "total": len(esc_tasks) + len(esc_leads)}


# --------- Bulk upload / Codebase ingest ---------
from fastapi import UploadFile, File


@api.post("/context/upload")
async def upload_context_files(
    files: List[UploadFile] = File(...),
    user=Depends(require_role("super_admin", "admin")),
):
    created = []
    for f in files:
        raw = await f.read()
        try:
            content = raw.decode("utf-8")
        except UnicodeDecodeError:
            continue
        if not content.strip():
            continue
        title = f.filename or "Untitled.md"
        title_clean = title.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()
        kind = "general"
        low = title.lower()
        if any(x in low for x in ["dev", "arch", "code", "schema", "backend", "api"]):
            kind = "dev"
        elif any(x in low for x in ["product", "prd", "spec"]):
            kind = "product"
        elif any(x in low for x in ["ideology", "principle", "value", "playbook"]):
            kind = "ideology"
        doc = {
            "id": str(uuid.uuid4()),
            "company_id": user["company_id"],
            "title": title_clean,
            "content": content,
            "kind": kind,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        await db.context_docs.insert_one(doc)
        doc.pop("_id", None)
        created.append(doc)
    return {"created": len(created), "docs": created}


@api.post("/context/ingest")
async def ingest_codebase(inp: IngestIn, user=Depends(require_role("super_admin", "admin"))):
    """Accepts a set of code/config files and uses the LLM to synthesize structured context docs
    (architecture, schema, module map) so the chatbot understands the codebase automatically."""
    if not inp.files:
        raise HTTPException(400, "No files provided")

    # Build a compact repo listing + snippets (cap size)
    MAX_TOTAL = 60000  # chars
    used = 0
    parts = [f"# Repository: {inp.repo_name}", "", "## File tree"]
    for f in inp.files:
        parts.append(f"- {f.path} ({len(f.content)} chars)")
    parts.append("")
    parts.append("## File contents")
    for f in inp.files:
        header = f"\n### {f.path}\n"
        remaining = MAX_TOTAL - used - len(header)
        if remaining <= 0:
            parts.append(f"\n### {f.path}\n(truncated)")
            continue
        snippet = f.content[:remaining]
        parts.append(header + snippet)
        used += len(header) + len(snippet)
    repo_dump = "\n".join(parts)

    settings = (await db.companies.find_one({"id": user["company_id"]}, {"_id": 0}) or {}).get("settings", {})
    provider = settings.get("llm_provider", "anthropic")
    model = settings.get("llm_model", "claude-sonnet-4-6")
    api_key = settings.get("api_key_override") or EMERGENT_LLM_KEY

    system = (
        "You are a senior engineer ingesting a codebase for a company chatbot. "
        "Given a repo dump (file tree + contents), output THREE Markdown documents delimited exactly by these headers: "
        "'===DOC:ARCHITECTURE===', '===DOC:SCHEMA===', '===DOC:MODULES==='. "
        "ARCHITECTURE: high-level system, tech stack, main flows. "
        "SCHEMA: every database table/collection with fields and relationships (infer from models/migrations). "
        "MODULES: for each significant file/module, one bullet 'path — what it does'. "
        "Be concise, factual, technical."
    )
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    chat = LlmChat(api_key=api_key, session_id=f"ingest-{user['company_id']}-{uuid.uuid4()}", system_message=system).with_model(provider, model)
    try:
        summary = await chat.send_message(UserMessage(text=repo_dump))
    except Exception as e:
        raise HTTPException(500, f"LLM ingest error: {e}")

    # Split and save
    def extract(marker: str) -> str:
        if marker not in summary:
            return ""
        after = summary.split(marker, 1)[1]
        for other in ("===DOC:ARCHITECTURE===", "===DOC:SCHEMA===", "===DOC:MODULES==="):
            if other != marker and other in after:
                after = after.split(other, 1)[0]
        return after.strip()

    sections = {
        "Architecture": ("dev", extract("===DOC:ARCHITECTURE===")),
        "Database Schema": ("dev", extract("===DOC:SCHEMA===")),
        "Module Map": ("dev", extract("===DOC:MODULES===")),
    }
    created = []
    for title, (kind, content) in sections.items():
        if not content:
            continue
        title_full = f"{inp.repo_name} — {title}"
        doc = {
            "id": str(uuid.uuid4()),
            "company_id": user["company_id"],
            "title": title_full,
            "content": content,
            "kind": kind,
            "created_at": now_iso(),
            "updated_at": now_iso(),
            "source": "auto-ingest",
        }
        # Upsert by title within company
        await db.context_docs.update_one(
            {"company_id": user["company_id"], "title": title_full},
            {"$set": doc}, upsert=True,
        )
        doc.pop("_id", None)
        created.append(doc)
    return {"created": len(created), "docs": created}


# --------- Settings ---------
@api.get("/settings")
async def get_settings(user=Depends(require_role("super_admin", "admin"))):
    c = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Company not found")
    s = c.get("settings", {}) or {}
    # Never leak the raw key; mask
    override = s.get("api_key_override")
    return {
        "llm_provider": s.get("llm_provider", "anthropic"),
        "llm_model": s.get("llm_model", "claude-sonnet-4-6"),
        "has_custom_key": bool(override),
        "key_preview": (override[:6] + "..." + override[-4:]) if override else None,
        "slack_webhook_url": s.get("slack_webhook_url") or "",
    }


@api.put("/settings")
async def update_settings(inp: SettingsIn, user=Depends(require_role("super_admin"))):
    upd = {"settings.llm_provider": inp.llm_provider, "settings.llm_model": inp.llm_model}
    if inp.api_key_override is not None:
        upd["settings.api_key_override"] = inp.api_key_override or None
    if inp.slack_webhook_url is not None:
        upd["settings.slack_webhook_url"] = inp.slack_webhook_url or None
    await db.companies.update_one({"id": user["company_id"]}, {"$set": upd})
    return {"ok": True}


# --------- Seed ---------
async def seed_demo():
    if await db.companies.find_one({"id": "demo-company"}):
        return
    logger.info("Seeding demo company...")
    company_id = "demo-company"
    await db.companies.insert_one({
        "id": company_id,
        "name": "Acme CRM Demo",
        "created_at": now_iso(),
        "settings": {"llm_provider": "anthropic", "llm_model": "claude-sonnet-4-6"},
    })

    # Users
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@acme.demo")
    admin_pw = os.environ.get("ADMIN_PASSWORD", "admin123")
    admin_id = "user-admin"
    agent1_id = "user-agent-1"
    agent2_id = "user-agent-2"

    users = [
        {"id": admin_id, "email": admin_email, "name": "Ava Admin",
         "password_hash": hash_pw(admin_pw), "role": "super_admin",
         "company_id": company_id, "company_name": "Acme CRM Demo",
         "blocked": False, "created_at": now_iso()},
        {"id": agent1_id, "email": "alice@acme.demo", "name": "Alice Agent",
         "password_hash": hash_pw("agent123"), "role": "agent",
         "company_id": company_id, "company_name": "Acme CRM Demo",
         "blocked": False, "created_at": now_iso()},
        {"id": agent2_id, "email": "bob@acme.demo", "name": "Bob Agent",
         "password_hash": hash_pw("agent123"), "role": "agent",
         "company_id": company_id, "company_name": "Acme CRM Demo",
         "blocked": False, "created_at": now_iso()},
    ]
    for u in users:
        await db.users.update_one({"email": u["email"]}, {"$set": u}, upsert=True)

    # Context docs
    docs = [
        {"id": "doc-onboard", "company_id": company_id, "kind": "product",
         "title": "Acme CRM — Product Ideology",
         "content": "Acme CRM prioritizes lead urgency by SLA. Escalations trigger when a task is >24h overdue or the lead has priority=urgent with no update in 4h. Agents should always tackle URGENT priority tasks first, then HIGH, in due-date order.",
         "created_at": now_iso(), "updated_at": now_iso()},
        {"id": "doc-dev", "company_id": company_id, "kind": "dev",
         "title": "Escalation Rules (Dev Reference)",
         "content": "Escalation flag is set in the CRM when: (1) task.priority=urgent AND now > task.due_date, (2) lead.status='hot' with no touch in 48h. Escalation resolutions must include a note in the lead notes field.",
         "created_at": now_iso(), "updated_at": now_iso()},
        {"id": "doc-ideology", "company_id": company_id, "kind": "ideology",
         "title": "Customer-First Playbook",
         "content": "Every interaction should aim to solve, not sell. When responding to escalations, empathize first, then explain the resolution path with a concrete next step and timeline.",
         "created_at": now_iso(), "updated_at": now_iso()},
    ]
    for d in docs:
        await db.context_docs.update_one({"id": d["id"]}, {"$set": d}, upsert=True)

    # Leads
    leads = [
        {"id": "lead-01", "name": "Northwind Traders", "email": "cto@northwind.example", "phone": "555-0101",
         "status": "hot", "priority": "urgent", "assigned_to": agent1_id, "notes": "Awaiting demo call. Escalated last week."},
        {"id": "lead-02", "name": "Contoso Ltd", "email": "buyer@contoso.example", "phone": "555-0102",
         "status": "warm", "priority": "high", "assigned_to": agent1_id, "notes": "Wants pricing tier for 200 seats."},
        {"id": "lead-03", "name": "Fabrikam Inc", "email": "ops@fabrikam.example", "phone": "555-0103",
         "status": "new", "priority": "medium", "assigned_to": agent1_id, "notes": "Inbound webform lead."},
        {"id": "lead-04", "name": "Adventure Works", "email": "sales@adventure.example", "phone": "555-0104",
         "status": "hot", "priority": "urgent", "assigned_to": agent2_id, "notes": "Ready to sign — waiting on legal review."},
        {"id": "lead-05", "name": "Wingtip Toys", "email": "founder@wingtip.example", "phone": "555-0105",
         "status": "cold", "priority": "low", "assigned_to": agent2_id, "notes": "Nurture; check back in Q2."},
    ]
    for l in leads:
        l["company_id"] = company_id
        l["created_at"] = now_iso()
        await db.leads.update_one({"id": l["id"]}, {"$set": l}, upsert=True)

    # Tasks
    today = datetime.now(timezone.utc)
    tasks = [
        {"id": "task-01", "lead_id": "lead-01", "title": "Call Northwind CTO for demo",
         "description": "Follow up on escalation from last week.", "priority": "urgent",
         "due_date": today.isoformat(), "status": "open", "assigned_to": agent1_id},
        {"id": "task-02", "lead_id": "lead-02", "title": "Send Contoso 200-seat pricing",
         "description": "Custom quote requested.", "priority": "high",
         "due_date": (today + timedelta(days=1)).isoformat(), "status": "open", "assigned_to": agent1_id},
        {"id": "task-03", "lead_id": "lead-03", "title": "Qualify Fabrikam webform lead",
         "description": "BANT questions.", "priority": "medium",
         "due_date": (today + timedelta(days=3)).isoformat(), "status": "open", "assigned_to": agent1_id},
        {"id": "task-04", "lead_id": "lead-04", "title": "Adventure Works legal follow-up",
         "description": "Push contract to signature.", "priority": "urgent",
         "due_date": today.isoformat(), "status": "open", "assigned_to": agent2_id},
        {"id": "task-05", "lead_id": "lead-05", "title": "Wingtip Q2 nurture email",
         "description": "Schedule for Apr 1.", "priority": "low",
         "due_date": (today + timedelta(days=45)).isoformat(), "status": "open", "assigned_to": agent2_id},
    ]
    for t in tasks:
        t["company_id"] = company_id
        t["created_at"] = now_iso()
        await db.tasks.update_one({"id": t["id"]}, {"$set": t}, upsert=True)

    logger.info("Seed complete.")


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("company_id")
    await db.leads.create_index("company_id")
    await db.tasks.create_index("company_id")
    await db.chat_logs.create_index("company_id")
    await db.prompt_cache.create_index("key", unique=True)
    await seed_demo()


@app.on_event("shutdown")
async def shutdown():
    client.close()


@api.get("/")
async def root():
    return {"service": "Company OS", "ok": True}


# --------- Voice transcription (STT) ---------
@api.post("/voice/transcribe")
async def transcribe_voice(file: UploadFile = File(...), user=Depends(current_user)):
    from emergentintegrations.llm.openai import OpenAISpeechToText
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "STT not configured")
    # Whisper accepts webm/mp3/wav; browsers usually send webm from MediaRecorder
    filename = file.filename or "voice.webm"
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(400, "Empty audio")
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(400, "Audio too large (>25MB)")
    stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
    # Pass a file-like object with a name attribute so the SDK infers mimetype
    import io
    buf = io.BytesIO(contents)
    buf.name = filename
    try:
        resp = await stt.transcribe(file=buf, model="whisper-1", response_format="json")
    except Exception as e:
        logger.exception("STT error")
        raise HTTPException(500, f"Transcription failed: {e}")
    text = getattr(resp, "text", None) or (resp.get("text") if isinstance(resp, dict) else "")
    return {"text": text or ""}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
