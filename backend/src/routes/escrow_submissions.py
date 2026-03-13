"""Escrow and submission API routes."""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import Job, JobStatus, Escrow, EscrowStatus, Submission, User
from src.utils.logger import api_logger
from src.auth import decode_access_token


router = APIRouter(prefix="/api/jobs", tags=["jobs"])


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


# Escrow Routes

@router.post("/{job_id}/escrow", response_model=dict)
async def fund_escrow(
    job_id: int,
    escrow_data: dict,
    request: Request,
    db: Session = Depends(get_db),
):
    """Fund escrow for a job (employer only).

    Args:
        job_id: Job ID
        escrow_data: Escrow data (amount)
        request: FastAPI request
        db: Database session

    Returns:
        Created escrow

    Raises:
        HTTPException: Not authenticated
        HTTPException: Not authorized
        HTTPException: Job not found
        HTTPException: Job not assigned
        HTTPException: Invalid amount
        Server error
    """
    current_user = get_current_user(request)

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        api_logger.info(f"Funding escrow for job {job_id}")

        # Verify user is employer
        if current_user.get("role") != "employer":
            api_logger.warning(f"Only employers can fund escrow: {current_user['user_id']}")
            raise HTTPException(
                status_code=403,
                detail="Only employers can fund escrow"
            )

        # Check if job exists
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            api_logger.warning(f"Job not found: {job_id}")
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        # Verify job owner
        if job.employer_id != current_user["user_id"]:
            api_logger.warning(f"Unauthorized escrow funding: user {current_user['user_id']} not job owner")
            raise HTTPException(
                status_code=403,
                detail="You are not the owner of this job"
            )

        # Check if job is assigned
        if job.status != JobStatus.ASSIGNED:
            raise HTTPException(
                status_code=400,
                detail="Job must be assigned before funding escrow"
            )

        # Check if escrow already exists
        existing_escrow = db.query(Escrow).filter(Escrow.job_id == job_id).first()
        if existing_escrow:
            raise HTTPException(
                status_code=409,
                detail="Escrow already exists for this job"
            )

        # Get amount
        amount = escrow_data.get("amount")
        if not amount or amount <= 0:
            raise HTTPException(
                status_code=400,
                detail="Amount must be greater than 0"
            )

        # Create escrow
        new_escrow = Escrow(
            job_id=job_id,
            amount=amount,
            status=EscrowStatus.FUNDED,
            funded_at=datetime.utcnow(),
        )

        db.add(new_escrow)
        db.commit()
        db.refresh(new_escrow)

        # Update job status to ESCROW_FUNDED
        job.status = JobStatus.ESCROW_FUNDED
        db.commit()

        api_logger.info(f"Escrow {new_escrow.id} funded for job {job_id}")

        return {
            "success": True,
            "data": {
                "escrow_id": new_escrow.id,
                "job_id": job_id,
                "amount": new_escrow.amount,
                "currency": new_escrow.currency,
                "status": new_escrow.status.value if new_escrow.status else None,
                "funded_at": new_escrow.funded_at.isoformat() if new_escrow.funded_at else None,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Unexpected error funding escrow: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Server error"
        )


@router.get("/{job_id}/escrow", response_model=dict)
async def get_escrow_status(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Get escrow status.

    Args:
        job_id: Job ID
        request: FastAPI request
        db: Database session

    Returns:
        Escrow status

    Raises:
        HTTPException: Not authenticated
        HTTPException: Job not found
        HTTPException: Escrow not found
        Server error
    """
    current_user = get_current_user(request)

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        api_logger.info(f"Fetching escrow status for job {job_id}")

        # Check if job exists
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            api_logger.warning(f"Job not found: {job_id}")
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        # Verify user has access to this job
        if current_user.get("role") == "employer" and job.employer_id != current_user["user_id"]:
            raise HTTPException(
                status_code=403,
                detail="You are not the owner of this job"
            )

        # Get escrow
        escrow = db.query(Escrow).filter(Escrow.job_id == job_id).first()
        if not escrow:
            raise HTTPException(
                status_code=404,
                detail="Escrow not found"
            )

        return {
            "success": True,
            "data": {
                "escrow_id": escrow.id,
                "job_id": job_id,
                "amount": escrow.amount,
                "currency": escrow.currency,
                "status": escrow.status.value if escrow.status else None,
                "funded_at": escrow.funded_at.isoformat() if escrow.funded_at else None,
                "released_at": escrow.released_at.isoformat() if escrow.released_at else None,
                "refunded_at": escrow.refunded_at.isoformat() if escrow.refunded_at else None,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Unexpected error fetching escrow status: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Server error"
        )


# Submission Routes

@router.post("/{job_id}/submissions", response_model=dict)
async def submit_work(
    job_id: int,
    submission_data: dict,
    request: Request,
    db: Session = Depends(get_db),
):
    """Submit work for a milestone.

    Args:
        job_id: Job ID
        submission_data: Submission data (milestone_id, submission_type, ...)
        request: FastAPI request
        db: Database session

    Returns:
        Created submission

    Raises:
        HTTPException: Not authenticated
        HTTPException: Not authorized
        HTTPException: Job not found
        HTTPException: Invalid submission data
        Server error
    """
    current_user = get_current_user(request)

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        api_logger.info(f"Submitting work for job {job_id}")

        # Verify user is freelancer
        if current_user.get("role") != "freelancer":
            api_logger.warning(f"Only freelancers can submit work: {current_user['user_id']}")
            raise HTTPException(
                status_code=403,
                detail="Only freelancers can submit work"
            )

        # Check if job exists
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            api_logger.warning(f"Job not found: {job_id}")
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        # Verify user is assigned freelancer
        if job.employer_id == current_user["user_id"] or job.status not in [JobStatus.ESCROW_FUNDED, JobStatus.IN_PROGRESS]:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to submit work for this job"
            )

        # Get submission data
        milestone_id = submission_data.get("milestone_id")
        submission_type = submission_data.get("submission_type")

        if not milestone_id or not submission_type:
            raise HTTPException(
                status_code=400,
                detail="milestone_id and submission_type are required"
            )

        # Validate submission type
        valid_types = ["github_link", "file_upload", "text_paste", "document_pair"]
        if submission_type not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid submission_type. Must be one of: {', '.join(valid_types)}"
            )

        # Create submission based on type
        new_submission = Submission(
            job_id=job_id,
            milestone_id=milestone_id,
            freelancer_id=current_user["user_id"],
            submission_type=submission_type,
            github_link=submission_data.get("github_link"),
            file_urls=submission_data.get("file_urls"),
            text_content=submission_data.get("text_content"),
            source_document_url=submission_data.get("source_document_url"),
            status="pending",
        )

        db.add(new_submission)
        db.commit()
        db.refresh(new_submission)

        # Update job status to IN_PROGRESS on first submission
        if job.status == JobStatus.ESCROW_FUNDED:
            job.status = JobStatus.IN_PROGRESS
            db.commit()

        api_logger.info(f"Submission {new_submission.id} created for job {job_id}")

        return {
            "success": True,
            "data": {
                "submission_id": new_submission.id,
                "job_id": job_id,
                "milestone_id": new_submission.milestone_id,
                "freelancer_id": new_submission.freelancer_id,
                "submission_type": new_submission.submission_type,
                "github_link": new_submission.github_link,
                "file_urls": new_submission.file_urls,
                "text_content": new_submission.text_content,
                "source_document_url": new_submission.source_document_url,
                "status": new_submission.status,
                "resubmission_count": new_submission.resubmission_count,
                "resubmissions_remaining": new_submission.resubmissions_remaining,
                "created_at": new_submission.created_at.isoformat(),
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Unexpected error submitting work: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Server error"
        )


@router.get("/{job_id}/submissions/{submission_id}", response_model=dict)
async def get_submission(
    job_id: int,
    submission_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Get submission details and verification report.

    Args:
        job_id: Job ID
        submission_id: Submission ID
        request: FastAPI request
        db: Database session

    Returns:
        Submission details with verification report

    Raises:
        HTTPException: Not authenticated
        HTTPException: Job not found
        HTTPException: Submission not found
        Server error
    """
    current_user = get_current_user(request)

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        api_logger.info(f"Fetching submission {submission_id} for job {job_id}")

        # Check if job exists
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            api_logger.warning(f"Job not found: {job_id}")
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        # Get submission
        submission = db.query(Submission).filter(
            Submission.id == submission_id,
            Submission.job_id == job_id
        ).first()

        if not submission:
            api_logger.warning(f"Submission not found: {submission_id}")
            raise HTTPException(
                status_code=404,
                detail="Submission not found"
            )

        # Verify user has access
        is_employer = current_user.get("role") == "employer" and job.employer_id == current_user["user_id"]
        is_freelancer = current_user.get("role") == "freelancer" and submission.freelancer_id == current_user["user_id"]

        if not (is_employer or is_freelancer):
            raise HTTPException(
                status_code=403,
                detail="You don't have access to this submission"
            )

        return {
            "success": True,
            "data": {
                "submission_id": submission.id,
                "job_id": job_id,
                "milestone_id": submission.milestone_id,
                "freelancer_id": submission.freelancer_id,
                "submission_type": submission.submission_type,
                "github_link": submission.github_link,
                "file_urls": submission.file_urls,
                "text_content": submission.text_content,
                "source_document_url": submission.source_document_url,
                "status": submission.status,
                "verification_report": submission.verification_report_json,
                "resubmission_count": submission.resubmission_count,
                "resubmissions_remaining": submission.resubmissions_remaining,
                "created_at": submission.created_at.isoformat(),
                "updated_at": submission.updated_at.isoformat(),
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Unexpected error fetching submission: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Server error"
        )
