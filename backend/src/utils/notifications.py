"""Notification preference utilities."""
from typing import Optional
from sqlalchemy.orm import Session

from src.models import NotificationPreference


# Mapping of notification types to preference field names
NOTIFICATION_TYPE_MAP = {
    "bid": "bid_notifications",
    "assignment": "assignment_notifications",
    "submission": "submission_notifications",
    "payment": "payment_notifications",
    "deadline": "deadline_reminders",
    "ghost": "ghost_warnings",
    "dispute": "dispute_notifications",
    "change_request": "change_request_notifications",
    "verification": "verification_results",
    "chat": "chat_notifications",
}


def should_send_notification(
    db: Session,
    user_id: int,
    notification_type: str
) -> bool:
    """
    Check if user wants to receive a specific notification type.

    Args:
        db: Database session
        user_id: User ID to check preferences for
        notification_type: Type of notification (bid, assignment, submission, etc.)

    Returns:
        True if notification should be sent, False otherwise
    """
    # Get the preference field name
    pref_field = NOTIFICATION_TYPE_MAP.get(notification_type)
    if not pref_field:
        # Unknown notification type, default to sending
        return True

    # Get user preferences
    prefs = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == user_id
    ).first()

    # If no preferences set, default to True (send all notifications)
    if not prefs:
        return True

    # Return the specific preference value
    return getattr(prefs, pref_field, True)


def get_user_email_frequency(db: Session, user_id: int) -> str:
    """
    Get user's email frequency preference.

    Args:
        db: Database session
        user_id: User ID

    Returns:
        Email frequency: 'immediate', 'daily_digest', or 'weekly_digest'
    """
    prefs = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == user_id
    ).first()

    if not prefs:
        return "immediate"

    return prefs.email_frequency
