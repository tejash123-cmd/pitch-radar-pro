"""Email/password auth backed by data/store.json."""
import uuid
from datetime import datetime

from werkzeug.security import check_password_hash, generate_password_hash

from modules.json_store import snapshot, transaction

VALID_ROLES = {
    "vc_partner":            "Investment partner",
    "data_scientist":        "Technical diligence",
    "pharma_scientist":      "Pharma Scientist",
    "university_researcher": "University Researcher",
    "lab_director":          "Lab Director",
    "clinical_researcher":   "Clinical Researcher",
}


def _public(user: dict) -> dict:
    return {k: v for k, v in user.items() if k != "password_hash"}


def get_by_email(email: str) -> dict | None:
    e = (email or "").strip().lower()
    for u in snapshot()["users"]:
        if (u.get("email") or "").lower() == e:
            return u
    return None


def get_by_id(user_id: str) -> dict | None:
    if not user_id:
        return None
    for u in snapshot()["users"]:
        if u.get("id") == user_id:
            return _public(u)
    return None


def get_all_public() -> list:
    return [_public(u) for u in snapshot()["users"]]


def create_user(name: str, email: str, password: str,
                roles: list, organization: str = "") -> dict:
    if not name.strip():
        raise ValueError("Name is required")
    if not email.strip():
        raise ValueError("Email is required")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters")
    if get_by_email(email):
        raise ValueError("Email already registered")

    cleaned_roles = [r for r in (roles or []) if r in VALID_ROLES]
    if not cleaned_roles:
        cleaned_roles = ["vc_partner"]

    user = {
        "id":            str(uuid.uuid4())[:12],
        "name":          name.strip(),
        "email":         email.strip().lower(),
        "password_hash": generate_password_hash(password),
        "roles":         cleaned_roles,
        "organization":  organization.strip(),
        "initials":      "".join(w[0].upper() for w in name.split()[:2]) or "?",
        "created_at":    datetime.utcnow().isoformat(),
    }

    def _append(d: dict):
        d.setdefault("users", []).append(user)

    transaction(_append)
    return _public(user)


def verify_user(email: str, password: str) -> dict | None:
    user = get_by_email(email)
    if user and check_password_hash(user["password_hash"], password):
        return _public(user)
    return None
