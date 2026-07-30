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
import re
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
# Platform owner — only this email can view cross-tenant marketing leads (contact/waitlist).
PLATFORM_OWNER_EMAIL = os.environ.get('PLATFORM_OWNER_EMAIL', '').strip().lower()

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
    custom_fields: Dict[str, Any] = {}  # arbitrary per-company key/value data


class TaskIn(BaseModel):
    lead_id: str
    title: str
    description: str = ""
    priority: str = "medium"  # low, medium, high, urgent
    due_date: str  # ISO
    status: str = "open"  # open / done
    assigned_to: str  # user_id
    custom_fields: Dict[str, Any] = {}


class ChatIn(BaseModel):
    message: str
    session_id: Optional[str] = None


class BlockIn(BaseModel):
    blocked: bool


class LimitIn(BaseModel):
    token_limit: int  # 0 = unlimited


class SettingsIn(BaseModel):
    llm_provider: str = "anthropic"
    llm_model: str = "claude-sonnet-4-6"
    api_key_override: Optional[str] = None
    slack_webhook_url: Optional[str] = None


class ContactIn(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = ""
    message: str


class WaitlistIn(BaseModel):
    email: EmailStr


class ServicesEstimateIn(BaseModel):
    email: EmailStr
    note: Optional[str] = ""
    services: List[str] = []


class ServicesIn(BaseModel):
    services: List[str] = []


class ContextToggleIn(BaseModel):
    included: bool


class TreeNodeToggleIn(BaseModel):
    path: str
    included: bool
    cascade: bool = True  # when a dir is toggled, apply to all descendants


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


def make_token(user_id: str, token_version: int = 0, hours: int = 24 * 7) -> str:
    payload = {
        "sub": user_id,
        "tv": token_version,  # token version — bump on user record to invalidate all outstanding tokens
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
    # Server-side token revocation: bump user.token_version to kill all outstanding JWTs.
    token_tv = payload.get("tv", 0)
    user_tv = user.get("token_version", 0)
    if token_tv != user_tv:
        raise HTTPException(401, "Token revoked — please sign in again")
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
        "token_limit": u.get("token_limit", 0),   # 0 = unlimited
        "token_used": u.get("token_used", 0),
        "department": u.get("department", ""),
    }


LOGIN_MAX_ATTEMPTS = 5      # SEC hardening: rate limit /auth/login
LOGIN_WINDOW_MIN = 10       # attempts counted within this rolling window
LOGIN_LOCKOUT_MIN = 15      # once tripped, IP is blocked this long

async def _client_ip(request: Request) -> str:
    # Prefer X-Forwarded-For (first hop = original client) since we're behind K8s ingress
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()[:64]
    return (request.client.host if request.client else "unknown")[:64]


async def _login_throttle_check(ip: str, email: str):
    now = datetime.now(timezone.utc)
    window_start = (now - timedelta(minutes=LOGIN_WINDOW_MIN)).isoformat()
    # Trip if EITHER the IP or the email hit the ceiling in this window.
    ip_fails = await db.login_attempts.count_documents({
        "ip": ip, "success": False, "at": {"$gte": window_start}
    })
    email_fails = await db.login_attempts.count_documents({
        "email": email[:100], "success": False, "at": {"$gte": window_start}
    })
    if ip_fails >= LOGIN_MAX_ATTEMPTS or email_fails >= LOGIN_MAX_ATTEMPTS:
        raise HTTPException(429, f"Too many failed login attempts. Try again in {LOGIN_LOCKOUT_MIN} minutes.")


async def _login_record(ip: str, email: str, success: bool):
    await db.login_attempts.insert_one({
        "ip": ip, "email": email[:100].lower(), "success": success, "at": now_iso()
    })


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
        "token_version": 0,
        "department": "",
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    token = make_token(user_id, 0)
    return {"token": token, "user": user_to_out(doc)}


@api.post("/auth/login")
async def login(inp: LoginIn, request: Request):
    ip = await _client_ip(request)
    await _login_throttle_check(ip, inp.email)
    email = inp.email.lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_pw(inp.password, user["password_hash"]):
        await _login_record(ip, email, False)
        raise HTTPException(401, "Invalid credentials")
    if user.get("blocked"):
        await _login_record(ip, email, False)
        raise HTTPException(403, "User is blocked")
    await _login_record(ip, email, True)
    token = make_token(user["id"], user.get("token_version", 0))
    return {"token": token, "user": user_to_out(user)}


@api.post("/auth/logout")
async def logout(user=Depends(current_user)):
    """Bump token_version so every outstanding JWT for this user is now invalid."""
    await db.users.update_one({"id": user["id"]}, {"$inc": {"token_version": 1}})
    return {"ok": True}


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
    department: str = ""


class DepartmentIn(BaseModel):
    department: str


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
        "token_version": 0,
        "department": (inp.department or "").strip(),
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    return user_to_out(doc)


@api.patch("/users/{uid}/department")
async def set_department(uid: str, inp: DepartmentIn, user=Depends(require_role("super_admin", "admin"))):
    target = await db.users.find_one({"id": uid, "company_id": user["company_id"]})
    if not target:
        raise HTTPException(404, "User not found")
    await db.users.update_one({"id": uid}, {"$set": {"department": (inp.department or "").strip()}})
    return {"ok": True}


@api.get("/departments")
async def list_departments(user=Depends(current_user)):
    """Distinct list of department names within the company (for filter chips)."""
    rows = await db.users.find({"company_id": user["company_id"]}, {"_id": 0, "department": 1}).to_list(500)
    depts = sorted({(r.get("department") or "").strip() for r in rows if (r.get("department") or "").strip()})
    return depts


@api.patch("/users/{uid}/block")
async def toggle_block(uid: str, inp: BlockIn, user=Depends(require_role("super_admin", "admin"))):
    target = await db.users.find_one({"id": uid, "company_id": user["company_id"]})
    if not target:
        raise HTTPException(404, "User not found")
    if target["id"] == user["id"]:
        raise HTTPException(400, "Cannot block yourself")
    await db.users.update_one({"id": uid}, {"$set": {"blocked": inp.blocked}})
    return {"ok": True}


@api.patch("/users/{uid}/limit")
async def set_token_limit(uid: str, inp: LimitIn, user=Depends(require_role("super_admin", "admin"))):
    target = await db.users.find_one({"id": uid, "company_id": user["company_id"]})
    if not target:
        raise HTTPException(404, "User not found")
    if inp.token_limit < 0:
        raise HTTPException(400, "Limit must be >= 0")
    await db.users.update_one({"id": uid}, {"$set": {"token_limit": inp.token_limit}})
    return {"ok": True}


@api.post("/users/{uid}/reset-usage")
async def reset_usage(uid: str, user=Depends(require_role("super_admin", "admin"))):
    target = await db.users.find_one({"id": uid, "company_id": user["company_id"]})
    if not target:
        raise HTTPException(404, "User not found")
    await db.users.update_one({"id": uid}, {"$set": {"token_used": 0}})
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


@api.patch("/context/{doc_id}/toggle")
async def toggle_context(doc_id: str, inp: ContextToggleIn, user=Depends(require_role("super_admin", "admin"))):
    """Include or exclude a context doc from the LLM system prompt (token-saving)."""
    r = await db.context_docs.update_one(
        {"id": doc_id, "company_id": user["company_id"]},
        {"$set": {"included": bool(inp.included), "updated_at": now_iso()}},
    )
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True, "included": bool(inp.included)}


