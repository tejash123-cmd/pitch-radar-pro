"""Teams + members in data/store.json."""
import uuid
from datetime import datetime

from modules.json_store import snapshot, transaction


def _members_for(data: dict, team_id: str) -> list:
    return [m for m in data.get("team_members", []) if m.get("team_id") == team_id]


def _hydrate(data: dict, team: dict | None) -> dict | None:
    if not team:
        return None
    team = dict(team)
    team["members"] = [
        {
            "user_id":   m["user_id"],
            "name":      m["name"],
            "team_role": m["team_role"],
            "joined_at": m["joined_at"],
        }
        for m in _members_for(data, team["id"])
    ]
    return team


def create_team(name: str, owner_id: str, owner_name: str,
                description: str = "") -> dict:
    if not name.strip():
        raise ValueError("Team name is required")
    team = {
        "id":          str(uuid.uuid4())[:10],
        "name":        name.strip(),
        "description": description.strip(),
        "owner_id":    owner_id,
        "created_at":  datetime.utcnow().isoformat(),
    }
    row = {
        "team_id":   team["id"],
        "user_id":   owner_id,
        "name":      owner_name,
        "team_role": "owner",
        "joined_at": datetime.utcnow().isoformat(),
    }

    def _ins(d: dict):
        d.setdefault("teams", []).append(team)
        d.setdefault("team_members", []).append(row)

    transaction(_ins)
    return _hydrate(snapshot(), team)  # type: ignore


def get_by_id(team_id: str) -> dict | None:
    data = snapshot()
    team = next((t for t in data["teams"] if t["id"] == team_id), None)
    return _hydrate(data, team)


def get_for_user(user_id: str) -> list:
    data = snapshot()
    ids = {m["team_id"] for m in data["team_members"] if m.get("user_id") == user_id}
    teams = [t for t in data["teams"] if t["id"] in ids]
    return [_hydrate(data, t) for t in teams]


def add_member(team_id: str, user_id: str, name: str,
               team_role: str = "member", requester_id: str = "") -> dict:
    def _run(d: dict) -> dict:
        team = next((t for t in d["teams"] if t["id"] == team_id), None)
        if not team:
            raise ValueError("Team not found")
        if team["owner_id"] != requester_id:
            raise PermissionError("Only the team owner can add members")
        if any(m["user_id"] == user_id for m in _members_for(d, team_id)):
            raise ValueError("User is already a member")
        d.setdefault("team_members", []).append({
            "team_id":   team_id,
            "user_id":   user_id,
            "name":      name,
            "team_role": team_role,
            "joined_at": datetime.utcnow().isoformat(),
        })
        return team

    transaction(_run)
    return get_by_id(team_id)


def remove_member(team_id: str, user_id: str, requester_id: str) -> dict:
    def _run(d: dict):
        team = next((t for t in d["teams"] if t["id"] == team_id), None)
        if not team:
            raise ValueError("Team not found")
        if team["owner_id"] != requester_id and user_id != requester_id:
            raise PermissionError("Not authorized to remove this member")
        d["team_members"] = [
            m for m in d.get("team_members", [])
            if not (m.get("team_id") == team_id and m.get("user_id") == user_id)
        ]

    transaction(_run)
    return get_by_id(team_id)


def update_team(team_id: str, requester_id: str, **kwargs) -> dict:
    def _run(d: dict):
        team = next((t for t in d["teams"] if t["id"] == team_id), None)
        if not team:
            raise ValueError("Team not found")
        if team["owner_id"] != requester_id:
            raise PermissionError("Only the owner can update the team")
        for k in ("name", "description"):
            if k in kwargs and kwargs[k] is not None:
                team[k] = str(kwargs[k]).strip()

    transaction(_run)
    return get_by_id(team_id)


def delete_team(team_id: str, requester_id: str):
    def _run(d: dict):
        team = next((t for t in d["teams"] if t["id"] == team_id), None)
        if not team:
            raise ValueError("Team not found")
        if team["owner_id"] != requester_id:
            raise PermissionError("Only the owner can delete the team")
        d["teams"] = [t for t in d["teams"] if t["id"] != team_id]
        d["team_members"] = [m for m in d.get("team_members", []) if m.get("team_id") != team_id]

    transaction(_run)
