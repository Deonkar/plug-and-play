from fastapi import APIRouter
from .auth import router as auth_router
from .users import router as users_router
from .crm import router as crm_router
from .context import router as context_router
from .chat import router as chat_router
from .admin import router as admin_router
from .settings import router as settings_router
from .public import router as public_router


def build_api_router() -> APIRouter:
    api = APIRouter(prefix="/api")
    api.include_router(auth_router)
    api.include_router(users_router)
    api.include_router(crm_router)
    api.include_router(context_router)
    api.include_router(chat_router)
    api.include_router(admin_router)
    api.include_router(settings_router)
    api.include_router(public_router)
    return api