def _build_tree(paths_and_sizes: List[dict]) -> dict:
    """Turn a flat list of {path, size} into a nested tree {name, path, size, kind, included, children}."""
    root = {"name": "root", "path": "", "size": 0, "kind": "dir", "included": True, "children": {}}
    for entry in paths_and_sizes:
        parts = [p for p in entry["path"].split("/") if p]
        node = root
        for i, part in enumerate(parts):
            is_leaf = i == len(parts) - 1
            if part not in node["children"]:
                node["children"][part] = {
                    "name": part,
                    "path": "/".join(parts[: i + 1]),
                    "size": 0,
                    "kind": "file" if is_leaf else "dir",
                    "included": True,
                    "children": {},
                }
            child = node["children"][part]
            if is_leaf:
                child["size"] = entry["size"]
                child["kind"] = "file"
            node = child
    def finalize(n):
        kids = list(n["children"].values())
        kids.sort(key=lambda k: (k["kind"] != "dir", k["name"].lower()))
        for k in kids:
            finalize(k)
        n["children"] = kids
        if n["kind"] == "dir":
            n["size"] = sum(k["size"] for k in kids)
    finalize(root)
    return root


def _walk_nodes(node, visitor):
    """Depth-first walk; visitor(node) may return False to skip descending."""
    if visitor(node) is False:
        return
    for k in node.get("children", []) or []:
        _walk_nodes(k, visitor)


def _apply_inclusion_flags(new_tree: dict, prev_tree: dict) -> dict:
    """Copy `included` flags from prev_tree onto matching paths of new_tree (for re-ingest)."""
    prev_by_path = {}
    def collect(n):
        prev_by_path[n.get("path", "")] = n.get("included", True)
    _walk_nodes(prev_tree, collect)
    def apply(n):
        p = n.get("path", "")
        if p in prev_by_path:
            n["included"] = prev_by_path[p]
    _walk_nodes(new_tree, apply)
    return new_tree


def _tree_diff(prev_files: dict, new_files: dict) -> dict:
    """Compare {path: size} maps and return added / removed / changed lists."""
    prev_paths = set(prev_files.keys())
    new_paths = set(new_files.keys())
    added = sorted(new_paths - prev_paths)
    removed = sorted(prev_paths - new_paths)
    changed = sorted([p for p in (prev_paths & new_paths) if prev_files[p] != new_files[p]])
    return {"added": added, "removed": removed, "changed": changed}


def _tree_included_paths(tree: dict) -> List[str]:
    """Return the file paths that are still included, respecting parent-directory exclusions."""
    included: List[str] = []
    def visit(node, parent_included):
        my_included = parent_included and node.get("included", True)
        if node["kind"] == "file" and my_included:
            included.append(node["path"])
        for k in node.get("children", []) or []:
            visit(k, my_included)
    for k in tree.get("children", []) or []:
        visit(k, True)
    return included


def _tree_included_chars(tree: dict) -> int:
    total = 0
    def visit(node, parent_included):
        my_included = parent_included and node.get("included", True)
        if node["kind"] == "file" and my_included:
            total_ref[0] += node.get("size", 0)
        for k in node.get("children", []) or []:
            visit(k, my_included)
    total_ref = [0]
    for k in tree.get("children", []) or []:
        visit(k, True)
    return total_ref[0]


