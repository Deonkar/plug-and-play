"""Slack webhook — validated host + host-locked to prevent SSRF."""
from urllib.parse import urlparse
from database import db
from logger import logger


def is_valid_slack_webhook(url: str) -> bool:
    try:
        u = urlparse(url or "")
        return u.scheme == "https" and u.hostname == "hooks.slack.com"
    except Exception:
        return False


async def send_slack(company_id: str, text: str):
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    url = ((company or {}).get("settings") or {}).get("slack_webhook_url")
    if not url:
        return
    if not is_valid_slack_webhook(url):
        logger.warning("Rejected slack webhook (not hooks.slack.com host)")
        return
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5) as hc:
            await hc.post(url, json={"text": text})
    except Exception as e:
        logger.warning(f"Slack send failed: {e}")
