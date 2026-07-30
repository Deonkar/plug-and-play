"""FastAPI auth dependencies — current_user, require_role, current_anonymous."""
import jwt
from fastapi import Depends, HTTPException, Request
from typing import Optional
from database import db
from .jwt_utils import decode_token
from .throttle import client_ip


def _extract_token(request: Request) -> Optional[str]:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return request.cookies.get("access_token")


async def current_user(request: Request) -> dict:
    """Full authenticated user. Rejects anonymous tokens."""
    token = _extract_token(request)
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    if payload.get("kind") == "anon":
        raise HTTPException(401, "Anonymous token cannot access this endpoint")
    user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0})
    if not user:
        raise HTTPException(401, "User not found")
    if user.get("blocked"):
        raise HTTPException(403, "User is blocked")
    if payload.get("tv", 0) != user.get("token_version", 0):
        raise HTTPException(401, "Token revoked — please sign in again")
    return user


async def current_anonymous(request: Request) -> dict:
    """Accepts an anonymous OR user token. Returns {kind, ip, user?} — used on /public/* endpoints."""
    token = _extract_token(request)
    if not token:
        raise HTTPException(401, "Anonymous session required — call POST /public/session first")
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Session expired — refresh and try again")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid session token")
    ip = client_ip(request)
    if payload.get("kind") == "anon":
        # Bind anonymous token to originating IP to reduce token-passing abuse
        if payload.get("ip") and payload["ip"] != ip:
            raise HTTPException(401, "Session bound to a different network")
        return {"kind": "anon", "ip": ip}
    # Fall through to full user validation
    user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0})
    if user and not user.get("blocked") and payload.get("tv", 0) == user.get("token_version", 0):
        return {"kind": "user", "ip": ip, "user": user}
    raise HTTPException(401, "Invalid session")


def require_role(*roles):
    async def dep(user=Depends(current_user)):
        if user["role"] not in roles:
            raise HTTPException(403, f"Requires role: {roles}")
        return user
    return dep


def user_to_out(u: dict) -> dict:
    return {
        "id": u["id"], "email": u["email"], "name": u["name"], "role": u["role"],
        "company_id": u["company_id"], "company_name": u.get("company_name", ""),
        "blocked": u.get("blocked", False),
        "token_limit": u.get("token_limit", 0),
        "token_used":  u.get("token_used", 0),
        "department": u.get("department", ""),
    }
