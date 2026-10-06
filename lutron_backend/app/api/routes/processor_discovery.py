"""JWT-protected Add-by-IP for operator-pasted host addresses only.

Does not expand CIDR ranges and does not scan the LAN. Each IPv4 is validated
by processor._parse_ipv4 then probed on LEAP 8081.
"""
from __future__ import annotations

import re
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.routes.processor import _parse_ipv4, get_db
from app.dependencies.auth import get_current_user
from app.models.processor import Processor
from app.models.user_model import User
from app.utils.lutron_helpers import is_processor_reachable

router = APIRouter()

_IPV4_TOKEN = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
_MAX_HOSTS = 32
_ALLOWED_PROBE_PORTS = frozenset({8081, 8083})


class ScanRequest(BaseModel):
    raw: Optional[str] = None
    ips: Optional[List[str]] = None
    ports: Optional[List[int]] = None
    timeout: Optional[float] = Field(default=2.0, ge=0.5, le=5.0)


class ManualAddRequest(BaseModel):
    ipv4: str
    system: Optional[str] = None
    serial: Optional[str] = None
    mac: Optional[str] = None


def _hosts_from_payload(raw: Optional[str], ips: Optional[List[str]]) -> List[str]:
    blob = " ".join([raw or ""] + list(ips or []))
    if "/" in blob:
        raise HTTPException(
            status_code=400,
            detail="Paste individual IPv4 host addresses only. CIDR ranges are not scanned.",
        )
    seen: list[str] = []
    for token in _IPV4_TOKEN.findall(blob):
        host = _parse_ipv4(token)
        if host not in seen:
            seen.append(host)
        if len(seen) > _MAX_HOSTS:
            raise HTTPException(
                status_code=400,
                detail=f"At most {_MAX_HOSTS} IPv4 addresses per request.",
            )
    return seen


def _upsert_processor(
    db: Session,
    ipv4: str,
    *,
    system: Optional[str] = None,
    serial: Optional[str] = None,
    mac: Optional[str] = None,
    reachable: bool,
) -> Processor:
    row = None
    if serial:
        row = db.query(Processor).filter(Processor.serial == serial).first()
    if row is None:
        row = db.query(Processor).filter(Processor.ipv4 == ipv4).first()
    if row is None:
        row = Processor(
            ipv4=ipv4,
            server=ipv4,
            system=system or "unknown",
            serial=serial or f"manual-{ipv4.replace('.', '-')}",
            mac=mac or "",
            claimed="",
            sw_version="",
            status="active",
        )
        db.add(row)
        db.flush()
    else:
        row.ipv4 = ipv4
        if system:
            row.system = system
        if serial:
            row.serial = serial
        if mac:
            row.mac = mac
    row.ping_status = "reachable" if reachable else "unreachable"
    row.pinged_at = datetime.utcnow()
    return row


@router.post("/scan")
def scan_processors_by_ip(
    payload: ScanRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    hosts = _hosts_from_payload(payload.raw, payload.ips)
    timeout = int(payload.timeout or 2)
    ports = [p for p in (payload.ports or [8081]) if p in _ALLOWED_PROBE_PORTS] or [8081]
    results = []
    for host in hosts:
        reachable = any(is_processor_reachable(host, port=port, timeout=timeout) for port in ports)
        row = _upsert_processor(db, host, reachable=reachable) if reachable else None
        results.append(
            {
                "ipv4": host,
                "reachable": reachable,
                "processor_id": row.id if row is not None else None,
            }
        )
    db.commit()
    return results


@router.post("/manual_add")
def manual_add_processor(
    payload: ManualAddRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ipv4 = _parse_ipv4(payload.ipv4)
    other = (
        db.query(Processor)
        .filter(Processor.ipv4 == ipv4)
        .first()
    )
    serial = (payload.serial or "").strip() or None
    if serial:
        clash = db.query(Processor).filter(Processor.serial == serial, Processor.ipv4 != ipv4).first()
        if clash:
            raise HTTPException(status_code=409, detail="A processor with that serial already exists")
    reachable = is_processor_reachable(ipv4)
    row = _upsert_processor(
        db,
        ipv4,
        system=payload.system,
        serial=serial,
        mac=payload.mac,
        reachable=reachable,
    )
    if other and other.id != row.id:
        raise HTTPException(status_code=409, detail="Duplicate processor IP")
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "ipv4": row.ipv4,
        "system": row.system,
        "serial": row.serial,
        "mac": row.mac,
        "reachable": reachable,
    }
