"""Escrow and submission API routes."""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import httpx

from src.database import get_db
from src.models import (
    Job, JobStatus, Escrow, EscrowStatus, EscrowRelease, Submission, SubmissionStatus,
    User, JobSpec, Bid, BidStatus, ChatChannel, ChatMessage, MessageSender
)
from src.schemas import (
    FundEscrowRequest, CreateSubmissionRequest, ResubmitRequest,
    EscrowResponse, SubmissionResponse, SuccessResponse
)
from src.utils.logger import api_logger
from src.auth import decode_access_token
from src.config import settings
from src.services.email_service import email_service
from src.utils.enforcement import enforce_escrow_requirements, enforce_submission_requirements
from src.utils.deadline import deadline_enforcer


router = APIRouter(prefix="/api/jobs", tags=["escrow", "submissions"])


def get_current_user(request: Request) -> Optional[dict]:
    """Get current user from JWT token."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    return decode_access_token(token)


def require_auth(request: Request) -> dict:
    """Require authentication - raises if not authenticated."""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


# ============== ESCROW ROUTES ==============

@router.post("/{job_id}/escrow", response_model=SuccessResponse)
async def fund_escrow(
    job_id: int,
    escrow_data: FundEscrowRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Fund escrow for a job (employer only)."""
    current_user = require_auth(request)

    if current_user.get("role") != "employer":
        raise HTTPException(status_code=403, detail="Only employers can fund escrow")

    # Get user and enforce requirements (email verified, PFI >= 20)
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    enforce_escrow_requirements(user, db)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.employer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You are not the owner of this job")

    if job.status != JobStatus.ASSIGNED:
        raise HTTPException(status_code=400, detail="Job must be assigned before funding escrow")

    # Check spec is locked (mutual agreement required)
    spec = db.query(JobSpec).filter(JobSpec.job_id == job_id).first()
    if not spec or not spec.is_locked:
        raise HTTPException(
            status_code=400,
            detail="Spec must be locked by both parties before funding escrow. Both employer and freelancer must call /spec/lock."
        )

    existing_escrow = db.query(Escrow).filter(Escrow.job_id == job_id).first()
    if existing_escrow:
        raise HTTPException(status_code=409, detail="Escrow already exists for this job")

    # Validate amount against job budget
    if escrow_data.amount < job.budget_min:
        raise HTTPException(
            status_code=400,
            detail=f"Escrow amount must be at least the minimum budget: ${job.budget_min}"
        )

    # Calculate platform fee (10%)
    platform_fee = round(escrow_data.amount * 0.10, 2)
    total_funded = round(escrow_data.amount + platform_fee, 2)

    new_escrow = Escrow(
        job_id=job_id,
        amount=escrow_data.amount,
        platform_fee=platform_fee,
        total_funded=total_funded,
        released_amount=0.0,
        status=EscrowStatus.FUNDED,
        funded_at=datetime.utcnow(),
    )
    db.add(new_escrow)

    job.status = JobStatus.ESCROW_FUNDED

    # Send Bro message about escrow funding
    channel = db.query(ChatChannel).filter(ChatChannel.job_id == job_id).first()
    if channel:
        # Get freelancer name
        freelancer = db.query(User).filter(User.id == job.assigned_freelancer_id).first()
        freelancer_name = freelancer.name if freelancer else "Freelancer"

        # Get first milestone name
        spec = db.query(JobSpec).filter(JobSpec.job_id == job_id).first()
        first_milestone = spec.milestones_json[0] if spec and spec.milestones_json else {"name": "First milestone"}

        bro_message = ChatMessage(
            channel_id=channel.id,
            sender_id=None,
            sender_type=MessageSender.AI_MEDIATOR,
            content=f"""💰 Escrow funded!

The employer has funded ${escrow_data.amount:.2f} to escrow. The project is ready to begin!

{freelancer_name}, you can now start working on Milestone 1: {first_milestone.get('name', 'First deliverable')}
Deadline: {job.deadline.strftime('%B %d, %Y') if job.deadline else 'TBD'}

Good luck! 🚀""",
            is_ai_generated=True,
            ai_intervention_type="escrow_funded",
        )
        db.add(bro_message)

    db.commit()
    db.refresh(new_escrow)

    # Send email notification to freelancer
    freelancer = db.query(User).filter(User.id == job.assigned_freelancer_id).first()
    if freelancer:
        email_service.send_escrow_funded_notification(
            to_email=freelancer.email,
            freelancer_name=freelancer.name,
            job_title=job.title,
            job_id=job_id,
            amount=escrow_data.amount
        )

    api_logger.info(f"Escrow {new_escrow.id} funded for job {job_id} with ${escrow_data.amount} (fee: ${platform_fee})")

    return SuccessResponse(data={
        "escrow_id": new_escrow.id,
        "job_id": job_id,
        "amount": new_escrow.amount,
        "platform_fee": new_escrow.platform_fee,
        "total_funded": new_escrow.total_funded,
        "currency": new_escrow.currency,
        "status": new_escrow.status.value,
        "funded_at": new_escrow.funded_at.isoformat(),
    })


