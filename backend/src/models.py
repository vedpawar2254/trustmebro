"""SQLAlchemy database models."""
from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional, List

from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, Enum, ForeignKey, JSON
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


# Python Enums for type safety
class UserRole(str, PyEnum):
    """User roles."""
    EMPLOYER = "employer"
    FREELANCER = "freelancer"


class JobStatus(str, PyEnum):
    """Job statuses."""
    DRAFT = "draft"
    PUBLISHED = "published"
    ASSIGNED = "assigned"
    ESCROW_FUNDED = "escrow_funded"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DISPUTED = "disputed"


class GigType(str, PyEnum):
    """Gig types."""
    SOFTWARE = "software"
    COPYWRITING = "copywriting"
    DATA_ENTRY = "data_entry"
    TRANSLATION = "translation"


class GigSubtype(str, PyEnum):
    """Gig subtypes for each gig type."""
    # Software subtypes
    WEB_DEVELOPMENT = "web_development"
    MOBILE_APP = "mobile_app"
    DESKTOP_APP = "desktop_app"
    API_DEVELOPMENT = "api_development"
    GAME_DEVELOPMENT = "game_development"
    BLOCKCHAIN = "blockchain"
    DEVOPS = "devops"
    DATA_SCIENCE = "data_science"

    # Copywriting subtypes
    BLOG_POSTS = "blog_posts"
    WEBSITE_COPY = "website_copy"
    MARKETING_EMAILS = "marketing_emails"
    SOCIAL_MEDIA = "social_media"
    TECHNICAL_WRITING = "technical_writing"
    PRESS_RELEASES = "press_releases"

    # Data Entry subtypes
    SPREADSHEET_DATA = "spreadsheet_data"
    DATABASE_ENTRY = "database_entry"
    WEB_SCRAPING = "web_scraping"
    FORM_PROCESSING = "form_processing"
    IMAGE_TRANSCRIPTION = "image_transcription"

    # Translation subtypes
    DOCUMENT_TRANSLATION = "document_translation"
    WEBSITE_TRANSLATION = "website_translation"
    APP_TRANSLATION = "app_translation"
    SUBTITLE_TRANSLATION = "subtitle_translation"
    LEGAL_TRANSLATION = "legal_translation"
    TECHNICAL_TRANSLATION = "technical_translation"


class BidStatus(str, PyEnum):
    """Bid statuses."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class EscrowStatus(str, PyEnum):
    """Escrow statuses."""
    FUNDED = "funded"
    HELD = "held"
    RELEASED = "released"
    REFUNDED = "refunded"


class SubmissionStatus(str, PyEnum):
    """Submission verification statuses."""
    PENDING = "pending"
    VERIFIED = "verified"
    PARTIAL = "partial"
    FAILED = "failed"


class MessageSender(str, PyEnum):
    """Message sender types."""
    EMPLOYER = "employer"
    FREELANCER = "freelancer"
    AI_MEDIATOR = "ai_mediator"


class User(Base):
    """User model."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    pfi_score = Column(Float, default=None)
    email_verified = Column(Boolean, default=False, nullable=False)
    email_verification_token = Column(String(255), default=None)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employer_jobs = relationship("Job", back_populates="employer", foreign_keys="Job.employer_id")
    freelancer_jobs = relationship("Job", back_populates="assigned_freelancer", foreign_keys="Job.assigned_freelancer_id")
    bids = relationship("Bid", back_populates="freelancer")
    submissions = relationship("Submission", back_populates="freelancer")


class Job(Base):
    """Job model."""
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    employer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assigned_freelancer_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    gig_type = Column(Enum(GigType), nullable=True, index=True)
    gig_subtype = Column(String(100), nullable=True)
    budget_min = Column(Float, nullable=False)
    budget_max = Column(Float, nullable=False)
    deadline = Column(DateTime, nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.DRAFT, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    published_at = Column(DateTime, default=None)
    assigned_at = Column(DateTime, default=None)
    completed_at = Column(DateTime, default=None)

    # Relationships
    employer = relationship("User", back_populates="employer_jobs", foreign_keys=[employer_id])
    assigned_freelancer = relationship("User", back_populates="freelancer_jobs", foreign_keys=[assigned_freelancer_id])
    bids = relationship("Bid", back_populates="job", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="job", cascade="all, delete-orphan")
    escrow = relationship("Escrow", back_populates="job", uselist=False, cascade="all, delete-orphan")
    spec = relationship("JobSpec", back_populates="job", uselist=False, cascade="all, delete-orphan")
    chat_channel = relationship("ChatChannel", back_populates="job", uselist=False, cascade="all, delete-orphan")
    change_requests = relationship("ChangeRequest", back_populates="job", cascade="all, delete-orphan")
    dispute = relationship("Dispute", back_populates="job", uselist=False, cascade="all, delete-orphan")


class JobSpec(Base):
    """Job specification model."""
    __tablename__ = "job_specs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, unique=True, index=True)
    version = Column(Integer, default=1, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    locked_at = Column(DateTime, default=None)
    employer_locked_at = Column(DateTime, default=None)
    freelancer_locked_at = Column(DateTime, default=None)
    milestones_json = Column(JSON, nullable=False, default=list)
    requirements_json = Column(JSON, nullable=False, default=dict)  # {primary: [], secondary: [], tertiary: []}
    deliverables_json = Column(JSON, nullable=False, default=list)
    required_assets_json = Column(JSON, nullable=False, default=list)
    verification_policy = Column(String(50), default="standard", nullable=False)  # strict, standard, flexible, trust_based
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="spec")


class Bid(Base):
    """Bid model."""
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    freelancer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    cover_letter = Column(Text, nullable=False)
    proposed_deadline = Column(DateTime, default=None)
    proposed_budget = Column(Float, default=None)
    status = Column(Enum(BidStatus), default=BidStatus.PENDING, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="bids")
    freelancer = relationship("User", back_populates="bids")


class Escrow(Base):
    """Escrow model."""
    __tablename__ = "escrows"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, unique=True, index=True)
    amount = Column(Float, nullable=False)
    platform_fee = Column(Float, default=0.0, nullable=False)
    total_funded = Column(Float, nullable=False)
    released_amount = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    status = Column(Enum(EscrowStatus), default=EscrowStatus.FUNDED, nullable=False)
    funded_at = Column(DateTime, default=None)
    released_at = Column(DateTime, default=None)
    refunded_at = Column(DateTime, default=None)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="escrow")
    releases = relationship("EscrowRelease", back_populates="escrow", cascade="all, delete-orphan")


