"""Jobs API routes."""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
import httpx

from src.database import get_db
from src.models import Job, JobStatus, JobSpec, Bid, BidStatus, User, GigType, ChatChannel
from src.schemas import (
    CreateJobRequest, JobSpecUpdate, CreateBidRequest, AssignFreelancerRequest,
    SuccessResponse, PaginatedResponse
)
from src.utils.logger import api_logger
from src.auth import decode_access_token
from src.config import settings


router = APIRouter(prefix="/api/jobs", tags=["jobs"])


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


def get_user_pfi(user_id: int, db: Session) -> Optional[float]:
    """Get user PFI score from ID."""
    user = db.query(User).filter(User.id == user_id).first()
    return user.pfi_score if user else None


def format_job_response(job: Job, db: Session, include_spec: bool = False) -> dict:
    """Format job for API response."""
    result = {
        "job_id": job.id,
        "employer_id": job.employer_id,
        "assigned_freelancer_id": job.assigned_freelancer_id,
        "title": job.title,
        "description": job.description,
        "gig_type": job.gig_type.value if job.gig_type else None,
        "gig_subtype": job.gig_subtype,
        "budget_range": {
            "min": job.budget_min,
            "max": job.budget_max,
            "currency": "USD"
        },
        "deadline": job.deadline.isoformat(),
        "status": job.status.value if job.status else None,
        "created_at": job.created_at.isoformat(),
        "published_at": job.published_at.isoformat() if job.published_at else None,
        "assigned_at": job.assigned_at.isoformat() if job.assigned_at else None,
        "employer_name": get_user_name(job.employer_id, db),
        "employer_pfi": get_user_pfi(job.employer_id, db),
    }

    if job.assigned_freelancer_id:
        result["freelancer_name"] = get_user_name(job.assigned_freelancer_id, db)
        result["freelancer_pfi"] = get_user_pfi(job.assigned_freelancer_id, db)

    if include_spec:
        spec = db.query(JobSpec).filter(JobSpec.job_id == job.id).first()
        if spec:
            result["spec"] = {
                "spec_id": spec.id,
                "version": spec.version,
                "is_locked": spec.is_locked,
                "locked_at": spec.locked_at.isoformat() if spec.locked_at else None,
                "milestones": spec.milestones_json,
                "required_assets": spec.required_assets_json,
                "created_at": spec.created_at.isoformat(),
            }

    return result


# ============== JOB CRUD ==============

