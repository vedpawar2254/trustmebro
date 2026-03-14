"""Chat API routes for employer-freelancer communication."""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import (
    Job, JobStatus, ChatChannel, ChatMessage, MessageSender, User
)
from src.schemas import SendMessageRequest, ChatChannelResponse, ChatMessageResponse, SuccessResponse
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

        # Add a system message
        welcome_message = ChatMessage(
            channel_id=channel.id,
            sender_id=None,
            sender_type=MessageSender.AI_MEDIATOR,
            content=f"Chat channel created for job: {job.title}. Please keep discussions on-topic and related to the job scope.",
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

    response_data = {
        "message_id": new_message.id,
        "channel_id": channel.id,
        "sender_id": new_message.sender_id,
        "sender_type": sender_type.value,
        "sender_name": get_user_name(new_message.sender_id, db),
        "content": new_message.content,
        "is_ai_generated": False,
        "created_at": new_message.created_at.isoformat(),
    }

    # TODO: Add AI mediator analysis here
    # This would:
    # 1. Analyze message for scope creep keywords
    # 2. Check if message is requesting changes outside spec
    # 3. Inject clarifying messages if needed
    # 4. Log spec clarifications for future reference

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
