"""Context docs + ingested repo trees."""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from database import db
from models import ContextDocIn, ContextToggleIn, TreeNodeToggleIn, IngestIn
from auth import current_user, require_role
from helpers import (
    now_iso, build_tree, walk_nodes, apply_inclusion_flags, tree_diff,
    tree_included_paths, tree_included_chars, toggle_node_in_tree, enrich_tree_with_docs,
)
from services import log_event, enqueue, get_llm_provider_settings

router = APIRouter(prefix="/context", tags=["context"])

MAX_UPLOAD_FILES = 50
MAX_UPLOAD_BYTES = 2 * 1024 * 1024


@router.get("")
async def list_context(user=Depends(require_role("super_admin", "admin"))):
    return await db.context_docs.find({"company_id": user["company_id"]}, {"_id": 0}).sort("updated_at", -1).to_list(200)


@router.post("")
async def create_doc(inp: ContextDocIn, user=Depends(require_role("super_admin", "admin"))):
    doc = {**inp.model_dump(), "id": str(uuid.uuid4()), "company_id": user["company_id"],
           "created_at": now_iso(), "updated_at": now_iso(), "source": "manual", "included": True}
    await db.context_docs.insert_one(doc); doc.pop("_id", None)
    await log_event("context.doc_created", company_id=user["company_id"], actor_id=user["id"],
                    actor_name=user["name"], meta={"doc_id": doc["id"], "title": doc["title"]})
    return doc


@router.put("/{doc_id}")
async def update_doc(doc_id: str, inp: ContextDocIn, user=Depends(require_role("super_admin", "admin"))):
    upd = {**inp.model_dump(), "updated_at": now_iso()}
    r = await db.context_docs.update_one({"id": doc_id, "company_id": user["company_id"]}, {"$set": upd})
    if r.matched_count == 0: raise HTTPException(404, "Not found")
    await log_event("context.doc_updated", company_id=user["company_id"], actor_id=user["id"],
                    actor_name=user["name"], meta={"doc_id": doc_id})
    return {"ok": True}


@router.delete("/{doc_id}")
async def delete_doc(doc_id: str, user=Depends(require_role("super_admin", "admin"))):
    await db.context_docs.delete_one({"id": doc_id, "company_id": user["company_id"]})
    await log_event("context.doc_deleted", company_id=user["company_id"], actor_id=user["id"],
                    actor_name=user["name"], meta={"doc_id": doc_id})
    return {"ok": True}


@router.patch("/{doc_id}/toggle")
async def toggle_context(doc_id: str, inp: ContextToggleIn, user=Depends(require_role("super_admin", "admin"))):
    r = await db.context_docs.update_one(
        {"id": doc_id, "company_id": user["company_id"]},
        {"$set": {"included": bool(inp.included), "updated_at": now_iso()}},
    )
    if r.matched_count == 0: raise HTTPException(404, "Not found")
    await log_event("context.doc_toggled", company_id=user["company_id"], actor_id=user["id"],
                    actor_name=user["name"], meta={"doc_id": doc_id, "included": bool(inp.included)})
    return {"ok": True, "included": bool(inp.included)}


@router.post("/upload")
async def upload_context_files(files: List[UploadFile] = File(...),
                               user=Depends(require_role("super_admin", "admin"))):
    if len(files) > MAX_UPLOAD_FILES:
        raise HTTPException(413, f"Too many files (max {MAX_UPLOAD_FILES})")
    created = []
    for f in files:
        raw = await f.read()
        if len(raw) > MAX_UPLOAD_BYTES:
            raise HTTPException(413, f"'{f.filename}' exceeds 2 MB limit")
        try: content = raw.decode("utf-8")
        except UnicodeDecodeError: continue
        if not content.strip(): continue
        title = (f.filename or "Untitled.md").rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()
        low = (f.filename or "").lower()
        kind = "dev" if any(x in low for x in ["dev", "arch", "code", "schema", "backend", "api"]) \
               else "product" if any(x in low for x in ["product", "prd", "spec"]) \
               else "ideology" if any(x in low for x in ["ideology", "vision", "brand"]) \
               else "general"
        doc = {"id": str(uuid.uuid4()), "company_id": user["company_id"], "title": title,
               "content": content, "kind": kind, "created_at": now_iso(), "updated_at": now_iso(),
               "source": "upload", "included": True}
        await db.context_docs.insert_one(doc); doc.pop("_id", None)
        created.append(doc)
    await log_event("context.files_uploaded", company_id=user["company_id"], actor_id=user["id"],
                    actor_name=user["name"], meta={"count": len(created)})
    return {"created": len(created), "docs": created}


