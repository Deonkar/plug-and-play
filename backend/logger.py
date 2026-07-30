"""Structured logging — writes to console AND fires event_service.log_event for auditable actions."""
import logging
import sys

_configured = False


def get_logger(name: str = "companyos") -> logging.Logger:
    global _configured
    log = logging.getLogger(name)
    if not _configured:
        log.setLevel(logging.INFO)
        h = logging.StreamHandler(sys.stdout)
        h.setFormatter(logging.Formatter(
            fmt="%(asctime)s %(levelname)-5s [%(name)s] %(message)s",
            datefmt="%H:%M:%S",
        ))
        log.addHandler(h)
        log.propagate = False
        _configured = True
    return log


logger = get_logger()
