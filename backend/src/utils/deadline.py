"""Deadline enforcement utilities.

Deadline Policies:
- Grace period: 48 hours after deadline for final submissions
- Auto-approve: If employer doesn't verify within 48 hours of submission, auto-approve
- Deadline warnings: Bro sends reminders at 7 days, 3 days, 1 day before deadline
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from src.models import (
    Job, JobStatus, Submission, SubmissionStatus, JobSpec,
    ChatChannel, ChatMessage, MessageSender, User
)
from src.utils.logger import api_logger


# Deadline configuration
GRACE_PERIOD_HOURS = 48
AUTO_APPROVE_HOURS = 48  # Auto-approve if employer doesn't verify within this time


class DeadlineEnforcer:
    """Deadline enforcement handler."""

    def __init__(self):
        """Initialize deadline enforcer."""
        self.logger = api_logger

    def check_deadline_status(
        self,
        job: Job,
        db: Session,
    ) -> Dict[str, Any]:
        """
        Check the deadline status for a job.

        Args:
            job: Job to check
            db: Database session

        Returns:
            Dict with deadline status info
        """
        now = datetime.utcnow()
        deadline = job.deadline
        grace_period_end = deadline + timedelta(hours=GRACE_PERIOD_HOURS)

        # Calculate time remaining
        time_to_deadline = deadline - now
        time_to_grace_end = grace_period_end - now

        return {
            "job_id": job.id,
            "deadline": deadline.isoformat(),
            "grace_period_end": grace_period_end.isoformat(),
            "is_before_deadline": now < deadline,
            "is_in_grace_period": deadline <= now < grace_period_end,
            "is_past_grace_period": now >= grace_period_end,
            "hours_to_deadline": max(0, int(time_to_deadline.total_seconds() / 3600)),
            "hours_to_grace_end": max(0, int(time_to_grace_end.total_seconds() / 3600)),
            "days_to_deadline": max(0, time_to_deadline.days),
        }

    def can_submit_work(
        self,
        job: Job,
        db: Session,
    ) -> tuple[bool, str]:
        """
        Check if work can still be submitted for a job.

        Args:
            job: Job to check
            db: Database session

        Returns:
            Tuple of (can_submit, reason)
        """
        status = self.check_deadline_status(job, db)

        if status["is_before_deadline"]:
            return True, "Within deadline"

        if status["is_in_grace_period"]:
            return True, f"Grace period active ({status['hours_to_grace_end']} hours remaining)"

        return False, "Past grace period - deadline has expired"

    def check_auto_approve(
        self,
        submission: Submission,
        db: Session,
    ) -> bool:
        """
        Check if a submission should be auto-approved due to employer inactivity.

        Args:
            submission: Submission to check
            db: Database session

        Returns:
            True if should auto-approve
        """
        if submission.status != SubmissionStatus.PENDING:
            return False

        # Check if submission has been pending for more than AUTO_APPROVE_HOURS
        now = datetime.utcnow()
        pending_duration = now - submission.created_at

        if pending_duration.total_seconds() / 3600 >= AUTO_APPROVE_HOURS:
            return True

        return False

    def auto_approve_submission(
        self,
        submission: Submission,
        job: Job,
        db: Session,
    ) -> Dict[str, Any]:
        """
        Auto-approve a submission due to employer inactivity.

        Args:
            submission: Submission to auto-approve
            job: Associated job
            db: Database session

        Returns:
            Dict with auto-approve result
        """
        submission.status = SubmissionStatus.VERIFIED
        submission.verification_score = 90.0  # Default passing score
        submission.verified_at = datetime.utcnow()
        submission.verification_report_json = {
            "auto_approved": True,
            "reason": "Employer did not verify within 48 hours",
            "approval_type": "deadline_enforcement",
        }

        # Send Bro message
        channel = db.query(ChatChannel).filter(ChatChannel.job_id == job.id).first()
        if channel:
            bro_message = ChatMessage(
                channel_id=channel.id,
                sender_id=None,
                sender_type=MessageSender.AI_MEDIATOR,
                content=f"""✅ Auto-Approval Applied

Milestone submission has been automatically approved because the employer did not review it within 48 hours.

Score: 90% (Default passing score)

The freelancer's payment for this milestone will be processed.""",
                is_ai_generated=True,
                ai_intervention_type="auto_approve",
            )
            db.add(bro_message)

        db.commit()

        self.logger.info(
            f"Submission {submission.id} auto-approved due to employer inactivity"
        )

        return {
            "submission_id": submission.id,
            "status": "auto_approved",
            "score": 90.0,
            "reason": "Employer did not verify within 48 hours",
        }

    def send_deadline_reminder(
        self,
        job: Job,
        days_remaining: int,
        db: Session,
    ) -> None:
        """
        Send deadline reminder via Bro.

        Args:
            job: Job with approaching deadline
            days_remaining: Days until deadline
            db: Database session
        """
        channel = db.query(ChatChannel).filter(ChatChannel.job_id == job.id).first()
        if not channel:
            return

        # Get freelancer name
        freelancer = db.query(User).filter(User.id == job.assigned_freelancer_id).first()
        freelancer_name = freelancer.name if freelancer else "Freelancer"

        urgency_emoji = "⚠️" if days_remaining <= 1 else "📅"

        message = f"""{urgency_emoji} Deadline Reminder

{freelancer_name}, the deadline for "{job.title}" is in {days_remaining} day(s)!

Deadline: {job.deadline.strftime('%B %d, %Y at %H:%M UTC')}

Please ensure all milestones are submitted before the deadline. A 48-hour grace period is available for final submissions."""

        if days_remaining <= 1:
            message += "\n\n🔴 This is your final reminder!"

        bro_message = ChatMessage(
            channel_id=channel.id,
            sender_id=None,
            sender_type=MessageSender.AI_MEDIATOR,
            content=message,
            is_ai_generated=True,
            ai_intervention_type=f"deadline_reminder_{days_remaining}d",
        )
        db.add(bro_message)
        db.commit()

        self.logger.info(f"Sent {days_remaining}-day deadline reminder for job {job.id}")

    def get_jobs_approaching_deadline(
        self,
        days: int,
        db: Session,
    ) -> list[Job]:
        """
        Get jobs with deadlines within the specified number of days.

        Args:
            days: Number of days to look ahead
            db: Database session

        Returns:
            List of jobs with approaching deadlines
        """
        now = datetime.utcnow()
        cutoff = now + timedelta(days=days)

        jobs = db.query(Job).filter(
            Job.status.in_([JobStatus.IN_PROGRESS, JobStatus.ESCROW_FUNDED]),
            Job.deadline > now,
            Job.deadline <= cutoff
        ).all()

        return jobs

    def get_pending_submissions_for_auto_approve(
        self,
        db: Session,
    ) -> list[Submission]:
        """
        Get submissions that are pending and eligible for auto-approval.

        Args:
            db: Database session

        Returns:
            List of submissions eligible for auto-approval
        """
        cutoff = datetime.utcnow() - timedelta(hours=AUTO_APPROVE_HOURS)

        submissions = db.query(Submission).filter(
            Submission.status == SubmissionStatus.PENDING,
            Submission.created_at <= cutoff
        ).all()

        return submissions


# Singleton instance
deadline_enforcer = DeadlineEnforcer()
