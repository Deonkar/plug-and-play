"""Central configuration — all env vars in one place. Fail-fast on missing required keys."""
from pathlib import Path
from dotenv import load_dotenv
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# Required — fail loudly if missing
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]

# Optional / with defaults
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
PLATFORM_OWNER_EMAIL = os.environ.get("PLATFORM_OWNER_EMAIL", "").strip().lower()
SEED_DEMO_DATA = os.environ.get("SEED_DEMO_DATA", "true").lower() in ("1", "true", "yes")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@acme.demo")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

# Auth
JWT_ALGO = "HS256"
JWT_TTL_HOURS = 24 * 7
ANONYMOUS_TTL_MIN = 30
LOGIN_MAX_ATTEMPTS = 5
LOGIN_WINDOW_MIN = 10
LOGIN_LOCKOUT_MIN = 15

# Rate limits
PLAYGROUND_HOURLY_LIMIT = 15

# Queue
QUEUE_WORKERS = int(os.environ.get("QUEUE_WORKERS", "2"))

# Event retention
EVENT_LOG_RETENTION_DAYS = int(os.environ.get("EVENT_LOG_RETENTION_DAYS", "90"))
