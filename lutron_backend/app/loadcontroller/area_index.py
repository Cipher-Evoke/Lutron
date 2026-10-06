"""
Constant-time LC → area lookup.

Built once from LMS DB (zones.loadcontroller_code + one AreaPathResolver).
Refresh only on demand (project change / recovery), never per alert.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple

from app.loadcontroller.metrics import LoadControllerMetrics
from app.utils.alert_area_path import AreaPathResolver, build_area_path

Key = Tuple[int, int]


@dataclass(frozen=True)
class AreaHit:
    area_id: Optional[int]
    area_code: Optional[int]
    zone_code: Optional[int]
    zone_id: Optional[int]
    area_path: Optional[str]


class AreaIndex:
    def __init__(self, metrics: Optional[LoadControllerMetrics] = None):
        self.metrics = metrics
        self._index: Dict[Key, AreaHit] = {}
        self.built_at: Optional[float] = None
        self.build_count = 0
        self.last_build_ms = 0.0

    def __len__(self) -> int:
        return len(self._index)

    def get(self, processor_id: int, loadcontroller_code: int) -> Optional[AreaHit]:
        t0 = time.perf_counter()
        hit = self._index.get((int(processor_id), int(loadcontroller_code)))
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        if self.metrics is not None:
            if self.metrics.area_lookup_last_ms == 0:
                self.metrics.area_lookup_last_ms = elapsed_ms
            else:
                self.metrics.area_lookup_repeat_ms = elapsed_ms
                self.metrics.area_lookup_last_ms = elapsed_ms
        return hit

    def rebuild(self, db: Any) -> int:
        """Load all zone→area mappings. One AreaPathResolver for the whole pass."""
        from app.models.zone import Zone

        t0 = time.perf_counter()
        resolver = AreaPathResolver(db)
        index: Dict[Key, AreaHit] = {}
        rows = (
            db.query(Zone)
            .filter(Zone.loadcontroller_code.isnot(None))
            .all()
        )
        for zone in rows:
            try:
                lc = int(zone.loadcontroller_code)
            except (TypeError, ValueError):
                continue
            if zone.processor_id is None:
                continue
            area = resolver.get_area(zone.area_id) if zone.area_id else None
            area_id = area.id if area is not None else None
            area_code = None
            if area is not None and area.code is not None:
                try:
                    area_code = int(area.code)
                except (TypeError, ValueError):
                    area_code = None
            zone_code = None
            try:
                zone_code = int(zone.code) if zone.code is not None else None
            except (TypeError, ValueError):
                zone_code = None
            path = build_area_path(area, resolver=resolver) if area is not None else None
            index[(int(zone.processor_id), lc)] = AreaHit(
                area_id=area_id,
                area_code=area_code,
                zone_code=zone_code,
                zone_id=getattr(zone, "id", None),
                area_path=path,
            )
        self._index = index
        self.last_build_ms = (time.perf_counter() - t0) * 1000.0
        self.built_at = time.time()
        self.build_count += 1
        if self.metrics is not None:
            self.metrics.area_cache_size = len(self._index)
            self.metrics.area_cache_build_ms = self.last_build_ms
        return len(self._index)
