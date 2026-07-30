"""Anonymous session issuance + rate-limited public forms (playground, contact, waitlist, estimate)."""
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from database import db
from models import ContactIn, WaitlistIn, ServicesEstimateIn, PublicChatIn
from auth import current_anonymous, make_anonymous_token, client_ip
from helpers import now_iso
from config import PLAYGROUND_HOURLY_LIMIT, EMERGENT_LLM_KEY
from services import log_event, enqueue, send_slack

router = APIRouter(prefix="/public", tags=["public"])


@router.post("/session")
async def issue_anonymous_session(request: Request):
    """Anyone on the marketing site calls this once on load to get a short-lived JWT.
    IP-bound; required on every subsequent /public/* call."""
    ip = client_ip(request)
    await log_event("public.session_issued", meta={"ip": ip})
    return {"token": make_anonymous_token(ip), "ttl_min": 30}


@router.post("/playground")
async def playground_chat(inp: PublicChatIn, request: Request, ctx=Depends(current_anonymous)):
    ip = ctx["ip"]
    since = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    used = await db.playground_logs.count_documents({"ip": ip, "at": {"$gte": since}})
    if used >= PLAYGROUND_HOURLY_LIMIT:
        raise HTTPException(429, f"Playground limit reached ({PLAYGROUND_HOURLY_LIMIT}/hr). Sign up for unlimited.")

    system = ("You are Company/OS's public playground assistant — helping a curious visitor understand what "
              "the product does. Answer briefly and conversationally. If asked about specific CRM data, say "
              "you can't see any (this is a public demo) and suggest signing up to try with real data. "
              "Keep replies under ~80 words.")
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    session_id = inp.session_id or str(uuid.uuid4())
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"playground-{ip}-{session_id}",
                   system_message=system).with_model("anthropic", "claude-sonnet-4-6")
    try:
        answer = await chat.send_message(UserMessage(text=inp.message))
    except Exception:
        from logger import logger
        logger.exception("Playground LLM error")
        raise HTTPException(500, "LLM error")

    await db.playground_logs.insert_one({
        "ip": ip, "session_id": session_id, "message": inp.message[:400],
        "answer": (answer or "")[:2000], "at": now_iso(),
    })
    await log_event("public.playground_used", meta={"ip": ip})
    return {"answer": answer, "session_id": session_id,
            "remaining": max(0, PLAYGROUND_HOURLY_LIMIT - used - 1)}


@router.post("/contact")
async def submit_contact(inp: ContactIn, request: Request, ctx=Depends(current_anonymous)):
    doc = {"id": str(uuid.uuid4()), **inp.model_dump(), "ip": ctx["ip"], "created_at": now_iso()}
    await db.contact_submissions.insert_one(doc); doc.pop("_id", None)
    await log_event("public.contact_submitted", meta={"email": inp.email, "ip": ctx["ip"]})
    return {"ok": True}


@router.post("/waitlist")
async def waitlist(inp: WaitlistIn, request: Request, ctx=Depends(current_anonymous)):
    doc = {"id": str(uuid.uuid4()), **inp.model_dump(), "ip": ctx["ip"], "created_at": now_iso()}
    await db.waitlist.insert_one(doc); doc.pop("_id", None)
    await log_event("public.waitlist_joined", meta={"email": inp.email, "ip": ctx["ip"]})
    return {"ok": True}


@router.post("/services-estimate")
async def services_estimate(inp: ServicesEstimateIn, request: Request, ctx=Depends(current_anonymous)):
    doc = {"id": str(uuid.uuid4()), **inp.model_dump(), "ip": ctx["ip"], "created_at": now_iso()}
    await db.services_estimates.insert_one(doc); doc.pop("_id", None)
    await log_event("public.estimate_submitted", meta={"email": inp.email, "services": inp.services})
    return {"ok": True}
