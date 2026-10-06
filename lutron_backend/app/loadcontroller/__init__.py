"""
Load Controller v2 pipeline.

Internal architecture only. External entrypoint and alert semantics are unchanged.
"""

from app.loadcontroller.metrics import LoadControllerMetrics, get_metrics

__all__ = ["LoadControllerMetrics", "get_metrics"]
