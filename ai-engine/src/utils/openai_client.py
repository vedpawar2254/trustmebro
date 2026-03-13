"""OpenAI client wrapper with error handling."""
from typing import Optional, Dict, Any

import openai
from openai import OpenAI

from src.config import settings
from src.utils.logger import verification_logger


class AIClient:
    """Wrapper for OpenAI API with error handling."""

    def __init__(self):
        """Initialize OpenAI client."""
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model
        self.max_tokens = settings.openai_max_tokens
        verification_logger.info(f"OpenAI client initialized with model: {self.model}")

    async def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        response_format: Optional[Dict[str, str]] = None,
    ) -> str:
        """Generate a completion using OpenAI chat API.

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

            verification_logger.debug(f"Sending request to OpenAI: {prompt[:100]}...")

            response = self.client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content

            verification_logger.debug(f"Received response from OpenAI: {content[:100]}...")
            return content

        except openai.AuthenticationError as e:
            verification_logger.error(f"OpenAI authentication error: {e}")
            raise ValueError("Invalid OpenAI API key") from e
        except openai.RateLimitError as e:
            verification_logger.warning(f"OpenAI rate limit: {e}")
            raise Exception("OpenAI API rate limit exceeded") from e
        except openai.APIError as e:
            verification_logger.error(f"OpenAI API error: {e}")
            raise Exception(f"OpenAI API error: {str(e)}") from e
        except Exception as e:
            verification_logger.error(f"Unexpected error calling OpenAI: {e}")
            raise Exception(f"Failed to call OpenAI: {str(e)}") from e

    async def generate_json_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
    ) -> Dict[str, Any]:
        """Generate a JSON completion using OpenAI chat API.

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
            verification_logger.error(f"Failed to parse OpenAI JSON response: {response_text}")
            raise Exception(f"Invalid JSON response: {str(e)}") from e


# Singleton instance
ai_client = AIClient()
