"""Payment API routes for escrow releases and payment management."""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import (
    Job, JobStatus, Escrow, EscrowStatus, EscrowRelease, Submission, SubmissionStatus,
    User, JobSpec, ChatChannel, ChatMessage, MessageSender
)
from src.schemas import SuccessResponse
from src.utils.logger import api_logger
from src.auth import decode_access_token


router = APIRouter(prefix="/api/jobs", tags=["payments"])


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


def get_user_name(user_id: int, db: Session) -> Optional[str]:
    """Get user name from ID."""
    user = db.query(User).filter(User.id == user_id).first()
    return user.name if user else None


def calculate_milestone_payout(total_budget: float, milestones: list, milestone_id: str) -> float:
    """
    Calculate payout for a specific milestone.

    Distribution: Equal split with 1.5x on final milestone.
    """
    count = len(milestones)
    if count == 0:
        return 0.0

    if count == 1:
        return total_budget

    # Find milestone index
    milestone_index = -1
    for i, m in enumerate(milestones):
        if str(m.get("id")) == str(milestone_id) or str(m.get("order")) == str(milestone_id):
            milestone_index = i
            break

    if milestone_index == -1:
        # Milestone not found, return equal split
        return round(total_budget / count, 2)

    # Calculate base amount (final gets 1.5x)
    # total = (count - 1) * base + 1.5 * base
    # total = base * (count + 0.5)
    base = total_budget / (count + 0.5)

    is_final = milestone_index == count - 1
    return round(base * 1.5 if is_final else base, 2)


