"""Auth routes: register / login / logout / me / anonymous session."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from database import db
from models import RegisterIn, LoginIn
from auth import (
    hash_pw, verify_pw, make_user_token, make_anonymous_token,
    client_ip, throttle_check, record_attempt,
    current_user, user_to_out,
)
from helpers import now_iso
from services import log_event

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(inp: RegisterIn, request: Request):
    email = inp.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    company_id = str(uuid.uuid4())
    await db.companies.insert_one({
        "id": company_id, "name": inp.company_name, "created_at": now_iso(),
        "settings": {"llm_provider": "anthropic", "llm_model": "claude-sonnet-4-6"},
    })
    uid = str(uuid.uuid4())
    doc = {
        "id": uid, "email": email, "name": inp.name,
        "password_hash": hash_pw(inp.password), "role": "super_admin",
        "company_id": company_id, "company_name": inp.company_name,
        "blocked": False, "token_version": 0, "department": "",
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    await log_event("user.registered", company_id=company_id, actor_id=uid, actor_name=inp.name,
                    meta={"email": email, "company": inp.company_name})
    return {"token": make_user_token(uid, 0), "user": user_to_out(doc)}


@router.post("/login")
async def login(inp: LoginIn, request: Request):
    ip = client_ip(request)
    await throttle_check(ip, inp.email)
    email = inp.email.lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_pw(inp.password, user["password_hash"]):
        await record_attempt(ip, email, False)
        await log_event("user.login_failed", meta={"email": email, "ip": ip}, level="warn")
        raise HTTPException(401, "Invalid credentials")
    if user.get("blocked"):
        await record_attempt(ip, email, False)
        raise HTTPException(403, "User is blocked")
    await record_attempt(ip, email, True)
    await log_event("user.login", company_id=user["company_id"], actor_id=user["id"],
                    actor_name=user["name"], meta={"ip": ip})
    return {"token": make_user_token(user["id"], user.get("token_version", 0)), "user": user_to_out(user)}


@router.post("/logout")
async def logout(user=Depends(current_user)):
    await db.users.update_one({"id": user["id"]}, {"$inc": {"token_version": 1}})
    await log_event("user.logout", company_id=user["company_id"], actor_id=user["id"], actor_name=user["name"])
    return {"ok": True}


@router.get("/me")
async def me(user=Depends(current_user)):
    return user_to_out(user)
