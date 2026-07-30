"""Company settings (super_admin only)."""
from fastapi import APIRouter, Depends, HTTPException
from database import db
from models import SettingsIn
from auth import require_role
from services import is_valid_slack_webhook, log_event

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("")
async def get_settings(user=Depends(require_role("super_admin", "admin"))):
    c = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    if not c: raise HTTPException(404, "Company not found")
    s = c.get("settings", {}) or {}
    override = s.get("api_key_override") or ""
    return {
        "llm_provider": s.get("llm_provider", "anthropic"),
        "llm_model": s.get("llm_model", "claude-sonnet-4-6"),
        "has_custom_key": bool(override),
        "key_preview": None,
        "slack_webhook_url": s.get("slack_webhook_url") or "",
    }


@router.put("")
async def update_settings(inp: SettingsIn, user=Depends(require_role("super_admin"))):
    upd = {"settings.llm_provider": inp.llm_provider, "settings.llm_model": inp.llm_model}
    if inp.api_key_override is not None:
        upd["settings.api_key_override"] = inp.api_key_override or None
    if inp.slack_webhook_url is not None:
        url = (inp.slack_webhook_url or "").strip()
        if url and not is_valid_slack_webhook(url):
            raise HTTPException(400, "Slack webhook must be https://hooks.slack.com/…")
        upd["settings.slack_webhook_url"] = url or None
    await db.companies.update_one({"id": user["company_id"]}, {"$set": upd})
    await log_event("settings.updated", company_id=user["company_id"], actor_id=user["id"],
                    actor_name=user["name"],
                    meta={"provider": inp.llm_provider, "model": inp.llm_model,
                          "slack_set": bool(inp.slack_webhook_url)})
    return {"ok": True}
