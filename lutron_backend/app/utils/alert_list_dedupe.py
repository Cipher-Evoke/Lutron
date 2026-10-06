"""Last-resort display merge for GET /alert/active_alerts dicts.

Does not write solved_time.
Drivers: same (alert_type, loadcontroller_code) collapse — mapped + "-" path twins
become one row (prefer the row with a location).
Devices: same (alert_type, serial, device_name) collapse without using location.
Different loadcontroller_code values stay distinct.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional, Tuple


def _norm(value: Any) -> str:
    return ("" if value is None else str(value)).strip().lower()


def _has_name(row: Dict[str, Any]) -> bool:
    return bool((row.get("device_name") or "").strip())


def _has_location(row: Dict[str, Any]) -> bool:
    loc = row.get("location")
    if loc is None:
        return False
    text = str(loc).strip()
    return bool(text) and text != "-"


def _has_area_id(row: Dict[str, Any]) -> bool:
    return row.get("area_id") is not None


def _lc_key(row: Dict[str, Any]) -> Optional[str]:
    lc = row.get("loadcontroller_code")
    if lc is None:
        return None
    text = str(lc).strip()
    return text or None


def _parse_time(row: Dict[str, Any]) -> datetime:
    """Best-effort newest-time sort key (missing sorts oldest)."""
    for key in ("reported_time", "time", "last_updated_time"):
        raw = row.get(key)
        if raw is None or raw == "":
            continue
        if isinstance(raw, datetime):
            return raw.replace(tzinfo=None) if getattr(raw, "tzinfo", None) else raw
        text = str(raw).strip()
        for fmt in (
            "%d/%m/%Y %I:%M %p",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S",
        ):
            try:
                return datetime.strptime(text, fmt)
            except ValueError:
                continue
    return datetime.min


def _dedupe_key(row: Dict[str, Any]) -> Tuple[Any, ...]:
    alert_type = _norm(row.get("alert_type"))
    lc = _lc_key(row)
    if lc is not None:
        # Do not include location — otherwise mapped + unmapped twins both survive.
        return ("lc", alert_type, lc)
    return (
        "row",
        alert_type,
        _norm(row.get("serial_no")),
        _norm(row.get("device_name")),
    )


def _pick_dict_survivor(group: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Prefer location/area, then named device, then newest time."""

    def sort_key(r: Dict[str, Any]):
        t = _parse_time(r)
        try:
            ts = t.timestamp()
        except (OSError, OverflowError, ValueError):
            ts = 0.0
        return (
            0 if _has_location(r) else 1,
            0 if _has_area_id(r) else 1,
            0 if _has_name(r) else 1,
            -ts,
        )

    return min(group, key=sort_key)


def dedupe_active_alert_dicts(rows: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    groups: Dict[Tuple[Any, ...], List[Dict[str, Any]]] = {}
    order: List[Tuple[Any, ...]] = []
    for row in rows or []:
        if not isinstance(row, dict):
            continue
        key = _dedupe_key(row)
        if key not in groups:
            groups[key] = []
            order.append(key)
        groups[key].append(row)

    out: List[Dict[str, Any]] = []
    for key in order:
        group = groups[key]
        if len(group) == 1:
            out.append(group[0])
            continue
        out.append(_pick_dict_survivor(group))
    return out