@api.get("/context/trees")
async def list_context_trees(user=Depends(require_role("super_admin", "admin"))):
    """All ingested repo trees for this company + their linked doc-inclusion state."""
    trees = await db.context_trees.find({"company_id": user["company_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for t in trees:
        docs = await db.context_docs.find(
            {"company_id": user["company_id"], "repo_name": t["repo_name"], "source": "auto-ingest"},
            {"_id": 0, "id": 1, "title": 1, "kind": 1, "included": 1, "content": 1, "updated_at": 1},
        ).to_list(20)
        for d in docs:
            d["chars"] = len(d.get("content") or "")
            d["included"] = d.get("included", True)
            d.pop("content", None)
        t["docs"] = docs
        # Live-computed inclusion stats so the UI can render a counter without re-walking
        included_chars = _tree_included_chars(t.get("tree", {}))
        t["included_chars"] = included_chars
        t["included_files"] = len(_tree_included_paths(t.get("tree", {})))
    return trees


@api.get("/context/trees/{repo_name}")
async def get_context_tree(repo_name: str, user=Depends(require_role("super_admin", "admin"))):
    t = await db.context_trees.find_one({"company_id": user["company_id"], "repo_name": repo_name}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Repo not found")
    docs = await db.context_docs.find(
        {"company_id": user["company_id"], "repo_name": repo_name, "source": "auto-ingest"},
        {"_id": 0, "id": 1, "title": 1, "kind": 1, "included": 1, "content": 1, "updated_at": 1},
    ).to_list(20)
    for d in docs:
        d["chars"] = len(d.get("content") or "")
        d["included"] = d.get("included", True)
        d.pop("content", None)
    t["docs"] = docs
    t["included_chars"] = _tree_included_chars(t.get("tree", {}))
    t["included_files"] = len(_tree_included_paths(t.get("tree", {})))
    return t


@api.patch("/context/trees/{repo_name}/toggle")
async def toggle_tree_node(repo_name: str, inp: TreeNodeToggleIn, user=Depends(require_role("super_admin", "admin"))):
    """Toggle a single node's `included` flag. If `cascade` (default), descendants inherit."""
    t = await db.context_trees.find_one({"company_id": user["company_id"], "repo_name": repo_name}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Repo not found")
    tree = t.get("tree") or {}
    target_found = [False]
    def visit(node, force_value=None):
        if force_value is not None:
            node["included"] = force_value
        if node.get("path", "") == inp.path:
            node["included"] = inp.included
            target_found[0] = True
            if inp.cascade:
                for k in node.get("children", []) or []:
                    visit(k, force_value=inp.included)
            return
        for k in node.get("children", []) or []:
            visit(k, force_value=force_value)
    visit(tree)
    if not target_found[0]:
        raise HTTPException(404, "Path not in tree")
    await db.context_trees.update_one(
        {"company_id": user["company_id"], "repo_name": repo_name},
        {"$set": {"tree": tree, "updated_at": now_iso()}},
    )
    return {
        "ok": True,
        "included_chars": _tree_included_chars(tree),
        "included_files": len(_tree_included_paths(tree)),
    }


@api.delete("/context/trees/{repo_name}")
async def delete_context_tree(repo_name: str, user=Depends(require_role("super_admin", "admin"))):
    r = await db.context_trees.delete_one({"company_id": user["company_id"], "repo_name": repo_name})
    if r.deleted_count == 0:
        raise HTTPException(404, "Repo not found")
    # Also delete the auto-ingested docs tied to this repo
    await db.context_docs.delete_many({"company_id": user["company_id"], "repo_name": repo_name, "source": "auto-ingest"})
    return {"ok": True}


# --------- CRM ---------
@api.get("/leads")
async def list_leads(
    user=Depends(current_user),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    escalated: Optional[bool] = None,
    q: Optional[str] = None,
):
    query = {"company_id": user["company_id"]}
    if user["role"] == "agent":
        query["assigned_to"] = user["id"]
    elif assigned_to:
        query["assigned_to"] = assigned_to
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if q:
        # SEC-003: escape user input before feeding to $regex; cap length
        safe_q = re.escape(q[:80])
        query["$or"] = [
            {"name":  {"$regex": safe_q, "$options": "i"}},
            {"email": {"$regex": safe_q, "$options": "i"}},
            {"notes": {"$regex": safe_q, "$options": "i"}},
        ]
    leads = await db.leads.find(query, {"_id": 0}).to_list(500)
    if escalated is True:
        leads = [l for l in leads if is_lead_escalated(l)]
    elif escalated is False:
        leads = [l for l in leads if not is_lead_escalated(l)]
    return leads


@api.post("/leads")
async def create_lead(inp: LeadIn, user=Depends(require_role("super_admin", "admin"))):
    doc = inp.model_dump()
    doc.update({"id": str(uuid.uuid4()), "company_id": user["company_id"], "created_at": now_iso()})
    await db.leads.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/tasks")
async def list_tasks(
    user=Depends(current_user),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    lead_id: Optional[str] = None,
    due_before: Optional[str] = None,   # ISO date, filter tasks due on or before
    overdue: Optional[bool] = None,
    q: Optional[str] = None,
):
    query = {"company_id": user["company_id"]}
    if user["role"] == "agent":
        query["assigned_to"] = user["id"]
    elif assigned_to:
        query["assigned_to"] = assigned_to
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if lead_id:
        query["lead_id"] = lead_id
    if due_before:
        query["due_date"] = {"$lte": due_before}
    if q:
        # SEC-003: escape user input before feeding to $regex; cap length
        safe_q = re.escape(q[:80])
        query["$or"] = [
            {"title":       {"$regex": safe_q, "$options": "i"}},
            {"description": {"$regex": safe_q, "$options": "i"}},
        ]
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(500)
    if overdue is True:
        now_s = now_iso()
        tasks = [t for t in tasks if t.get("status") != "done" and (t.get("due_date") or "") < now_s]
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
        "",
        "## Voice",
        "Talk like a helpful colleague — natural, conversational sentences, contractions are fine.",
        "Prefer flowing paragraphs over lists. Use a short bullet only when a real enumeration helps.",
        "NEVER dump giant markdown tables, big headings, emoji rows, or 'Recommended action:' template sections.",
        "Do NOT use decorative emojis (🚨🔴📋 etc.). One inline `code span` for an ID or field name is fine.",
        "When you mention a task or lead, refer to it by its short id in backticks like `task-01` or `lead-04`. No status badges.",
        "Keep answers under ~120 words unless the question truly demands more detail.",
        "",
        "## Rules",
        "Answer strictly from the context docs and CRM data below. If the answer isn't there, say so.",
        "Never fabricate leads, tasks, users, dates, or numbers.",
        "",
        "=== COMPANY CONTEXT DOCUMENTS ===",
    ]
    active_docs = [d for d in context_docs if d.get("included", True)]
    for d in active_docs:
        parts.append(f"\n### [{d['kind']}] {d['title']}\n{d['content']}\n")
    parts.append("\n=== USER'S ASSIGNED LEADS ===")
    if not leads:
        parts.append("(no leads assigned)")
    for l in leads:
        cf = l.get("custom_fields") or {}
        extras = (" | " + " | ".join(f"{k}={v}" for k, v in cf.items())) if cf else ""
        parts.append(f"- Lead {l['id'][:8]} | {l['name']} | status={l['status']} | priority={l['priority']} | notes: {l.get('notes','')}{extras}")
    parts.append("\n=== USER'S TASKS ===")
    if not tasks:
        parts.append("(no tasks)")
    for t in tasks:
        cf = t.get("custom_fields") or {}
        extras = (" | " + " | ".join(f"{k}={v}" for k, v in cf.items())) if cf else ""
        parts.append(f"- Task {t['id'][:8]} | {t['title']} | priority={t['priority']} | status={t['status']} | due={t.get('due_date','')} | lead={t.get('lead_id','')[:8]}{extras}")
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

    # 0) Monthly reset check + enforce per-user token quota (0 = unlimited)
    user = await maybe_monthly_reset(user)
    token_limit = int(user.get("token_limit") or 0)
    token_used = int(user.get("token_used") or 0)
    if token_limit > 0 and token_used >= token_limit:
        raise HTTPException(429, f"Token quota exceeded ({token_used}/{token_limit}). Contact an admin.")

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
            raise HTTPException(500, "LLM error")

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

    # 5) Increment per-user token counter (cache-hits count too, since they still consumed context on 1st call)
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"token_used": int(tokens_in + tokens_out)}},
    )

    # 6) Fire quota alert at 80% (once per month)
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    if fresh:
        await maybe_quota_alert(fresh, company_id)

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
@api.get("/overview")
async def personal_overview(user=Depends(current_user)):
    """One aggregated endpoint that powers the redesigned agent Overview page.
    Everything is scoped to the current user (agents see only theirs)."""
    cid = user["company_id"]
    now = datetime.now(timezone.utc)
    now_s = now.isoformat()

    lead_q = {"company_id": cid}
    task_q = {"company_id": cid}
    if user["role"] == "agent":
        lead_q["assigned_to"] = user["id"]
        task_q["assigned_to"] = user["id"]

    leads = await db.leads.find(lead_q, {"_id": 0}).to_list(500)
    tasks = await db.tasks.find(task_q, {"_id": 0}).to_list(500)

    open_tasks   = [t for t in tasks if t.get("status") != "done"]
    urgent_tasks = [t for t in open_tasks if t.get("priority") == "urgent"]
    overdue      = [t for t in open_tasks if (t.get("due_date") or "") < now_s]
    hot_leads    = [l for l in leads if l.get("status") == "hot"]
    stale_hot    = [l for l in hot_leads if is_lead_escalated(l)]
    escalated_t  = [t for t in urgent_tasks if is_task_escalated(t)]

    # Pipeline funnel per status
    stages = ["new", "qualified", "proposal", "negotiation", "hot", "closed", "lost"]
    funnel = []
    for s in stages:
        c = sum(1 for l in leads if l.get("status") == s)
        if c > 0:
            funnel.append({"stage": s, "count": c})

    # Priority breakdown for open tasks
    priority_mix = []
    for p in ["urgent", "high", "medium", "low"]:
        c = sum(1 for t in open_tasks if t.get("priority") == p)
        if c > 0:
            priority_mix.append({"priority": p, "count": c})

    # Merged "attention" feed
    attention: List[Dict[str, Any]] = []
    for t in escalated_t:
        attention.append({
            "type": "task_escalated", "id": t["id"], "title": t["title"],
            "priority": t.get("priority", ""), "when": t.get("due_date", ""),
            "meta": {"lead_id": t.get("lead_id"), "status": t.get("status")},
        })
    for t in overdue:
        if t in escalated_t:  # already surfaced
            continue
        attention.append({
            "type": "task_overdue", "id": t["id"], "title": t["title"],
            "priority": t.get("priority", ""), "when": t.get("due_date", ""),
            "meta": {"lead_id": t.get("lead_id"), "status": t.get("status")},
        })
    for l in stale_hot:
        attention.append({
            "type": "lead_stale", "id": l["id"], "title": l["name"],
            "priority": l.get("priority", "high"), "when": l.get("last_touched_at") or l.get("created_at", ""),
            "meta": {"status": l.get("status"), "email": l.get("email")},
        })
    # sort by 'when' asc (oldest overdue first)
    attention.sort(key=lambda x: x.get("when") or "")

    # Recent activity — latest chats + task completions + context updates for this user
    chat_recent = await db.chat_logs.find(
        {"company_id": cid, **({"user_id": user["id"]} if user["role"] == "agent" else {})},
        {"_id": 0, "message": 1, "user_name": 1, "created_at": 1, "cache_hit": 1},
    ).sort("created_at", -1).to_list(6)
    activity = [{
        "type": "chat", "title": c["message"][:90],
        "meta": {"user": c.get("user_name"), "cache_hit": c.get("cache_hit", False)},
        "when": c.get("created_at", ""),
    } for c in chat_recent]
    activity.sort(key=lambda x: x["when"], reverse=True)

    # Personal quota (agents only carry a limit — admins usually unlimited)
    me = await db.users.find_one({"id": user["id"]}, {"_id": 0}) or {}
    quota = {
        "used":  me.get("token_used", 0),
        "limit": me.get("token_limit", 0),
    }

    return {
        "kpis": {
            "open_tasks":   len(open_tasks),
            "urgent_tasks": len(urgent_tasks),
            "overdue":      len(overdue),
            "hot_leads":    len(hot_leads),
            "stale_hot":    len(stale_hot),
            "leads_total":  len(leads),
        },
        "quota": quota,
        "attention":    attention[:12],
        "funnel":       funnel,
        "priority_mix": priority_mix,
        "activity":     activity[:8],
    }


@api.get("/analytics/overview")
async def analytics_overview(
    user=Depends(require_role("super_admin", "admin")),
    range: str = "14d",           # "7d" | "14d" | "30d" | "all"
    user_id: Optional[str] = None,
):
    cid = user["company_id"]
    days_map = {"7d": 7, "14d": 14, "30d": 30}
    days = days_map.get(range)  # None for "all"

    base_match: Dict[str, Any] = {"company_id": cid}
    if days is not None:
        since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        base_match["created_at"] = {"$gte": since}
    if user_id:
        base_match["user_id"] = user_id

    total_msgs = await db.chat_logs.count_documents(base_match)
    cache_match = dict(base_match, cache_hit=True)
    cache_hits = await db.chat_logs.count_documents(cache_match)
    users_count = await db.users.count_documents({"company_id": cid})

    # tokens per user
    pipeline = [
        {"$match": base_match},
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
        {"$match": base_match},
        {"$group": {"_id": "$message", "count": {"$sum": 1}, "tokens": {"$sum": "$tokens_out"}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    top_prompts = await db.chat_logs.aggregate(top_pipeline).to_list(10)
    top_prompts = [{"message": x["_id"], "count": x["count"], "tokens": x["tokens"]} for x in top_prompts]

    # time series (respects same range; falls back to 14d cap when "all")
    ts_days = days if days is not None else 30
    since = (datetime.now(timezone.utc) - timedelta(days=ts_days)).isoformat()
    ts_match = dict(base_match)
    ts_match["created_at"] = {"$gte": since}
    ts_pipeline = [
        {"$match": ts_match},
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
        "filters": {"range": range, "user_id": user_id},
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


def _is_valid_slack_webhook(url: str) -> bool:
    """SEC-002: only allow Slack's official webhook host."""
    try:
        from urllib.parse import urlparse
        u = urlparse(url)
        return u.scheme == "https" and u.hostname == "hooks.slack.com"
    except Exception:
        return False


async def send_slack(company_id: str, text: str):
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    url = (company or {}).get("settings", {}).get("slack_webhook_url")
    if not url:
        return
    if not _is_valid_slack_webhook(url):
        logger.warning("Rejected slack webhook (not hooks.slack.com host)")
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
    # SEC hardening: cap file count + per-file size
    MAX_FILES = 50
    MAX_BYTES_PER_FILE = 2 * 1024 * 1024  # 2 MB
    if len(files) > MAX_FILES:
        raise HTTPException(413, f"Too many files (max {MAX_FILES} per upload)")
    created = []
    for f in files:
        raw = await f.read()
        if len(raw) > MAX_BYTES_PER_FILE:
            raise HTTPException(413, f"'{f.filename}' exceeds 2 MB limit")
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
    """Accepts a set of code/config files. If this repo_name was ingested before, computes a diff and
    preserves the user's per-file inclusion selections. Only INCLUDED files are shown to the LLM."""
    if not inp.files:
        raise HTTPException(400, "No files provided")

    new_paths = [{"path": f.path, "size": len(f.content)} for f in inp.files]
    new_tree = _build_tree(new_paths)

    prev = await db.context_trees.find_one({"company_id": user["company_id"], "repo_name": inp.repo_name}, {"_id": 0})
    diff = {"added": [], "removed": [], "changed": []}
    if prev and prev.get("tree"):
        prev_files_map = {}
        def coll(n):
            if n["kind"] == "file":
                prev_files_map[n["path"]] = n.get("size", 0)
        _walk_nodes(prev["tree"], coll)
        new_files_map = {f.path: len(f.content) for f in inp.files}
        diff = _tree_diff(prev_files_map, new_files_map)
        new_tree = _apply_inclusion_flags(new_tree, prev["tree"])

    included_paths = set(_tree_included_paths(new_tree))
    files_to_feed = [f for f in inp.files if f.path in included_paths] if prev else inp.files
    if not files_to_feed:
        raise HTTPException(400, "All files are excluded — include at least one file")

    MAX_TOTAL = 60000
    used = 0
    parts = [f"# Repository: {inp.repo_name}", "", "## File tree"]
    for f in files_to_feed:
        parts.append(f"- {f.path} ({len(f.content)} chars)")
    parts.append("")
    parts.append("## File contents")
    for f in files_to_feed:
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
        logger.exception("LLM ingest error")
        raise HTTPException(500, "LLM ingest error")

    def extract(marker: str) -> str:
        if marker not in summary:
            return ""
        after = summary.split(marker, 1)[1]
        for other in ("===DOC:ARCHITECTURE===", "===DOC:SCHEMA===", "===DOC:MODULES==="):
            if other != marker and other in after:
                after = after.split(other, 1)[0]
        return after.strip()

    sections = {
        "Architecture":    ("dev", extract("===DOC:ARCHITECTURE===")),
        "Database Schema": ("dev", extract("===DOC:SCHEMA===")),
        "Module Map":      ("dev", extract("===DOC:MODULES===")),
    }
    created = []
    for title, (kind, content) in sections.items():
        if not content:
            continue
        title_full = f"{inp.repo_name} — {title}"
        existing = await db.context_docs.find_one({"company_id": user["company_id"], "title": title_full}, {"included": 1})
        doc = {
            "id": str(uuid.uuid4()),
            "company_id": user["company_id"],
            "title": title_full,
            "content": content,
            "kind": kind,
            "created_at": now_iso(),
            "updated_at": now_iso(),
            "source": "auto-ingest",
            "repo_name": inp.repo_name,
            "included": (existing or {}).get("included", True),
        }
        await db.context_docs.update_one(
            {"company_id": user["company_id"], "title": title_full},
            {"$set": doc}, upsert=True,
        )
        doc.pop("_id", None)
        created.append(doc)

    total_chars = sum(len(f.content) for f in inp.files)
    await db.context_trees.update_one(
        {"company_id": user["company_id"], "repo_name": inp.repo_name},
        {"$set": {
            "id": (prev or {}).get("id", str(uuid.uuid4())),
            "company_id": user["company_id"],
            "repo_name": inp.repo_name,
            "tree": new_tree,
            "file_count": len(inp.files),
            "total_chars": total_chars,
            "last_diff": diff,
            "created_at": (prev or {}).get("created_at", now_iso()),
            "updated_at": now_iso(),
        }}, upsert=True,
    )
    return {
        "created": len(created), "docs": created,
        "file_count": len(inp.files), "total_chars": total_chars,
        "diff": diff, "reingest": bool(prev),
    }


# --------- Chat history (admin) ---------
@api.get("/admin/chats")
async def admin_chat_history(
    user=Depends(require_role("super_admin", "admin")),
    user_id: Optional[str] = None,
    department: Optional[str] = None,
    range: str = "14d",
    cached_only: Optional[bool] = None,
    q: Optional[str] = None,
    limit: int = 200,
):
    """Full chat log for admins — filterable by department, user, date range, cache-only, keyword."""
    days_map = {"7d": 7, "14d": 14, "30d": 30}
    days = days_map.get(range)
    match: Dict[str, Any] = {"company_id": user["company_id"]}
    if days is not None:
        since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        match["created_at"] = {"$gte": since}

    # Department filter: resolve user_ids in that department
    dept_user_ids: Optional[set] = None
    if department:
        rows = await db.users.find(
            {"company_id": user["company_id"], "department": department},
            {"_id": 0, "id": 1},
        ).to_list(500)
        dept_user_ids = {r["id"] for r in rows}
        if not dept_user_ids:
            return {"items": [], "total": 0, "filters": {"user_id": user_id, "department": department, "range": range, "cached_only": cached_only, "q": q}}
        match["user_id"] = {"$in": list(dept_user_ids)}
    if user_id:
        # If department filter is also set, user_id must intersect
        if dept_user_ids is not None and user_id not in dept_user_ids:
            return {"items": [], "total": 0, "filters": {"user_id": user_id, "department": department, "range": range, "cached_only": cached_only, "q": q}}
        match["user_id"] = user_id
    if cached_only is True:
        match["cache_hit"] = True
    if q:
        match["message"] = {"$regex": re.escape(q[:80]), "$options": "i"}

    rows = await db.chat_logs.find(
        match,
        {"_id": 0, "id": 1, "user_id": 1, "user_name": 1, "user_role": 1,
         "message": 1, "answer": 1, "tokens_in": 1, "tokens_out": 1,
         "cache_hit": 1, "created_at": 1},
    ).sort("created_at", -1).to_list(min(limit, 500))

    # Enrich rows with department (single company_users cache to avoid N queries)
    users_map = {u["id"]: u for u in await db.users.find(
        {"company_id": user["company_id"]}, {"_id": 0, "id": 1, "department": 1}
    ).to_list(500)}
    for r in rows:
        r["department"] = (users_map.get(r["user_id"], {}) or {}).get("department", "") or ""

    total = await db.chat_logs.count_documents(match)
    return {
        "items": rows,
        "total": total,
        "filters": {"user_id": user_id, "department": department, "range": range, "cached_only": cached_only, "q": q},
    }


@api.get("/admin/chats/summary")
async def admin_chat_summary(user=Depends(require_role("super_admin", "admin")), range: str = "14d"):
    """Counts grouped by department → user, so the UI can render a two-level nav."""
    days_map = {"7d": 7, "14d": 14, "30d": 30}
    days = days_map.get(range)
    match: Dict[str, Any] = {"company_id": user["company_id"]}
    if days is not None:
        since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        match["created_at"] = {"$gte": since}
    pipeline = [
        {"$match": match},
        {"$group": {"_id": "$user_id", "user_name": {"$first": "$user_name"}, "count": {"$sum": 1}}},
    ]
    per_user_rows = await db.chat_logs.aggregate(pipeline).to_list(500)
    users_rows = await db.users.find(
        {"company_id": user["company_id"]}, {"_id": 0, "id": 1, "name": 1, "department": 1, "role": 1}
    ).to_list(500)
    users_by_id = {u["id"]: u for u in users_rows}
    dept_map: Dict[str, Dict[str, Any]] = {}
    for r in per_user_rows:
        uid = r["_id"]
        u = users_by_id.get(uid, {})
        dept = (u.get("department") or "Unassigned").strip() or "Unassigned"
        d = dept_map.setdefault(dept, {"department": dept, "total": 0, "users": []})
        d["total"] += r["count"]
        d["users"].append({
            "id": uid,
            "name": u.get("name") or r.get("user_name") or "?",
            "role": u.get("role", ""),
            "count": r["count"],
        })
    # Also include users with 0 chats so admins can see who's inactive
    for u in users_rows:
        dept = (u.get("department") or "Unassigned").strip() or "Unassigned"
        d = dept_map.setdefault(dept, {"department": dept, "total": 0, "users": []})
        if not any(x["id"] == u["id"] for x in d["users"]):
            d["users"].append({"id": u["id"], "name": u["name"], "role": u.get("role", ""), "count": 0})
    result = list(dept_map.values())
    for d in result:
        d["users"].sort(key=lambda x: (-x["count"], x["name"].lower()))
    result.sort(key=lambda d: (-d["total"], d["department"].lower()))
    return {"departments": result, "range": range}


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
        "key_preview": None,  # SEC hardening: never leak any part of the key
        "slack_webhook_url": s.get("slack_webhook_url") or "",
    }


@api.put("/settings")
async def update_settings(inp: SettingsIn, user=Depends(require_role("super_admin"))):
    upd = {"settings.llm_provider": inp.llm_provider, "settings.llm_model": inp.llm_model}
    if inp.api_key_override is not None:
        upd["settings.api_key_override"] = inp.api_key_override or None
    if inp.slack_webhook_url is not None:
        # SEC-002: reject anything that isn't the official Slack host
        url = (inp.slack_webhook_url or "").strip()
        if url and not _is_valid_slack_webhook(url):
            raise HTTPException(400, "Slack webhook must be https://hooks.slack.com/…")
        upd["settings.slack_webhook_url"] = url or None
    await db.companies.update_one({"id": user["company_id"]}, {"$set": upd})
    return {"ok": True}


# --------- Seed ---------
async def seed_demo():
    # SEC-004: gate demo seed behind an explicit env var so prod tenants never inherit
    # the well-known admin@acme.demo / admin123 credentials. Default 'true' for previews.
    if os.environ.get("SEED_DEMO_DATA", "true").lower() not in ("1", "true", "yes"):
        logger.info("SEED_DEMO_DATA disabled — skipping demo seed")
        return
    company_id = "demo-company"
    existing = await db.companies.find_one({"id": company_id})
    if existing:
        # Company already seeded — still ensure the demo repo tree exists for the tree feature
        await _seed_demo_tree(company_id)
        return
    logger.info("Seeding demo company...")
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
         "blocked": False, "token_version": 0, "department": "",
         "created_at": now_iso()},
        {"id": agent1_id, "email": "alice@acme.demo", "name": "Alice Agent",
         "password_hash": hash_pw("agent123"), "role": "agent",
         "company_id": company_id, "company_name": "Acme CRM Demo",
         "blocked": False, "token_version": 0, "department": "Sales",
         "created_at": now_iso()},
        {"id": agent2_id, "email": "bob@acme.demo", "name": "Bob Agent",
         "password_hash": hash_pw("agent123"), "role": "agent",
         "company_id": company_id, "company_name": "Acme CRM Demo",
         "blocked": False, "token_version": 0, "department": "Support",
         "created_at": now_iso()},
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

    await _seed_demo_tree(company_id)
    logger.info("Seed complete.")


async def _seed_demo_tree(company_id: str):
    """Idempotent — seeds a demo ingested-repo tree + 3 auto-doc so the tree feature is visible."""
    demo_repo = "acme-crm-app"
    if await db.context_trees.find_one({"company_id": company_id, "repo_name": demo_repo}):
        return
    demo_files = [
        {"path": "README.md",                          "size":  1240},
        {"path": "package.json",                       "size":   980},
        {"path": "backend/server.py",                  "size": 12480},
        {"path": "backend/models/lead.py",             "size":  1560},
        {"path": "backend/models/task.py",             "size":  1340},
        {"path": "backend/routes/auth.py",             "size":  2200},
        {"path": "backend/routes/crm.py",              "size":  3100},
        {"path": "backend/routes/chat.py",             "size":  4820},
        {"path": "backend/db.py",                      "size":   870},
        {"path": "frontend/src/App.js",                "size":  1420},
        {"path": "frontend/src/pages/Overview.jsx",    "size":  3480},
        {"path": "frontend/src/pages/CRM.jsx",         "size":  4210},
        {"path": "frontend/src/pages/Analytics.jsx",   "size":  5320},
        {"path": "frontend/src/components/Chat.jsx",   "size":  6100},
        {"path": "frontend/src/lib/api.js",            "size":   640},
        {"path": "frontend/src/lib/auth.js",           "size":   980},
        {"path": "docs/architecture.md",               "size":  2400},
        {"path": "docs/escalation-rules.md",           "size":  1180},
    ]
    tree = _build_tree(demo_files)
    await db.context_trees.update_one(
        {"company_id": company_id, "repo_name": demo_repo},
        {"$set": {
            "id": str(uuid.uuid4()),
            "company_id": company_id,
            "repo_name": demo_repo,
            "tree": tree,
            "file_count": len(demo_files),
            "total_chars": sum(f["size"] for f in demo_files),
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }}, upsert=True,
    )
    demo_docs = [
        ("Architecture",    "dev", "# Architecture\n\nReact + FastAPI + MongoDB. Auth via JWT. Chat streams from Anthropic Claude Sonnet 4.6.\n\n## Main flows\n- Register/Login → JWT (7d)\n- Ask assistant → build system prompt from context docs + scoped CRM → LLM → cache\n- Ingest .md → auto-generate context docs"),
        ("Database Schema","dev", "# Schema\n\n## users\n- id, email (unique), password_hash, name, role (super_admin/admin/agent), company_id, token_limit, token_used, blocked\n\n## leads\n- id, company_id, name, email, phone, status, priority, assigned_to (user_id), notes, last_touched_at\n\n## tasks\n- id, company_id, lead_id, title, priority, due_date, status, assigned_to\n\n## context_docs\n- id, company_id, title, content, kind (dev/product/ideology), source, included, repo_name"),
        ("Module Map",     "dev", "# Modules\n\n- `backend/server.py` — FastAPI app + all routes + LLM integration\n- `backend/routes/auth.py` — JWT register/login/me\n- `backend/routes/crm.py` — leads + tasks CRUD, scoped queries\n- `backend/routes/chat.py` — /chat endpoint with system-prompt build + cache\n- `frontend/src/pages/Overview.jsx` — agent dashboard\n- `frontend/src/pages/CRM.jsx` — leads + tasks tables with filters\n- `frontend/src/pages/Analytics.jsx` — admin metrics + charts\n- `frontend/src/components/Chat.jsx` — floating chat widget with markdown + voice"),
    ]
    for title, kind, content in demo_docs:
        full_title = f"{demo_repo} — {title}"
        doc = {
            "id": str(uuid.uuid4()),
            "company_id": company_id,
            "title": full_title,
            "content": content,
            "kind": kind,
            "created_at": now_iso(),
            "updated_at": now_iso(),
            "source": "auto-ingest",
            "repo_name": demo_repo,
            "included": True,
        }
        await db.context_docs.update_one(
            {"company_id": company_id, "title": full_title},
            {"$set": doc}, upsert=True,
        )


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


# --------- Public: Contact & Waitlist ---------
@api.post("/public/contact")
async def submit_contact(inp: ContactIn):
    doc = {
        "id": str(uuid.uuid4()),
        "name": inp.name,
        "email": inp.email.lower(),
        "company": inp.company or "",
        "message": inp.message,
        "created_at": now_iso(),
        "read": False,
    }
    await db.contact_submissions.insert_one(doc)
    return {"ok": True}


@api.post("/public/waitlist")
async def join_waitlist(inp: WaitlistIn):
    email = inp.email.lower()
    await db.waitlist.update_one(
        {"email": email},
        {"$setOnInsert": {"email": email, "created_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}


@api.post("/public/services-estimate")
async def services_estimate(inp: ServicesEstimateIn):
    doc = {
        "id": str(uuid.uuid4()),
        "email": inp.email.lower(),
        "note": inp.note or "",
        "services": inp.services,
        "created_at": now_iso(),
    }
    await db.services_estimates.insert_one(doc)
    return {"ok": True}


# --------- Public playground chat (no auth, seeded demo tenant) ---------
class PlaygroundIn(BaseModel):
    message: str
    session_id: Optional[str] = None


@api.post("/public/playground")
async def public_playground(inp: PlaygroundIn, request: Request):
    ip = request.client.host if request.client else "unknown"
    # rate-limit: 15 messages / hour / IP
    since = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    count = await db.playground_logs.count_documents({"ip": ip, "created_at": {"$gte": since}})
    if count >= 15:
        raise HTTPException(429, "Playground limit reached (15/hr). Sign up for unlimited access.")

    message = inp.message.strip()
    if not message:
        raise HTTPException(400, "Empty message")
    if len(message) > 500:
        raise HTTPException(400, "Message too long")

    company_id = "demo-company"
    # Impersonate Alice (agent w/ 3 leads) — scope enforced via query
    demo_user = await db.users.find_one({"id": "user-agent-1"}, {"_id": 0})
    if not demo_user:
        raise HTTPException(500, "Demo tenant not seeded")

    context_docs = await db.context_docs.find({"company_id": company_id}, {"_id": 0}).to_list(200)
    leads = await db.leads.find({"company_id": company_id, "assigned_to": demo_user["id"]}, {"_id": 0}).to_list(50)
    tasks = await db.tasks.find({"company_id": company_id, "assigned_to": demo_user["id"]}, {"_id": 0}).to_list(50)
    system_prompt = build_system_prompt(context_docs, demo_user, leads, tasks)

    from emergentintegrations.llm.chat import LlmChat, UserMessage
    session_id = inp.session_id or str(uuid.uuid4())
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"playground-{ip}-{session_id}",
        system_message=system_prompt,
    ).with_model("anthropic", "claude-sonnet-4-6")
    answer = None
    try:
        answer = await chat.send_message(UserMessage(text=message))
    except Exception as e:
        raise HTTPException(500, f"LLM error: {e}")

    tokens = max(1, (len(system_prompt) + len(message) + len(answer)) // 4)
    await db.playground_logs.insert_one({
        "id": str(uuid.uuid4()), "ip": ip, "session_id": session_id,
        "message": message, "answer": answer, "tokens": tokens,
        "created_at": now_iso(),
    })
    remaining = max(0, 15 - count - 1)
    return {"answer": answer, "session_id": session_id, "remaining": remaining}


@api.get("/services/mine")
async def get_services(user=Depends(current_user)):
    c = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    return {"services": (c or {}).get("services", [])}


@api.put("/services/mine")
async def set_services(inp: ServicesIn, user=Depends(require_role("super_admin", "admin"))):
    await db.companies.update_one(
        {"id": user["company_id"]},
        {"$set": {"services": inp.services, "services_updated_at": now_iso()}},
    )
    return {"ok": True}


@api.post("/services/checkout")
async def services_checkout(inp: ServicesIn, user=Depends(require_role("super_admin"))):
    """Records the intended service order. Real Stripe integration is pending."""
    order = {
        "id": str(uuid.uuid4()),
        "company_id": user["company_id"],
        "user_id": user["id"],
        "services": inp.services,
        "status": "pending_payment",
        "created_at": now_iso(),
    }
    await db.service_orders.insert_one(order)
    return {"ok": True, "order_id": order["id"], "status": "pending_payment"}


@api.get("/admin/contact")
async def list_contact(user=Depends(require_role("super_admin", "admin"))):
    # SEC-001: cross-tenant marketing leads — restrict to platform owner only
    if not PLATFORM_OWNER_EMAIL or (user.get("email", "").lower() != PLATFORM_OWNER_EMAIL):
        raise HTTPException(403, "Forbidden")
    docs = await db.contact_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api.get("/admin/waitlist")
async def list_waitlist(user=Depends(require_role("super_admin", "admin"))):
    # SEC-001: cross-tenant marketing leads — restrict to platform owner only
    if not PLATFORM_OWNER_EMAIL or (user.get("email", "").lower() != PLATFORM_OWNER_EMAIL):
        raise HTTPException(403, "Forbidden")
    docs = await db.waitlist.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


# --------- Monthly reset + 80% quota alert ---------
async def maybe_monthly_reset(u: dict):
    """If user's last_reset month != current month, zero their token_used."""
    now = datetime.now(timezone.utc)
    key = f"{now.year}-{now.month:02d}"
    if (u.get("token_reset_month") or "") != key:
        await db.users.update_one(
            {"id": u["id"]},
            {"$set": {"token_used": 0, "token_reset_month": key, "quota_alert_sent": False}},
        )
        u["token_used"] = 0
        u["token_reset_month"] = key
        u["quota_alert_sent"] = False
    return u


async def maybe_quota_alert(u: dict, company_id: str):
    limit = int(u.get("token_limit") or 0)
    used = int(u.get("token_used") or 0)
    if limit <= 0:
        return
    if used >= limit * 0.8 and not u.get("quota_alert_sent"):
        await db.users.update_one({"id": u["id"]}, {"$set": {"quota_alert_sent": True}})
        pct = int((used / limit) * 100)
        await send_slack(
            company_id,
            f":warning: Quota alert — *{u['name']}* is at {pct}% of monthly token cap ({used:,}/{limit:,}).",
        )


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