@router.post("", response_model=SuccessResponse)
async def create_job(
    job_data: CreateJobRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Create a new job (draft). Employer only."""
    current_user = require_auth(request)

    if current_user.get("role") != "employer":
        raise HTTPException(status_code=403, detail="Only employers can create jobs")

    new_job = Job(
        employer_id=current_user["user_id"],
        title=job_data.title,
        description=job_data.description,
        budget_min=job_data.budget_min,
        budget_max=job_data.budget_max,
        deadline=job_data.deadline,
        status=JobStatus.DRAFT,
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    api_logger.info(f"Created job {new_job.id} by employer {current_user['user_id']}")

    return SuccessResponse(data=format_job_response(new_job, db))


@router.get("", response_model=SuccessResponse)
async def get_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    gig_type: Optional[str] = Query(None),
    min_budget: Optional[float] = Query(None),
    max_budget: Optional[float] = Query(None),
    deadline_before: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get list of published jobs with filtering."""
    # Build base query
    query = db.query(Job)

    # Filter by status (default to PUBLISHED for public browsing)
    if status:
        try:
            job_status = JobStatus(status.lower())
            query = query.filter(Job.status == job_status)
        except ValueError:
            pass
    else:
        query = query.filter(Job.status == JobStatus.PUBLISHED)

    # Apply filters
    if gig_type:
        try:
            gt = GigType(gig_type.lower())
            query = query.filter(Job.gig_type == gt)
        except ValueError:
            pass

    if min_budget:
        query = query.filter(Job.budget_max >= min_budget)

    if max_budget:
        query = query.filter(Job.budget_min <= max_budget)

    if deadline_before:
        try:
            deadline = datetime.fromisoformat(deadline_before)
            query = query.filter(Job.deadline <= deadline)
        except ValueError:
            pass

    if keyword:
        keyword_filter = f"%{keyword}%"
        query = query.filter(
            (Job.title.ilike(keyword_filter)) | (Job.description.ilike(keyword_filter))
        )

    # Get total count
    total = query.count()

    # Apply pagination and ordering
    jobs = query.order_by(Job.published_at.desc().nullsfirst()).offset(skip).limit(limit).all()

    job_list = [format_job_response(job, db) for job in jobs]

    return SuccessResponse(data={
        "jobs": job_list,
        "total": total,
        "page": skip // limit,
        "page_size": limit,
    })


@router.get("/my", response_model=SuccessResponse)
async def get_my_jobs(
    request: Request,
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get jobs for the current user (employer's jobs or freelancer's assigned jobs)."""
    current_user = require_auth(request)

    if current_user.get("role") == "employer":
        query = db.query(Job).filter(Job.employer_id == current_user["user_id"])
    else:
        query = db.query(Job).filter(Job.assigned_freelancer_id == current_user["user_id"])

    if status:
        try:
            job_status = JobStatus(status.lower())
            query = query.filter(Job.status == job_status)
        except ValueError:
            pass

    jobs = query.order_by(Job.created_at.desc()).all()
    job_list = [format_job_response(job, db, include_spec=True) for job in jobs]

    return SuccessResponse(data=job_list)


@router.get("/{job_id}", response_model=SuccessResponse)
async def get_job_by_id(
    job_id: int,
    db: Session = Depends(get_db),
):
    """Get job details by ID."""
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return SuccessResponse(data=format_job_response(job, db, include_spec=True))


# ============== SPEC MANAGEMENT ==============

@router.post("/{job_id}/spec", response_model=SuccessResponse)
async def generate_job_spec(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Generate AI spec for a job. Employer only."""
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.employer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You are not the owner of this job")

    # Check if spec already exists
    existing_spec = db.query(JobSpec).filter(JobSpec.job_id == job_id).first()
    if existing_spec:
        return SuccessResponse(data={
            "spec_id": existing_spec.id,
            "job_id": job_id,
            "milestones": existing_spec.milestones_json,
            "required_assets": existing_spec.required_assets_json,
            "version": existing_spec.version,
            "is_locked": existing_spec.is_locked,
            "message": "Spec already exists"
        })

    # Call AI engine for spec generation
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.ai_engine_url}/generate-spec",
                json={
                    "job_id": job_id,
                    "title": job.title,
                    "description": job.description,
                },
                timeout=30.0,
            )

        if response.status_code != 200:
            api_logger.error(f"AI engine spec generation failed: {response.status_code}")
            raise HTTPException(status_code=502, detail="AI engine failed to generate spec")

        result = response.json()
        spec_data = result.get("data", result)

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI engine timeout")
    except httpx.RequestError as e:
        api_logger.error(f"AI engine connection failed: {e}")
        raise HTTPException(status_code=502, detail="Failed to connect to AI engine")

    # Create spec in database
    new_spec = JobSpec(
        job_id=job_id,
        milestones_json=spec_data.get("milestones", []),
        required_assets_json=spec_data.get("required_assets", []),
        version=1,
        is_locked=False,
    )

    db.add(new_spec)

    # Update job with gig type from AI
    gig_type_str = spec_data.get("gig_type")
    if gig_type_str:
        try:
            job.gig_type = GigType(gig_type_str.lower())
            job.gig_subtype = spec_data.get("gig_subtype")
        except ValueError:
            api_logger.warning(f"Invalid gig type from AI: {gig_type_str}")

    db.commit()
    db.refresh(new_spec)

    api_logger.info(f"Generated spec {new_spec.id} for job {job_id}")

    return SuccessResponse(data={
        "spec_id": new_spec.id,
        "job_id": job_id,
        "gig_type": job.gig_type.value if job.gig_type else None,
        "gig_subtype": job.gig_subtype,
        "milestones": new_spec.milestones_json,
        "required_assets": new_spec.required_assets_json,
        "version": new_spec.version,
        "is_locked": new_spec.is_locked,
        "vague_items": spec_data.get("vague_items", []),
    })


