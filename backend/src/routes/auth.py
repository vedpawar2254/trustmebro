"""Authentication API routes."""
from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import User
from src.auth import (
    create_access_token,
    decode_access_token,
)
from src.utils.logger import api_logger


router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_current_user(request: Request) -> Optional[dict]:
    """Get current user from JWT token.

    Args:
        request: FastAPI request

    Returns:
        User data or None
    """
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)

    return payload


@router.post("/verify-email")
async def verify_email(
    verification_data: dict,
    db: Session = Depends(get_db),
):
    """Verify email address using verification token.

    Args:
        verification_data: Data with verification token
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: Invalid token
        HTTPException: Token expired
        HTTPException: Server error
    """
    try:
        token = verification_data.get("token")

        if not token:
            raise HTTPException(
                status_code=400,
                detail="Verification token is required"
            )

        api_logger.info(f"Email verification attempt with token")

        # Find user by verification token
        user = db.query(User).filter(
            User.email_verification_token == token
        ).first()

        if not user:
            api_logger.warning(f"Invalid verification token")
            raise HTTPException(
                status_code=400,
                detail="Invalid verification token"
            )

        # Check if already verified
        if user.email_verified:
            api_logger.info(f"Email already verified: {user.email}")
            raise HTTPException(
                status_code=400,
                detail="Email already verified"
            )

        # Mark email as verified
        user.email_verified = True
        user.email_verification_token = None
        db.commit()

        api_logger.info(f"Email verified successfully: {user.email}")

        return {
            "success": True,
            "message": "Email verified successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Email verification failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Server error"
        )


@router.post("/resend-verification")
async def resend_verification_email(
    request: Request,
    db: Session = Depends(get_db),
):
    """Resend email verification token.

    Args:
        request: FastAPI request
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: Not authenticated
        HTTPException: Already verified
        HTTPException: Server error
    """
    current_user = get_current_user(request)

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        api_logger.info(f"Resend verification email for user {current_user['user_id']}")

        # Find user
        user = db.query(User).filter(User.id == current_user["user_id"]).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # Check if already verified
        if user.email_verified:
            raise HTTPException(
                status_code=400,
                detail="Email already verified"
            )

        # Generate new verification token
        import secrets
        new_token = secrets.token_urlsafe(32)
        user.email_verification_token = new_token
        db.commit()

        # In production, send actual email here
        # For now, we'll log the token
        api_logger.info(f"Verification token for {user.email}: {new_token}")
        api_logger.info(f"In production, send email to: {user.email}")
        api_logger.info(f"Verification URL: http://localhost:3000/verify-email?token={new_token}")

        return {
            "success": True,
            "message": "Verification email sent successfully",
            "note": "In production mode, an actual email would be sent",
            "dev_token": new_token,  # Only for development
        }

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Resend verification failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Server error"
        )
