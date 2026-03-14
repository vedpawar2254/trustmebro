"""Scheduler API routes for background task processing.

These endpoints are meant to be called by a scheduler (cron, Celery, etc.)
to process time-based events like ghost protocol and auto-approve.
"""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import (
    Job, JobStatus, User, Submission, SubmissionStatus, JobSpec,
    Escrow, EscrowStatus, EscrowRelease
)
from src.services.ghost_protocol import ghost_protocol
from src.utils.deadline import deadline_enforcer
from src.utils.logger import api_logger


router = APIRouter(prefix="/api/scheduler", tags=["scheduler"])


@router.post("/ghost-check")
async def run_ghost_protocol_check(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Run ghost protocol checks for all active jobs.

    This should be called periodically (e.g., every hour) by a scheduler.
    It checks for inactive users and triggers ghost protocol events.
    """
    # In production, this would be protected by an API key
    api_logger.info("Running ghost protocol check...")

    # Get all active jobs (in progress or escrow funded)
    active_jobs = db.query(Job).filter(
        Job.status.in_([JobStatus.IN_PROGRESS, JobStatus.ESCROW_FUNDED])
    ).all()

    results = {
        "jobs_checked": 0,
        "events_triggered": 0,
        "events": [],
    }

    for job in active_jobs:
        results["jobs_checked"] += 1

        # Check employer
        if job.employer_id:
            employer = db.query(User).filter(User.id == job.employer_id).first()
            if employer:
                event_info = ghost_protocol.check_user_activity(job, employer, db)
                if event_info:
                    ghost_protocol.process_ghost_event(job, event_info, db)
                    results["events_triggered"] += 1
                    results["events"].append({
                        "job_id": job.id,
                        "user_id": employer.id,
                        "event_type": event_info["event_type"],
                    })

        # Check freelancer
        if job.assigned_freelancer_id:
            freelancer = db.query(User).filter(User.id == job.assigned_freelancer_id).first()
            if freelancer:
                event_info = ghost_protocol.check_user_activity(job, freelancer, db)
                if event_info:
                    ghost_protocol.process_ghost_event(job, event_info, db)
                    results["events_triggered"] += 1
                    results["events"].append({
                        "job_id": job.id,
                        "user_id": freelancer.id,
                        "event_type": event_info["event_type"],
                    })

    api_logger.info(f"Ghost check complete: {results['events_triggered']} events triggered")

    return {
        "success": True,
        "data": results,
    }


@router.post("/auto-approve-check")
async def run_auto_approve_check(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Run auto-approve checks for pending submissions.

    This should be called periodically (e.g., every hour) by a scheduler.
    It auto-approves submissions that have been pending for > 48 hours.
    """
    api_logger.info("Running auto-approve check...")

    # Get pending submissions eligible for auto-approve
    pending_submissions = deadline_enforcer.get_pending_submissions_for_auto_approve(db)

    results = {
        "submissions_checked": len(pending_submissions),
        "auto_approved": 0,
        "approved_submissions": [],
    }

    for submission in pending_submissions:
        job = db.query(Job).filter(Job.id == submission.job_id).first()
        if not job:
            continue

        # Auto-approve
        result = deadline_enforcer.auto_approve_submission(submission, job, db)

        results["auto_approved"] += 1
        results["approved_submissions"].append({
            "submission_id": submission.id,
            "job_id": job.id,
            "milestone_id": submission.milestone_id,
        })

        # Check if we need to release payment
        spec = db.query(JobSpec).filter(JobSpec.job_id == job.id).first()
        escrow = db.query(Escrow).filter(Escrow.job_id == job.id).first()

        if escrow and escrow.status in [EscrowStatus.FUNDED, EscrowStatus.HELD]:
            # Calculate and release milestone payment
            milestones = spec.milestones_json if spec else []
            release_amount = _calculate_milestone_payout(escrow.amount, milestones, submission.milestone_id)

            release = EscrowRelease(
                escrow_id=escrow.id,
                milestone_id=submission.milestone_id,
                amount=release_amount,
                released_at=datetime.utcnow(),
            )
            db.add(release)
            escrow.released_amount = round(escrow.released_amount + release_amount, 2)
            db.commit()

    api_logger.info(f"Auto-approve check complete: {results['auto_approved']} submissions approved")

    return {
        "success": True,
        "data": results,
    }


@router.post("/deadline-reminders")
async def run_deadline_reminders(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Send deadline reminders for jobs with approaching deadlines.

    This should be called daily by a scheduler.
    Sends reminders at 7 days, 3 days, and 1 day before deadline.
    """
    api_logger.info("Running deadline reminder check...")

    results = {
        "reminders_sent": 0,
        "jobs": [],
    }

    # Check for jobs with deadlines in 7, 3, or 1 days
    for days in [7, 3, 1]:
        jobs = deadline_enforcer.get_jobs_approaching_deadline(days, db)

        # Filter to jobs that are exactly at this threshold
        for job in jobs:
            days_remaining = (job.deadline - datetime.utcnow()).days

            if days_remaining == days:
                deadline_enforcer.send_deadline_reminder(job, days, db)
                results["reminders_sent"] += 1
                results["jobs"].append({
                    "job_id": job.id,
                    "title": job.title,
                    "days_remaining": days,
                })

    api_logger.info(f"Deadline reminder check complete: {results['reminders_sent']} reminders sent")

    return {
        "success": True,
        "data": results,
    }


@router.get("/status")
async def get_scheduler_status(
    db: Session = Depends(get_db),
):
    """
    Get overall status for scheduler monitoring.

    Returns counts of items that need processing.
    """
    # Count active jobs
    active_jobs = db.query(Job).filter(
        Job.status.in_([JobStatus.IN_PROGRESS, JobStatus.ESCROW_FUNDED])
    ).count()

    # Count pending submissions
    pending_submissions = db.query(Submission).filter(
        Submission.status == SubmissionStatus.PENDING
    ).count()

    # Count auto-approve eligible
    auto_approve_eligible = len(deadline_enforcer.get_pending_submissions_for_auto_approve(db))

    # Count jobs with approaching deadlines (7 days)
    approaching_deadlines = len(deadline_enforcer.get_jobs_approaching_deadline(7, db))

    return {
        "success": True,
        "data": {
            "active_jobs": active_jobs,
            "pending_submissions": pending_submissions,
            "auto_approve_eligible": auto_approve_eligible,
            "approaching_deadlines": approaching_deadlines,
            "timestamp": datetime.utcnow().isoformat(),
        }
    }


def _calculate_milestone_payout(total_budget: float, milestones: list, milestone_id: str) -> float:
    """Calculate payout for a specific milestone."""
    count = len(milestones)
    if count == 0:
        return 0.0

    if count == 1:
        return total_budget

    milestone_index = -1
    for i, m in enumerate(milestones):
        if str(m.get("id")) == str(milestone_id) or str(m.get("order")) == str(milestone_id):
            milestone_index = i
            break

    if milestone_index == -1:
        return round(total_budget / count, 2)

    base = total_budget / (count + 0.5)
    is_final = milestone_index == count - 1
    return round(base * 1.5 if is_final else base, 2)
