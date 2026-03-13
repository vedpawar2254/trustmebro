"""AI verification API routes."""
from typing import Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.config import settings
from src.utils.logger import api_logger
from src.auth import decode_access_token


router = APIRouter(prefix="/api/ai", tags=["ai"])


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


@router.post("/verify")
async def verify_submission(
    request_data: dict,
    request: Request,
    db: Session = Depends(get_db),
):
    """Verify a submission using AI engine.

    Args:
        request_data: Verification data (job_id, milestone_id, submission, criteria)
        request: FastAPI request
        db: Database session

    Returns:
        Verification report from AI engine

    Raises:
        HTTPException: Not authenticated
        HTTPException: Verification failed
        HTTPException: Server error
    """
    current_user = get_current_user(request)

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        api_logger.info(f"Verification request from user {current_user['user_id']}")

        # Forward request to AI engine
        ai_engine_url = f"{settings.ai_engine_url}/verify"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                ai_engine_url,
                json=request_data,
                timeout=30.0,
            )

        if response.status_code != 200:
            api_logger.error(f"AI engine returned error: {response.status_code}")
            raise HTTPException(
                status_code=502,
                detail="AI engine verification failed"
            )

        result = response.json()
        api_logger.info(f"Verification completed successfully")

        return result

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
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Verification failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Verification failed"
        )


@router.get("/health")
async def ai_health_check():
    """Check AI engine health.

    Returns:
        AI engine status

    Raises:
        HTTPException: AI engine unavailable
    """
    try:
        ai_engine_url = f"{settings.ai_engine_url}/health"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                ai_engine_url,
                timeout=5.0,
            )

        if response.status_code == 200:
            return {
                "success": True,
                "data": response.json()
            }
        else:
            raise HTTPException(
                status_code=502,
                detail="AI engine unhealthy"
            )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="AI engine timeout"
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Failed to connect to AI engine"
        )
    except Exception as e:
        api_logger.error(f"AI health check failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Health check failed"
        )
