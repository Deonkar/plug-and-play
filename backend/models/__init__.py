"""Pydantic input models. Grouped by domain."""
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, EmailStr


# --- Auth ---
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    company_name: str

class LoginIn(BaseModel):
    email: str
    password: str


# --- Users ---
class InviteUserIn(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: Literal["admin", "agent"]
    department: str = ""

class BlockIn(BaseModel):
    blocked: bool

class LimitIn(BaseModel):
    token_limit: int  # 0 = unlimited

class DepartmentIn(BaseModel):
    department: str


# --- CRM ---
class LeadIn(BaseModel):
    name: str
    email: str
    phone: str = ""
    status: str = "new"
    priority: str = "medium"
    assigned_to: Optional[str] = None
    notes: str = ""
    custom_fields: Dict[str, Any] = {}

class TaskIn(BaseModel):
    lead_id: str
    title: str
    description: str = ""
    priority: str = "medium"
    due_date: str
    status: str = "open"
    assigned_to: str
    custom_fields: Dict[str, Any] = {}


# --- Context ---
class ContextDocIn(BaseModel):
    title: str
    content: str
    kind: str = "general"

class ContextToggleIn(BaseModel):
    included: bool

class TreeNodeToggleIn(BaseModel):
    path: str
    included: bool
    cascade: bool = True

class IngestFile(BaseModel):
    path: str
    content: str

class IngestIn(BaseModel):
    repo_name: str
    files: List[IngestFile]


# --- Chat ---
class ChatIn(BaseModel):
    message: str
    stream: bool = False
    session_id: Optional[str] = None

class PublicChatIn(BaseModel):
    message: str
    session_id: Optional[str] = None


# --- Settings ---
class SettingsIn(BaseModel):
    llm_provider: str = "anthropic"
    llm_model: str = "claude-sonnet-4-6"
    api_key_override: Optional[str] = None
    slack_webhook_url: Optional[str] = None


# --- Public forms ---
class ContactIn(BaseModel):
    name: str
    email: EmailStr
    company: str = ""
    message: str

class WaitlistIn(BaseModel):
    email: EmailStr
    name: str = ""
    company: str = ""
    role: str = ""

class ServicesEstimateIn(BaseModel):
    email: EmailStr
    company: str = ""
    services: List[str] = []
    notes: str = ""
