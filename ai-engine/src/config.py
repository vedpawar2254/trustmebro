"""Configuration management for AI engine."""
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    # OpenRouter API Configuration (GPT-4o/4o-mini)
    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
    openrouter_model: str = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
    openrouter_max_tokens: int = int(os.getenv("OPENROUTER_MAX_TOKENS", "4096"))
    openrouter_api_url: str = os.getenv("OPENROUTER_API_URL", "https://openrouter.ai/api/v1")

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
        if not self.openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY is required")
        if not self.github_token:
            raise ValueError("GITHUB_TOKEN is required")


settings = Settings()