class EscrowRelease(Base):
    """Escrow release record for milestone payments."""
    __tablename__ = "escrow_releases"

    id = Column(Integer, primary_key=True, index=True)
    escrow_id = Column(Integer, ForeignKey("escrows.id"), nullable=False, index=True)
    milestone_id = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    released_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    escrow = relationship("Escrow", back_populates="releases")


class Submission(Base):
    """Submission model."""
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    milestone_id = Column(String(100), nullable=False)
    freelancer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    submission_type = Column(String(50), nullable=False)
    github_link = Column(String(500), default=None)
    file_urls = Column(JSON, default=None)
    text_content = Column(Text, default=None)
    source_document_url = Column(String(500), default=None)
    notes = Column(Text, default=None)
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.PENDING, nullable=False, index=True)
    verification_score = Column(Float, default=None)
    verification_report_json = Column(JSON, default=None)
    client_override = Column(Boolean, default=False, nullable=False)
    resubmission_count = Column(Integer, default=0, nullable=False)
    resubmissions_remaining = Column(Integer, default=2, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    verified_at = Column(DateTime, default=None)

    # Relationships
    job = relationship("Job", back_populates="submissions")
    freelancer = relationship("User", back_populates="submissions")


class ChatChannel(Base):
    """Chat channel model."""
    __tablename__ = "chat_channels"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, unique=True, index=True)
    employer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    freelancer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="chat_channel")
    messages = relationship("ChatMessage", back_populates="channel", cascade="all, delete-orphan", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    """Chat message model."""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("chat_channels.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    sender_type = Column(Enum(MessageSender), nullable=False)
    content = Column(Text, nullable=False)
    is_ai_generated = Column(Boolean, default=False, nullable=False)
    ai_intervention_type = Column(String(100), default=None)
    metadata_json = Column(JSON, default=None)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    channel = relationship("ChatChannel", back_populates="messages")


class ChangeRequest(Base):
    """Change request model."""
    __tablename__ = "change_requests"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    requested_by_role = Column(Enum(UserRole), nullable=False)
    description = Column(Text, nullable=False)
    change_type = Column(String(50), nullable=False)  # scope, budget, deadline
    proposed_changes_json = Column(JSON, nullable=False)
    status = Column(String(50), default="pending", nullable=False, index=True)
    response_message = Column(Text, default=None)
    created_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, default=None)

    # Relationships
    job = relationship("Job", back_populates="change_requests")


class DisputeStatus(str, PyEnum):
    """Dispute statuses."""
    OPEN = "open"
    UNDER_REVIEW = "under_review"
    RESOLVED_EMPLOYER = "resolved_employer"  # Employer wins - refund
    RESOLVED_FREELANCER = "resolved_freelancer"  # Freelancer wins - release
    RESOLVED_SPLIT = "resolved_split"  # Split decision
    WITHDRAWN = "withdrawn"


class Dispute(Base):
    """Dispute model for handling payment disputes."""
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, unique=True, index=True)
    initiated_by_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    initiated_by_role = Column(Enum(UserRole), nullable=False)
    reason = Column(Text, nullable=False)
    dispute_type = Column(String(50), nullable=False)  # quality, incomplete, non_delivery, scope_disagreement
    evidence_json = Column(JSON, default=list)  # List of evidence URLs/descriptions
    employer_statement = Column(Text, default=None)
    freelancer_statement = Column(Text, default=None)
    ai_recommendation = Column(Text, default=None)  # AI analysis of the dispute
    ai_recommendation_json = Column(JSON, default=None)
    status = Column(Enum(DisputeStatus), default=DisputeStatus.OPEN, nullable=False, index=True)
    resolution_notes = Column(Text, default=None)
    resolution_amount = Column(Float, default=None)  # Amount to release/refund
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, default=None)

    # Relationships
    job = relationship("Job", back_populates="dispute")


class GhostEvent(Base):
    """Ghost protocol events for tracking unresponsive users."""
    __tablename__ = "ghost_events"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    user_role = Column(Enum(UserRole), nullable=False)
    event_type = Column(String(50), nullable=False)  # warning_24h, warning_48h, warning_72h, ghost_7d
    triggered_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime, default=None)
    pfi_penalty_applied = Column(Float, default=0.0)
    is_resolved = Column(Boolean, default=False)

    # Relationships
    job = relationship("Job")
    user = relationship("User")
