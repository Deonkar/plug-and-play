"""Chat endpoint + voice transcription + personal overview + escalations."""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from database import db
from models import ChatIn
from auth import current_user, require_role
from config import EMERGENT_LLM_KEY
from helpers import (
    now_iso, is_lead_escalated, is_task_escalated,
)
from services import (
    log_event, enqueue, send_slack, build_system_prompt, cache_key, get_llm_provider_settings,
)
from logger import logger

router = APIRouter(tags=["chat"])


@router.post("/chat")
async def chat(inp: ChatIn, user=Depends(current_user)):
    if user.get("token_limit", 0) > 0 and user.get("token_used", 0) >= user["token_limit"]:
        raise HTTPException(429, "Monthly token quota exhausted — ask an admin to raise your limit.")

    ckey = cache_key(user["company_id"], user["role"], user["id"], inp.message)
    hit = await db.chat_cache.find_one({"key": ckey}, {"_id": 0})
    if hit and (datetime.now(timezone.utc) - datetime.fromisoformat(hit["cached_at"])) < timedelta(hours=1):
        answer = hit["answer"]
        await db.chat_logs.insert_one({
            "id": str(uuid.uuid4()), "company_id": user["company_id"], "user_id": user["id"],
            "user_name": user["name"], "user_role": user["role"], "message": inp.message,
            "answer": answer, "tokens_in": 0, "tokens_out": 0, "cache_hit": True, "created_at": now_iso(),
        })
        return {"answer": answer, "cache_hit": True, "session_id": inp.session_id or str(uuid.uuid4())}

    context_docs = await db.context_docs.find({"company_id": user["company_id"]}, {"_id": 0}).to_list(50)
    lead_q: Dict[str, Any] = {"company_id": user["company_id"]}
    task_q: Dict[str, Any] = {"company_id": user["company_id"]}
    if user["role"] == "agent":
        lead_q["assigned_to"] = user["id"]; task_q["assigned_to"] = user["id"]
    leads = await db.leads.find(lead_q, {"_id": 0}).to_list(200)
    tasks = await db.tasks.find(task_q, {"_id": 0}).to_list(200)

    system = build_system_prompt(context_docs, user, leads, tasks)
    provider, model, api_key = await get_llm_provider_settings(user["company_id"])

    from emergentintegrations.llm.chat import LlmChat, UserMessage
    session_id = inp.session_id or str(uuid.uuid4())
    chat_client = LlmChat(api_key=api_key, session_id=f"{user['id']}-{session_id}", system_message=system).with_model(provider, model)
    try:
        answer = await chat_client.send_message(UserMessage(text=inp.message))
    except Exception:
        logger.exception("LLM chat error")
        raise HTTPException(500, "LLM error")

    tokens_in = max(1, len(inp.message) // 4)
    tokens_out = max(1, len(answer) // 4)
    await db.users.update_one({"id": user["id"]}, {"$inc": {"token_used": tokens_in + tokens_out}})
    await db.chat_cache.update_one({"key": ckey}, {"$set": {"key": ckey, "answer": answer, "cached_at": now_iso()}}, upsert=True)
    await db.chat_logs.insert_one({
        "id": str(uuid.uuid4()), "company_id": user["company_id"], "user_id": user["id"],
        "user_name": user["name"], "user_role": user["role"], "message": inp.message,
        "answer": answer, "tokens_in": tokens_in, "tokens_out": tokens_out,
        "cache_hit": False, "created_at": now_iso(),
    })
    await log_event("chat.sent", company_id=user["company_id"], actor_id=user["id"], actor_name=user["name"],
                    meta={"tokens_in": tokens_in, "tokens_out": tokens_out})
    return {"answer": answer, "cache_hit": False, "session_id": session_id,
            "tokens_in": tokens_in, "tokens_out": tokens_out}


@router.post("/voice/transcribe")
async def voice_transcribe(file: UploadFile = File(...), user=Depends(current_user)):
    """Emergent Universal Key → Whisper-1."""
    import os, tempfile
    raw = await file.read()
    if len(raw) > 25 * 1024 * 1024:
        raise HTTPException(413, "Audio file too large (25MB max)")
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".webm")
    tmp.write(raw); tmp.close()
    try:
        from emergentintegrations.llm.openai.stt import OpenAIWhisperSTT
        stt = OpenAIWhisperSTT(api_key=EMERGENT_LLM_KEY)
        text = await stt.transcribe_audio(tmp.name)
        return {"text": text}
    except Exception:
        logger.exception("Voice transcribe error")
        raise HTTPException(500, "Transcribe error")
    finally:
        try: os.unlink(tmp.name)
        except Exception: pass


@router.get("/escalations")
async def get_escalations(user=Depends(current_user)):
    lead_q: Dict[str, Any] = {"company_id": user["company_id"]}
    task_q: Dict[str, Any] = {"company_id": user["company_id"]}
    if user["role"] == "agent":
        lead_q["assigned_to"] = user["id"]; task_q["assigned_to"] = user["id"]
    leads = await db.leads.find(lead_q, {"_id": 0}).to_list(500)
    tasks = await db.tasks.find(task_q, {"_id": 0}).to_list(500)
    esc_leads = [l for l in leads if is_lead_escalated(l)]
    esc_tasks = [t for t in tasks if is_task_escalated(t)]

    # Fire slack pings once per task/lead per day — dispatched to the queue so the caller isn't blocked
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for t in esc_tasks:
        key = f"task:{t['id']}:{today}"
        if not await db.slack_sent.find_one({"key": key}):
            await db.slack_sent.insert_one({"key": key, "company_id": user["company_id"], "sent_at": now_iso()})
            await enqueue(send_slack, user["company_id"],
                          f":rotating_light: Escalation — task *{t['title']}* is overdue and marked urgent.")
            await log_event("task.escalated", company_id=user["company_id"], meta={"task_id": t["id"]})
    for l in esc_leads:
        key = f"lead:{l['id']}:{today}"
        if not await db.slack_sent.find_one({"key": key}):
            await db.slack_sent.insert_one({"key": key, "company_id": user["company_id"], "sent_at": now_iso()})
            await enqueue(send_slack, user["company_id"],
                          f":warning: Escalation — hot lead *{l['name']}* untouched in 48h.")
            await log_event("lead.escalated", company_id=user["company_id"], meta={"lead_id": l["id"]})
    return {"tasks": esc_tasks, "leads": esc_leads, "total": len(esc_tasks) + len(esc_leads)}


@router.get("/overview")
async def personal_overview(user=Depends(current_user)):
    cid = user["company_id"]
    now_s = now_iso()
    lead_q: Dict[str, Any] = {"company_id": cid}
    task_q: Dict[str, Any] = {"company_id": cid}
    if user["role"] == "agent":
        lead_q["assigned_to"] = user["id"]; task_q["assigned_to"] = user["id"]
    leads = await db.leads.find(lead_q, {"_id": 0}).to_list(500)
    tasks = await db.tasks.find(task_q, {"_id": 0}).to_list(500)

    open_tasks = [t for t in tasks if t.get("status") != "done"]
    urgent = [t for t in open_tasks if t.get("priority") == "urgent"]
    overdue = [t for t in open_tasks if (t.get("due_date") or "") < now_s]
    hot_leads = [l for l in leads if l.get("status") == "hot"]
    stale_hot = [l for l in hot_leads if is_lead_escalated(l)]
    escalated_t = [t for t in urgent if is_task_escalated(t)]

    stages = ["new", "qualified", "proposal", "negotiation", "hot", "closed", "lost"]
    funnel = [{"stage": s, "count": sum(1 for l in leads if l.get("status") == s)} for s in stages]
    funnel = [f for f in funnel if f["count"] > 0]
    priority_mix = [{"priority": p, "count": sum(1 for t in open_tasks if t.get("priority") == p)}
                    for p in ["urgent", "high", "medium", "low"]]
    priority_mix = [x for x in priority_mix if x["count"] > 0]

    attention: List[Dict[str, Any]] = []
    for t in escalated_t:
        attention.append({"type": "task_escalated", "id": t["id"], "title": t["title"],
                          "priority": t.get("priority", ""), "when": t.get("due_date", ""),
                          "meta": {"lead_id": t.get("lead_id"), "status": t.get("status")}})
    for t in overdue:
        if t in escalated_t: continue
        attention.append({"type": "task_overdue", "id": t["id"], "title": t["title"],
                          "priority": t.get("priority", ""), "when": t.get("due_date", ""),
                          "meta": {"lead_id": t.get("lead_id"), "status": t.get("status")}})
    for l in stale_hot:
        attention.append({"type": "lead_stale", "id": l["id"], "title": l["name"],
                          "priority": l.get("priority", "high"),
                          "when": l.get("last_touched_at") or l.get("created_at", ""),
                          "meta": {"status": l.get("status"), "email": l.get("email")}})
    attention.sort(key=lambda x: x.get("when") or "")

    chat_recent = await db.chat_logs.find(
        {"company_id": cid, **({"user_id": user["id"]} if user["role"] == "agent" else {})},
        {"_id": 0, "message": 1, "user_name": 1, "created_at": 1, "cache_hit": 1},
    ).sort("created_at", -1).to_list(6)
    activity = [{"type": "chat", "title": (c["message"] or "")[:90],
                 "meta": {"user": c.get("user_name"), "cache_hit": c.get("cache_hit", False)},
                 "when": c.get("created_at", "")} for c in chat_recent]

    me = await db.users.find_one({"id": user["id"]}, {"_id": 0}) or {}
    return {
        "kpis": {
            "open_tasks": len(open_tasks), "urgent_tasks": len(urgent),
            "overdue": len(overdue), "hot_leads": len(hot_leads),
            "stale_hot": len(stale_hot), "leads_total": len(leads),
        },
        "quota": {"used": me.get("token_used", 0), "limit": me.get("token_limit", 0)},
        "attention": attention[:12], "funnel": funnel,
        "priority_mix": priority_mix, "activity": activity[:8],
    }
