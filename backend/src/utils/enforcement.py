"""Enforcement utilities for PFI and email verification checks.

These helpers enforce platform policies:
- Email verification required for critical actions
- PFI score >= 20 required to participate
- Account suspension for low PFI
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.models import User


# PFI Thresholds
MIN_PFI_FOR_BIDDING = 20.0
MIN_PFI_FOR_ESCROW = 20.0
MIN_PFI_FOR_SUBMISSION = 20.0
SUSPENDED_PFI_THRESHOLD = 10.0


def check_email_verified(user: User, action: str = "perform this action") -> None:
    """
    Check if user's email is verified.

    Args:
        user: User to check
        action: Description of the action for error message

    Raises:
        HTTPException: If email not verified
    """
    if not user.email_verified:
        raise HTTPException(
            status_code=403,
            detail=f"Email verification required to {action}. Please verify your email first."
        )


def check_pfi_threshold(
    user: User,
    min_pfi: float,
    action: str = "perform this action"
) -> None:
    """
    Check if user's PFI score meets minimum threshold.

    Args:
        user: User to check
        min_pfi: Minimum required PFI score
        action: Description of the action for error message

    Raises:
        HTTPException: If PFI below threshold
    """
    current_pfi = user.pfi_score if user.pfi_score is not None else 90.0

    if current_pfi < SUSPENDED_PFI_THRESHOLD:
        raise HTTPException(
            status_code=403,
            detail=f"Your account is suspended due to low PFI score ({current_pfi}). "
            f"Please contact support."
        )

    if current_pfi < min_pfi:
        raise HTTPException(
            status_code=403,
            detail=f"Your PFI score ({current_pfi}) is below the minimum required ({min_pfi}) to {action}. "
            f"Complete projects successfully to improve your score."
        )


def enforce_bidding_requirements(user: User, db: Session) -> None:
    """
    Enforce all requirements for placing a bid.

    Args:
        user: User attempting to bid
        db: Database session

    Raises:
        HTTPException: If any requirement not met
    """
    check_email_verified(user, "place a bid")
    check_pfi_threshold(user, MIN_PFI_FOR_BIDDING, "place bids")


def enforce_escrow_requirements(user: User, db: Session) -> None:
    """
    Enforce all requirements for funding escrow.

    Args:
        user: User attempting to fund escrow
        db: Database session

    Raises:
        HTTPException: If any requirement not met
    """
    check_email_verified(user, "fund escrow")
    check_pfi_threshold(user, MIN_PFI_FOR_ESCROW, "fund escrow")


def enforce_submission_requirements(user: User, db: Session) -> None:
    """
    Enforce all requirements for submitting work.

    Args:
        user: User attempting to submit work
        db: Database session

    Raises:
        HTTPException: If any requirement not met
    """
    check_email_verified(user, "submit work")
    check_pfi_threshold(user, MIN_PFI_FOR_SUBMISSION, "submit work")


def get_user_status(user: User) -> dict:
    """
    Get user's account status and any restrictions.

    Args:
        user: User to check

    Returns:
        Dict with status information
    """
    current_pfi = user.pfi_score if user.pfi_score is not None else 90.0

    restrictions = []
    if not user.email_verified:
        restrictions.append("email_not_verified")
    if current_pfi < MIN_PFI_FOR_BIDDING:
        restrictions.append("low_pfi")
    if current_pfi < SUSPENDED_PFI_THRESHOLD:
        restrictions.append("account_suspended")

    return {
        "user_id": user.id,
        "email_verified": user.email_verified,
        "pfi_score": current_pfi,
        "account_status": "suspended" if current_pfi < SUSPENDED_PFI_THRESHOLD else "active",
        "restrictions": restrictions,
        "can_bid": user.email_verified and current_pfi >= MIN_PFI_FOR_BIDDING,
        "can_fund_escrow": user.email_verified and current_pfi >= MIN_PFI_FOR_ESCROW,
        "can_submit_work": user.email_verified and current_pfi >= MIN_PFI_FOR_SUBMISSION,
    }
