"""Login rate limiter — trips at LOGIN_MAX_ATTEMPTS per IP-or-email in a rolling window."""
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Request
from database import db
from config import LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MIN, LOGIN_LOCKOUT_MIN
from helpers import now_iso


def client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()[:64]
    return (request.client.host if request.client else "unknown")[:64]


async def throttle_check(ip: str, email: str):
    since = (datetime.now(timezone.utc) - timedelta(minutes=LOGIN_WINDOW_MIN)).isoformat()
    ip_fails = await db.login_attempts.count_documents({"ip": ip, "success": False, "at": {"$gte": since}})
    email_fails = await db.login_attempts.count_documents({"email": email.lower()[:100], "success": False, "at": {"$gte": since}})
    if ip_fails >= LOGIN_MAX_ATTEMPTS or email_fails >= LOGIN_MAX_ATTEMPTS:
        raise HTTPException(429, f"Too many failed login attempts. Try again in {LOGIN_LOCKOUT_MIN} minutes.")


async def record_attempt(ip: str, email: str, success: bool):
    await db.login_attempts.insert_one({
        "ip": ip, "email": email.lower()[:100], "success": success, "at": now_iso(),
    })
