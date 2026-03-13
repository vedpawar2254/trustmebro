"""FastAPI application for AI verification engine."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from src.config import settings
from src.utils.logger import api_logger, setup_logger
from src.lanes.router import lane_router

# Set up main logger
main_logger = setup_logger("main")


# Request/Response Models
class VerificationRequest(BaseModel):
    """Verification request from backend."""

    milestone_id: str = Field(..., description="Milestone identifier")
    job_id: str = Field(..., description="Job identifier")
    submission: dict = Field(..., description="Submission data")
    criteria: list = Field(..., description="List of criteria to verify")


class VerificationResponse(BaseModel):
    """Verification response to backend."""

    success: bool = True
    data: dict = None


class ErrorResponse(BaseModel):
    """Error response."""

    success: bool = False
    error: str
    code: str = "INTERNAL_ERROR"


# Create FastAPI app
app = FastAPI(
    title="TrustMeBro AI Engine",
    description="AI-powered verification engine for freelance platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@asynccontextmanager
async def log_request(request: Request):
    """Log incoming requests."""
    api_logger.info(f"{request.method} {request.url.path}")
    try:
        yield
    finally:
        api_logger.info(f"{request.method} {request.url.path} - Completed")


@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    main_logger.info("Starting AI verification engine...")
    main_logger.info(f"Server URL: {settings.server_url}")

    # Validate settings
    try:
        settings.validate()
    except ValueError as e:
        main_logger.error(f"Configuration error: {e}")
        raise

    main_logger.info("AI verification engine started successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    main_logger.info("Shutting down AI verification engine...")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "trustmebro AI Engine",
        "version": "0.1.0",
        "status": "running",
        "supported_gig_types": lane_router.get_supported_gig_types(),
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": "2024-03-14T00:00:00Z",
    }


@app.post("/verify")
async def verify_submission(request: VerificationRequest) -> JSONResponse:
    """Verify a submission and generate report.

    This is the main endpoint used by the backend to trigger verification.
    """
    async with log_request(request):
        try:
            main_logger.info(f"Verifying milestone: {request.milestone_id}")

            # Route to appropriate lane
            gig_type = request.submission.get("gig_type", "SOFTWARE")

            report = await lane_router.verify(
                gig_type=gig_type,
                submission=request.submission,
                criteria=request.criteria,
            )

            main_logger.info(
                f"Verification complete: score={report.overall_score}, decision={report.payment_decision}"
            )

            return JSONResponse(
                status_code=200,
                content={"success": True, "data": report.model_dump()},
            )

        except ValueError as e:
            api_logger.error(f"Validation error: {e}")
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": str(e), "code": "VALIDATION_ERROR"},
            )
        except Exception as e:
            api_logger.error(f"Verification failed: {e}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={"success": False, "error": "Internal server error", "code": "INTERNAL_ERROR"},
            )


@app.exception_handler(ValueError)
async def validation_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    """Handle validation errors."""
    api_logger.warning(f"Validation error: {exc}")
    return JSONResponse(
        status_code=400,
        content={"success": False, "error": str(exc), "code": "VALIDATION_ERROR"},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle general exceptions."""
    api_logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error", "code": "INTERNAL_ERROR"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings.host, port=settings.port, log_level=settings.log_level.lower())
