"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field, field_validator
from enum import Enum


# Enums for validation
class UserRoleEnum(str, Enum):
    EMPLOYER = "employer"
    FREELANCER = "freelancer"


class SubmissionTypeEnum(str, Enum):
    GITHUB_LINK = "github_link"
    FILE_UPLOAD = "file_upload"
    TEXT_PASTE = "text_paste"
    DOCUMENT_PAIR = "document_pair"


class ChangeTypeEnum(str, Enum):
    SCOPE = "scope"
    BUDGET = "budget"
    DEADLINE = "deadline"


# Auth Schemas
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: UserRoleEnum

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    pfi_score: Optional[float] = None

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    success: bool = True
    token: str
    user: UserResponse


# Job Schemas
class CreateJobRequest(BaseModel):
    title: str = Field(..., min_length=10, max_length=500)
    description: str = Field(..., min_length=50)
    budget_min: float = Field(..., gt=0)
    budget_max: float = Field(..., gt=0)
    deadline: datetime

    @field_validator("budget_max")
    @classmethod
    def validate_budget_range(cls, v, info):
        if "budget_min" in info.data and v < info.data["budget_min"]:
            raise ValueError("budget_max must be greater than or equal to budget_min")
        return v


class JobSpecUpdate(BaseModel):
    milestones: Optional[List[dict]] = None
    requirements: Optional[dict] = None  # {primary: [], secondary: [], tertiary: []}
    deliverables: Optional[List[dict]] = None
    required_assets: Optional[List[dict]] = None
    verification_policy: Optional[str] = None  # strict, standard, flexible, trust_based


class JobResponse(BaseModel):
    job_id: int
    employer_id: int
    assigned_freelancer_id: Optional[int] = None
    title: str
    description: str
    gig_type: Optional[str] = None
    gig_subtype: Optional[str] = None
    budget_range: dict
    deadline: str
    status: str
    created_at: str
    published_at: Optional[str] = None
    employer_name: Optional[str] = None
    employer_pfi: Optional[float] = None
    spec: Optional[dict] = None


# Bid Schemas
class CreateBidRequest(BaseModel):
    cover_letter: str = Field(..., min_length=50, max_length=5000)
    proposed_budget: Optional[float] = Field(None, gt=0)
    proposed_timeline: Optional[datetime] = None


class AssignFreelancerRequest(BaseModel):
    bid_id: int
    freelancer_id: int


class BidResponse(BaseModel):
    bid_id: int
    job_id: int
    freelancer_id: int
    freelancer_name: Optional[str] = None
    freelancer_pfi: Optional[float] = None
    cover_letter: str
    proposed_deadline: Optional[str] = None
    proposed_budget: Optional[float] = None
    status: str
    created_at: str


# Escrow Schemas
class FundEscrowRequest(BaseModel):
    amount: float = Field(..., gt=0)


class EscrowResponse(BaseModel):
    escrow_id: int
    job_id: int
    amount: float
    currency: str = "USD"
    status: str
    funded_at: Optional[str] = None
    released_at: Optional[str] = None
    refunded_at: Optional[str] = None


# Submission Schemas
class CreateSubmissionRequest(BaseModel):
    milestone_id: str = Field(..., min_length=1)
    submission_type: SubmissionTypeEnum
    github_link: Optional[str] = None
    file_urls: Optional[List[str]] = None
    text_content: Optional[str] = None
    source_document_url: Optional[str] = None

    @field_validator("github_link")
    @classmethod
    def validate_github_link(cls, v, info):
        if info.data.get("submission_type") == SubmissionTypeEnum.GITHUB_LINK and not v:
            raise ValueError("github_link is required for github_link submission type")
        if v and not v.startswith("https://github.com/"):
            raise ValueError("github_link must be a valid GitHub URL")
        return v


class ResubmitRequest(BaseModel):
    github_link: Optional[str] = None
    file_urls: Optional[List[str]] = None
    text_content: Optional[str] = None
    source_document_url: Optional[str] = None


class SubmissionResponse(BaseModel):
    submission_id: int
    job_id: int
    milestone_id: str
    freelancer_id: int
    submission_type: str
    github_link: Optional[str] = None
    file_urls: Optional[List[str]] = None
    text_content: Optional[str] = None
    source_document_url: Optional[str] = None
    status: str
    verification_score: Optional[float] = None
    verification_report: Optional[dict] = None
    resubmission_count: int
    resubmissions_remaining: int
    created_at: str
    updated_at: str


# Chat Schemas
class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class ChatMessageResponse(BaseModel):
    message_id: int
    channel_id: int
    sender_id: Optional[int] = None
    sender_type: str
    sender_name: Optional[str] = None
    content: str
    is_ai_generated: bool
    ai_intervention_type: Optional[str] = None
    created_at: str


class ChatChannelResponse(BaseModel):
    channel_id: int
    job_id: int
    employer_id: int
    freelancer_id: int
    is_active: bool
    created_at: str
    messages: Optional[List[ChatMessageResponse]] = None


# Change Request Schemas
class CreateChangeRequest(BaseModel):
    description: str = Field(..., min_length=20)
    change_type: ChangeTypeEnum
    proposed_changes: dict

    @field_validator("proposed_changes")
    @classmethod
    def validate_proposed_changes(cls, v, info):
        change_type = info.data.get("change_type")
        if change_type == ChangeTypeEnum.BUDGET and "new_budget" not in v:
            raise ValueError("new_budget is required for budget change requests")
        if change_type == ChangeTypeEnum.DEADLINE and "new_deadline" not in v:
            raise ValueError("new_deadline is required for deadline change requests")
        if change_type == ChangeTypeEnum.SCOPE and "new_scope" not in v:
            raise ValueError("new_scope is required for scope change requests")
        return v


class RespondChangeRequest(BaseModel):
    accept: bool
    response_message: Optional[str] = None


# Verification Schemas
class VerificationResult(BaseModel):
    overall_score: float
    status: str
    criteria_results: List[dict]
    feedback: str
    payment_decision: str


# Generic Response
class SuccessResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    code: str = "ERROR"


class PaginatedResponse(BaseModel):
    success: bool = True
    data: List[Any]
    total: int
    page: int
    page_size: int
