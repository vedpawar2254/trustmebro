"""Dispute resolution API routes."""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from src.database import get_db
from src.models import (
    Job, JobStatus, Dispute, DisputeStatus, Escrow, EscrowStatus,
    User, UserRole, ChatChannel, ChatMessage, MessageSender
)
from src.utils.logger import api_logger
from src.auth import decode_access_token
from src.services.email_service import email_service


router = APIRouter(prefix="/api/jobs", tags=["disputes"])


# Request schemas
class CreateDisputeRequest(BaseModel):
    reason: str = Field(..., min_length=50)
    dispute_type: str = Field(...)  # quality, incomplete, non_delivery, scope_disagreement
    evidence: Optional[list] = None


class AddStatementRequest(BaseModel):
    statement: str = Field(..., min_length=50)


class ResolveDisputeRequest(BaseModel):
    resolution: str = Field(...)  # employer, freelancer, split
    resolution_notes: str = Field(..., min_length=20)
    split_percentage: Optional[float] = Field(None, ge=0, le=100)  # For split resolution


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


@router.post("/{job_id}/dispute")
async def create_dispute(
    job_id: int,
    dispute_data: CreateDisputeRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Initiate a dispute for a job.

    Either party can initiate a dispute when there's a disagreement
    about deliverables, quality, or payment.
    """
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check if user is employer or freelancer
    is_employer = job.employer_id == current_user["user_id"]
    is_freelancer = job.assigned_freelancer_id == current_user["user_id"]

    if not (is_employer or is_freelancer):
        raise HTTPException(status_code=403, detail="You don't have access to this job")

    # Check if job is in a disputable state
    if job.status not in [JobStatus.IN_PROGRESS, JobStatus.ESCROW_FUNDED]:
        raise HTTPException(status_code=400, detail="Job is not in a disputable state")

    # Check for existing dispute
    existing_dispute = db.query(Dispute).filter(Dispute.job_id == job_id).first()
    if existing_dispute:
        raise HTTPException(status_code=409, detail="A dispute already exists for this job")

    # Validate dispute type
    valid_types = ["quality", "incomplete", "non_delivery", "scope_disagreement"]
    if dispute_data.dispute_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid dispute type. Must be one of: {', '.join(valid_types)}"
        )

    # Create dispute
    dispute = Dispute(
        job_id=job_id,
        initiated_by_id=current_user["user_id"],
        initiated_by_role=UserRole.EMPLOYER if is_employer else UserRole.FREELANCER,
        reason=dispute_data.reason,
        dispute_type=dispute_data.dispute_type,
        evidence_json=dispute_data.evidence or [],
        status=DisputeStatus.OPEN,
    )

    # Set initial statement from initiator
    if is_employer:
        dispute.employer_statement = dispute_data.reason
    else:
        dispute.freelancer_statement = dispute_data.reason

    db.add(dispute)

    # Update job status
    job.status = JobStatus.DISPUTED

    # Send Bro message about dispute
    channel = db.query(ChatChannel).filter(ChatChannel.job_id == job_id).first()
    if channel:
        initiator = db.query(User).filter(User.id == current_user["user_id"]).first()
        initiator_name = initiator.name if initiator else "User"

        bro_message = ChatMessage(
            channel_id=channel.id,
            sender_id=None,
            sender_type=MessageSender.AI_MEDIATOR,
            content=f"""⚠️ Dispute Opened

{initiator_name} has opened a dispute regarding: {dispute_data.dispute_type}

Reason: {dispute_data.reason[:200]}...

Both parties should provide their statements. The dispute will be reviewed and a resolution will be provided.

Please remain professional and provide evidence to support your position.""",
            is_ai_generated=True,
            ai_intervention_type="dispute_opened",
        )
        db.add(bro_message)

    db.commit()
    db.refresh(dispute)

    api_logger.info(f"Dispute {dispute.id} created for job {job_id} by user {current_user['user_id']}")

    return {
        "success": True,
        "data": {
            "dispute_id": dispute.id,
            "job_id": job_id,
            "status": dispute.status.value,
            "dispute_type": dispute.dispute_type,
            "initiated_by": "employer" if is_employer else "freelancer",
            "created_at": dispute.created_at.isoformat(),
        },
        "message": "Dispute created successfully"
    }


@router.get("/{job_id}/dispute")
async def get_dispute(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Get dispute details for a job."""
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check access
    is_employer = job.employer_id == current_user["user_id"]
    is_freelancer = job.assigned_freelancer_id == current_user["user_id"]

    if not (is_employer or is_freelancer):
        raise HTTPException(status_code=403, detail="You don't have access to this dispute")

    dispute = db.query(Dispute).filter(Dispute.job_id == job_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="No dispute found for this job")

    return {
        "success": True,
        "data": {
            "dispute_id": dispute.id,
            "job_id": job_id,
            "status": dispute.status.value,
            "dispute_type": dispute.dispute_type,
            "reason": dispute.reason,
            "evidence": dispute.evidence_json,
            "employer_statement": dispute.employer_statement,
            "freelancer_statement": dispute.freelancer_statement,
            "ai_recommendation": dispute.ai_recommendation,
            "resolution_notes": dispute.resolution_notes,
            "resolution_amount": dispute.resolution_amount,
            "created_at": dispute.created_at.isoformat(),
            "resolved_at": dispute.resolved_at.isoformat() if dispute.resolved_at else None,
        }
    }


@router.post("/{job_id}/dispute/statement")
async def add_dispute_statement(
    job_id: int,
    statement_data: AddStatementRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Add or update statement for a dispute."""
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    is_employer = job.employer_id == current_user["user_id"]
    is_freelancer = job.assigned_freelancer_id == current_user["user_id"]

    if not (is_employer or is_freelancer):
        raise HTTPException(status_code=403, detail="You don't have access to this dispute")

    dispute = db.query(Dispute).filter(Dispute.job_id == job_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="No dispute found for this job")

    if dispute.status not in [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW]:
        raise HTTPException(status_code=400, detail="Cannot add statement to resolved dispute")

    # Update statement based on role
    if is_employer:
        dispute.employer_statement = statement_data.statement
    else:
        dispute.freelancer_statement = statement_data.statement

    # If both statements are present, move to under review
    if dispute.employer_statement and dispute.freelancer_statement:
        dispute.status = DisputeStatus.UNDER_REVIEW

    db.commit()

    api_logger.info(f"Statement added to dispute {dispute.id} by user {current_user['user_id']}")

    return {
        "success": True,
        "data": {
            "dispute_id": dispute.id,
            "status": dispute.status.value,
            "statement_added_by": "employer" if is_employer else "freelancer",
        },
        "message": "Statement added successfully"
    }


@router.post("/{job_id}/dispute/evidence")
async def add_dispute_evidence(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Add evidence to a dispute."""
    current_user = require_auth(request)

    # Parse JSON body
    body = await request.json()
    evidence_url = body.get("evidence_url")
    evidence_type = body.get("evidence_type", "file")
    description = body.get("description", "")

    if not evidence_url:
        raise HTTPException(status_code=400, detail="evidence_url is required")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    is_employer = job.employer_id == current_user["user_id"]
    is_freelancer = job.assigned_freelancer_id == current_user["user_id"]

    if not (is_employer or is_freelancer):
        raise HTTPException(status_code=403, detail="You don't have access to this dispute")

    dispute = db.query(Dispute).filter(Dispute.job_id == job_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="No dispute found for this job")

    if dispute.status not in [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW]:
        raise HTTPException(status_code=400, detail="Cannot add evidence to resolved dispute")

    # Add evidence
    evidence_list = dispute.evidence_json or []
    evidence_list.append({
        "url": evidence_url,
        "type": evidence_type,
        "description": description,
        "submitted_by": "employer" if is_employer else "freelancer",
        "submitted_at": datetime.utcnow().isoformat(),
    })
    dispute.evidence_json = evidence_list

    db.commit()

    return {
        "success": True,
        "data": {
            "dispute_id": dispute.id,
            "evidence_count": len(evidence_list),
        },
        "message": "Evidence added successfully"
    }


@router.post("/{job_id}/dispute/resolve")
async def resolve_dispute(
    job_id: int,
    resolution_data: ResolveDisputeRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Resolve a dispute (admin/platform action).

    In production, this would be triggered after AI analysis
    or manual review by platform support.
    """
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    dispute = db.query(Dispute).filter(Dispute.job_id == job_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="No dispute found for this job")

    if dispute.status in [
        DisputeStatus.RESOLVED_EMPLOYER,
        DisputeStatus.RESOLVED_FREELANCER,
        DisputeStatus.RESOLVED_SPLIT
    ]:
        raise HTTPException(status_code=400, detail="Dispute already resolved")

    escrow = db.query(Escrow).filter(Escrow.job_id == job_id).first()
    if not escrow:
        raise HTTPException(status_code=400, detail="No escrow found for this job")

    remaining_amount = escrow.amount - escrow.released_amount

    # Determine resolution
    if resolution_data.resolution == "employer":
        dispute.status = DisputeStatus.RESOLVED_EMPLOYER
        dispute.resolution_amount = 0  # Refund to employer
        escrow.status = EscrowStatus.REFUNDED
        escrow.refunded_at = datetime.utcnow()

        # PFI penalty for freelancer
        freelancer = db.query(User).filter(User.id == job.assigned_freelancer_id).first()
        if freelancer:
            freelancer.pfi_score = max(0, (freelancer.pfi_score or 90) - 10)

    elif resolution_data.resolution == "freelancer":
        dispute.status = DisputeStatus.RESOLVED_FREELANCER
        dispute.resolution_amount = remaining_amount  # Release to freelancer
        escrow.released_amount = escrow.amount
        escrow.status = EscrowStatus.RELEASED
        escrow.released_at = datetime.utcnow()
        job.status = JobStatus.COMPLETED
        job.completed_at = datetime.utcnow()

    elif resolution_data.resolution == "split":
        if resolution_data.split_percentage is None:
            raise HTTPException(status_code=400, detail="split_percentage required for split resolution")

        dispute.status = DisputeStatus.RESOLVED_SPLIT
        freelancer_amount = remaining_amount * (resolution_data.split_percentage / 100)
        dispute.resolution_amount = freelancer_amount

        escrow.released_amount += freelancer_amount
        if escrow.released_amount >= escrow.amount:
            escrow.status = EscrowStatus.RELEASED
            escrow.released_at = datetime.utcnow()

        job.status = JobStatus.COMPLETED
        job.completed_at = datetime.utcnow()

    else:
        raise HTTPException(status_code=400, detail="Invalid resolution type")

    dispute.resolution_notes = resolution_data.resolution_notes
    dispute.resolved_at = datetime.utcnow()

    # Send Bro message about resolution
    channel = db.query(ChatChannel).filter(ChatChannel.job_id == job_id).first()
    if channel:
        resolution_text = {
            "employer": "in favor of the employer. The escrow will be refunded.",
            "freelancer": "in favor of the freelancer. The payment has been released.",
            "split": f"with a split decision. {resolution_data.split_percentage}% released to freelancer.",
        }

        bro_message = ChatMessage(
            channel_id=channel.id,
            sender_id=None,
            sender_type=MessageSender.AI_MEDIATOR,
            content=f"""✅ Dispute Resolved

The dispute has been resolved {resolution_text[resolution_data.resolution]}

Resolution notes: {resolution_data.resolution_notes}

This project is now closed. Thank you for using TrustMeBro.""",
            is_ai_generated=True,
            ai_intervention_type="dispute_resolved",
        )
        db.add(bro_message)

    db.commit()

    api_logger.info(f"Dispute {dispute.id} resolved: {resolution_data.resolution}")

    return {
        "success": True,
        "data": {
            "dispute_id": dispute.id,
            "status": dispute.status.value,
            "resolution_amount": dispute.resolution_amount,
            "resolved_at": dispute.resolved_at.isoformat(),
        },
        "message": "Dispute resolved successfully"
    }


@router.post("/{job_id}/dispute/withdraw")
async def withdraw_dispute(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Withdraw a dispute (only by initiator)."""
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    dispute = db.query(Dispute).filter(Dispute.job_id == job_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="No dispute found")

    # Only initiator can withdraw
    if dispute.initiated_by_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the dispute initiator can withdraw")

    if dispute.status != DisputeStatus.OPEN:
        raise HTTPException(status_code=400, detail="Can only withdraw open disputes")

    dispute.status = DisputeStatus.WITHDRAWN
    dispute.resolved_at = datetime.utcnow()
    dispute.resolution_notes = "Withdrawn by initiator"

    # Restore job status
    if job.escrow and job.escrow.status == EscrowStatus.FUNDED:
        job.status = JobStatus.IN_PROGRESS

    db.commit()

    return {
        "success": True,
        "message": "Dispute withdrawn successfully"
    }
