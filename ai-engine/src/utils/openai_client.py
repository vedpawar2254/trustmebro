"""OpenRouter client wrapper for GPT-4o/4o-mini."""
from typing import Optional, Dict, Any

from openai import OpenAI, AuthenticationError, RateLimitError, APIError

from src.config import settings
from src.utils.logger import verification_logger


class OpenRouterClient:
    """Wrapper for OpenRouter API (OpenAI-compatible) with error handling."""

    def __init__(self):
        """Initialize OpenRouter client."""
        self.client = OpenAI(
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_api_url,
            default_headers={
                "HTTP-Referer": "https://trustmebro.com",
            }
        )
        self.model = settings.openrouter_model
        self.max_tokens = settings.openrouter_max_tokens
        verification_logger.info(f"OpenRouter client initialized with model: {self.model}")

    async def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        response_format: Optional[Dict[str, str]] = None,
    ) -> str:
        """Generate a completion using OpenRouter chat API.

        Args:
            prompt: User prompt
            system_prompt: Optional system message
            temperature: Sampling temperature (0-2)
            response_format: Optional JSON response format

        Returns:
            Generated text response

        Raises:
            Exception: If API call fails
        """
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            kwargs = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": self.max_tokens,
            }

            if response_format:
                kwargs["response_format"] = response_format

            verification_logger.debug(f"Sending request to OpenRouter: {prompt[:100]}...")

            response = self.client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content

            verification_logger.debug(f"Received response from OpenRouter: {content[:100]}...")
            return content

        except AuthenticationError as e:
            verification_logger.error(f"OpenRouter authentication error: {e}")
            raise ValueError("Invalid OpenRouter API key") from e
        except RateLimitError as e:
            verification_logger.warning(f"OpenRouter rate limit: {e}")
            raise Exception("OpenRouter API rate limit exceeded") from e
        except APIError as e:
            verification_logger.error(f"OpenRouter API error: {e}")
            raise Exception(f"OpenRouter API error: {str(e)}") from e
        except Exception as e:
            verification_logger.error(f"Unexpected error calling OpenRouter: {e}")
            raise Exception(f"Failed to call OpenRouter: {str(e)}") from e

    async def generate_json_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
    ) -> Dict[str, Any]:
        """Generate a JSON completion using OpenRouter chat API.

        Args:
            prompt: User prompt
            system_prompt: Optional system message
            temperature: Sampling temperature

        Returns:
            Parsed JSON response

        Raises:
            Exception: If API call fails or JSON parsing fails
        """
        import json

        response_text = await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            response_format={"type": "json_object"},
        )

        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            verification_logger.error(f"Failed to parse OpenRouter JSON response: {response_text}")
            raise Exception(f"Invalid JSON response: {str(e)}") from e


# Singleton instance
openrouter_client = OpenRouterClient()
