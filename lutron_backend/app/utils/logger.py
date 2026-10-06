import logging
import re
import sys

# File logging disabled - console output only
# Database logging (via log_activity and activity_report_log) is unaffected

formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] %(message)s", "%Y-%m-%d %H:%M:%S")

_JWT_RE = re.compile(r"eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+")
_BEARER_RE = re.compile(r"(?i)(Bearer\s+)[A-Za-z0-9\-._~+/]+=*")


class SecretRedactFilter(logging.Filter):
    """Strip JWTs and Bearer tokens from log records before they hit PM2/stdout."""

    def filter(self, record: logging.LogRecord) -> bool:
        try:
            msg = record.getMessage()
            msg = _JWT_RE.sub("[REDACTED_JWT]", msg)
            msg = _BEARER_RE.sub(r"\1[REDACTED]", msg)
            record.msg = msg
            record.args = ()
        except Exception:
            return True
        return True


_redact_filter = SecretRedactFilter()
logging.getLogger().addFilter(_redact_filter)

# -------------------------------
# General App Logger
# -------------------------------
logger = logging.getLogger("lutron_app")
logger.setLevel(logging.ERROR)
logger.propagate = False
logger.handlers.clear()

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(formatter)
console_handler.addFilter(_redact_filter)
logger.addFilter(_redact_filter)
logger.addHandler(console_handler)

# -------------------------------
# Listener Logger
# -------------------------------
listener_logger = logging.getLogger("lutron_listener")
listener_logger.setLevel(logging.INFO)
listener_logger.propagate = False
listener_logger.handlers.clear()

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(formatter)
console_handler.setLevel(logging.INFO)
console_handler.addFilter(_redact_filter)
listener_logger.addFilter(_redact_filter)
listener_logger.addHandler(console_handler)

# -------------------------------
# Connection Logger
# -------------------------------
connection_logger = logging.getLogger("lutron_connection")
connection_logger.setLevel(logging.ERROR)
connection_logger.propagate = False
connection_logger.handlers.clear()

# -------------------------------
# Main Process Logger
# -------------------------------
main_logger = logging.getLogger("lutron_main")
main_logger.setLevel(logging.ERROR)
main_logger.propagate = False
main_logger.handlers.clear()

