"""JWT encode/decode. Two token kinds: user (has `sub` + `tv`) and anonymous (has `anon` + `ip`)."""
from datetime import datetime, timezone, timedelta
import jwt
from config import JWT_SECRET, JWT_ALGO, JWT_TTL_HOURS, ANONYMOUS_TTL_MIN


def make_user_token(user_id: str, token_version: int = 0, hours: int = JWT_TTL_HOURS) -> str:
    return jwt.encode({
        "sub": user_id, "tv": token_version, "kind": "user",
        "exp": datetime.now(timezone.utc) + timedelta(hours=hours),
        "iat": datetime.now(timezone.utc),
    }, JWT_SECRET, algorithm=JWT_ALGO)


def make_anonymous_token(ip: str, minutes: int = ANONYMOUS_TTL_MIN) -> str:
    return jwt.encode({
        "anon": True, "ip": ip[:64], "kind": "anon",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=minutes),
        "iat": datetime.now(timezone.utc),
    }, JWT_SECRET, algorithm=JWT_ALGO)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