@router.put("/{job_id}/spec", response_model=SuccessResponse)
async def update_job_spec(
    job_id: int,
    spec_data: JobSpecUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    """Update job spec (only if not locked). Employer only."""
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.employer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You are not the owner of this job")

    spec = db.query(JobSpec).filter(JobSpec.job_id == job_id).first()
    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found. Generate spec first.")

    if spec.is_locked:
        raise HTTPException(status_code=403, detail="Spec is locked and cannot be modified")

    # Update spec
    if spec_data.milestones is not None:
        spec.milestones_json = spec_data.milestones
    if spec_data.required_assets is not None:
        spec.required_assets_json = spec_data.required_assets

    spec.version += 1
    spec.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(spec)

    api_logger.info(f"Updated spec {spec.id} to version {spec.version}")

    return SuccessResponse(data={
        "spec_id": spec.id,
        "job_id": job_id,
        "version": spec.version,
        "is_locked": spec.is_locked,
    })


@router.post("/{job_id}/spec/lock", response_model=SuccessResponse)
async def lock_job_spec(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Lock the job spec (makes it immutable). Employer only."""
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.employer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You are not the owner of this job")

    spec = db.query(JobSpec).filter(JobSpec.job_id == job_id).first()
    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")

    if spec.is_locked:
        raise HTTPException(status_code=400, detail="Spec is already locked")

    spec.is_locked = True
    spec.locked_at = datetime.utcnow()
    db.commit()

    api_logger.info(f"Locked spec {spec.id} for job {job_id}")

    return SuccessResponse(
        data={"spec_id": spec.id, "is_locked": True, "locked_at": spec.locked_at.isoformat()},
        message="Spec locked successfully"
    )


# ============== PUBLISHING ==============

@router.post("/{job_id}/publish", response_model=SuccessResponse)
async def publish_job(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Publish a job (makes it visible to freelancers). Employer only."""
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.employer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You are not the owner of this job")

    if job.status != JobStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only draft jobs can be published")

    # Check if spec exists
    spec = db.query(JobSpec).filter(JobSpec.job_id == job_id).first()
    if not spec:
        raise HTTPException(status_code=400, detail="Cannot publish job without spec. Generate spec first.")

    job.status = JobStatus.PUBLISHED
    job.published_at = datetime.utcnow()

    db.commit()
    db.refresh(job)

    api_logger.info(f"Published job {job_id}")

    return SuccessResponse(data={
        "job_id": job_id,
        "status": job.status.value,
        "published_at": job.published_at.isoformat(),
    })


# ============== BIDDING ==============

@router.get("/{job_id}/bids", response_model=SuccessResponse)
async def get_job_bids(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Get all bids for a job. Employer only."""
    current_user = require_auth(request)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.employer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the job owner can view bids")

    bids = db.query(Bid).filter(Bid.job_id == job_id).order_by(Bid.created_at.desc()).all()

    bid_list = []
    for bid in bids:
        bid_list.append({
            "bid_id": bid.id,
            "job_id": job_id,
            "freelancer_id": bid.freelancer_id,
            "freelancer_name": get_user_name(bid.freelancer_id, db),
            "freelancer_pfi": get_user_pfi(bid.freelancer_id, db),
            "cover_letter": bid.cover_letter,
            "proposed_deadline": bid.proposed_deadline.isoformat() if bid.proposed_deadline else None,
            "proposed_budget": bid.proposed_budget,
            "status": bid.status.value,
            "created_at": bid.created_at.isoformat(),
        })

    return SuccessResponse(data=bid_list)


@router.post("/{job_id}/bids", response_model=SuccessResponse)
async def create_bid(
    job_id: int,
    bid_data: CreateBidRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Create a bid on a job. Freelancer only."""
    current_user = require_auth(request)

    if current_user.get("role") != "freelancer":
        raise HTTPException(status_code=403, detail="Only freelancers can place bids")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status != JobStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Job is not accepting bids")

    # Check for existing bid
    existing_bid = db.query(Bid).filter(
        Bid.job_id == job_id,
        Bid.freelancer_id == current_user["user_id"]
    ).first()

    if existing_bid:
        raise HTTPException(status_code=409, detail="You already have a bid on this job")

    new_bid = Bid(
        job_id=job_id,
        freelancer_id=current_user["user_id"],
        cover_letter=bid_data.cover_letter,
        proposed_deadline=bid_data.proposed_timeline,
        proposed_budget=bid_data.proposed_budget,
        status=BidStatus.PENDING,
    )

    db.add(new_bid)
    db.commit()
    db.refresh(new_bid)

    api_logger.info(f"Created bid {new_bid.id} for job {job_id} by freelancer {current_user['user_id']}")

    return SuccessResponse(data={
        "bid_id": new_bid.id,
        "job_id": job_id,
        "freelancer_id": new_bid.freelancer_id,
        "freelancer_name": get_user_name(new_bid.freelancer_id, db),
        "cover_letter": new_bid.cover_letter,
        "proposed_deadline": new_bid.proposed_deadline.isoformat() if new_bid.proposed_deadline else None,
        "proposed_budget": new_bid.proposed_budget,
        "status": new_bid.status.value,
        "created_at": new_bid.created_at.isoformat(),
    })


@router.delete("/{job_id}/bids/{bid_id}", response_model=SuccessResponse)
async def withdraw_bid(
    job_id: int,
    bid_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Withdraw a bid. Freelancer only."""
    current_user = require_auth(request)

    bid = db.query(Bid).filter(
        Bid.id == bid_id,
        Bid.job_id == job_id
    ).first()

    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    if bid.freelancer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You can only withdraw your own bids")

    if bid.status != BidStatus.PENDING:
        raise HTTPException(status_code=400, detail="Can only withdraw pending bids")

    bid.status = BidStatus.WITHDRAWN
    db.commit()

    api_logger.info(f"Bid {bid_id} withdrawn by freelancer {current_user['user_id']}")

    return SuccessResponse(message="Bid withdrawn successfully")


# ============== ASSIGNMENT ==============

@router.post("/{job_id}/assign", response_model=SuccessResponse)
async def assign_freelancer(
    job_id: int,
    assignment_data: AssignFreelancerRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Assign a freelancer to a job. Employer only."""
    current_user = require_auth(request)

    if current_user.get("role") != "employer":
        raise HTTPException(status_code=403, detail="Only employers can assign freelancers")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.employer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You are not the owner of this job")

    if job.status != JobStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Job must be published to assign a freelancer")

    # Verify bid exists and matches
    bid = db.query(Bid).filter(
        Bid.id == assignment_data.bid_id,
        Bid.job_id == job_id,
        Bid.freelancer_id == assignment_data.freelancer_id,
        Bid.status == BidStatus.PENDING
    ).first()

    if not bid:
        raise HTTPException(status_code=404, detail="Valid pending bid not found")

    # Update job
    job.status = JobStatus.ASSIGNED
    job.assigned_freelancer_id = assignment_data.freelancer_id
    job.assigned_at = datetime.utcnow()

    # Lock spec when freelancer is assigned
    spec = db.query(JobSpec).filter(JobSpec.job_id == job_id).first()
    if spec and not spec.is_locked:
        spec.is_locked = True
        spec.locked_at = datetime.utcnow()

    # Update bid statuses
    bid.status = BidStatus.ACCEPTED

    # Reject all other bids
    db.query(Bid).filter(
        Bid.job_id == job_id,
        Bid.id != bid.id,
        Bid.status == BidStatus.PENDING
    ).update({"status": BidStatus.REJECTED})

    # Create chat channel for the job
    channel = ChatChannel(
        job_id=job_id,
        employer_id=job.employer_id,
        freelancer_id=assignment_data.freelancer_id,
        is_active=True,
    )
    db.add(channel)

    db.commit()

    api_logger.info(f"Job {job_id} assigned to freelancer {assignment_data.freelancer_id}")

    return SuccessResponse(data={
        "job_id": job_id,
        "status": job.status.value,
        "assigned_freelancer_id": assignment_data.freelancer_id,
        "assigned_freelancer_name": get_user_name(assignment_data.freelancer_id, db),
        "assigned_at": job.assigned_at.isoformat(),
        "spec_locked": True,
    })
