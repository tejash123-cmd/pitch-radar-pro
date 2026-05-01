"""Tasks + bundle edits in data/store.json."""
import uuid
from datetime import datetime

from modules.json_store import snapshot, transaction


def get_tasks(run_id: str) -> list:
    data = snapshot()
    out = [t for t in data.get("foresight_tasks", []) if t.get("run_id") == run_id]
    return sorted(out, key=lambda x: x.get("created_at") or "")


def add_task(run_id: str, title: str, description: str,
             assigned_to_id: str, assigned_to_name: str,
             priority: str, created_by: str,
             due_date: str = "", is_ai_generated: bool = False) -> dict:
    def _check_and_add(d: dict) -> dict:
        if not any(r.get("id") == run_id for r in d.get("foresight_runs", [])):
            raise ValueError("Foresight run not found")
        task = {
            "id":               str(uuid.uuid4())[:10],
            "run_id":           run_id,
            "title":            title.strip(),
            "description":      description.strip(),
            "assigned_to_id":   assigned_to_id or "",
            "assigned_to_name": assigned_to_name or "Unassigned",
            "priority":         priority or "medium",
            "status":           "todo",
            "created_by":       created_by or "",
            "due_date":         due_date or "",
            "is_ai_generated":  bool(is_ai_generated),
            "created_at":       datetime.utcnow().isoformat(),
        }
        d.setdefault("foresight_tasks", []).append(task)
        return task

    return transaction(_check_and_add)


def update_task(run_id: str, task_id: str, updates: dict) -> dict:
    allowed = {"title", "description", "assigned_to_id", "assigned_to_name",
               "priority", "status", "due_date"}

    def _upd(d: dict) -> dict:
        tasks = d.setdefault("foresight_tasks", [])
        for i, t in enumerate(tasks):
            if t.get("id") == task_id and t.get("run_id") == run_id:
                payload = {k: v for k, v in (updates or {}).items() if k in allowed}
                if not payload:
                    return tasks[i]
                tasks[i] = {**t, **payload, "updated_at": datetime.utcnow().isoformat()}
                return tasks[i]
        raise ValueError("Task not found")

    return transaction(_upd)


def delete_task(run_id: str, task_id: str):
    def _del(d: dict):
        tasks = d.setdefault("foresight_tasks", [])
        n = len(tasks)
        d["foresight_tasks"] = [t for t in tasks if not (t.get("id") == task_id and t.get("run_id") == run_id)]
        if len(d["foresight_tasks"]) == n:
            raise ValueError("Task not found")

    transaction(_del)


def update_bundle_section(run_id: str, section: str, data) -> dict:
    def _patch(d: dict) -> dict:
        for i, r in enumerate(d.get("foresight_runs", [])):
            if r.get("id") != run_id:
                continue
            modified = dict(r.get("modified_bundle") or {})
            modified[section] = data
            r["modified_bundle"] = modified
            r["bundle_modified_at"] = datetime.utcnow().isoformat()
            d["foresight_runs"][i] = r
            return modified
        raise ValueError("Run not found")

    return transaction(_patch)
