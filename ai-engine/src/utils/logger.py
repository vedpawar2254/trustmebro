"""Logging configuration for AI engine."""
import logging
import sys
from typing import Optional

from src.config import settings


def setup_logger(name: str, level: Optional[str] = None) -> logging.Logger:
    """Set up a logger with consistent formatting.

    Args:
        name: Logger name
        level: Log level (overrides settings.log_level if provided)

    Returns:
        Configured logger instance
    """
    log_level = level or settings.log_level

    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, log_level.upper()))

    # Remove existing handlers
    logger.handlers.clear()

    # Create console handler with formatting
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(getattr(logging, log_level.upper()))

    # Create formatter
    formatter = logging.Formatter(
        fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler.setFormatter(formatter)

    # Add handler to logger
    logger.addHandler(handler)

    return logger


# Create module loggers
verification_logger = setup_logger("verification")
classifier_logger = setup_logger("classifier")
api_logger = setup_logger("api")
