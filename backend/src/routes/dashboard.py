"""Dashboard API routes for employer and freelancer statistics."""
from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from src.database import get_db
from src.models import (
    Job, JobStatus, User, UserRole, Bid, BidStatus, Escrow, EscrowStatus,
    Submission, SubmissionStatus, Dispute, DisputeStatus, GhostEvent
)
from src.utils.logger import api_logger
from src.auth import decode_access_token
from src.utils.enforcement import get_user_status


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def get_current_user(request: Request) -> Optional[dict]:
    """Get current user from JWT token."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    return decode_access_token(token)


def require_auth(request: Request) -> dict:
    """Require authentication."""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


@router.get("/stats")
async def get_dashboard_stats(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Get dashboard statistics for the current user.

    Returns different stats based on role (employer vs freelancer).
    """
    current_user = require_auth(request)
    user_id = current_user["user_id"]
    role = current_user.get("role")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get account status
    account_status = get_user_status(user)

    if role == "employer":
        stats = await _get_employer_stats(user_id, db)
    else:
        stats = await _get_freelancer_stats(user_id, db)

    return {
        "success": True,
        "data": {
            "user": {
                "id": user.id,
                "name": user.name,
                "role": role,
                "pfi_score": user.pfi_score,
                "email_verified": user.email_verified,
            },
            "account_status": account_status,
            "stats": stats,
        }
    }


async def _get_employer_stats(user_id: int, db: Session) -> dict:
    """Get statistics for an employer."""
    # Job counts by status
    job_counts = db.query(
        Job.status,
        func.count(Job.id).label("count")
    ).filter(
        Job.employer_id == user_id
    ).group_by(Job.status).all()

    job_stats = {status.value: 0 for status in JobStatus}
    for status, count in job_counts:
        job_stats[status.value] = count

    # Total jobs
    total_jobs = sum(job_stats.values())

    # Active jobs (assigned, funded, in progress)
    active_jobs = (
        job_stats.get("assigned", 0) +
        job_stats.get("escrow_funded", 0) +
        job_stats.get("in_progress", 0)
    )

    # Total spent (released escrows)
    total_spent = db.query(func.sum(Escrow.released_amount)).join(Job).filter(
        Job.employer_id == user_id,
        Escrow.status == EscrowStatus.RELEASED
    ).scalar() or 0.0

    # Pending bids count
    pending_bids = db.query(func.count(Bid.id)).join(Job).filter(
        Job.employer_id == user_id,
        Bid.status == BidStatus.PENDING
    ).scalar() or 0

    # Active disputes
    active_disputes = db.query(func.count(Dispute.id)).join(Job).filter(
        Job.employer_id == user_id,
        Dispute.status.in_([DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW])
    ).scalar() or 0

    # Jobs with deadlines approaching (next 7 days)
    upcoming_deadline = datetime.utcnow() + timedelta(days=7)
    approaching_deadlines = db.query(func.count(Job.id)).filter(
        Job.employer_id == user_id,
        Job.status.in_([JobStatus.IN_PROGRESS, JobStatus.ESCROW_FUNDED]),
        Job.deadline <= upcoming_deadline
    ).scalar() or 0

    return {
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "completed_jobs": job_stats.get("completed", 0),
        "disputed_jobs": job_stats.get("disputed", 0),
        "draft_jobs": job_stats.get("draft", 0),
        "published_jobs": job_stats.get("published", 0),
        "total_spent": round(total_spent, 2),
        "pending_bids_to_review": pending_bids,
        "active_disputes": active_disputes,
        "approaching_deadlines": approaching_deadlines,
        "job_breakdown": job_stats,
    }


