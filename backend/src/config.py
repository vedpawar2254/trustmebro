"""Configuration management for backend API."""
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    # Database Configuration
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost:5432/trustmebro"
    )

    # JWT Configuration
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60 * 24 * 7"))  # 7 days

    # CORS Configuration
    cors_origins: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

    # Server Configuration
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "3001"))
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    # AI Engine Configuration
    ai_engine_url: str = os.getenv("AI_ENGINE_URL", "http://localhost:3002")

    # Frontend URL (for email links)
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Email Configuration
    smtp_host: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_username: str = os.getenv("SMTP_USERNAME", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    email_from: str = os.getenv("EMAIL_FROM", "noreply@trustmebro.com")
    email_from_name: str = os.getenv("EMAIL_FROM_NAME", "TrustMeBro")

    # Project Configuration
    base_dir: Path = Path(__file__).parent.parent
    src_dir: Path = Path(__file__).parent

    # File Upload Configuration
    max_upload_size: int = int(os.getenv("MAX_UPLOAD_SIZE", "10485760"))  # 10MB
    upload_dir: Path = os.getenv("UPLOAD_DIR", str(base_dir / "uploads"))

    @property
    def server_url(self) -> str:
        """Construct server URL."""
        return f"http://{self.host}:{self.port}"

    def validate(self) -> None:
        """Validate required settings."""
        if not self.database_url or "localhost" in self.database_url:
            raise ValueError(
                "DATABASE_URL must be set to a valid PostgreSQL connection string"
            )
        if not self.jwt_secret_key or self.jwt_secret_key == "your-secret-key-change-in-production":
            raise ValueError("JWT_SECRET_KEY must be set and changed in production")


settings = Settings()
