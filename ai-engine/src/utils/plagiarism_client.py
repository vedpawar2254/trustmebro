"""Plagiarism API client for content originality checking."""
from typing import Optional, Dict, Any
import httpx

from src.config import settings
from src.utils.logger import verification_logger


class PlagiarismClient:
    """Client for plagiarism detection API."""

    def __init__(self):
        """Initialize plagiarism client."""
        self.api_key = settings.plagiarism_api_key
        self.api_url = settings.plagiarism_api_url
        self.enabled = bool(self.api_key)
        if self.enabled:
            verification_logger.info("Plagiarism client initialized (API-based)")
        else:
            verification_logger.warning("Plagiarism API not configured - using AI-based fallback")

    async def check_plagiarism(
        self,
        text: str,
        check_type: str = "general",
    ) -> Dict[str, Any]:
        """Check text for plagiarism.

        Args:
            text: Text to check
            check_type: Type of check (general, academic, professional)

        Returns:
            Plagiarism check results
        """
        if not self.enabled:
            return await self._ai_based_check(text)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/check",
                    json={
                        "text": text,
                        "check_type": check_type,
                    },
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    timeout=30.0,
                )

            if response.status_code == 200:
                result = response.json()
                return self._parse_response(result)
            else:
                verification_logger.warning(f"Plagiarism API error: {response.status_code}")
                return await self._ai_based_check(text)

        except httpx.TimeoutException:
            verification_logger.warning("Plagiarism API timeout - using fallback")
            return await self._ai_based_check(text)
        except Exception as e:
            verification_logger.error(f"Plagiarism check failed: {e}")
            return await self._ai_based_check(text)

    async def _ai_based_check(self, text: str) -> Dict[str, Any]:
        """Fallback AI-based plagiarism/originality check.

        Uses OpenRouter to assess text originality when plagiarism API
        is not available.

        Args:
            text: Text to check

        Returns:
            Plagiarism check results in standard format
        """
        from src.utils.openai_client import openrouter_client

        try:
            prompt = f"""
            Analyze this text for originality and potential plagiarism concerns.

            Text: {text[:3000]}

            Respond in JSON format:
            {{
                "is_original": true/false,
                "originality_score": 0-100,
                "similarity_sources": ["list of possible similar sources or topics"],
                "concerns": ["list of specific concerns if any"],
                "recommendations": ["list of recommendations"],
                "explanation": "Brief explanation of your analysis"
            }}
            """

            system_prompt = "You are a plagiarism detection expert. Be thorough but fair in assessing originality."

            response = await openrouter_client.generate_json_completion(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.3,
            )

            # Convert AI response to standard format
            originality_score = response.get("originality_score", 85)
            is_original = originality_score >= 70

            return {
                "is_original": is_original,
                "originality_score": originality_score,
                "similarity_sources": response.get("similarity_sources", []),
                "concerns": response.get("concerns", []),
                "recommendations": response.get("recommendations", []),
                "explanation": response.get("explanation", ""),
                "method": "ai_fallback",
            }

        except Exception as e:
            verification_logger.error(f"AI-based plagiarism check failed: {e}")
            return {
                "is_original": True,
                "originality_score": 50,
                "similarity_sources": [],
                "concerns": ["Could not verify originality"],
                "recommendations": [],
                "explanation": "Plagiarism check failed - assuming original",
                "method": "error",
            }

    def _parse_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """Parse API response to standard format.

        Args:
            api_response: Raw API response

        Returns:
            Standardized plagiarism check results
        """
        return {
            "is_original": api_response.get("is_original", True),
            "originality_score": api_response.get("originality_score", 100),
            "similarity_sources": api_response.get("sources", []),
            "concerns": api_response.get("concerns", []),
            "recommendations": api_response.get("recommendations", []),
            "explanation": api_response.get("explanation", ""),
            "method": "api",
        }


# Singleton instance
plagiarism_client = PlagiarismClient()
