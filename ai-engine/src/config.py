"""Configuration management for AI engine."""
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    # OpenAI Configuration
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4")
    openai_max_tokens: int = int(os.getenv("OPENAI_MAX_TOKENS", "4096"))

    # GitHub Configuration
    github_token: str = os.getenv("GITHUB_TOKEN", "")

    # Plagiarism API Configuration
    plagiarism_api_key: str = os.getenv("PLAGIARISM_API_KEY", "")
    plagiarism_api_url: str = os.getenv("PLAGIARISM_API_URL", "https://api.plagiarism.com/v1")

    # Server Configuration
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "3002"))
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    # Project Configuration
    base_dir: Path = Path(__file__).parent.parent
    src_dir: Path = Path(__file__).parent

    @property
    def server_url(self) -> str:
        """Construct server URL."""
        return f"http://{self.host}:{self.port}"

    def validate(self) -> None:
        """Validate required settings."""
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required")
        if not self.github_token:
            raise ValueError("GITHUB_TOKEN is required")


settings = Settings()
