"""Ghost Protocol service for handling unresponsive users.

Ghost Protocol Timeline:
- 24h: First warning sent via Bro AI
- 48h: Second warning with PFI penalty preview
- 72h: Third warning, -5 PFI penalty applied
- 7 days: Account flagged as ghost, significant PFI penalty (-15)

This service checks for inactive users and triggers appropriate actions.
"""
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from src.models import (
    Job, JobStatus, User, UserRole, ChatChannel, ChatMessage, MessageSender,
    GhostEvent, Escrow, EscrowStatus
)
from src.services.email_service import email_service
from src.utils.logger import api_logger


class GhostProtocol:
    """Ghost protocol handler for tracking and penalizing unresponsive users."""

    # Time thresholds
    WARNING_24H = timedelta(hours=24)
    WARNING_48H = timedelta(hours=48)
    WARNING_72H = timedelta(hours=72)
    GHOST_7D = timedelta(days=7)

    # PFI penalties
    PENALTY_72H = 5.0
    PENALTY_7D = 15.0

    def __init__(self):
        """Initialize ghost protocol service."""
        self.logger = api_logger

    def check_user_activity(
        self,
        job: Job,
        user: User,
        db: Session,
    ) -> Optional[Dict[str, Any]]:
        """
        Check if a user has been inactive and determine ghost status.

        Args:
            job: The job to check activity for
            user: The user to check
            db: Database session

        Returns:
            Dict with ghost event info if action needed, None otherwise
        """
        if not job.chat_channel:
            return None

        channel = job.chat_channel
        is_employer = user.id == job.employer_id
        user_role = UserRole.EMPLOYER if is_employer else UserRole.FREELANCER

        # Get the last message from this user
        last_message = db.query(ChatMessage).filter(
            ChatMessage.channel_id == channel.id,
            ChatMessage.sender_id == user.id,
        ).order_by(ChatMessage.created_at.desc()).first()

        # If no messages, use channel creation time
        last_activity = last_message.created_at if last_message else channel.created_at
        now = datetime.utcnow()
        inactive_duration = now - last_activity

        # Check existing ghost events
        latest_event = db.query(GhostEvent).filter(
            GhostEvent.job_id == job.id,
            GhostEvent.user_id == user.id,
            GhostEvent.is_resolved == False,
        ).order_by(GhostEvent.triggered_at.desc()).first()

        # Determine what action to take
        if inactive_duration >= self.GHOST_7D:
            if not latest_event or latest_event.event_type != "ghost_7d":
                return {
                    "event_type": "ghost_7d",
                    "user_id": user.id,
                    "user_role": user_role,
                    "inactive_hours": int(inactive_duration.total_seconds() / 3600),
                    "penalty": self.PENALTY_7D,
                }
        elif inactive_duration >= self.WARNING_72H:
            if not latest_event or latest_event.event_type not in ["warning_72h", "ghost_7d"]:
                return {
                    "event_type": "warning_72h",
                    "user_id": user.id,
                    "user_role": user_role,
                    "inactive_hours": int(inactive_duration.total_seconds() / 3600),
                    "penalty": self.PENALTY_72H,
                }
        elif inactive_duration >= self.WARNING_48H:
            if not latest_event or latest_event.event_type not in ["warning_48h", "warning_72h", "ghost_7d"]:
                return {
                    "event_type": "warning_48h",
                    "user_id": user.id,
                    "user_role": user_role,
                    "inactive_hours": int(inactive_duration.total_seconds() / 3600),
                    "penalty": 0,
                }
        elif inactive_duration >= self.WARNING_24H:
            if not latest_event:
                return {
                    "event_type": "warning_24h",
                    "user_id": user.id,
                    "user_role": user_role,
                    "inactive_hours": int(inactive_duration.total_seconds() / 3600),
                    "penalty": 0,
                }

        return None

    def process_ghost_event(
        self,
        job: Job,
        event_info: Dict[str, Any],
        db: Session,
    ) -> GhostEvent:
        """
        Process a ghost event - create record, apply penalty, send notifications.

        Args:
            job: The job associated with the event
            event_info: Event information from check_user_activity
            db: Database session

        Returns:
            Created GhostEvent
        """
        user = db.query(User).filter(User.id == event_info["user_id"]).first()
        if not user:
            raise ValueError(f"User not found: {event_info['user_id']}")

        # Create ghost event record
        ghost_event = GhostEvent(
            job_id=job.id,
            user_id=user.id,
            user_role=event_info["user_role"],
            event_type=event_info["event_type"],
            pfi_penalty_applied=event_info["penalty"],
        )
        db.add(ghost_event)

        # Apply PFI penalty if applicable
        if event_info["penalty"] > 0:
            user.pfi_score = max(0, (user.pfi_score or 90) - event_info["penalty"])
            self.logger.info(
                f"Applied PFI penalty of {event_info['penalty']} to user {user.id}, "
                f"new score: {user.pfi_score}"
            )

        # Send Bro message
        self._send_ghost_warning(job, user, event_info, db)

        # Send email notification
        self._send_ghost_email(job, user, event_info)

        # Handle 7-day ghost (severe action)
        if event_info["event_type"] == "ghost_7d":
            self._handle_severe_ghost(job, user, db)

        db.commit()
        db.refresh(ghost_event)

        self.logger.info(
            f"Ghost event {event_info['event_type']} processed for user {user.id} on job {job.id}"
        )

        return ghost_event

    def _send_ghost_warning(
        self,
        job: Job,
        user: User,
        event_info: Dict[str, Any],
        db: Session,
    ) -> None:
        """Send Bro message warning about inactivity."""
        channel = job.chat_channel
        if not channel:
            return

        messages = {
            "warning_24h": f"""⏰ Activity Reminder

Hey {user.name}, it's been {event_info['inactive_hours']} hours since your last message in this project.

Please check in and respond to keep the project moving forward. Regular communication helps both parties stay aligned!""",

            "warning_48h": f"""⚠️ 48-Hour Inactivity Warning

{user.name}, you haven't responded in {event_info['inactive_hours']} hours.

If you don't respond within the next 24 hours, a PFI penalty of -{self.PENALTY_72H} points will be applied to your account.

Please respond as soon as possible to avoid penalties.""",

            "warning_72h": f"""🚨 72-Hour Warning - PFI Penalty Applied

{user.name}, due to {event_info['inactive_hours']} hours of inactivity, a penalty of -{event_info['penalty']} PFI points has been applied.

Current PFI: {user.pfi_score}

If you remain unresponsive for 7 days total, your account may be flagged and a larger penalty will apply.

Please respond immediately.""",

            "ghost_7d": f"""🔴 Ghost Protocol Activated

{user.name} has been unresponsive for {event_info['inactive_hours']} hours.

A penalty of -{event_info['penalty']} PFI points has been applied.
Current PFI: {user.pfi_score}

The other party may now request escrow action or dispute resolution.""",
        }

        message_content = messages.get(event_info["event_type"], "Inactivity detected.")

        bro_message = ChatMessage(
            channel_id=channel.id,
            sender_id=None,
            sender_type=MessageSender.AI_MEDIATOR,
            content=message_content,
            is_ai_generated=True,
            ai_intervention_type=f"ghost_{event_info['event_type']}",
        )
        db.add(bro_message)

    def _send_ghost_email(
        self,
        job: Job,
        user: User,
        event_info: Dict[str, Any],
    ) -> None:
        """Send email notification about ghost status."""
        subject_map = {
            "warning_24h": f"Reminder: Please respond to your project - {job.title}",
            "warning_48h": f"Warning: 48 hours of inactivity - {job.title}",
            "warning_72h": f"Alert: PFI penalty applied due to inactivity - {job.title}",
            "ghost_7d": f"Critical: Ghost protocol activated - {job.title}",
        }

        subject = subject_map.get(event_info["event_type"], f"Activity required - {job.title}")

        # Use email service (simplified - in production would have proper templates)
        email_service._send_email(
            to_email=user.email,
            subject=subject,
            html_content=f"""
            <h2>Activity Required on Your Project</h2>
            <p>Hello {user.name},</p>
            <p>You have been inactive on the project "{job.title}" for {event_info['inactive_hours']} hours.</p>
            {"<p>A PFI penalty has been applied to your account.</p>" if event_info['penalty'] > 0 else ""}
            <p>Please log in and respond to keep your project on track.</p>
            <p>- The TrustMeBro Team</p>
            """,
        )

    def _handle_severe_ghost(
        self,
        job: Job,
        user: User,
        db: Session,
    ) -> None:
        """Handle severe ghost case (7 days)."""
        is_freelancer = user.id == job.assigned_freelancer_id

        if is_freelancer:
            # Allow employer to take action
            self.logger.warning(
                f"Freelancer {user.id} marked as ghost on job {job.id}. "
                f"Employer can now request refund or dispute."
            )
        else:
            # Employer ghost - freelancer may request payment release
            self.logger.warning(
                f"Employer {user.id} marked as ghost on job {job.id}. "
                f"Freelancer can request payment release after verified work."
            )

    def resolve_ghost_status(
        self,
        job_id: int,
        user_id: int,
        db: Session,
    ) -> bool:
        """
        Resolve ghost status when user becomes active.

        Args:
            job_id: Job ID
            user_id: User ID who became active
            db: Database session

        Returns:
            True if ghost events were resolved
        """
        # Mark all unresolved ghost events as resolved
        events = db.query(GhostEvent).filter(
            GhostEvent.job_id == job_id,
            GhostEvent.user_id == user_id,
            GhostEvent.is_resolved == False,
        ).all()

        if not events:
            return False

        for event in events:
            event.is_resolved = True
            event.acknowledged_at = datetime.utcnow()

        db.commit()

        self.logger.info(f"Resolved {len(events)} ghost events for user {user_id} on job {job_id}")
        return True

    def get_ghost_status(
        self,
        job_id: int,
        db: Session,
    ) -> Dict[str, Any]:
        """
        Get current ghost status for a job.

        Args:
            job_id: Job ID
            db: Database session

        Returns:
            Dict with ghost status for both parties
        """
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return {"error": "Job not found"}

        employer_events = db.query(GhostEvent).filter(
            GhostEvent.job_id == job_id,
            GhostEvent.user_id == job.employer_id,
            GhostEvent.is_resolved == False,
        ).all()

        freelancer_events = db.query(GhostEvent).filter(
            GhostEvent.job_id == job_id,
            GhostEvent.user_id == job.assigned_freelancer_id,
            GhostEvent.is_resolved == False,
        ).all()

        return {
            "job_id": job_id,
            "employer": {
                "has_warnings": len(employer_events) > 0,
                "latest_event": employer_events[-1].event_type if employer_events else None,
                "total_penalties": sum(e.pfi_penalty_applied for e in employer_events),
            },
            "freelancer": {
                "has_warnings": len(freelancer_events) > 0,
                "latest_event": freelancer_events[-1].event_type if freelancer_events else None,
                "total_penalties": sum(e.pfi_penalty_applied for e in freelancer_events),
            },
        }


# Singleton instance
ghost_protocol = GhostProtocol()
