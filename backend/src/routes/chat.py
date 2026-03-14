"""Chat API routes for employer-freelancer communication."""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import (
    Job, JobStatus, JobSpec, ChatChannel, ChatMessage, MessageSender, User
)
from src.schemas import SendMessageRequest, ChatChannelResponse, ChatMessageResponse, SuccessResponse
from src.services.bro_mediator import bro_mediator
from src.services.ghost_protocol import ghost_protocol
from src.utils.logger import api_logger
from src.auth import decode_access_token


router = APIRouter(prefix="/api/jobs", tags=["chat"])


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


@router.post("/{job_id}/chat", response_model=SuccessResponse)
async def create_or_get_chat_channel(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Create or get the chat channel for a job.

    A chat channel is created automatically when a freelancer is assigned.
    This endpoint can be used to retrieve or ensure the channel exists.
    """
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check user has access to this job
    is_employer = job.employer_id == current_user["user_id"]
    is_freelancer = job.assigned_freelancer_id == current_user["user_id"]

    if not (is_employer or is_freelancer):
        raise HTTPException(status_code=403, detail="You don't have access to this job's chat")

    if not job.assigned_freelancer_id:
        raise HTTPException(status_code=400, detail="Job must have an assigned freelancer to create a chat channel")

    # Check if channel exists
    channel = db.query(ChatChannel).filter(ChatChannel.job_id == job_id).first()

    if not channel:
        # Create new channel
        channel = ChatChannel(
            job_id=job_id,
            employer_id=job.employer_id,
            freelancer_id=job.assigned_freelancer_id,
            is_active=True,
        )
        db.add(channel)
        db.commit()
        db.refresh(channel)

        # Get user names and spec info for welcome message
        employer = db.query(User).filter(User.id == job.employer_id).first()
        freelancer = db.query(User).filter(User.id == job.assigned_freelancer_id).first()
        spec = db.query(JobSpec).filter(JobSpec.job_id == job_id).first()

        employer_name = employer.name if employer else "Employer"
        freelancer_name = freelancer.name if freelancer else "Freelancer"

        # Build spec summary
        milestone_count = len(spec.milestones_json) if spec and spec.milestones_json else 0
        budget_display = f"${job.budget_min:.0f}" if job.budget_min == job.budget_max else f"${job.budget_min:.0f}-${job.budget_max:.0f}"
        deadline_display = job.deadline.strftime('%B %d, %Y') if job.deadline else "TBD"

        # Add Bro welcome message
        welcome_message = ChatMessage(
            channel_id=channel.id,
            sender_id=None,
            sender_type=MessageSender.AI_MEDIATOR,
            content=f"""Hey {employer_name} and {freelancer_name}! Welcome to your project chat.

I'm Bro, and I'll be here throughout the project to help with:
- Clarifying the spec
- Managing any changes
- Keeping things on track

Current spec summary:
- {milestone_count} milestone(s)
- Budget: {budget_display}
- Deadline: {deadline_display}

{freelancer_name}, please review the full spec and raise any concerns before {employer_name} funds the escrow.

Good luck! 🤙""",
            is_ai_generated=True,
            ai_intervention_type="channel_created",
        )
        db.add(welcome_message)
        db.commit()

        api_logger.info(f"Created chat channel {channel.id} for job {job_id}")

    return SuccessResponse(data={
        "channel_id": channel.id,
        "job_id": job_id,
        "employer_id": channel.employer_id,
        "freelancer_id": channel.freelancer_id,
        "is_active": channel.is_active,
        "created_at": channel.created_at.isoformat(),
    })


@router.get("/{job_id}/chat", response_model=SuccessResponse)
async def get_chat_channel(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Get chat channel details for a job."""
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    is_employer = job.employer_id == current_user["user_id"]
    is_freelancer = job.assigned_freelancer_id == current_user["user_id"]

    if not (is_employer or is_freelancer):
        raise HTTPException(status_code=403, detail="You don't have access to this chat")

    channel = db.query(ChatChannel).filter(ChatChannel.job_id == job_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Chat channel not found")

    return SuccessResponse(data={
        "channel_id": channel.id,
        "job_id": job_id,
        "job_title": job.title,
        "employer_id": channel.employer_id,
        "employer_name": get_user_name(channel.employer_id, db),
        "freelancer_id": channel.freelancer_id,
        "freelancer_name": get_user_name(channel.freelancer_id, db),
        "is_active": channel.is_active,
        "created_at": channel.created_at.isoformat(),
    })


@router.get("/{job_id}/chat/messages", response_model=SuccessResponse)
async def get_chat_messages(
    job_id: int,
    request: Request,
    limit: int = Query(50, ge=1, le=100),
    before_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Get chat messages for a job.

    Supports pagination via before_id for loading older messages.
    """
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    is_employer = job.employer_id == current_user["user_id"]
    is_freelancer = job.assigned_freelancer_id == current_user["user_id"]

    if not (is_employer or is_freelancer):
        raise HTTPException(status_code=403, detail="You don't have access to this chat")

    channel = db.query(ChatChannel).filter(ChatChannel.job_id == job_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Chat channel not found")

    # Build query
    query = db.query(ChatMessage).filter(ChatMessage.channel_id == channel.id)

    if before_id:
        query = query.filter(ChatMessage.id < before_id)

    messages = query.order_by(ChatMessage.created_at.desc()).limit(limit).all()

    # Reverse to get chronological order
    messages = list(reversed(messages))

    message_list = []
    for msg in messages:
        message_list.append({
            "message_id": msg.id,
            "channel_id": msg.channel_id,
            "sender_id": msg.sender_id,
            "sender_type": msg.sender_type.value,
            "sender_name": get_user_name(msg.sender_id, db) if msg.sender_id else "AI Mediator",
            "content": msg.content,
            "is_ai_generated": msg.is_ai_generated,
            "ai_intervention_type": msg.ai_intervention_type,
            "created_at": msg.created_at.isoformat(),
        })

    return SuccessResponse(data={
        "channel_id": channel.id,
        "messages": message_list,
        "has_more": len(messages) == limit,
    })


@router.post("/{job_id}/chat/messages", response_model=SuccessResponse)
async def send_chat_message(
    job_id: int,
    message_data: SendMessageRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Send a message in the chat channel.

    Messages are analyzed for scope creep or clarification needs.
    The AI mediator may inject messages when necessary.
    """
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    is_employer = job.employer_id == current_user["user_id"]
    is_freelancer = job.assigned_freelancer_id == current_user["user_id"]

    if not (is_employer or is_freelancer):
        raise HTTPException(status_code=403, detail="You don't have access to this chat")

    channel = db.query(ChatChannel).filter(ChatChannel.job_id == job_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Chat channel not found. Create one first.")

    if not channel.is_active:
        raise HTTPException(status_code=400, detail="Chat channel is closed")

    # Determine sender type
    sender_type = MessageSender.EMPLOYER if is_employer else MessageSender.FREELANCER

    # Create the message
    new_message = ChatMessage(
        channel_id=channel.id,
        sender_id=current_user["user_id"],
        sender_type=sender_type,
        content=message_data.content,
        is_ai_generated=False,
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    api_logger.info(f"Message {new_message.id} sent in channel {channel.id} by user {current_user['user_id']}")

    # Resolve any ghost status for this user (they're active now)
    ghost_protocol.resolve_ghost_status(job_id, current_user["user_id"], db)

    response_data = {
        "message_id": new_message.id,
        "channel_id": channel.id,
        "sender_id": new_message.sender_id,
        "sender_type": sender_type.value,
        "sender_name": get_user_name(new_message.sender_id, db),
        "content": new_message.content,
        "is_ai_generated": False,
        "created_at": new_message.created_at.isoformat(),
        "bro_response": None,
    }

    # AI Mediator Analysis - Detect scope creep, answer questions, etc.
    spec = db.query(JobSpec).filter(JobSpec.job_id == job_id).first()
    job_spec_data = {
        "milestones_json": spec.milestones_json if spec else [],
        "requirements_json": spec.requirements_json if spec else {},
        "deliverables_json": spec.deliverables_json if spec else [],
        "is_locked": spec.is_locked if spec else False,
    }

    analysis = bro_mediator.analyze_message(
        message_content=message_data.content,
        job_spec=job_spec_data,
        sender_role=current_user["role"],
        recent_messages=None  # Could fetch recent messages for context
    )

    # If Bro should respond, create a follow-up message
    if analysis["should_respond"] and analysis["response"]:
        bro_message = ChatMessage(
            channel_id=channel.id,
            sender_id=None,
            sender_type=MessageSender.AI_MEDIATOR,
            content=analysis["response"],
            is_ai_generated=True,
            ai_intervention_type=analysis["intervention_type"],
            metadata_json={
                "triggered_by_message_id": new_message.id,
                "detected_changes": analysis.get("detected_changes", []),
                "confidence": analysis.get("confidence", 0.0),
            }
        )
        db.add(bro_message)
        db.commit()
        db.refresh(bro_message)

        api_logger.info(
            f"Bro intervention ({analysis['intervention_type']}) in channel {channel.id}"
        )

        response_data["bro_response"] = {
            "message_id": bro_message.id,
            "content": bro_message.content,
            "intervention_type": analysis["intervention_type"],
            "created_at": bro_message.created_at.isoformat(),
        }

    return SuccessResponse(data=response_data)


@router.post("/{job_id}/chat/close", response_model=SuccessResponse)
async def close_chat_channel(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Close the chat channel (typically when job is completed).

    Only the employer can close the channel.
    """
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.employer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the employer can close the chat channel")

    channel = db.query(ChatChannel).filter(ChatChannel.job_id == job_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Chat channel not found")

    if not channel.is_active:
        raise HTTPException(status_code=400, detail="Chat channel is already closed")

    channel.is_active = False

    # Add closing message
    close_message = ChatMessage(
        channel_id=channel.id,
        sender_id=None,
        sender_type=MessageSender.AI_MEDIATOR,
        content="This chat channel has been closed by the employer.",
        is_ai_generated=True,
        ai_intervention_type="channel_closed",
    )
    db.add(close_message)
    db.commit()

    api_logger.info(f"Chat channel {channel.id} closed for job {job_id}")

    return SuccessResponse(
        data={"channel_id": channel.id, "is_active": False},
        message="Chat channel closed successfully"
    )


@router.get("/{job_id}/chat/new", response_model=SuccessResponse)
async def get_new_messages(
    job_id: int,
    after_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Get new messages since a given message ID.

    Used for polling-based real-time updates.
    """
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    is_employer = job.employer_id == current_user["user_id"]
    is_freelancer = job.assigned_freelancer_id == current_user["user_id"]

    if not (is_employer or is_freelancer):
        raise HTTPException(status_code=403, detail="You don't have access to this chat")

    channel = db.query(ChatChannel).filter(ChatChannel.job_id == job_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Chat channel not found")

    messages = db.query(ChatMessage).filter(
        ChatMessage.channel_id == channel.id,
        ChatMessage.id > after_id
    ).order_by(ChatMessage.created_at.asc()).all()

    message_list = []
    for msg in messages:
        message_list.append({
            "message_id": msg.id,
            "channel_id": msg.channel_id,
            "sender_id": msg.sender_id,
            "sender_type": msg.sender_type.value,
            "sender_name": get_user_name(msg.sender_id, db) if msg.sender_id else "AI Mediator",
            "content": msg.content,
            "is_ai_generated": msg.is_ai_generated,
            "ai_intervention_type": msg.ai_intervention_type,
            "created_at": msg.created_at.isoformat(),
        })

    return SuccessResponse(data={
        "messages": message_list,
        "count": len(message_list),
    })
