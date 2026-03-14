"""SQLAlchemy database models."""
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, Enum, ForeignKey, JSON
)
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


class UserRole(str, Enum):
    """User roles."""
    EMPLOYER = "employer"
    FREELANCER = "freelancer"


class JobStatus(str, Enum):
    """Job statuses."""
    DRAFT = "draft"
    PUBLISHED = "published"
    ASSIGNED = "assigned"
    ESCROW_FUNDED = "escrow_funded"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DISPUTED = "disputed"


class GigType(str, Enum):
    """Gig types."""
    SOFTWARE = "software"
    COPYWRITING = "copywriting"
    DATA_ENTRY = "data_entry"
    TRANSLATION = "translation"


class GigSubtype(str, Enum):
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
    SUBTITLE_TRANSLATION = "subtitle_transSLATION"
    LEGAL_TRANSLATION = "legal_translation"
    TECHNICAL_TRANSLATION = "technical_translation"


class BidStatus(str, Enum):
    """Bid statuses."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class EscrowStatus(str, Enum):
    """Escrow statuses."""
    FUNDED = "funded"
    HELD = "held"
    RELEASED = "released"
    REFUNDED = "refunded"


class CriterionType(str, Enum):
    """Criterion types."""
    PRIMARY = "PRIMARY"
    SECONDARY = "SECONDARY"


class VerificationStatus(str, Enum):
    """Verification status."""
    PASS = "pass"
    FAIL = "fail"
    PARTIAL = "partial"


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
    jobs = relationship("Job", back_populates="employer")
    bids = relationship("Bid", back_populates="freelancer")
    submissions = relationship("Submission", back_populates="freelancer")


class Job(Base):
    """Job model."""
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    employer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    gig_type = Column(Enum(GigType), nullable=False, index=True)
    gig_subtype = Column(String(100))
    budget_min = Column(Float, nullable=False)
    budget_max = Column(Float, nullable=False)
    deadline = Column(DateTime, nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.DRAFT, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    published_at = Column(DateTime, default=None)
    spec_locked_at = Column(DateTime, default=None)

    # Relationships
    employer = relationship("User", back_populates="jobs")
    bids = relationship("Bid", back_populates="job")
    submissions = relationship("Submission", back_populates="job")
    escrow = relationship("Escrow", back_populates="job", uselist=False)
    spec = relationship("JobSpec", back_populates="job", uselist=False)
    chat_channel = relationship("ChatChannel", back_populates="job", uselist=False)
    change_requests = relationship("ChangeRequest", back_populates="job", uselist=False)


class MilestoneCriterion(Base):
    """Milestone criterion model."""
    __tablename__ = "milestone_criteria"

    id = Column(Integer, primary_key=True, index=True)
    job_spec_id = Column(Integer, ForeignKey("job_specs.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    criterion_type = Column(Enum(CriterionType), nullable=False)
    verification_status = Column(Enum(VerificationStatus), default="pending", nullable=False)
    is_verifiable = Column(Boolean, default=True, nullable=False)
    is_vague = Column(Boolean, default=False, nullable=False)
    vague_resolved = Column(Boolean, default=False, nullable=False)
    weight = Column(Float, default=0.1, nullable=False)


class RequiredAsset(Base):
    """Required asset model."""
    __tablename__ = "required_assets"

    id = Column(Integer, primary_key=True, index=True)
    job_spec_id = Column(Integer, ForeignKey("job_specs.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    is_delivered = Column(Boolean, default=False, nullable=False)
    delivered_at = Column(DateTime, default=None)


class Milestone(Base):
    """Milestone model."""
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    job_spec_id = Column(Integer, ForeignKey("job_specs.id"), nullable=False, index=True)
    order = Column(Integer, nullable=False)
    title = Column(String(500), nullable=False)
    deadline = Column(DateTime, nullable=False)

    # Relationships
    job_spec = relationship("JobSpec", back_populates="milestones")
    criteria = relationship("MilestoneCriterion", back_populates="milestone")
    submission_requirements = relationship("SubmissionRequirement", back_populates="milestone", uselist=False)


class JobSpec(Base):
    """Job specification model."""
    __tablename__ = "job_specs"

    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    version = Column(Integer, default=1, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    milestones_json = Column(JSON, nullable=False)
    required_assets_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

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


class Escrow(Base):
    """Escrow model."""
    __tablename__ = "escrows"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    status = Column(Enum(EscrowStatus), default=EscrowStatus.FUNDED, nullable=False)
    funded_at = Column(DateTime, default=None)
    released_at = Column(DateTime, default=None)
    refunded_at = Column(DateTime, default=None)
    created_at = Column(DateTime, default=datetime.utcnow)


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
    status = Column(String(50), default="pending", nullable=False, index=True)
    verification_report_json = Column(JSON, default=None)
    resubmission_count = Column(Integer, default=0)
    resubmissions_remaining = Column(Integer, default=2)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ChatChannel(Base):
    """Chat channel model."""
    __tablename__ = "chat_channels"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    employer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    freelancer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ChangeRequest(Base):
    """Change request model."""
    __tablename__ = "change_requests"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    requested_by_role = Column(Enum(UserRole), nullable=False)
    description = Column(Text, nullable=False)
    new_scope = Column(Text, default=None)
    budget_adjustment = Column(Float, default=None)
    deadline_adjustment = Column(String(100), default=None)
    status = Column(String(50), default="pending", nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, default=None)
