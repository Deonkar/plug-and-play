"""File-tree helpers — build, walk, diff, inclusion flag propagation."""
from typing import Dict, List


def build_tree(paths_and_sizes: List[dict]) -> dict:
    """Turn a flat list of {path,size} into a nested tree {name,path,size,kind,included,children}."""
    root = {"name": "root", "path": "", "size": 0, "kind": "dir", "included": True, "children": {}}
    for entry in paths_and_sizes:
        parts = [p for p in entry["path"].split("/") if p]
        node = root
        for i, part in enumerate(parts):
            is_leaf = i == len(parts) - 1
            if part not in node["children"]:
                node["children"][part] = {
                    "name": part, "path": "/".join(parts[: i + 1]),
                    "size": 0, "kind": "file" if is_leaf else "dir",
                    "included": True, "children": {},
                }
            child = node["children"][part]
            if is_leaf:
                child["size"] = entry["size"]
                child["kind"] = "file"
            node = child

    def finalize(n):
        kids = list(n["children"].values())
        kids.sort(key=lambda k: (k["kind"] != "dir", k["name"].lower()))
        for k in kids: finalize(k)
        n["children"] = kids
        if n["kind"] == "dir":
            n["size"] = sum(k["size"] for k in kids)
    finalize(root)
    return root


def walk_nodes(node: dict, visitor):
    if visitor(node) is False:
        return
    for k in node.get("children", []) or []:
        walk_nodes(k, visitor)


def apply_inclusion_flags(new_tree: dict, prev_tree: dict) -> dict:
    """Copy `included` flags from prev_tree onto matching paths of new_tree (for re-ingest)."""
    prev_by_path: Dict[str, bool] = {}
    def collect(n): prev_by_path[n.get("path", "")] = n.get("included", True)
    walk_nodes(prev_tree, collect)
    def apply(n):
        p = n.get("path", "")
        if p in prev_by_path: n["included"] = prev_by_path[p]
    walk_nodes(new_tree, apply)
    return new_tree


def tree_diff(prev_files: dict, new_files: dict) -> dict:
    prev_paths = set(prev_files.keys()); new_paths = set(new_files.keys())
    return {
        "added":   sorted(new_paths - prev_paths),
        "removed": sorted(prev_paths - new_paths),
        "changed": sorted([p for p in (prev_paths & new_paths) if prev_files[p] != new_files[p]]),
    }


def tree_included_paths(tree: dict) -> List[str]:
    out: List[str] = []
    def visit(node, parent_incl):
        my_incl = parent_incl and node.get("included", True)
        if node["kind"] == "file" and my_incl:
            out.append(node["path"])
        for k in node.get("children", []) or []:
            visit(k, my_incl)
    for k in tree.get("children", []) or []:
        visit(k, True)
    return out


def tree_included_chars(tree: dict) -> int:
    total = [0]
    def visit(node, parent_incl):
        my_incl = parent_incl and node.get("included", True)
        if node["kind"] == "file" and my_incl:
            total[0] += node.get("size", 0)
        for k in node.get("children", []) or []:
            visit(k, my_incl)
    for k in tree.get("children", []) or []:
        visit(k, True)
    return total[0]


def toggle_node_in_tree(tree: dict, path: str, included: bool, cascade: bool) -> bool:
    """Toggle a node's included flag in-place. Returns True if the path was found."""
    found = [False]
    def visit(node, force=None):
        if force is not None:
            node["included"] = force
        if node.get("path", "") == path:
            node["included"] = included
            found[0] = True
            if cascade:
                for k in node.get("children", []) or []:
                    visit(k, force=included)
            return
        for k in node.get("children", []) or []:
            visit(k, force=force)
    visit(tree)
    return found[0]


def is_lead_escalated(lead: dict) -> bool:
    """A hot lead untouched for 48+ hours is 'escalated' (stale)."""
    from datetime import datetime, timezone, timedelta
    if lead.get("status") != "hot":
        return False
    last = lead.get("last_touched_at") or lead.get("created_at")
    if not last:
        return False
    try:
        d = datetime.fromisoformat(last.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - d) > timedelta(hours=48)
    except Exception:
        return False


def is_task_escalated(task: dict) -> bool:
    """An urgent task past due is 'escalated'."""
    if task.get("status") == "done":
        return False
    if task.get("priority") != "urgent":
        return False
    from .time_helper import now_iso
    return (task.get("due_date") or "") < now_iso()
