"""FastAPI application for backend API."""
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field

from src.config import settings
from src.database import get_db
from src.models import User, Job, JobStatus, UserRole, GigType, Bid, BidStatus
from src.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
)
from src.utils.logger import api_logger
from src.routes import jobs, verify, escrow_submissions
from sqlalchemy.orm import Session


# Set up main logger
main_logger = api_logger


# Request/Response Models
class RegisterRequest(BaseModel):
    """Registration request model."""

    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, regex=r"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$")
    role: UserRole


class LoginRequest(BaseModel):
    """Login request model."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response model."""

    id: int
    name: str
    email: str
    role: UserRole
    pfi_score: Optional[float]


class AuthResponse(BaseModel):
    """Authentication response model."""

    success: bool = True
    token: str
    user: UserResponse


class JobResponse(BaseModel):
    """Job response model."""

    id: int
    employer_id: int
    title: str
    description: str
    gig_type: GigType
    gig_subtype: Optional[str]
    budget_min: float
    budget_max: float
    deadline: datetime
    status: JobStatus
    created_at: datetime
    employer_name: str
    employer_pfi: Optional[float]


class ErrorResponse(BaseModel):
    """Error response model."""

    success: bool = False
    error: str
    code: str = "INTERNAL_ERROR"


# Security
security = HTTPBearer(auto_error=False)


# Create FastAPI app
app = FastAPI(
    title="TrustMeBro Backend API",
    description="Backend API for trustmebro freelance platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(jobs.router)
app.include_router(verify.router)
app.include_router(escrow_submissions.router)


@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    main_logger.info("Starting backend API...")
    main_logger.info(f"Server URL: {settings.server_url}")

    # Validate settings
    try:
        settings.validate()
    except ValueError as e:
        main_logger.error(f"Configuration error: {e}")
        raise

    # Initialize database
    from src.database import init_db
    try:
        init_db()
        main_logger.info("Database initialized successfully")
    except Exception as e:
        main_logger.error(f"Database initialization failed: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    main_logger.info("Shutting down backend API...")


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


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "trustmebro Backend API",
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/auth/register", response_model=AuthResponse)
async def register(
    register_data: RegisterRequest,
    db: Session = Depends(get_db),
):
    """Register a new user account.

    Args:
        register_data: Registration data

    Returns:
        AuthResponse with token and user data
    """
    try:
        main_logger.info(f"Registration attempt: {register_data.email}")

        # Check if user exists
        existing_user = db.query(User).filter(User.email == register_data.email).first()
        if existing_user:
            main_logger.warning(f"Registration failed: email already exists {register_data.email}")
            raise HTTPException(
                status_code=409,
                detail="Email already registered. Please login."
            )

        # Create new user
        hashed_password = get_password_hash(register_data.password)
        new_user = User(
            name=register_data.name,
            email=register_data.email,
            password_hash=hashed_password,
            role=register_data.role,
            pfi_score=100.0 if register_data.role == UserRole.EMPLOYER else 90.0,  # Default PFI
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Generate token
        token = create_access_token(
            {"user_id": new_user.id, "role": new_user.role}
        )

        main_logger.info(f"User registered successfully: {new_user.id}")

        return AuthResponse(
            token=token,
            user=UserResponse(
                id=new_user.id,
                name=new_user.name,
                email=new_user.email,
                role=new_user.role,
                pfi_score=new_user.pfi_score,
            )
        )

    except HTTPException:
        raise
    except Exception as e:
        main_logger.error(f"Registration failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Something went wrong. Please try again."
        )


@app.post("/auth/login", response_model=AuthResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    """Authenticate a user and return JWT token.

    Args:
        login_data: Login data

    Returns:
        AuthResponse with token and user data
    """
    try:
        main_logger.info(f"Login attempt: {login_data.email}")

        # Find user
        user = db.query(User).filter(User.email == login_data.email).first()
        if not user:
            main_logger.warning(f"Login failed: user not found {login_data.email}")
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password."
            )

        # Verify password
        if not verify_password(login_data.password, user.password_hash):
            main_logger.warning(f"Login failed: invalid password {login_data.email}")
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password."
            )

        # Generate token
        token = create_access_token(
            {"user_id": user.id, "role": user.role}
        )

        main_logger.info(f"User logged in successfully: {user.id}")

        return AuthResponse(
            token=token,
            user=UserResponse(
                id=user.id,
                name=user.name,
                email=user.email,
                role=user.role,
                pfi_score=user.pfi_score,
            )
        )

    except HTTPException:
        raise
    except Exception as e:
        main_logger.error(f"Login failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Something went wrong. Please try again."
        )


@app.get("/users/me", response_model=UserResponse)
async def get_me(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get current user information.

    Args:
        db: Database session
        current_user: Current user from JWT

    Returns:
        UserResponse with user data
    """
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing authentication token"
        )

    try:
        user = db.query(User).filter(User.id == current_user["user_id"]).first()
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            pfi_score=user.pfi_score,
        )

    except HTTPException:
        raise
    except Exception as e:
        main_logger.error(f"Get user failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch user information"
        )


@app.exception_handler(ValueError)
async def validation_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    """Handle validation errors."""
    main_logger.warning(f"Validation error: {exc}")
    return JSONResponse(
        status_code=400,
        content={"success": False, "error": str(exc), "code": "VALIDATION_ERROR"},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions."""
    main_logger.warning(f"HTTP exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail, "code": "HTTP_ERROR"},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle general exceptions."""
    main_logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error", "code": "INTERNAL_ERROR"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings.host, port=settings.port, log_level=settings.log_level.lower())
