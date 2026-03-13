"""Jobs API routes."""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
import httpx

from src.database import get_db
from src.models import Job, JobStatus, JobSpec, Bid, BidStatus, User, JobSpec as JobSpecModel
from src.utils.logger import api_logger
from src.auth import decode_access_token
from src.config import settings


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


@router.post("", response_model=dict)
async def create_job(
    job_data: dict,
    request: Request,
    db: Session = Depends(get_db),
):
    """Create a new job (draft).

    Args:
        job_data: Job data (title, description, budget_min, budget_max, deadline, gig_type)
        request: FastAPI request
        db: Database session

    Returns:
        Created job

    Raises:
        HTTPException: Not authenticated
        HTTPException: Not authorized
        HTTPException: Invalid data
        Server error
    """
    current_user = get_current_user(request)

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        api_logger.info(f"Creating job by user {current_user['user_id']}")

        # Verify user is employer
        if current_user.get("role") != "employer":
            api_logger.warning(f"Only employers can create jobs: {current_user['user_id']}")
            raise HTTPException(
                status_code=403,
                detail="Only employers can create jobs"
            )

        # Validate required fields
        title = job_data.get("title")
        description = job_data.get("description")
        budget_min = job_data.get("budget_min")
        budget_max = job_data.get("budget_max")
        deadline_str = job_data.get("deadline")

        if not all([title, description, budget_min, budget_max, deadline_str]):
            raise HTTPException(
                status_code=400,
                detail="Missing required fields: title, description, budget_min, budget_max, deadline"
            )

        try:
            deadline = datetime.fromisoformat(deadline_str)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid deadline format. Use ISO 8601 format."
            )

        # Create job
        new_job = Job(
            employer_id=current_user["user_id"],
            title=title,
            description=description,
            budget_min=budget_min,
            budget_max=budget_max,
            deadline=deadline,
            status=JobStatus.DRAFT,
        )

        db.add(new_job)
        db.commit()
        db.refresh(new_job)

        api_logger.info(f"Created job {new_job.id}")

        return {
            "success": True,
            "data": {
                "job_id": new_job.id,
                "employer_id": new_job.employer_id,
                "title": new_job.title,
                "description": new_job.description,
                "gig_type": new_job.gig_type.value if new_job.gig_type else None,
                "gig_subtype": new_job.gig_subtype,
                "budget_range": {
                    "min": new_job.budget_min,
                    "max": new_job.budget_max,
                    "currency": "USD"
                },
                "deadline": new_job.deadline.isoformat(),
                "status": new_job.status.value if new_job.status else None,
                "created_at": new_job.created_at.isoformat(),
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Unexpected error creating job: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Server error"
        )


@router.post("/{job_id}/spec", response_model=dict)
async def generate_job_spec(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Generate AI spec for a job.

    Args:
        job_id: Job ID
        request: FastAPI request
        db: Database session

    Returns:
        Generated spec

    Raises:
        HTTPException: Not authenticated
        HTTPException: Not authorized
        HTTPException: Job not found
        HTTPException: AI engine error
        Server error
    """
    current_user = get_current_user(request)

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        api_logger.info(f"Generating spec for job {job_id}")

        # Verify user is employer who owns the job
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            api_logger.warning(f"Job not found: {job_id}")
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        if job.employer_id != current_user["user_id"]:
            api_logger.warning(f"Unauthorized spec generation: user {current_user['user_id']} not job owner")
            raise HTTPException(
                status_code=403,
                detail="You are not the owner of this job"
            )

        # Check if spec already exists
        existing_spec = db.query(JobSpecModel).filter(JobSpecModel.job_id == job_id).first()
        if existing_spec:
            return {
                "success": True,
                "data": {
                    "spec_id": existing_spec.id,
                    "job_id": job_id,
                    "milestones": existing_spec.milestones_json,
                    "required_assets": existing_spec.required_assets_json,
                    "version": existing_spec.version,
                    "is_locked": existing_spec.is_locked,
                }
            }

        # Forward to AI engine for spec generation
        ai_engine_url = f"{settings.ai_engine_url}/generate-spec"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                ai_engine_url,
                json={
                    "job_id": job_id,
                    "title": job.title,
                    "description": job.description,
                },
                timeout=30.0,
            )

        if response.status_code != 200:
            api_logger.error(f"AI engine returned error: {response.status_code}")
            raise HTTPException(
                status_code=502,
                detail="AI engine failed to generate spec"
            )

        result = response.json()
        spec_data = result.get("data", {})

        # Create spec in database
        new_spec = JobSpecModel(
            job_id=job_id,
            milestones_json=spec_data.get("milestones", []),
            required_assets_json=spec_data.get("required_assets", []),
            version=1,
            is_locked=False,
        )

        db.add(new_spec)
        db.commit()
        db.refresh(new_spec)

        # Update job with gig type from AI
        gig_type_str = spec_data.get("gig_type")
        if gig_type_str:
            try:
                from src.models import GigType
                job.gig_type = GigType(gig_type_str.lower())
                job.gig_subtype = spec_data.get("gig_subtype")
                db.commit()
            except ValueError:
                api_logger.warning(f"Invalid gig type: {gig_type_str}")

        api_logger.info(f"Generated spec {new_spec.id} for job {job_id}")

        return {
            "success": True,
            "data": {
                "spec_id": new_spec.id,
                "job_id": job_id,
                "gig_type": job.gig_type.value if job.gig_type else None,
                "gig_subtype": job.gig_subtype,
                "milestones": new_spec.milestones_json,
                "required_assets": new_spec.required_assets_json,
                "version": new_spec.version,
                "is_locked": new_spec.is_locked,
                "vague_items": spec_data.get("vague_items", []),
            }
        }

    except HTTPException:
        raise
    except httpx.TimeoutException:
        api_logger.error("AI engine timeout")
        raise HTTPException(
            status_code=504,
            detail="AI engine timeout"
        )
    except httpx.RequestError as e:
        api_logger.error(f"AI engine request failed: {e}")
        raise HTTPException(
            status_code=502,
            detail="Failed to connect to AI engine"
        )
    except Exception as e:
        api_logger.error(f"Unexpected error generating spec: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Server error"
        )


@router.put("/{job_id}/spec", response_model=dict)
async def update_job_spec(
    job_id: int,
    spec_data: dict,
    request: Request,
    db: Session = Depends(get_db),
):
    """Update job spec (only if not locked).

    Args:
        job_id: Job ID
        spec_data: Updated spec data (milestones, required_assets)
        request: FastAPI request
        db: Database session

    Returns:
        Updated spec

    Raises:
        HTTPException: Not authenticated
        HTTPException: Not authorized
        HTTPException: Job not found
        HTTPException: Spec locked
        Server error
    """
    current_user = get_current_user(request)

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        api_logger.info(f"Updating spec for job {job_id}")

        # Verify user is employer who owns the job
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            api_logger.warning(f"Job not found: {job_id}")
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        if job.employer_id != current_user["user_id"]:
            api_logger.warning(f"Unauthorized spec update: user {current_user['user_id']} not job owner")
            raise HTTPException(
                status_code=403,
                detail="You are not the owner of this job"
            )

        # Get spec
        spec = db.query(JobSpecModel).filter(JobSpecModel.job_id == job_id).first()
        if not spec:
            raise HTTPException(
                status_code=404,
                detail="Spec not found. Generate spec first."
            )

        # Check if spec is locked
        if spec.is_locked:
            raise HTTPException(
                status_code=403,
                detail="Spec is locked and cannot be modified"
            )

        # Update spec
        spec.milestones_json = spec_data.get("milestones", spec.milestones_json)
        spec.required_assets_json = spec_data.get("required_assets", spec.required_assets_json)
        spec.version += 1

        db.commit()
        db.refresh(spec)

        api_logger.info(f"Updated spec {spec.id} to version {spec.version}")

        return {
            "success": True,
            "data": {
                "spec_id": spec.id,
                "job_id": job_id,
                "version": spec.version,
                "is_locked": spec.is_locked,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Unexpected error updating spec: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Server error"
        )


@router.post("/{job_id}/publish", response_model=dict)
async def publish_job(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Publish a job (makes it visible to freelancers).

    Args:
        job_id: Job ID
        request: FastAPI request
        db: Database session

    Returns:
        Published job

    Raises:
        HTTPException: Not authenticated
        HTTPException: Not authorized
        HTTPException: Job not found
        HTTPException: No spec exists
        Server error
    """
    current_user = get_current_user(request)

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        api_logger.info(f"Publishing job {job_id}")

        # Verify user is employer who owns the job
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            api_logger.warning(f"Job not found: {job_id}")
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        if job.employer_id != current_user["user_id"]:
            api_logger.warning(f"Unauthorized publish attempt: user {current_user['user_id']} not job owner")
            raise HTTPException(
                status_code=403,
                detail="You are not the owner of this job"
            )

        # Check if spec exists
        spec = db.query(JobSpecModel).filter(JobSpecModel.job_id == job_id).first()
        if not spec:
            raise HTTPException(
                status_code=400,
                detail="Cannot publish job without spec. Generate spec first."
            )

        # Update job status to PUBLISHED
        job.status = JobStatus.PUBLISHED
        job.published_at = datetime.utcnow()

        db.commit()
        db.refresh(job)

        api_logger.info(f"Published job {job_id}")

        return {
            "success": True,
            "data": {
                "job_id": job_id,
                "status": job.status.value if job.status else None,
                "published_at": job.published_at.isoformat() if job.published_at else None,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Unexpected error publishing job: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Server error"
        )


@router.get("", response_model=List[dict])
async def get_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=0),
    gig_type: Optional[str] = Query(None),
    min_budget: Optional[float] = Query(None),
    max_budget: Optional[float] = Query(None),
    deadline_before: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get list of published jobs with optional filtering.

    Args:
        skip: Number of jobs to skip
        limit: Max jobs to return
        gig_type: Filter by gig type
        min_budget: Minimum budget filter
        max_budget: Maximum budget filter
        deadline_before: Filter jobs by deadline
        keyword: Search in title/description
        db: Database session

    Returns:
        List of published jobs
    """
    try:
        api_logger.info(f"Fetching jobs: skip={skip}, limit={limit}, gig_type={gig_type}")

        # Build base query
        query = db.query(Job).filter(Job.status == JobStatus.PUBLISHED)

        # Apply filters
        if gig_type:
            query = query.filter(Job.gig_type == gig_type.lower())

        if min_budget:
            query = query.filter(Job.budget_min >= min_budget)

        if max_budget:
            query = query.filter(Job.budget_max <= max_budget)

        if deadline_before:
            from datetime import datetime
            deadline = datetime.fromisoformat(deadline_before)
            query = query.filter(Job.deadline <= deadline)

        if keyword:
            keyword_filter = f"%{keyword}%"
            query = query.filter(Job.title.ilike(keyword_filter) | Job.description.ilike(keyword_filter))

        # Apply pagination
        total = query.count()
        jobs = query.offset(skip).limit(limit).all()

        # Format response
        job_list = []
        for job in jobs:
            job_dict = {
                "job_id": job.id,
                "employer_id": job.employer_id,
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
                "employer_name": get_employer_name(job.employer_id, db),
                "employer_pfi": get_employer_pfi(job.employer_id, db),
            }

            job_list.append(job_dict)

        api_logger.info(f"Returning {len(job_list)} jobs")

        page_size = limit if limit > 0 else 100
        return {
            "success": True,
            "data": job_list,
            "total": total,
            "page": skip // page_size,
            "page_size": page_size,
        }

    except Exception as e:
        api_logger.error(f"Failed to fetch jobs: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch jobs"
        )


@router.get("/{job_id}", response_model=dict)
async def get_job_by_id(
    job_id: int,
    db: Session = Depends(get_db),
):
    """Get job details by ID.

    Args:
        job_id: Job ID
        db: Database session

    Returns:
        Job details with spec

    Raises:
        HTTPException: Job not found
        HTTPException: Server error
    """
    try:
        api_logger.info(f"Fetching job {job_id}")

        job = db.query(Job).filter(Job.id == job_id).first()

        if not job:
            api_logger.warning(f"Job not found: {job_id}")
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        # Get employer info
        job_dict = {
            "job_id": job.id,
            "employer_id": job.employer_id,
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
            "employer_name": get_employer_name(job.employer_id, db),
            "employer_pfi": get_employer_pfi(job.employer_id, db),
            "spec": get_job_spec(job.id, db),
        }

        api_logger.info(f"Returning job {job_id}")

        return {
            "success": True,
            "data": job_dict
        }

    except HTTPException as e:
        api_logger.error(f"Failed to fetch job {job_id}: {e}", exc_info=True)
        raise
    except Exception as e:
        api_logger.error(f"Unexpected error fetching job {job_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Server error"
        )


@router.get("/{job_id}/bids", response_model=dict)
async def get_job_bids(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Get all bids for a job (employer only).

    Args:
        job_id: Job ID
        request: FastAPI request
        db: Database session

    Returns:
        List of bids

    Raises:
        HTTPException: Not authenticated
        HTTPException: Not authorized
        HTTPException: Job not found
        Server error
    """
    current_user = get_current_user(request)

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        api_logger.info(f"Fetching bids for job {job_id}")

        # Check if job exists
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            api_logger.warning(f"Job not found: {job_id}")
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        # Verify user is employer who owns the job
        if current_user.get("role") != "employer" or job.employer_id != current_user["user_id"]:
            api_logger.warning(f"Unauthorized access to job bids: user {current_user['user_id']}")
            raise HTTPException(
                status_code=403,
                detail="Only the job owner can view bids"
            )

        # Get bids
        bids = db.query(Bid).filter(Bid.job_id == job_id).all()

        bid_list = []
        for bid in bids:
            bid_dict = {
                "bid_id": bid.id,
                "job_id": job_id,
                "freelancer_id": bid.freelancer_id,
                "freelancer_name": get_freelancer_name(bid.freelancer_id, db),
                "freelancer_pfi": get_freelancer_pfi(bid.freelancer_id, db),
                "cover_letter": bid.cover_letter,
                "proposed_deadline": bid.proposed_deadline.isoformat() if bid.proposed_deadline else None,
                "proposed_budget": bid.proposed_budget,
                "status": bid.status.value if bid.status else None,
                "created_at": bid.created_at.isoformat(),
            }
            bid_list.append(bid_dict)

        api_logger.info(f"Returning {len(bid_list)} bids for job {job_id}")

        return {
            "success": True,
            "data": bid_list
        }

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Unexpected error fetching bids: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Server error"
        )


@router.post("/{job_id}/bids", response_model=dict)
async def create_bid(
    job_id: int,
    bid_data: dict,
    request: Request,
    db: Session = Depends(get_db),
):
    """Create a bid on a job.

    Args:
        job_id: Job ID
        bid_data: Bid data (cover_letter, proposed_timeline, proposed_budget)
        request: FastAPI request
        db: Database session

    Returns:
        Created bid

    Raises:
        HTTPException: Not authenticated
        HTTPException: Job not found
        HTTPException: Not authorized
        HTTPException: Already bid on job
        HTTPException: Invalid bid data
        Server error
    """
    current_user = get_current_user(request)

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        api_logger.info(f"Creating bid for job {job_id} by user {current_user['user_id']}")

        # Verify user is freelancer
        if current_user.get("role") != "freelancer":
            api_logger.warning(f"Only freelancers can place bids: {current_user['user_id']}")
            raise HTTPException(
                status_code=403,
                detail="Only freelancers can place bids"
            )

        # Check if job exists
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            api_logger.warning(f"Job not found: {job_id}")
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        # Check if user already bid on this job
        existing_bid = db.query(Bid).filter(
            Bid.job_id == job_id,
            Bid.freelancer_id == current_user["user_id"]
        ).first()

        if existing_bid:
            api_logger.warning(f"User already bid on job {job_id}")
            raise HTTPException(
                status_code=409,
                detail="You already have a bid on this job"
            )

        # Validate bid data
        cover_letter = bid_data.get("cover_letter", "")
        proposed_budget = bid_data.get("proposed_budget")
        proposed_deadline = bid_data.get("proposed_timeline")

        if len(cover_letter) < 50:
            api_logger.warning(f"Bid too short: {len(cover_letter)} characters")
            raise HTTPException(
                status_code=400,
                detail="Cover letter must be at least 50 characters"
            )

        if len(cover_letter) > 5000:
            api_logger.warning(f"Bid too long: {len(cover_letter)} characters")
            raise HTTPException(
                status_code=400,
                detail="Cover letter must be 5000 characters or less"
            )

        # Create bid
        new_bid = Bid(
            job_id=job_id,
            freelancer_id=current_user["user_id"],
            cover_letter=cover_letter,
            proposed_deadline=proposed_deadline,
            proposed_budget=proposed_budget,
            status=BidStatus.PENDING
        )

        db.add(new_bid)
        db.commit()
        db.refresh(new_bid)

        api_logger.info(f"Created bid {new_bid.id} for job {job_id} by user {current_user['user_id']}")

        return {
            "success": True,
            "data": {
                "bid_id": new_bid.id,
                "job_id": job_id,
                "freelancer_id": new_bid.freelancer_id,
                "freelancer_name": get_freelancer_name(new_bid.freelancer_id, db),
                "freelancer_pfi": get_freelancer_pfi(new_bid.freelancer_id, db),
                "cover_letter": new_bid.cover_letter,
                "proposed_deadline": new_bid.proposed_deadline.isoformat() if new_bid.proposed_deadline else None,
                "proposed_budget": new_bid.proposed_budget,
                "status": new_bid.status.value,
                "created_at": new_bid.created_at.isoformat(),
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Unexpected error creating bid: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Server error"
        )


@router.post("/{job_id}/assign", response_model=dict)
async def assign_freelancer(
    job_id: int,
    assignment_data: dict,
    request: Request,
    db: Session = Depends(get_db),
):
    """Assign a freelancer to a job (employer only).

    Args:
        job_id: Job ID
        assignment_data: Assignment data (bid_id, freelancer_id)
        request: FastAPI request
        db: Database session

    Returns:
        Updated job with assigned freelancer

    Raises:
        HTTPException: Not authenticated
        HTTPException: Not authorized
        HTTPException: Job not found
        HTTPException: Bid not found
        Server error
    """
    current_user = get_current_user(request)

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        api_logger.info(f"Assigning freelancer to job {job_id}")

        # Verify user is employer
        if current_user.get("role") != "employer":
            api_logger.warning(f"Only employers can assign freelancers: {current_user['user_id']}")
            raise HTTPException(
                status_code=403,
                detail="Only employers can assign freelancers"
            )

        # Check if job exists and belongs to user
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            api_logger.warning(f"Job not found: {job_id}")
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        if job.employer_id != current_user["user_id"]:
            api_logger.warning(f"Unauthorized assignment attempt: user {current_user['user_id']} not job owner")
            raise HTTPException(
                status_code=403,
                detail="You are not the owner of this job"
            )

        # Get assignment data
        bid_id = assignment_data.get("bid_id")
        freelancer_id = assignment_data.get("freelancer_id")

        if not bid_id or not freelancer_id:
            raise HTTPException(
                status_code=400,
                detail="bid_id and freelancer_id are required"
            )

        # Verify bid exists and belongs to this job
        bid = db.query(Bid).filter(
            Bid.id == bid_id,
            Bid.job_id == job_id,
            Bid.freelancer_id == freelancer_id
        ).first()

        if not bid:
            api_logger.warning(f"Bid not found: {bid_id} for job {job_id}")
            raise HTTPException(
                status_code=404,
                detail="Bid not found"
            )

        # Update job status to ASSIGNED
        job.status = JobStatus.ASSIGNED
        db.commit()

        # Update bid status to ACCEPTED
        bid.status = BidStatus.ACCEPTED
        db.commit()

        # Reject all other bids for this job
        db.query(Bid).filter(
            Bid.job_id == job_id,
            Bid.id != bid_id
        ).update({"status": BidStatus.REJECTED})
        db.commit()

        api_logger.info(f"Job {job_id} assigned to freelancer {freelancer_id}")

        return {
            "success": True,
            "data": {
                "job_id": job_id,
                "status": job.status.value,
                "assigned_freelancer_id": freelancer_id,
                "assigned_at": job.updated_at.isoformat() if hasattr(job, 'updated_at') else None,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Unexpected error assigning freelancer: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Server error"
        )

        # Verify user is freelancer
        if current_user.get("role") != "freelancer":
            api_logger.warning(f"Only freelancers can place bids: {current_user['user_id']}")
            raise HTTPException(
                status_code=403,
                detail="Only freelancers can place bids"
            )

        # Check if job exists
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            api_logger.warning(f"Job not found: {job_id}")
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        # Check if user already bid on this job
        existing_bid = db.query(Bid).filter(
            Bid.job_id == job_id,
            Bid.freelancer_id == current_user["user_id"]
        ).first()

        if existing_bid:
            api_logger.warning(f"User already bid on job {job_id}")
            raise HTTPException(
                status_code=409,
                detail="You already have a bid on this job"
            )

        # Validate bid data
        cover_letter = bid_data.get("cover_letter", "")
        proposed_budget = bid_data.get("proposed_budget")
        proposed_deadline = bid_data.get("proposed_timeline")

        if len(cover_letter) < 50:
            api_logger.warning(f"Bid too short: {len(cover_letter)} characters")
            raise HTTPException(
                status_code=400,
                detail="Cover letter must be at least 50 characters"
            )

        if len(cover_letter) > 5000:
            api_logger.warning(f"Bid too long: {len(cover_letter)} characters")
            raise HTTPException(
                status_code=400,
                detail="Cover letter must be 5000 characters or less"
            )

        # Create bid
        new_bid = Bid(
            job_id=job_id,
            freelancer_id=current_user["user_id"],
            cover_letter=cover_letter,
            proposed_deadline=proposed_deadline,
            proposed_budget=proposed_budget,
            status=BidStatus.PENDING
        )

        db.add(new_bid)
        db.commit()
        db.refresh(new_bid)

        api_logger.info(f"Created bid {new_bid.id} for job {job_id} by user {current_user['user_id']}")

        return {
            "success": True,
            "data": {
                "bid_id": new_bid.id,
                "job_id": job_id,
                "freelancer_id": new_bid.freelancer_id,
                "freelancer_name": get_freelancer_name(new_bid.freelancer_id, db),
                "freelancer_pfi": get_freelancer_pfi(new_bid.freelancer_id, db),
                "cover_letter": new_bid.cover_letter,
                "proposed_deadline": new_bid.proposed_deadline.isoformat() if new_bid.proposed_deadline else None,
                "proposed_budget": new_bid.proposed_budget,
                "status": new_bid.status.value,
                "created_at": new_bid.created_at.isoformat(),
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Unexpected error creating bid: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Server error"
        )


def get_employer_name(employer_id: int, db: Session) -> Optional[str]:
    """Get employer name from ID."""
    user = db.query(User).filter(User.id == employer_id).first()
    return user.name if user else None


def get_freelancer_name(freelancer_id: int, db: Session) -> Optional[str]:
    """Get freelancer name from ID."""
    user = db.query(User).filter(User.id == freelancer_id).first()
    return user.name if user else None


def get_employer_pfi(employer_id: int, db: Session) -> Optional[float]:
    """Get employer PFI score from ID."""
    user = db.query(User).filter(User.id == employer_id).first()
    return user.pfi_score if user else None


def get_freelancer_pfi(freelancer_id: int, db: Session) -> Optional[float]:
    """Get freelancer PFI score from ID."""
    user = db.query(User).filter(User.id == freelancer_id).first()
    return user.pfi_score if user else None


def get_job_spec(job_id: int, db: Session) -> Optional[dict]:
    """Get job spec for a job."""
    spec = db.query(JobSpec).filter(JobSpec.job_id == job_id).first()

    if not spec:
        return None

    return {
        "spec_id": spec.id,
        "job_id": spec.job_id,
        "version": spec.version,
        "is_locked": spec.is_locked,
        "locked_at": spec.locked_at.isoformat() if spec.locked_at else None,
        "milestones_json": spec.milestones_json,
        "required_assets_json": spec.required_assets_json,
        "created_at": spec.created_at.isoformat(),
    }