async def _get_freelancer_stats(user_id: int, db: Session) -> dict:
    """Get statistics for a freelancer."""
    # Job counts by status (assigned jobs)
    job_counts = db.query(
        Job.status,
        func.count(Job.id).label("count")
    ).filter(
        Job.assigned_freelancer_id == user_id
    ).group_by(Job.status).all()

    job_stats = {status.value: 0 for status in JobStatus}
    for status, count in job_counts:
        job_stats[status.value] = count

    # Total assigned jobs
    total_jobs = sum(job_stats.values())

    # Active jobs
    active_jobs = (
        job_stats.get("assigned", 0) +
        job_stats.get("escrow_funded", 0) +
        job_stats.get("in_progress", 0)
    )

    # Total earned (from released escrows)
    total_earned = db.query(func.sum(Escrow.released_amount)).join(Job).filter(
        Job.assigned_freelancer_id == user_id,
        Escrow.status == EscrowStatus.RELEASED
    ).scalar() or 0.0

    # Pending earnings (from funded escrows)
    pending_earnings = db.query(
        func.sum(Escrow.amount - Escrow.released_amount)
    ).join(Job).filter(
        Job.assigned_freelancer_id == user_id,
        Escrow.status.in_([EscrowStatus.FUNDED, EscrowStatus.HELD])
    ).scalar() or 0.0

    # Bid stats
    total_bids = db.query(func.count(Bid.id)).filter(
        Bid.freelancer_id == user_id
    ).scalar() or 0

    accepted_bids = db.query(func.count(Bid.id)).filter(
        Bid.freelancer_id == user_id,
        Bid.status == BidStatus.ACCEPTED
    ).scalar() or 0

    pending_bids = db.query(func.count(Bid.id)).filter(
        Bid.freelancer_id == user_id,
        Bid.status == BidStatus.PENDING
    ).scalar() or 0

    # Submission stats
    total_submissions = db.query(func.count(Submission.id)).filter(
        Submission.freelancer_id == user_id
    ).scalar() or 0

    verified_submissions = db.query(func.count(Submission.id)).filter(
        Submission.freelancer_id == user_id,
        Submission.status == SubmissionStatus.VERIFIED
    ).scalar() or 0

    # Average verification score
    avg_score = db.query(func.avg(Submission.verification_score)).filter(
        Submission.freelancer_id == user_id,
        Submission.verification_score.isnot(None)
    ).scalar() or 0.0

    # Active disputes
    active_disputes = db.query(func.count(Dispute.id)).join(Job).filter(
        Job.assigned_freelancer_id == user_id,
        Dispute.status.in_([DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW])
    ).scalar() or 0

    # Jobs with deadlines approaching
    upcoming_deadline = datetime.utcnow() + timedelta(days=7)
    approaching_deadlines = db.query(func.count(Job.id)).filter(
        Job.assigned_freelancer_id == user_id,
        Job.status.in_([JobStatus.IN_PROGRESS, JobStatus.ESCROW_FUNDED]),
        Job.deadline <= upcoming_deadline
    ).scalar() or 0

    # Ghost warnings
    unresolved_ghost_events = db.query(func.count(GhostEvent.id)).filter(
        GhostEvent.user_id == user_id,
        GhostEvent.is_resolved == False
    ).scalar() or 0

    return {
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "completed_jobs": job_stats.get("completed", 0),
        "disputed_jobs": job_stats.get("disputed", 0),
        "total_earned": round(total_earned, 2),
        "pending_earnings": round(pending_earnings, 2),
        "total_bids": total_bids,
        "accepted_bids": accepted_bids,
        "pending_bids": pending_bids,
        "bid_acceptance_rate": round((accepted_bids / total_bids * 100) if total_bids > 0 else 0, 1),
        "total_submissions": total_submissions,
        "verified_submissions": verified_submissions,
        "average_verification_score": round(avg_score, 1),
        "active_disputes": active_disputes,
        "approaching_deadlines": approaching_deadlines,
        "ghost_warnings": unresolved_ghost_events,
        "job_breakdown": job_stats,
    }


