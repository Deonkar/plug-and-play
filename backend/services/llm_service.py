"""LLM prompt-building + chat cache key. Also the raw LlmChat call sites."""
import hashlib
from typing import List
from config import EMERGENT_LLM_KEY
from database import db


def build_system_prompt(context_docs: List[dict], user: dict, leads: List[dict], tasks: List[dict]) -> str:
    parts = [
        f"You are the AI assistant for {user['company_name']} — a plug-and-play Company OS chatbot.",
        f"You are talking to: {user['name']} (role: {user['role']}, id: {user['id']}).",
        "",
        "## Voice",
        "Talk like a helpful colleague — natural, conversational sentences, contractions are fine.",
        "Prefer flowing paragraphs over lists. Use a short bullet only when a real enumeration helps.",
        "NEVER dump giant markdown tables, big headings, emoji rows, or 'Recommended action:' template sections.",
        "Do NOT use decorative emojis (🚨🔴📋 etc.). One inline `code span` for an ID or field name is fine.",
        "When you mention a task or lead, refer to it by its short id in backticks like `task-01` or `lead-04`. No status badges.",
        "Keep answers under ~120 words unless the question truly demands more detail.",
        "",
        "## Rules",
        "Answer strictly from the context docs and CRM data below. If the answer isn't there, say so.",
        "Never fabricate leads, tasks, users, dates, or numbers.",
        "",
        "=== COMPANY CONTEXT DOCUMENTS ===",
    ]
    active_docs = [d for d in context_docs if d.get("included", True)]
    for d in active_docs:
        parts.append(f"\n### [{d['kind']}] {d['title']}\n{d['content']}\n")
    parts.append("\n=== USER'S ASSIGNED LEADS ===")
    if not leads: parts.append("(no leads assigned)")
    for l in leads:
        cf = l.get("custom_fields") or {}
        extras = (" | " + " | ".join(f"{k}={v}" for k, v in cf.items())) if cf else ""
        parts.append(f"- Lead {l['id'][:8]} | {l['name']} | status={l['status']} | priority={l['priority']} | notes: {l.get('notes','')}{extras}")
    parts.append("\n=== USER'S TASKS ===")
    if not tasks: parts.append("(no tasks)")
    for t in tasks:
        cf = t.get("custom_fields") or {}
        extras = (" | " + " | ".join(f"{k}={v}" for k, v in cf.items())) if cf else ""
        parts.append(f"- Task {t['id'][:8]} | {t['title']} | priority={t['priority']} | status={t['status']} | due={t.get('due_date','')} | lead={t.get('lead_id','')[:8]}{extras}")
    parts.append("\nOnly reveal data listed above. Never fabricate leads/tasks/users.")
    return "\n".join(parts)


def cache_key(company_id: str, user_role: str, user_id: str, message: str) -> str:
    scope = user_id if user_role == "agent" else f"role:{user_role}"
    return hashlib.sha256(f"{company_id}|{scope}|{message.strip().lower()}".encode()).hexdigest()


async def get_llm_provider_settings(company_id: str) -> tuple[str, str, str]:
    """Returns (provider, model, api_key) — falls back to Emergent Universal Key."""
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    s = ((company or {}).get("settings") or {})
    return (
        s.get("llm_provider", "anthropic"),
        s.get("llm_model", "claude-sonnet-4-6"),
        s.get("api_key_override") or EMERGENT_LLM_KEY,
    )
