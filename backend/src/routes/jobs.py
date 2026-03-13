"""Jobs API routes."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import Job, JobStatus, Bid, BidStatus, User
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