@router.post("/{job_id}/submissions/{submission_id}/approve", response_model=SuccessResponse)
async def manual_approve_submission(
    job_id: int,
    submission_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Manually approve a submission and release payment.

    Allows employer to approve PARTIAL or FAILED submissions,
    overriding the AI verification score.
    """
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Only employer can approve
    if job.employer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the employer can approve submissions")

    submission = db.query(Submission).filter(
        Submission.id == submission_id,
        Submission.job_id == job_id
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Can only approve PENDING, PARTIAL, or FAILED submissions
    if submission.status == SubmissionStatus.VERIFIED:
        raise HTTPException(status_code=400, detail="Submission already verified")

    if submission.status not in [SubmissionStatus.PENDING, SubmissionStatus.PARTIAL, SubmissionStatus.FAILED]:
        raise HTTPException(status_code=400, detail="Cannot approve this submission")

    # Get escrow
    escrow = db.query(Escrow).filter(Escrow.job_id == job_id).first()
    if not escrow:
        raise HTTPException(status_code=400, detail="Escrow not found")

    if escrow.status not in [EscrowStatus.FUNDED, EscrowStatus.HELD]:
        raise HTTPException(status_code=400, detail="Escrow not available for release")

    # Get spec for milestone payout calculation
    spec = db.query(JobSpec).filter(JobSpec.job_id == job_id).first()
    milestones = spec.milestones_json if spec else []

    # Calculate payout for this milestone
    payout_amount = calculate_milestone_payout(escrow.amount, milestones, submission.milestone_id)

    # Update submission
    submission.status = SubmissionStatus.VERIFIED
    submission.client_override = True
    submission.verified_at = datetime.utcnow()

    # If no verification was done, set a default report
    if not submission.verification_report_json:
        submission.verification_report_json = {
            "client_override": True,
            "overall_score": None,
            "feedback": "Approved by client override"
        }
    else:
        submission.verification_report_json["client_override"] = True

    # Create escrow release record
    release = EscrowRelease(
        escrow_id=escrow.id,
        milestone_id=submission.milestone_id,
        amount=payout_amount,
        released_at=datetime.utcnow(),
    )
    db.add(release)

    # Update escrow released amount
    escrow.released_amount = round(escrow.released_amount + payout_amount, 2)

    # Update freelancer PFI (smaller boost for manual approval)
    freelancer = db.query(User).filter(User.id == submission.freelancer_id).first()
    freelancer_name = freelancer.name if freelancer else "Freelancer"
    if freelancer:
        current_pfi = freelancer.pfi_score or 90.0
        freelancer.pfi_score = min(100.0, current_pfi + 0.3)

    # Find milestone name
    milestone_name = submission.milestone_id
    for m in milestones:
        if str(m.get("id")) == str(submission.milestone_id) or str(m.get("order")) == str(submission.milestone_id):
            milestone_name = m.get("name", submission.milestone_id)
            break

    # Send Bro message about payment release
    channel = db.query(ChatChannel).filter(ChatChannel.job_id == job_id).first()
    if channel:
        bro_message = ChatMessage(
            channel_id=channel.id,
            sender_id=None,
            sender_type=MessageSender.AI_MEDIATOR,
            content=f"""💰 Payment Released!

Milestone: {milestone_name} has been approved by the employer and payment of ${payout_amount:.2f} has been released to {freelancer_name}.

Great work! 🎉""",
            is_ai_generated=True,
            ai_intervention_type="payment_released",
        )
        db.add(bro_message)

    # Check if all milestones are now verified (job completion)
    all_verified = _check_all_milestones_verified(job_id, spec, db)

    if all_verified:
        escrow.status = EscrowStatus.RELEASED
        escrow.released_at = datetime.utcnow()
        job.status = JobStatus.COMPLETED
        job.completed_at = datetime.utcnow()

        # Send completion message
        if channel:
            _send_completion_message(channel, job, escrow, freelancer_name, db)

    db.commit()

    api_logger.info(f"Manual approval: submission {submission_id}, amount ${payout_amount}")

    return SuccessResponse(data={
        "success": True,
        "submission": {
            "id": submission.id,
            "status": submission.status.value,
            "client_override": True,
            "verified_at": submission.verified_at.isoformat(),
        },
        "payment": {
            "amount": payout_amount,
            "milestone_id": submission.milestone_id,
            "released_at": release.released_at.isoformat(),
        },
        "job_completed": all_verified,
    })


@router.get("/{job_id}/payments", response_model=SuccessResponse)
async def get_job_payments(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Get payment information for a job.

    Shows total budget, released payments, and pending amounts.
    """
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Only employer or assigned freelancer can view
    is_employer = job.employer_id == current_user["user_id"]
    is_freelancer = job.assigned_freelancer_id == current_user["user_id"]

    if not (is_employer or is_freelancer):
        raise HTTPException(status_code=403, detail="You don't have access to this job's payments")

    escrow = db.query(Escrow).filter(Escrow.job_id == job_id).first()
    if not escrow:
        return SuccessResponse(data={
            "job_id": job_id,
            "status": "not_funded",
            "total_budget": 0,
            "total_released": 0,
            "total_pending": 0,
            "releases": [],
        })

    # Get spec for milestone names
    spec = db.query(JobSpec).filter(JobSpec.job_id == job_id).first()
    milestones = spec.milestones_json if spec else []

    # Get all releases
    releases = db.query(EscrowRelease).filter(EscrowRelease.escrow_id == escrow.id).order_by(EscrowRelease.released_at.desc()).all()

    release_list = []
    for release in releases:
        # Find milestone name
        milestone_name = release.milestone_id
        for m in milestones:
            if str(m.get("id")) == str(release.milestone_id) or str(m.get("order")) == str(release.milestone_id):
                milestone_name = m.get("name", release.milestone_id)
                break

        release_list.append({
            "milestone_id": release.milestone_id,
            "milestone_name": milestone_name,
            "amount": release.amount,
            "released_at": release.released_at.isoformat() if release.released_at else None,
        })

    return SuccessResponse(data={
        "job_id": job_id,
        "total_budget": escrow.amount,
        "platform_fee": escrow.platform_fee,
        "total_funded": escrow.total_funded,
        "total_released": escrow.released_amount,
        "total_pending": round(escrow.amount - escrow.released_amount, 2),
        "escrow_status": escrow.status.value,
        "releases": release_list,
    })


def _check_all_milestones_verified(job_id: int, spec: JobSpec, db: Session) -> bool:
    """Check if all milestones have been verified."""
    if not spec or not spec.milestones_json:
        return False

    milestones = spec.milestones_json

    for milestone in milestones:
        milestone_id = str(milestone.get("id") or milestone.get("order"))

        # Find verified submission for this milestone
        verified_submission = db.query(Submission).filter(
            Submission.job_id == job_id,
            Submission.milestone_id == milestone_id,
            Submission.status == SubmissionStatus.VERIFIED
        ).first()

        if not verified_submission:
            return False

    return True


def _send_completion_message(channel: ChatChannel, job: Job, escrow: Escrow, freelancer_name: str, db: Session):
    """Send job completion message via Bro."""
    employer = db.query(User).filter(User.id == job.employer_id).first()
    employer_name = employer.name if employer else "Employer"

    # Calculate days taken
    days_taken = 0
    if job.assigned_at and job.completed_at:
        days_taken = (job.completed_at - job.assigned_at).days

    completion_message = ChatMessage(
        channel_id=channel.id,
        sender_id=None,
        sender_type=MessageSender.AI_MEDIATOR,
        content=f"""🎉 Project Complete!

All milestones have been verified and payments released.

Great job, {employer_name} and {freelancer_name}!

Final stats:
- Total paid: ${escrow.amount:.2f}
- Completed in: {days_taken} days

Thanks for using TrustMeBro! 🤙""",
        is_ai_generated=True,
        ai_intervention_type="job_completed",
    )
    db.add(completion_message)