@router.get("/{job_id}/escrow", response_model=SuccessResponse)
async def get_escrow_status(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Get escrow status for a job."""
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Only employer or assigned freelancer can view escrow
    is_employer = job.employer_id == current_user["user_id"]
    is_freelancer = job.assigned_freelancer_id == current_user["user_id"]
    if not (is_employer or is_freelancer):
        raise HTTPException(status_code=403, detail="You don't have access to this escrow")

    escrow = db.query(Escrow).filter(Escrow.job_id == job_id).first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")

    # Get milestone releases
    releases = db.query(EscrowRelease).filter(EscrowRelease.escrow_id == escrow.id).all()
    release_list = [
        {
            "milestone_id": r.milestone_id,
            "amount": r.amount,
            "released_at": r.released_at.isoformat() if r.released_at else None,
        }
        for r in releases
    ]

    return SuccessResponse(data={
        "escrow_id": escrow.id,
        "job_id": job_id,
        "amount": escrow.amount,
        "platform_fee": escrow.platform_fee,
        "total_funded": escrow.total_funded,
        "released_amount": escrow.released_amount,
        "pending_amount": round(escrow.amount - escrow.released_amount, 2),
        "currency": escrow.currency,
        "status": escrow.status.value,
        "funded_at": escrow.funded_at.isoformat() if escrow.funded_at else None,
        "released_at": escrow.released_at.isoformat() if escrow.released_at else None,
        "refunded_at": escrow.refunded_at.isoformat() if escrow.refunded_at else None,
        "releases": release_list,
    })


@router.post("/{job_id}/escrow/release", response_model=SuccessResponse)
async def release_escrow(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Release escrow to freelancer.

    Auto-released when all milestones verified with ≥90% score.
    Can also be manually released by employer.
    """
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Only employer can manually release
    if job.employer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the employer can release escrow")

    escrow = db.query(Escrow).filter(Escrow.job_id == job_id).first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")

    if escrow.status == EscrowStatus.RELEASED:
        raise HTTPException(status_code=400, detail="Escrow already released")

    if escrow.status == EscrowStatus.REFUNDED:
        raise HTTPException(status_code=400, detail="Escrow was refunded")

    # Release the escrow
    escrow.status = EscrowStatus.RELEASED
    escrow.released_at = datetime.utcnow()

    # Mark job as completed
    job.status = JobStatus.COMPLETED
    job.completed_at = datetime.utcnow()

    # Update freelancer PFI score (boost for successful completion)
    freelancer = db.query(User).filter(User.id == job.assigned_freelancer_id).first()
    if freelancer:
        current_pfi = freelancer.pfi_score or 90.0
        freelancer.pfi_score = min(100.0, current_pfi + 1.0)  # +1 for completion

    db.commit()

    api_logger.info(f"Escrow released for job {job_id} to freelancer {job.assigned_freelancer_id}")

    return SuccessResponse(
        data={
            "escrow_id": escrow.id,
            "status": escrow.status.value,
            "released_at": escrow.released_at.isoformat(),
            "job_status": job.status.value,
        },
        message="Escrow released successfully"
    )


@router.post("/{job_id}/escrow/refund", response_model=SuccessResponse)
async def refund_escrow(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Refund escrow to employer.

    RESTRICTED: Direct refunds are only allowed when:
    - No work has been submitted yet (job status = ESCROW_FUNDED, no submissions)
    - Or a dispute has been resolved in employer's favor

    For other cases, use the dispute resolution process.
    """
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.employer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the employer can request refund")

    escrow = db.query(Escrow).filter(Escrow.job_id == job_id).first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")

    if escrow.status == EscrowStatus.RELEASED:
        raise HTTPException(status_code=400, detail="Cannot refund - escrow already released")

    if escrow.status == EscrowStatus.REFUNDED:
        raise HTTPException(status_code=400, detail="Escrow already refunded")

    # Check if direct refund is allowed
    submissions = db.query(Submission).filter(Submission.job_id == job_id).count()

    if submissions > 0 and job.status != JobStatus.DISPUTED:
        raise HTTPException(
            status_code=400,
            detail="Work has been submitted. You must open a dispute to request a refund. Use POST /api/jobs/{job_id}/dispute"
        )

    # Direct refund allowed (no work submitted)
    escrow.status = EscrowStatus.REFUNDED
    escrow.refunded_at = datetime.utcnow()

    # Update job status appropriately
    if submissions == 0:
        # No work done - cancel the job
        job.status = JobStatus.DRAFT  # Reset to draft
    else:
        job.status = JobStatus.DISPUTED

    db.commit()

    api_logger.info(f"Escrow refunded for job {job_id}")

    return SuccessResponse(
        data={
            "escrow_id": escrow.id,
            "status": escrow.status.value,
            "refunded_at": escrow.refunded_at.isoformat(),
        },
        message="Escrow refunded successfully"
    )


# ============== SUBMISSION ROUTES ==============

@router.post("/{job_id}/submissions", response_model=SuccessResponse)
async def submit_work(
    job_id: int,
    submission_data: CreateSubmissionRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Submit work for a milestone (freelancer only)."""
    current_user = require_auth(request)

    if current_user.get("role") != "freelancer":
        raise HTTPException(status_code=403, detail="Only freelancers can submit work")

    # Get user and enforce requirements (email verified, PFI >= 20)
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    enforce_submission_requirements(user, db)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Verify user is the assigned freelancer
    if job.assigned_freelancer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You are not assigned to this job")

    if job.status not in [JobStatus.ESCROW_FUNDED, JobStatus.IN_PROGRESS]:
        raise HTTPException(status_code=400, detail="Job is not in a submittable state")

    # Check deadline (with grace period)
    can_submit, reason = deadline_enforcer.can_submit_work(job, db)
    if not can_submit:
        raise HTTPException(status_code=400, detail=f"Cannot submit work: {reason}")

    # Check if there's already a pending submission for this milestone
    existing = db.query(Submission).filter(
        Submission.job_id == job_id,
        Submission.milestone_id == submission_data.milestone_id,
        Submission.status == SubmissionStatus.PENDING
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="A pending submission already exists for this milestone. Wait for verification or resubmit."
        )

    new_submission = Submission(
        job_id=job_id,
        milestone_id=submission_data.milestone_id,
        freelancer_id=current_user["user_id"],
        submission_type=submission_data.submission_type.value,
        github_link=submission_data.github_link,
        file_urls=submission_data.file_urls,
        text_content=submission_data.text_content,
        source_document_url=submission_data.source_document_url,
        status=SubmissionStatus.PENDING,
    )
    db.add(new_submission)

    # Update job status to IN_PROGRESS on first submission
    if job.status == JobStatus.ESCROW_FUNDED:
        job.status = JobStatus.IN_PROGRESS

    db.commit()
    db.refresh(new_submission)

    api_logger.info(f"Submission {new_submission.id} created for job {job_id}, milestone {submission_data.milestone_id}")

    # Send email notification to employer
    employer = db.query(User).filter(User.id == job.employer_id).first()
    freelancer = db.query(User).filter(User.id == current_user["user_id"]).first()
    spec = db.query(JobSpec).filter(JobSpec.job_id == job_id).first()

    # Get milestone name
    milestone_name = submission_data.milestone_id
    if spec and spec.milestones_json:
        for m in spec.milestones_json:
            if str(m.get("id")) == str(submission_data.milestone_id) or str(m.get("order")) == str(submission_data.milestone_id):
                milestone_name = m.get("name", submission_data.milestone_id)
                break

    if employer and freelancer:
        email_service.send_submission_notification(
            to_email=employer.email,
            employer_name=employer.name,
            freelancer_name=freelancer.name,
            job_title=job.title,
            job_id=job_id,
            milestone_name=milestone_name
        )

    return SuccessResponse(data={
        "submission_id": new_submission.id,
        "job_id": job_id,
        "milestone_id": new_submission.milestone_id,
        "submission_type": new_submission.submission_type,
        "status": new_submission.status.value,
        "resubmissions_remaining": new_submission.resubmissions_remaining,
        "created_at": new_submission.created_at.isoformat(),
    })


@router.get("/{job_id}/submissions", response_model=SuccessResponse)
async def get_job_submissions(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Get all submissions for a job."""
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Only employer or assigned freelancer can view submissions
    is_employer = job.employer_id == current_user["user_id"]
    is_freelancer = job.assigned_freelancer_id == current_user["user_id"]
    if not (is_employer or is_freelancer):
        raise HTTPException(status_code=403, detail="You don't have access to this job's submissions")

    submissions = db.query(Submission).filter(Submission.job_id == job_id).order_by(Submission.created_at.desc()).all()

    submission_list = []
    for sub in submissions:
        submission_list.append({
            "submission_id": sub.id,
            "milestone_id": sub.milestone_id,
            "submission_type": sub.submission_type,
            "status": sub.status.value if isinstance(sub.status, SubmissionStatus) else sub.status,
            "verification_score": sub.verification_score,
            "resubmission_count": sub.resubmission_count,
            "resubmissions_remaining": sub.resubmissions_remaining,
            "created_at": sub.created_at.isoformat(),
            "verified_at": sub.verified_at.isoformat() if sub.verified_at else None,
        })

    return SuccessResponse(data=submission_list)


@router.get("/{job_id}/submissions/{submission_id}", response_model=SuccessResponse)
async def get_submission(
    job_id: int,
    submission_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Get submission details with verification report."""
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    submission = db.query(Submission).filter(
        Submission.id == submission_id,
        Submission.job_id == job_id
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Only employer or submitting freelancer can view
    is_employer = job.employer_id == current_user["user_id"]
    is_freelancer = submission.freelancer_id == current_user["user_id"]
    if not (is_employer or is_freelancer):
        raise HTTPException(status_code=403, detail="You don't have access to this submission")

    return SuccessResponse(data={
        "submission_id": submission.id,
        "job_id": job_id,
        "milestone_id": submission.milestone_id,
        "freelancer_id": submission.freelancer_id,
        "submission_type": submission.submission_type,
        "github_link": submission.github_link,
        "file_urls": submission.file_urls,
        "text_content": submission.text_content,
        "source_document_url": submission.source_document_url,
        "status": submission.status.value if isinstance(submission.status, SubmissionStatus) else submission.status,
        "verification_score": submission.verification_score,
        "verification_report": submission.verification_report_json,
        "resubmission_count": submission.resubmission_count,
        "resubmissions_remaining": submission.resubmissions_remaining,
        "created_at": submission.created_at.isoformat(),
        "updated_at": submission.updated_at.isoformat(),
        "verified_at": submission.verified_at.isoformat() if submission.verified_at else None,
    })


@router.post("/{job_id}/submissions/{submission_id}/verify", response_model=SuccessResponse)
async def verify_submission(
    job_id: int,
    submission_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Trigger verification for a submission.

    Calls the AI engine to verify the submission against the job spec.
    Updates submission status and handles auto-release if score ≥90%.
    """
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    submission = db.query(Submission).filter(
        Submission.id == submission_id,
        Submission.job_id == job_id
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Only employer can trigger verification
    if job.employer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the employer can trigger verification")

    if submission.status != SubmissionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Submission already verified or not pending")

    # Get job spec for verification criteria
    spec = db.query(JobSpec).filter(JobSpec.job_id == job_id).first()
    if not spec:
        raise HTTPException(status_code=400, detail="Job spec not found")

    # Find the milestone criteria
    milestone_data = None
    for m in spec.milestones_json:
        if m.get("id") == submission.milestone_id or str(m.get("order")) == submission.milestone_id:
            milestone_data = m
            break

    if not milestone_data:
        # Use generic criteria if milestone not found
        milestone_data = {"criteria": []}

    # Build verification request
    verification_request = {
        "job_id": job_id,
        "submission_id": submission_id,
        "gig_type": job.gig_type.value if job.gig_type else "software",
        "milestone_id": submission.milestone_id,
        "submission": {
            "type": submission.submission_type,
            "github_link": submission.github_link,
            "file_urls": submission.file_urls,
            "text_content": submission.text_content,
            "source_document_url": submission.source_document_url,
        },
        "criteria": milestone_data.get("criteria", []),
        "freelancer_pfi": db.query(User).filter(User.id == submission.freelancer_id).first().pfi_score or 90.0,
    }

    # Call AI engine for verification
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.ai_engine_url}/verify",
                json=verification_request,
                timeout=60.0,
            )

        if response.status_code != 200:
            api_logger.error(f"AI engine verification failed: {response.status_code}")
            raise HTTPException(status_code=502, detail="Verification service failed")

        result = response.json()
        verification_data = result.get("data", result)

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Verification service timeout")
    except httpx.RequestError as e:
        api_logger.error(f"AI engine connection failed: {e}")
        raise HTTPException(status_code=502, detail="Could not connect to verification service")

    # Process verification result
    overall_score = verification_data.get("overall_score", 0)
    payment_decision = verification_data.get("payment_decision", "HOLD")

    # Update submission
    submission.verification_score = overall_score
    submission.verification_report_json = verification_data
    submission.verified_at = datetime.utcnow()

    if overall_score >= 90:
        submission.status = SubmissionStatus.VERIFIED
    elif overall_score >= 50:
        submission.status = SubmissionStatus.PARTIAL
    else:
        submission.status = SubmissionStatus.FAILED

    # Update freelancer PFI based on score
    freelancer = db.query(User).filter(User.id == submission.freelancer_id).first()
    if freelancer:
        current_pfi = freelancer.pfi_score or 90.0
        if overall_score >= 90:
            freelancer.pfi_score = min(100.0, current_pfi + 0.5)
        elif overall_score < 50:
            freelancer.pfi_score = max(0.0, current_pfi - 2.0)
        elif overall_score < 70:
            freelancer.pfi_score = max(0.0, current_pfi - 0.5)

    db.commit()

    # Auto-release payment for this milestone if score >= 90
    payment_released = False
    release_amount = 0.0

    if overall_score >= 90:
        escrow = db.query(Escrow).filter(Escrow.job_id == job_id).first()
        if escrow and escrow.status in [EscrowStatus.FUNDED, EscrowStatus.HELD]:
            # Calculate milestone payout
            milestones = spec.milestones_json if spec else []
            release_amount = _calculate_milestone_payout(escrow.amount, milestones, submission.milestone_id)

            # Create release record
            release = EscrowRelease(
                escrow_id=escrow.id,
                milestone_id=submission.milestone_id,
                amount=release_amount,
                released_at=datetime.utcnow(),
            )
            db.add(release)

            # Update escrow released amount
            escrow.released_amount = round(escrow.released_amount + release_amount, 2)
            payment_released = True

            # Get freelancer name for message
            freelancer_name = freelancer.name if freelancer else "Freelancer"

            # Find milestone name
            milestone_name = submission.milestone_id
            for m in milestones:
                if str(m.get("id")) == str(submission.milestone_id) or str(m.get("order")) == str(submission.milestone_id):
                    milestone_name = m.get("name", submission.milestone_id)
                    break

            # Send payment release message
            channel = db.query(ChatChannel).filter(ChatChannel.job_id == job_id).first()
            if channel:
                bro_message = ChatMessage(
                    channel_id=channel.id,
                    sender_id=None,
                    sender_type=MessageSender.AI_MEDIATOR,
                    content=f"""💰 Payment Released!

Milestone: {milestone_name} has been verified (Score: {overall_score}%) and payment of ${release_amount:.2f} has been released to {freelancer_name}.

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

                # Bonus PFI for full completion
                if freelancer:
                    freelancer.pfi_score = min(100.0, freelancer.pfi_score + 1.0)

                # Send completion message
                if channel:
                    _send_completion_message(channel, job, escrow, freelancer, db)

                api_logger.info(f"Job {job_id} completed - all milestones verified")

    db.commit()

    api_logger.info(f"Submission {submission_id} verified with score {overall_score}")

    return SuccessResponse(data={
        "submission_id": submission.id,
        "status": submission.status.value,
        "verification_score": overall_score,
        "payment_decision": payment_decision,
        "payment_released": payment_released,
        "release_amount": release_amount if payment_released else None,
        "verification_report": verification_data,
        "verified_at": submission.verified_at.isoformat(),
    })


@router.post("/{job_id}/submissions/{submission_id}/resubmit", response_model=SuccessResponse)
async def resubmit_work(
    job_id: int,
    submission_id: int,
    resubmit_data: ResubmitRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Resubmit work for a failed/partial submission.

    Freelancers get up to 2 resubmissions per milestone.
    Creates a new submission linked to the original.
    """
    current_user = require_auth(request)

    if current_user.get("role") != "freelancer":
        raise HTTPException(status_code=403, detail="Only freelancers can resubmit work")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.assigned_freelancer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You are not assigned to this job")

    original_submission = db.query(Submission).filter(
        Submission.id == submission_id,
        Submission.job_id == job_id
    ).first()

    if not original_submission:
        raise HTTPException(status_code=404, detail="Original submission not found")

    if original_submission.status == SubmissionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Original submission is still pending verification")

    if original_submission.status == SubmissionStatus.VERIFIED:
        raise HTTPException(status_code=400, detail="Original submission already verified successfully")

    if original_submission.resubmissions_remaining <= 0:
        raise HTTPException(status_code=400, detail="No resubmissions remaining for this milestone")

    # Check deadline (with grace period)
    can_submit, reason = deadline_enforcer.can_submit_work(job, db)
    if not can_submit:
        raise HTTPException(status_code=400, detail=f"Cannot resubmit work: {reason}")

    # Create new submission
    new_submission = Submission(
        job_id=job_id,
        milestone_id=original_submission.milestone_id,
        freelancer_id=current_user["user_id"],
        submission_type=original_submission.submission_type,
        github_link=resubmit_data.github_link or original_submission.github_link,
        file_urls=resubmit_data.file_urls or original_submission.file_urls,
        text_content=resubmit_data.text_content or original_submission.text_content,
        source_document_url=resubmit_data.source_document_url or original_submission.source_document_url,
        status=SubmissionStatus.PENDING,
        resubmission_count=original_submission.resubmission_count + 1,
        resubmissions_remaining=original_submission.resubmissions_remaining - 1,
    )
    db.add(new_submission)

    # Update original submission's remaining count too
    original_submission.resubmissions_remaining -= 1

    db.commit()
    db.refresh(new_submission)

    api_logger.info(
        f"Resubmission {new_submission.id} created for job {job_id}, "
        f"milestone {original_submission.milestone_id}, "
        f"remaining: {new_submission.resubmissions_remaining}"
    )

    return SuccessResponse(data={
        "submission_id": new_submission.id,
        "original_submission_id": submission_id,
        "milestone_id": new_submission.milestone_id,
        "resubmission_count": new_submission.resubmission_count,
        "resubmissions_remaining": new_submission.resubmissions_remaining,
        "status": new_submission.status.value,
        "created_at": new_submission.created_at.isoformat(),
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


def _calculate_milestone_payout(total_budget: float, milestones: list, milestone_id: str) -> float:
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
    base = total_budget / (count + 0.5)

    is_final = milestone_index == count - 1
    return round(base * 1.5 if is_final else base, 2)


def _send_completion_message(channel: ChatChannel, job: Job, escrow: Escrow, freelancer: User, db: Session):
    """Send job completion message via Bro."""
    employer = db.query(User).filter(User.id == job.employer_id).first()
    employer_name = employer.name if employer else "Employer"
    freelancer_name = freelancer.name if freelancer else "Freelancer"

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
