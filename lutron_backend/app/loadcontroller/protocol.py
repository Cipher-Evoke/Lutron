"""Shared LEAP load-controller status parsing. Semantics match the pre-v2 listener."""

from __future__ import annotations

from typing import Any, Optional, Tuple

ERROR_MAP = {
    "E2": "MissingInAction",
    "FC": "LampFailure",
    "FD": "BackendFailure",
    "08": "InEmergencyMode",
    "E0": "UnAddressed",
    "D0": "ShortedComponent",
    "D1": "ShortedComponent",
    "D2": "ShortedComponent",
    "D3": "AirGapFailure",
    "D4": "AirGapFailure",
    "D5": "OverCurrentError",
    "D6": "OverVoltageError",
    "D7": "OverLoadError",
    "D8": "UnitWarm",
    "D9": "UnitHotScaleBackTo25Percent",
    "DA": "UnitOverheatedOutputsOff",
    "DB": "MultipleError",
}

PING_URLS = frozenset({"/server/status/ping", "/server/1/status/ping"})
LC_STATUS_URL = "/loadcontroller/status"


def lc_code_from_status(status: Any) -> Optional[int]:
    href = status.get("href") if isinstance(status, dict) else None
    if not href or not isinstance(href, str):
        return None
    try:
        return int(href.strip("/").split("/")[-2])
    except (ValueError, IndexError, AttributeError, TypeError):
        return None


def parse_error_status(status: Any) -> Tuple[bool, Optional[str], Optional[str], bool]:
    """
    Return (is_error, code, description, is_unknown).

    Empty ErrorCode and Description → resolved (is_error False).
    Unknown → ignore (is_unknown True).
    """
    if not isinstance(status, dict):
        return False, None, None, False
    error_info = status.get("ErrorStatus") or {}
    if not isinstance(error_info, dict):
        error_info = {}
    code = error_info.get("ErrorCode")
    desc = error_info.get("Description")
    if code == "Unknown" or desc == "Unknown":
        return False, None, None, True
    empty_code = not code or (isinstance(code, str) and code.strip() == "")
    empty_desc = not desc or (isinstance(desc, str) and desc.strip() == "")
    if empty_code and empty_desc:
        return False, None, None, False
    mapped = ERROR_MAP.get(code, desc)
    return True, code, mapped, False
