"""User settings and notification preferences routes."""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import User, NotificationPreference
from src.schemas import (
    NotificationPreferencesResponse,
    UpdateNotificationPreferencesRequest,
    SuccessResponse,
)
from src.routes.auth import get_current_user
from src.utils.logger import api_logger


router = APIRouter(prefix="/api/users", tags=["users"])


def require_auth(request: Request) -> dict:
    """Require authentication for endpoint.

    Args:
        request: FastAPI request

    Returns:
        User data

    Raises:
        HTTPException: Not authenticated
    """
    current_user = get_current_user(request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return current_user


@router.get("/notification-preferences")
async def get_notification_preferences(
    request: Request,
    db: Session = Depends(get_db),
):
    """Get current user's notification preferences.

    Args:
        request: FastAPI request
        db: Database session

    Returns:
        Notification preferences
    """
    current_user = require_auth(request)

    try:
        # Get or create notification preferences
        prefs = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == current_user["user_id"]
        ).first()

        if not prefs:
            # Create default preferences
            prefs = NotificationPreference(user_id=current_user["user_id"])
            db.add(prefs)
            db.commit()
            db.refresh(prefs)
            api_logger.info(f"Created default notification preferences for user {current_user['user_id']}")

        return {
            "success": True,
            "data": {
                "bid_notifications": prefs.bid_notifications,
                "assignment_notifications": prefs.assignment_notifications,
                "submission_notifications": prefs.submission_notifications,
                "payment_notifications": prefs.payment_notifications,
                "deadline_reminders": prefs.deadline_reminders,
                "ghost_warnings": prefs.ghost_warnings,
                "dispute_notifications": prefs.dispute_notifications,
                "change_request_notifications": prefs.change_request_notifications,
                "verification_results": prefs.verification_results,
                "chat_notifications": prefs.chat_notifications,
                "email_frequency": prefs.email_frequency,
            }
        }

    except Exception as e:
        api_logger.error(f"Failed to get notification preferences: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get notification preferences")


@router.put("/notification-preferences")
async def update_notification_preferences(
    request: Request,
    update_data: UpdateNotificationPreferencesRequest,
    db: Session = Depends(get_db),
):
    """Update current user's notification preferences.

    Args:
        request: FastAPI request
        update_data: New preference values
        db: Database session

    Returns:
        Updated notification preferences
    """
    current_user = require_auth(request)

    try:
        # Get or create notification preferences
        prefs = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == current_user["user_id"]
        ).first()

        if not prefs:
            prefs = NotificationPreference(user_id=current_user["user_id"])
            db.add(prefs)

        # Update only provided fields
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            if value is not None:
                # Handle enum conversion for email_frequency
                if field == "email_frequency":
                    setattr(prefs, field, value.value if hasattr(value, 'value') else value)
                else:
                    setattr(prefs, field, value)

        db.commit()
        db.refresh(prefs)

        api_logger.info(f"Updated notification preferences for user {current_user['user_id']}")

        return {
            "success": True,
            "data": {
                "bid_notifications": prefs.bid_notifications,
                "assignment_notifications": prefs.assignment_notifications,
                "submission_notifications": prefs.submission_notifications,
                "payment_notifications": prefs.payment_notifications,
                "deadline_reminders": prefs.deadline_reminders,
                "ghost_warnings": prefs.ghost_warnings,
                "dispute_notifications": prefs.dispute_notifications,
                "change_request_notifications": prefs.change_request_notifications,
                "verification_results": prefs.verification_results,
                "chat_notifications": prefs.chat_notifications,
                "email_frequency": prefs.email_frequency,
            },
            "message": "Notification preferences updated successfully"
        }

    except Exception as e:
        api_logger.error(f"Failed to update notification preferences: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update notification preferences")


@router.post("/notification-preferences/reset")
async def reset_notification_preferences(
    request: Request,
    db: Session = Depends(get_db),
):
    """Reset notification preferences to defaults.

    Args:
        request: FastAPI request
        db: Database session

    Returns:
        Reset notification preferences
    """
    current_user = require_auth(request)

    try:
        # Get or create notification preferences
        prefs = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == current_user["user_id"]
        ).first()

        if prefs:
            # Reset to defaults
            prefs.bid_notifications = True
            prefs.assignment_notifications = True
            prefs.submission_notifications = True
            prefs.payment_notifications = True
            prefs.deadline_reminders = True
            prefs.ghost_warnings = True
            prefs.dispute_notifications = True
            prefs.change_request_notifications = True
            prefs.verification_results = True
            prefs.chat_notifications = True
            prefs.email_frequency = "immediate"
        else:
            prefs = NotificationPreference(user_id=current_user["user_id"])
            db.add(prefs)

        db.commit()
        db.refresh(prefs)

        api_logger.info(f"Reset notification preferences for user {current_user['user_id']}")

        return {
            "success": True,
            "data": {
                "bid_notifications": prefs.bid_notifications,
                "assignment_notifications": prefs.assignment_notifications,
                "submission_notifications": prefs.submission_notifications,
                "payment_notifications": prefs.payment_notifications,
                "deadline_reminders": prefs.deadline_reminders,
                "ghost_warnings": prefs.ghost_warnings,
                "dispute_notifications": prefs.dispute_notifications,
                "change_request_notifications": prefs.change_request_notifications,
                "verification_results": prefs.verification_results,
                "chat_notifications": prefs.chat_notifications,
                "email_frequency": prefs.email_frequency,
            },
            "message": "Notification preferences reset to defaults"
        }

    except Exception as e:
        api_logger.error(f"Failed to reset notification preferences: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to reset notification preferences")