# --- Trees ---
@router.get("/trees")
async def list_trees(user=Depends(require_role("super_admin", "admin"))):
    trees = await db.context_trees.find({"company_id": user["company_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return [await enrich_tree_with_docs(user["company_id"], t) for t in trees]


@router.get("/trees/{repo_name}")
async def get_tree(repo_name: str, user=Depends(require_role("super_admin", "admin"))):
    t = await db.context_trees.find_one({"company_id": user["company_id"], "repo_name": repo_name}, {"_id": 0})
    if not t: raise HTTPException(404, "Repo not found")
    return await enrich_tree_with_docs(user["company_id"], t)


@router.patch("/trees/{repo_name}/toggle")
async def toggle_tree_node(repo_name: str, inp: TreeNodeToggleIn, user=Depends(require_role("super_admin", "admin"))):
    t = await db.context_trees.find_one({"company_id": user["company_id"], "repo_name": repo_name}, {"_id": 0})
    if not t: raise HTTPException(404, "Repo not found")
    tree = t.get("tree") or {}
    if not toggle_node_in_tree(tree, inp.path, inp.included, inp.cascade):
        raise HTTPException(404, "Path not in tree")
    await db.context_trees.update_one(
        {"company_id": user["company_id"], "repo_name": repo_name},
        {"$set": {"tree": tree, "updated_at": now_iso()}},
    )
    await log_event("context.tree_toggled", company_id=user["company_id"], actor_id=user["id"],
                    actor_name=user["name"], meta={"repo": repo_name, "path": inp.path, "included": inp.included})
    return {"ok": True, "included_chars": tree_included_chars(tree),
            "included_files": len(tree_included_paths(tree))}


@router.delete("/trees/{repo_name}")
async def delete_tree(repo_name: str, user=Depends(require_role("super_admin", "admin"))):
    r = await db.context_trees.delete_one({"company_id": user["company_id"], "repo_name": repo_name})
    if r.deleted_count == 0: raise HTTPException(404, "Repo not found")
    await db.context_docs.delete_many({"company_id": user["company_id"], "repo_name": repo_name, "source": "auto-ingest"})
    await log_event("context.tree_deleted", company_id=user["company_id"], actor_id=user["id"],
                    actor_name=user["name"], meta={"repo": repo_name})
    return {"ok": True}


@router.post("/ingest")
async def ingest_codebase(inp: IngestIn, user=Depends(require_role("super_admin", "admin"))):
    if not inp.files: raise HTTPException(400, "No files provided")
    new_paths = [{"path": f.path, "size": len(f.content)} for f in inp.files]
    new_tree = build_tree(new_paths)

    prev = await db.context_trees.find_one({"company_id": user["company_id"], "repo_name": inp.repo_name}, {"_id": 0})
    diff = {"added": [], "removed": [], "changed": []}
    if prev and prev.get("tree"):
        prev_map: dict = {}
        def coll(n):
            if n["kind"] == "file": prev_map[n["path"]] = n.get("size", 0)
        walk_nodes(prev["tree"], coll)
        diff = tree_diff(prev_map, {f.path: len(f.content) for f in inp.files})
        new_tree = apply_inclusion_flags(new_tree, prev["tree"])

    included_paths = set(tree_included_paths(new_tree))
    files_to_feed = [f for f in inp.files if f.path in included_paths] if prev else inp.files
    if not files_to_feed:
        raise HTTPException(400, "All files are excluded — include at least one file")

    MAX_TOTAL = 60000
    used = 0
    parts = [f"# Repository: {inp.repo_name}", "", "## File tree"]
    for f in files_to_feed: parts.append(f"- {f.path} ({len(f.content)} chars)")
    parts.append(""); parts.append("## File contents")
    for f in files_to_feed:
        header = f"\n### {f.path}\n"
        remaining = MAX_TOTAL - used - len(header)
        if remaining <= 0:
            parts.append(f"\n### {f.path}\n(truncated)"); continue
        parts.append(header + f.content[:remaining])
        used += len(header) + min(remaining, len(f.content))
    repo_dump = "\n".join(parts)

    provider, model, api_key = await get_llm_provider_settings(user["company_id"])
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    system = ("You are a senior engineer ingesting a codebase for a company chatbot. "
              "Given a repo dump (file tree + contents), output THREE Markdown documents delimited exactly by these headers: "
              "'===DOC:ARCHITECTURE===', '===DOC:SCHEMA===', '===DOC:MODULES==='. "
              "ARCHITECTURE: high-level system, tech stack, main flows. "
              "SCHEMA: every database table/collection with fields and relationships. "
              "MODULES: for each significant file/module, one bullet 'path — what it does'. Be concise, factual, technical.")
    chat = LlmChat(api_key=api_key, session_id=f"ingest-{user['company_id']}-{uuid.uuid4()}",
                   system_message=system).with_model(provider, model)
    try:
        summary = await chat.send_message(UserMessage(text=repo_dump))
    except Exception:
        from logger import logger
        logger.exception("LLM ingest error")
        raise HTTPException(500, "LLM ingest error")

    def extract(marker):
        if marker not in summary: return ""
        after = summary.split(marker, 1)[1]
        for other in ("===DOC:ARCHITECTURE===", "===DOC:SCHEMA===", "===DOC:MODULES==="):
            if other != marker and other in after: after = after.split(other, 1)[0]
        return after.strip()

    sections = {"Architecture": extract("===DOC:ARCHITECTURE==="),
                "Database Schema": extract("===DOC:SCHEMA==="),
                "Module Map": extract("===DOC:MODULES===")}
    created = []
    for title, content in sections.items():
        if not content: continue
        title_full = f"{inp.repo_name} — {title}"
        existing = await db.context_docs.find_one(
            {"company_id": user["company_id"], "title": title_full}, {"included": 1})
        doc = {"id": str(uuid.uuid4()), "company_id": user["company_id"], "title": title_full,
               "content": content, "kind": "dev", "created_at": now_iso(), "updated_at": now_iso(),
               "source": "auto-ingest", "repo_name": inp.repo_name,
               "included": (existing or {}).get("included", True)}
        await db.context_docs.update_one({"company_id": user["company_id"], "title": title_full},
                                         {"$set": doc}, upsert=True)
        doc.pop("_id", None); created.append(doc)

    total_chars = sum(len(f.content) for f in inp.files)
    await db.context_trees.update_one(
        {"company_id": user["company_id"], "repo_name": inp.repo_name},
        {"$set": {"id": (prev or {}).get("id", str(uuid.uuid4())), "company_id": user["company_id"],
                  "repo_name": inp.repo_name, "tree": new_tree, "file_count": len(inp.files),
                  "total_chars": total_chars, "last_diff": diff,
                  "created_at": (prev or {}).get("created_at", now_iso()), "updated_at": now_iso()}},
        upsert=True,
    )
    await log_event("context.ingested", company_id=user["company_id"], actor_id=user["id"],
                    actor_name=user["name"],
                    meta={"repo": inp.repo_name, "files": len(inp.files),
                          "added": len(diff["added"]), "removed": len(diff["removed"]),
                          "changed": len(diff["changed"])})
    return {"created": len(created), "docs": created, "file_count": len(inp.files),
            "total_chars": total_chars, "diff": diff, "reingest": bool(prev)}
