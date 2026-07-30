"""FastAPI app entry — just wiring. All business logic lives in routes/, services/, helpers/."""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS, EVENT_LOG_RETENTION_DAYS
from database import db
from logger import logger
from routes import build_api_router
from seed import seed_demo
from services import start_workers, stop_workers, enqueue_periodic, prune_old_events


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    logger.info("Company/OS booting…")
    await db.users.create_index("email", unique=True)
    await db.users.create_index("company_id")
    await db.leads.create_index("company_id")
    await db.tasks.create_index("company_id")
    await db.chat_logs.create_index("company_id")
    await db.chat_cache.create_index("key", unique=True)
    await db.event_logs.create_index([("company_id", 1), ("at", -1)])
    await db.login_attempts.create_index([("ip", 1), ("at", -1)])
    await db.login_attempts.create_index([("email", 1), ("at", -1)])

    await seed_demo()
    await start_workers()
    # nightly maintenance: prune old event logs
    await enqueue_periodic(prune_old_events, 24 * 3600, EVENT_LOG_RETENTION_DAYS)
    logger.info("Company/OS ready.")
    yield
    # shutdown
    await stop_workers()
    logger.info("Company/OS stopped.")


app = FastAPI(title="Company/OS", lifespan=lifespan)
app.include_router(build_api_router())

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"ok": True, "service": "company-os"}