@router.get("/recent-activity")
async def get_recent_activity(
    request: Request,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    """Get recent activity feed for the current user."""
    current_user = require_auth(request)
    user_id = current_user["user_id"]
    role = current_user.get("role")

    activities = []

    if role == "employer":
        # Recent bids on user's jobs
        recent_bids = db.query(Bid, Job).join(Job).filter(
            Job.employer_id == user_id
        ).order_by(Bid.created_at.desc()).limit(limit).all()

        for bid, job in recent_bids:
            freelancer = db.query(User).filter(User.id == bid.freelancer_id).first()
            activities.append({
                "type": "new_bid",
                "job_id": job.id,
                "job_title": job.title,
                "message": f"{freelancer.name if freelancer else 'A freelancer'} placed a bid",
                "created_at": bid.created_at.isoformat(),
            })

        # Recent submissions
        recent_submissions = db.query(Submission, Job).join(Job).filter(
            Job.employer_id == user_id
        ).order_by(Submission.created_at.desc()).limit(limit).all()

        for sub, job in recent_submissions:
            activities.append({
                "type": "submission",
                "job_id": job.id,
                "job_title": job.title,
                "message": f"New submission for milestone {sub.milestone_id}",
                "status": sub.status.value if sub.status else None,
                "created_at": sub.created_at.isoformat(),
            })

    else:
        # Recent bid status updates
        recent_bids = db.query(Bid, Job).join(Job).filter(
            Bid.freelancer_id == user_id,
            Bid.status != BidStatus.PENDING
        ).order_by(Bid.created_at.desc()).limit(limit).all()

        for bid, job in recent_bids:
            activities.append({
                "type": "bid_update",
                "job_id": job.id,
                "job_title": job.title,
                "message": f"Your bid was {bid.status.value}",
                "created_at": bid.created_at.isoformat(),
            })

        # Recent verification results
        recent_verifications = db.query(Submission, Job).join(Job).filter(
            Submission.freelancer_id == user_id,
            Submission.status != SubmissionStatus.PENDING
        ).order_by(Submission.verified_at.desc()).limit(limit).all()

        for sub, job in recent_verifications:
            activities.append({
                "type": "verification",
                "job_id": job.id,
                "job_title": job.title,
                "message": f"Submission {sub.status.value} with score {sub.verification_score}%",
                "score": sub.verification_score,
                "created_at": sub.verified_at.isoformat() if sub.verified_at else sub.updated_at.isoformat(),
            })

    # Sort by date and limit
    activities.sort(key=lambda x: x["created_at"], reverse=True)
    activities = activities[:limit]

    return {
        "success": True,
        "data": activities
    }


@router.get("/deadlines")
async def get_upcoming_deadlines(
    request: Request,
    days: int = 14,
    db: Session = Depends(get_db),
):
    """Get jobs with upcoming deadlines."""
    current_user = require_auth(request)
    user_id = current_user["user_id"]
    role = current_user.get("role")

    deadline_cutoff = datetime.utcnow() + timedelta(days=days)

    if role == "employer":
        jobs = db.query(Job).filter(
            Job.employer_id == user_id,
            Job.status.in_([JobStatus.IN_PROGRESS, JobStatus.ESCROW_FUNDED]),
            Job.deadline <= deadline_cutoff
        ).order_by(Job.deadline.asc()).all()
    else:
        jobs = db.query(Job).filter(
            Job.assigned_freelancer_id == user_id,
            Job.status.in_([JobStatus.IN_PROGRESS, JobStatus.ESCROW_FUNDED]),
            Job.deadline <= deadline_cutoff
        ).order_by(Job.deadline.asc()).all()

    deadline_list = []
    now = datetime.utcnow()

    for job in jobs:
        days_remaining = (job.deadline - now).days
        hours_remaining = int((job.deadline - now).total_seconds() / 3600)

        deadline_list.append({
            "job_id": job.id,
            "title": job.title,
            "deadline": job.deadline.isoformat(),
            "days_remaining": days_remaining,
            "hours_remaining": hours_remaining,
            "status": job.status.value,
            "is_overdue": job.deadline < now,
            "urgency": "critical" if days_remaining <= 1 else "warning" if days_remaining <= 3 else "normal",
        })

    return {
        "success": True,
        "data": deadline_list
    }


@router.get("/pfi-history")
async def get_pfi_history(
    request: Request,
    db: Session = Depends(get_db),
):
    """Get PFI score history and events that affected it."""
    current_user = require_auth(request)
    user_id = current_user["user_id"]

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get ghost events with penalties
    ghost_events = db.query(GhostEvent).filter(
        GhostEvent.user_id == user_id,
        GhostEvent.pfi_penalty_applied > 0
    ).order_by(GhostEvent.triggered_at.desc()).limit(20).all()

    # Get verified submissions that affected PFI
    submissions = db.query(Submission).filter(
        Submission.freelancer_id == user_id,
        Submission.verification_score.isnot(None)
    ).order_by(Submission.verified_at.desc()).limit(20).all()

    pfi_events = []

    for event in ghost_events:
        pfi_events.append({
            "type": "ghost_penalty",
            "event": event.event_type,
            "change": -event.pfi_penalty_applied,
            "date": event.triggered_at.isoformat(),
            "job_id": event.job_id,
        })

    for sub in submissions:
        if sub.verification_score >= 90:
            change = 0.5
        elif sub.verification_score < 50:
            change = -2.0
        elif sub.verification_score < 70:
            change = -0.5
        else:
            change = 0

        if change != 0:
            pfi_events.append({
                "type": "verification",
                "score": sub.verification_score,
                "change": change,
                "date": sub.verified_at.isoformat() if sub.verified_at else sub.updated_at.isoformat(),
                "job_id": sub.job_id,
            })

    # Sort by date
    pfi_events.sort(key=lambda x: x["date"], reverse=True)

    return {
        "success": True,
        "data": {
            "current_pfi": user.pfi_score,
            "events": pfi_events[:30],
        }
    }
