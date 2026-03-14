"""Escrow and submission API routes."""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import httpx

from src.database import get_db
from src.models import (
    Job, JobStatus, Escrow, EscrowStatus, Submission, SubmissionStatus,
    User, JobSpec, Bid, BidStatus
)
from src.schemas import (
    FundEscrowRequest, CreateSubmissionRequest, ResubmitRequest,
    EscrowResponse, SubmissionResponse, SuccessResponse
)
from src.utils.logger import api_logger
from src.auth import decode_access_token
from src.config import settings


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

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.employer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You are not the owner of this job")

    if job.status != JobStatus.ASSIGNED:
        raise HTTPException(status_code=400, detail="Job must be assigned before funding escrow")

    existing_escrow = db.query(Escrow).filter(Escrow.job_id == job_id).first()
    if existing_escrow:
        raise HTTPException(status_code=409, detail="Escrow already exists for this job")

    # Validate amount against job budget
    if escrow_data.amount < job.budget_min:
        raise HTTPException(
            status_code=400,
            detail=f"Escrow amount must be at least the minimum budget: ${job.budget_min}"
        )

    new_escrow = Escrow(
        job_id=job_id,
        amount=escrow_data.amount,
        status=EscrowStatus.FUNDED,
        funded_at=datetime.utcnow(),
    )
    db.add(new_escrow)

    job.status = JobStatus.ESCROW_FUNDED
    db.commit()
    db.refresh(new_escrow)

    api_logger.info(f"Escrow {new_escrow.id} funded for job {job_id} with ${escrow_data.amount}")

    return SuccessResponse(data={
        "escrow_id": new_escrow.id,
        "job_id": job_id,
        "amount": new_escrow.amount,
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

    return SuccessResponse(data={
        "escrow_id": escrow.id,
        "job_id": job_id,
        "amount": escrow.amount,
        "currency": escrow.currency,
        "status": escrow.status.value,
        "funded_at": escrow.funded_at.isoformat() if escrow.funded_at else None,
        "released_at": escrow.released_at.isoformat() if escrow.released_at else None,
        "refunded_at": escrow.refunded_at.isoformat() if escrow.refunded_at else None,
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
    """Refund escrow to employer (for disputes or failed jobs)."""
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Only employer can request refund (would normally go through dispute process)
    if job.employer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the employer can request refund")

    escrow = db.query(Escrow).filter(Escrow.job_id == job_id).first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")

    if escrow.status == EscrowStatus.RELEASED:
        raise HTTPException(status_code=400, detail="Cannot refund - escrow already released")

    if escrow.status == EscrowStatus.REFUNDED:
        raise HTTPException(status_code=400, detail="Escrow already refunded")

    escrow.status = EscrowStatus.REFUNDED
    escrow.refunded_at = datetime.utcnow()

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

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Verify user is the assigned freelancer
    if job.assigned_freelancer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You are not assigned to this job")

    if job.status not in [JobStatus.ESCROW_FUNDED, JobStatus.IN_PROGRESS]:
        raise HTTPException(status_code=400, detail="Job is not in a submittable state")

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

    # Handle auto-release if all milestones verified with ≥90%
    if payment_decision == "AUTO_RELEASE" and overall_score >= 90:
        # Check if all milestones are verified
        all_verified = _check_all_milestones_verified(job_id, spec, db)

        if all_verified:
            escrow = db.query(Escrow).filter(Escrow.job_id == job_id).first()
            if escrow and escrow.status == EscrowStatus.FUNDED:
                escrow.status = EscrowStatus.RELEASED
                escrow.released_at = datetime.utcnow()
                job.status = JobStatus.COMPLETED
                job.completed_at = datetime.utcnow()

                # Bonus PFI for auto-release
                if freelancer:
                    freelancer.pfi_score = min(100.0, freelancer.pfi_score + 1.0)

                db.commit()
                api_logger.info(f"Auto-released escrow for job {job_id}")

    api_logger.info(f"Submission {submission_id} verified with score {overall_score}")

    return SuccessResponse(data={
        "submission_id": submission.id,
        "status": submission.status.value,
        "verification_score": overall_score,
        "payment_decision": payment_decision,
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
    """Check if all milestones have been verified with ≥90% score."""
    milestones = spec.milestones_json or []
    if not milestones:
        return False

    for milestone in milestones:
        milestone_id = milestone.get("id") or str(milestone.get("order"))

        # Find the best submission for this milestone
        best_submission = db.query(Submission).filter(
            Submission.job_id == job_id,
            Submission.milestone_id == milestone_id,
            Submission.status == SubmissionStatus.VERIFIED
        ).first()

        if not best_submission or (best_submission.verification_score or 0) < 90:
            return False

    return True
