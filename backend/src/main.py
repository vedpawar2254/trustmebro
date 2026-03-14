"""FastAPI application for backend API."""
import secrets
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from src.config import settings
from src.database import get_db
from src.models import User, UserRole
from src.schemas import RegisterRequest, LoginRequest, UserResponse, AuthResponse, UserRoleEnum
from src.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
)
from src.utils.logger import api_logger
from src.routes import jobs, verify, escrow_submissions, auth, uploads, chat, payments, change_requests, disputes, dashboard, scheduler, users
from src.services.email_service import email_service


main_logger = api_logger


# Create FastAPI app
app = FastAPI(
    title="TrustMeBro Backend API",
    description="Backend API for trustmebro freelance platform",
    version="0.2.0",
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
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(verify.router)
app.include_router(escrow_submissions.router)
app.include_router(uploads.router)
app.include_router(chat.router)
app.include_router(payments.router)
app.include_router(change_requests.router)
app.include_router(disputes.router)
app.include_router(dashboard.router)
app.include_router(scheduler.router)
app.include_router(users.router)


@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    main_logger.info("Starting backend API...")
    main_logger.info(f"Server URL: {settings.server_url}")

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
    """Get current user from JWT token."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    return decode_access_token(token)


# ============== ROOT & HEALTH ==============

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "trustmebro Backend API",
        "version": "0.2.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
    }


# ============== AUTH ENDPOINTS ==============

@app.post("/auth/register", response_model=AuthResponse)
async def register(
    register_data: RegisterRequest,
    db: Session = Depends(get_db),
):
    """Register a new user account."""
    main_logger.info(f"Registration attempt: {register_data.email}")

    # Check if user exists
    existing_user = db.query(User).filter(User.email == register_data.email).first()
    if existing_user:
        main_logger.warning(f"Registration failed: email already exists {register_data.email}")
        raise HTTPException(status_code=409, detail="Email already registered. Please login.")

    # Create new user
    hashed_password = get_password_hash(register_data.password)
    verification_token = secrets.token_urlsafe(32)

    # Set default PFI based on role
    default_pfi = 100.0 if register_data.role == UserRoleEnum.EMPLOYER else 90.0

    new_user = User(
        name=register_data.name,
        email=register_data.email,
        password_hash=hashed_password,
        role=UserRole(register_data.role.value),
        pfi_score=default_pfi,
        email_verified=False,
        email_verification_token=verification_token,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send verification email
    email_service.send_verification_email(
        to_email=new_user.email,
        name=new_user.name,
        token=verification_token
    )
    main_logger.info(f"Verification email sent to {new_user.email}")

    # Generate token
    token = create_access_token({"user_id": new_user.id, "role": new_user.role.value})

    main_logger.info(f"User registered successfully: {new_user.id}")

    return AuthResponse(
        token=token,
        user=UserResponse(
            id=new_user.id,
            name=new_user.name,
            email=new_user.email,
            role=new_user.role.value,
            pfi_score=new_user.pfi_score,
        )
    )


@app.post("/auth/login", response_model=AuthResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    """Authenticate a user and return JWT token."""
    main_logger.info(f"Login attempt: {login_data.email}")

    # Find user
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        main_logger.warning(f"Login failed: user not found {login_data.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        main_logger.warning(f"Login failed: invalid password {login_data.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Generate token
    token = create_access_token({"user_id": user.id, "role": user.role.value})

    main_logger.info(f"User logged in successfully: {user.id}")

    return AuthResponse(
        token=token,
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role.value,
            pfi_score=user.pfi_score,
        )
    )


@app.post("/auth/logout")
async def logout(request: Request):
    """Logout user (invalidate token client-side)."""
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing authentication token")

    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    main_logger.info(f"User logout: user_id={payload.get('user_id')}")

    return {"success": True, "message": "Logged out successfully"}


@app.get("/users/me", response_model=UserResponse)
async def get_me(
    request: Request,
    db: Session = Depends(get_db),
):
    """Get current user information."""
    current_user = get_current_user(request)

    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid or missing authentication token")

    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role.value,
        pfi_score=user.pfi_score,
    )


# ============== EXCEPTION HANDLERS ==============

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
