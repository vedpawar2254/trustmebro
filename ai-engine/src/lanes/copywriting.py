"""Copywriting verification lane - checks text submissions."""
from typing import Dict, Any, List

from src.lanes.base import VerificationLane, Criterion, PFISignal, VerificationReport
from src.utils.openai_client import openrouter_client
from src.utils.logger import verification_logger


class CopywritingLane(VerificationLane):
    """Verification lane for copywriting gigs."""

    GIG_TYPE = "COPYWRITING"

    async def verify(
        self, submission: Dict[str, Any], criteria: List[Dict[str, Any]]
    ) -> VerificationReport:
        """Verify a copywriting submission.

        Args:
            submission: Dict with text content or file URLs
            criteria: List of criteria to verify

        Returns:
            VerificationReport with scores
        """
        verification_logger.info(f"Starting copywriting verification")

        try:
            # Get text content
            text_content = submission.get("text_content", "")

            if not text_content:
                raise ValueError("No text content provided for verification")

            # Verify each criterion
            verified_criteria = []
            pfi_signals = []

            for criterion_config in criteria:
                criterion_name = criterion_config["name"]
                criterion_type = criterion_config["type"]

                # Route to appropriate verification method
                if criterion_name == "Word Count":
                    result = await self._verify_word_count(text_content, criterion_config)
                elif criterion_name == "Keywords":
                    result = await self._verify_keywords(text_content, criterion_config)
                elif criterion_name == "Tone":
                    result = await self._verify_tone(text_content, criterion_config)
                elif criterion_name == "Grammar":
                    result = await self._verify_grammar(text_content)
                elif criterion_name == "Plagiarism":
                    result = await self._verify_plagiarism(text_content)
                elif criterion_name == "Structure":
                    result = await self._verify_structure(text_content, criterion_config)
                elif criterion_name == "Call to Action":
                    result = await self._verify_call_to_action(text_content)
                else:
                    verification_logger.warning(f"Unknown criterion: {criterion_name}")
                    continue

                status, detail, score = self.get_criterion_status(criterion_name, result)

                if criterion_type == "SECONDARY":
                    pfi_signals.append(
                        PFISignal(
                            name=criterion_name,
                            status="WARNING" if score < 1.0 else "INFO",
                            detail=detail,
                        )
                    )
                else:
                    verified_criteria.append(
                        Criterion(
                            name=criterion_name,
                            type=criterion_type,
                            status=status,
                            detail=detail,
                            weight=criterion_config.get("weight", 0.1),
                        )
                    )

            # Calculate overall score
            overall_score = self.calculate_overall_score(verified_criteria, pfi_signals)

            # Determine payment decision
            payment_decision = self.determine_payment_decision(overall_score)

            # Generate feedback
            feedback = self.generate_feedback(verified_criteria)

            # Create report
            report = VerificationReport(
                milestone_id=submission.get("milestone_id", "unknown"),
                gig_type=self.GIG_TYPE,
                gig_subtype=submission.get("gig_subtype", "unknown"),
                overall_score=overall_score,
                payment_decision=payment_decision,
                criteria=verified_criteria,
                pfi_signals=pfi_signals,
                resubmissions_remaining=submission.get("resubmissions_remaining", 2),
                feedback_for_freelancer=feedback,
                verification_lane=self.lane_name,
            )

            verification_logger.info(f"Copywriting verification complete: score={overall_score}")
            return report

        except Exception as e:
            verification_logger.error(f"Copywriting verification failed: {e}")
            raise Exception(f"Verification failed: {str(e)}") from e

    async def _verify_word_count(self, text: str, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify word count meets requirements.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            word_count = len(text.split())

            # Get expected word count from description
            description = criterion_config.get("description", "")
            import re
            match = re.search(r'(\d+)\s*-\s*(\d+)\s*words', description.lower())
            if match:
                min_words = int(match.group(1))
                max_words = int(match.group(2))
            else:
                min_words, max_words = 100, 5000  # Default

            if min_words <= word_count <= max_words:
                return "PASS", f"Word count ({word_count}) within range ({min_words}-{max_words})", 1.0
            elif word_count < min_words:
                return "FAIL", f"Word count ({word_count}) below minimum ({min_words})", 0.0
            else:
                return "PARTIAL", f"Word count ({word_count}) exceeds maximum ({max_words})", 0.5

        except Exception as e:
            verification_logger.error(f"Word count check failed: {e}")
            return "FAIL", f"Failed to verify word count: {str(e)}", 0.0

    async def _verify_keywords(self, text: str, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify required keywords are present.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            description = criterion_config.get("description", "")

            # Extract keywords from description
            import re
            keywords = re.findall(r'"([^"]+)"', description)

            if not keywords:
                return "INFO", "No specific keywords required", 1.0

            text_lower = text.lower()
            found_keywords = [k for k in keywords if k.lower() in text_lower]

            if len(found_keywords) == len(keywords):
                return "PASS", f"All {len(keywords)} keywords found", 1.0
            else:
                missing = set(k.lower() for k in keywords) - set(k.lower() for k in found_keywords)
                return "FAIL", f"Missing keywords: {', '.join(missing)}", 0.0

        except Exception as e:
            verification_logger.error(f"Keyword check failed: {e}")
            return "FAIL", f"Failed to verify keywords: {str(e)}", 0.0

    async def _verify_tone(self, text: str, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify tone matches requirements using AI.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            description = criterion_config.get("description", "")

            # Extract required tone from description
            import re
            match = re.search(r'(\w+)\s*tone', description.lower())
            required_tone = match.group(1) if match else "professional"

            prompt = f"""
            Analyze the tone of this text and determine if it matches the required tone.

            Text: {text[:1000]}

            Required tone: {required_tone}

            Respond in JSON format:
            {{
                "detected_tone": "tone detected",
                "matches_required": true/false,
                "confidence": "high/medium/low",
                "details": "Brief explanation"
            }}
            """

            system_prompt = "You are a writing expert. Analyze text tone accurately."

            response = await openrouter_client.generate_json_completion(prompt, system_prompt)

            if response.get("matches_required"):
                return "PASS", f"Tone matches: {response.get('detected_tone')}", 1.0
            else:
                return "PARTIAL", f"Detected tone: {response.get('detected_tone')} (required: {required_tone})", 0.5

        except Exception as e:
            verification_logger.error(f"Tone check failed: {e}")
            return "FAIL", f"Failed to verify tone: {str(e)}", 0.0

    async def _verify_grammar(self, text: str) -> tuple[str, str, float]:
        """Verify grammar using AI.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            prompt = f"""
            Check the grammar and spelling of this text.

            Text: {text[:2000]}

            Respond in JSON format:
            {{
                "has_errors": true/false,
                "error_count": number,
                "major_errors": ["list of major errors"],
                "minor_errors": ["list of minor errors"],
                "overall_quality": "excellent/good/fair/poor"
            }}
            """

            system_prompt = "You are a grammar and spelling expert."

            response = await openrouter_client.generate_json_completion(prompt, system_prompt)

            if not response.get("has_errors"):
                return "PASS", "No grammar errors found", 1.0

            quality = response.get("overall_quality", "fair")
            major_errors = response.get("major_errors", [])
            error_count = response.get("error_count", 0)

            if len(major_errors) > 3 or error_count > 10:
                return "FAIL", f"Too many grammar errors ({error_count})", 0.0
            elif len(major_errors) > 0:
                return "PARTIAL", f"Grammar quality: {quality} ({error_count} errors)", 0.5
            else:
                return "PASS", f"Grammar quality: {quality} (minor errors only)", 0.75

        except Exception as e:
            verification_logger.error(f"Grammar check failed: {e}")
            return "FAIL", f"Failed to verify grammar: {str(e)}", 0.0

    async def _verify_plagiarism(self, text: str) -> tuple[str, str, float]:
        """Verify originality (plagiarism check).

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            # This is a simplified check - in production would use plagiarism API
            # For now, we'll use AI to assess originality

            prompt = f"""
            Assess the originality of this text for plagiarism.

            Text: {text[:2000]}

            Respond in JSON format:
            {{
                "likely_original": true/false,
                "originality_score": 0-100,
                "concerns": ["list of potential issues"],
                "explanation": "Brief explanation"
            }}
            """

            system_prompt = "You are a plagiarism detection expert. Assess text originality fairly."

            response = await openrouter_client.generate_json_completion(prompt, system_prompt)

            if response.get("likely_original"):
                return "PASS", f"Originality score: {response.get('originality_score')}%", 1.0

            score = response.get("originality_score", 50)
            if score >= 80:
                return "PARTIAL", f"Originality score: {score}% (concerns present)", 0.5
            else:
                return "FAIL", f"Low originality score: {score}%", 0.0

        except Exception as e:
            verification_logger.error(f"Plagiarism check failed: {e}")
            return "FAIL", f"Failed to verify originality: {str(e)}", 0.0

    async def _verify_structure(self, text: str, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify text structure (headings, paragraphs, etc.).

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            description = criterion_config.get("description", "")

            # Check for basic structure elements
            has_headings = bool([l for l in text.split('\n') if l.strip().startswith('#')])
            has_paragraphs = len([p for p in text.split('\n\n') if p.strip()]) > 1
            has_bullet_points = '*' in text or '-' in text or '•' in text

            structure_score = 0
            structure_notes = []

            if has_headings:
                structure_score += 1
                structure_notes.append("Has headings")
            if has_paragraphs:
                structure_score += 1
                structure_notes.append("Has proper paragraphs")
            if has_bullet_points:
                structure_score += 1
                structure_notes.append("Has bullet points")

            score = structure_score / 3.0

            if score >= 0.8:
                return "PASS", f"Good structure: {', '.join(structure_notes)}", 1.0
            elif score >= 0.5:
                return "PARTIAL", f"Adequate structure: {', '.join(structure_notes)}", 0.5
            else:
                return "FAIL", f"Poor structure: {', '.join(structure_notes) or 'No structure elements found'}", 0.0

        except Exception as e:
            verification_logger.error(f"Structure check failed: {e}")
            return "FAIL", f"Failed to verify structure: {str(e)}", 0.0

    async def _verify_call_to_action(self, text: str) -> tuple[str, str, float]:
        """Verify call to action is present.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            cta_phrases = [
                "click here", "sign up", "register", "subscribe", "contact us",
                "get started", "learn more", "join now", "buy now", "order now"
            ]

            text_lower = text.lower()
            has_cta = any(phrase in text_lower for phrase in cta_phrases)

            if has_cta:
                return "PASS", "Call to action present", 1.0
            else:
                return "INFO", "No clear call to action", 1.0

        except Exception as e:
            verification_logger.error(f"Call to action check failed: {e}")
            return "FAIL", f"Failed to verify call to action: {str(e)}", 0.0

    def get_criterion_status(self, name: str, result: tuple) -> tuple[str, str, float]:
        """Determine criterion status based on verification result."""
        status, detail, score = result
        return status, detail, score
