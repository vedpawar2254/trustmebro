"""Logging configuration for backend API."""
import logging
import sys
from typing import Optional

from src.config import settings


def get_logger(name: str, level: Optional[str] = None) -> logging.Logger:
    """Get a configured logger.

    Args:
        name: Logger name (usually __name__)
        level: Log level (defaults to settings.log_level)

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)

    if not logger.handlers:
        log_level = getattr(logging, (level or settings.log_level).upper(), logging.INFO)
        logger.setLevel(log_level)

        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(log_level)

        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger


# Pre-configured logger for API routes
api_logger = get_logger("trustmebro.api")
