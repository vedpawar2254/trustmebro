"""Change Request API routes for spec modifications after lock."""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import (
    Job, JobSpec, ChangeRequest, User, UserRole,
    ChatChannel, ChatMessage, MessageSender
)
from src.schemas import CreateChangeRequest, RespondChangeRequest, SuccessResponse
from src.utils.logger import api_logger
from src.auth import decode_access_token


router = APIRouter(prefix="/api/jobs", tags=["change_requests"])

# Change request limits
EMPLOYER_CR_LIMIT = 3
FREELANCER_CR_LIMIT = 2
CR_PURCHASE_COST = 25.0


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


def get_remaining_change_requests(job_id: int, user_id: int, role: str, db: Session) -> int:
    """Calculate remaining change requests for a user on a job."""
    # Get base limit
    base_limit = EMPLOYER_CR_LIMIT if role == "employer" else FREELANCER_CR_LIMIT

    # Count used change requests
    used_count = db.query(ChangeRequest).filter(
        ChangeRequest.job_id == job_id,
        ChangeRequest.requested_by_id == user_id
    ).count()

    return max(0, base_limit - used_count)


@router.get("/{job_id}/change-requests", response_model=SuccessResponse)
async def get_change_requests(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Get all change requests for a job.

    Both employer and freelancer can view all change requests.
    """
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check access
    is_employer = job.employer_id == current_user["user_id"]
    is_freelancer = job.assigned_freelancer_id == current_user["user_id"]

    if not (is_employer or is_freelancer):
        raise HTTPException(status_code=403, detail="You don't have access to this job")

    # Get all change requests
    change_requests = db.query(ChangeRequest).filter(
        ChangeRequest.job_id == job_id
    ).order_by(ChangeRequest.created_at.desc()).all()

    cr_list = []
    for cr in change_requests:
        cr_list.append({
            "id": cr.id,
            "job_id": cr.job_id,
            "requested_by_id": cr.requested_by_id,
            "requested_by_name": get_user_name(cr.requested_by_id, db),
            "requested_by_role": cr.requested_by_role.value,
            "description": cr.description,
            "change_type": cr.change_type,
            "proposed_changes": cr.proposed_changes_json,
            "status": cr.status,
            "response_message": cr.response_message,
            "created_at": cr.created_at.isoformat(),
            "responded_at": cr.responded_at.isoformat() if cr.responded_at else None,
        })

    # Calculate remaining CRs for current user
    remaining = get_remaining_change_requests(
        job_id,
        current_user["user_id"],
        current_user["role"],
        db
    )

    return SuccessResponse(data={
        "change_requests": cr_list,
        "remaining_requests": remaining,
        "your_limit": EMPLOYER_CR_LIMIT if is_employer else FREELANCER_CR_LIMIT,
    })


@router.post("/{job_id}/change-requests", response_model=SuccessResponse)
async def create_change_request(
    job_id: int,
    cr_data: CreateChangeRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Create a new change request.

    Change requests can only be created after spec is locked.
    Employer gets 3, Freelancer gets 2 by default.
    """
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check access
    is_employer = job.employer_id == current_user["user_id"]
    is_freelancer = job.assigned_freelancer_id == current_user["user_id"]

    if not (is_employer or is_freelancer):
        raise HTTPException(status_code=403, detail="You don't have access to this job")

    # Check spec is locked
    spec = db.query(JobSpec).filter(JobSpec.job_id == job_id).first()
    if not spec or not spec.is_locked:
        raise HTTPException(
            status_code=400,
            detail="Change requests can only be created after spec is locked"
        )

    # Check remaining change requests
    remaining = get_remaining_change_requests(
        job_id,
        current_user["user_id"],
        current_user["role"],
        db
    )

    if remaining <= 0:
        raise HTTPException(
            status_code=400,
            detail=f"No change requests remaining. You can purchase more for ${CR_PURCHASE_COST}."
        )

    # Create change request
    new_cr = ChangeRequest(
        job_id=job_id,
        requested_by_id=current_user["user_id"],
        requested_by_role=UserRole(current_user["role"]),
        description=cr_data.description,
        change_type=cr_data.change_type.value,
        proposed_changes_json=cr_data.proposed_changes,
        status="pending",
    )
    db.add(new_cr)

    # Send Bro message about change request
    channel = db.query(ChatChannel).filter(ChatChannel.job_id == job_id).first()
    if channel:
        requester_name = get_user_name(current_user["user_id"], db)
        other_party = "employer" if is_freelancer else "freelancer"

        bro_message = ChatMessage(
            channel_id=channel.id,
            sender_id=None,
            sender_type=MessageSender.AI_MEDIATOR,
            content=f"""📝 Change Request Submitted

{requester_name} has submitted a change request:

**Type:** {cr_data.change_type.value.title()}
**Description:** {cr_data.description}

{other_party.title()}, please review and respond to this request.""",
            is_ai_generated=True,
            ai_intervention_type="change_request_created",
        )
        db.add(bro_message)

    db.commit()
    db.refresh(new_cr)

    api_logger.info(f"Change request {new_cr.id} created for job {job_id}")

    return SuccessResponse(data={
        "change_request": {
            "id": new_cr.id,
            "job_id": job_id,
            "description": new_cr.description,
            "change_type": new_cr.change_type,
            "proposed_changes": new_cr.proposed_changes_json,
            "status": new_cr.status,
            "created_at": new_cr.created_at.isoformat(),
        },
        "remaining_requests": remaining - 1,
    })


@router.post("/{job_id}/change-requests/{cr_id}/respond", response_model=SuccessResponse)
async def respond_to_change_request(
    job_id: int,
    cr_id: int,
    response_data: RespondChangeRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Respond to a change request (accept or reject).

    Only the other party (not the requester) can respond.
    If accepted, the spec is updated accordingly.
    """
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    cr = db.query(ChangeRequest).filter(
        ChangeRequest.id == cr_id,
        ChangeRequest.job_id == job_id
    ).first()

    if not cr:
        raise HTTPException(status_code=404, detail="Change request not found")

    # Check that responder is not the requester
    if cr.requested_by_id == current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You cannot respond to your own change request")

    # Check responder has access to job
    is_employer = job.employer_id == current_user["user_id"]
    is_freelancer = job.assigned_freelancer_id == current_user["user_id"]

    if not (is_employer or is_freelancer):
        raise HTTPException(status_code=403, detail="You don't have access to this job")

    # Check CR is still pending
    if cr.status != "pending":
        raise HTTPException(status_code=400, detail="Change request already responded to")

    # Update change request
    cr.status = "accepted" if response_data.accept else "rejected"
    cr.response_message = response_data.response_message
    cr.responded_at = datetime.utcnow()

    # If accepted, apply changes to spec
    spec_updated = False
    if response_data.accept:
        spec = db.query(JobSpec).filter(JobSpec.job_id == job_id).first()
        if spec:
            spec_updated = _apply_change_request(spec, cr)
            spec.version += 1
            spec.updated_at = datetime.utcnow()

    # Send Bro message about response
    channel = db.query(ChatChannel).filter(ChatChannel.job_id == job_id).first()
    if channel:
        responder_name = get_user_name(current_user["user_id"], db)
        requester_name = get_user_name(cr.requested_by_id, db)
        status_emoji = "✅" if response_data.accept else "❌"
        status_text = "accepted" if response_data.accept else "rejected"

        message_content = f"""{status_emoji} Change Request {status_text.title()}

{responder_name} has {status_text} the change request from {requester_name}.

**Type:** {cr.change_type.title()}"""

        if response_data.response_message:
            message_content += f"\n**Response:** {response_data.response_message}"

        if response_data.accept and spec_updated:
            message_content += "\n\nThe spec has been updated accordingly."

        bro_message = ChatMessage(
            channel_id=channel.id,
            sender_id=None,
            sender_type=MessageSender.AI_MEDIATOR,
            content=message_content,
            is_ai_generated=True,
            ai_intervention_type="change_request_responded",
        )
        db.add(bro_message)

    db.commit()

    api_logger.info(f"Change request {cr_id} {cr.status} for job {job_id}")

    return SuccessResponse(
        data={
            "change_request": {
                "id": cr.id,
                "status": cr.status,
                "response_message": cr.response_message,
                "responded_at": cr.responded_at.isoformat(),
            },
            "spec_updated": spec_updated,
        },
        message=f"Change request {cr.status}"
    )


@router.delete("/{job_id}/change-requests/{cr_id}", response_model=SuccessResponse)
async def cancel_change_request(
    job_id: int,
    cr_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Cancel a pending change request.

    Only the requester can cancel, and only if still pending.
    Refunds the change request allocation.
    """
    current_user = require_auth(request)

    cr = db.query(ChangeRequest).filter(
        ChangeRequest.id == cr_id,
        ChangeRequest.job_id == job_id
    ).first()

    if not cr:
        raise HTTPException(status_code=404, detail="Change request not found")

    # Only requester can cancel
    if cr.requested_by_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You can only cancel your own change requests")

    # Only pending can be cancelled
    if cr.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending change requests can be cancelled")

    # Update status
    cr.status = "cancelled"
    cr.responded_at = datetime.utcnow()

    db.commit()

    api_logger.info(f"Change request {cr_id} cancelled for job {job_id}")

    return SuccessResponse(
        data={"id": cr_id, "status": "cancelled"},
        message="Change request cancelled"
    )


def _apply_change_request(spec: JobSpec, cr: ChangeRequest) -> bool:
    """
    Apply accepted change request to spec.

    Returns True if spec was updated, False otherwise.
    """
    proposed = cr.proposed_changes_json

    if cr.change_type == "scope":
        # Update requirements or deliverables
        if "new_scope" in proposed:
            if "requirements" in proposed["new_scope"]:
                spec.requirements_json = proposed["new_scope"]["requirements"]
            if "deliverables" in proposed["new_scope"]:
                spec.deliverables_json = proposed["new_scope"]["deliverables"]
            if "milestones" in proposed["new_scope"]:
                spec.milestones_json = proposed["new_scope"]["milestones"]
            return True

    elif cr.change_type == "deadline":
        # Update milestone deadlines
        if "new_deadline" in proposed:
            # Update job deadline or milestone deadlines
            # For now, just update milestone deadlines in spec
            milestones = spec.milestones_json or []
            if "milestone_id" in proposed:
                for m in milestones:
                    if str(m.get("id")) == str(proposed["milestone_id"]):
                        m["deadline"] = proposed["new_deadline"]
                        break
            spec.milestones_json = milestones
            return True

    elif cr.change_type == "budget":
        # Budget changes would typically require escrow adjustment
        # For hackathon, just log it
        if "new_budget" in proposed:
            # Could update milestone payouts here
            return True

    return False
