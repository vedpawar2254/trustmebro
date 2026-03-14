"""Translation verification lane - checks translated text submissions."""
from typing import Dict, Any, List

from src.lanes.base import VerificationLane, Criterion, PFISignal, VerificationReport
from src.utils.openai_client import openrouter_client
from src.utils.logger import verification_logger


class TranslationLane(VerificationLane):
    """Verification lane for translation gigs."""

    GIG_TYPE = "TRANSLATION"

    async def verify(
        self, submission: Dict[str, Any], criteria: List[Dict[str, Any]]
    ) -> VerificationReport:
        """Verify a translation submission.

        Args:
            submission: Dict with translated text and source document
            criteria: List of criteria to verify

        Returns:
            VerificationReport with scores
        """
        verification_logger.info(f"Starting translation verification")

        try:
            # Get text content
            translated_text = submission.get("text_content", "")
            source_document_url = submission.get("source_document_url", "")

            if not translated_text:
                raise ValueError("No translated text provided for verification")

            # Verify each criterion
            verified_criteria = []
            pfi_signals = []

            for criterion_config in criteria:
                criterion_name = criterion_config["name"]
                criterion_type = criterion_config["type"]

                # Route to appropriate verification method
                if criterion_name == "Translation Accuracy":
                    result = await self._verify_accuracy(translated_text, criterion_config, source_document_url)
                elif criterion_name == "Word Count Match":
                    result = await self._verify_word_count_match(translated_text, criterion_config)
                elif criterion_name == "Language":
                    result = await self._verify_language(translated_text, criterion_config)
                elif criterion_name == "Grammar and Style":
                    result = await self._verify_grammar_style(translated_text)
                elif criterion_name == "Cultural Adaptation":
                    result = await self._verify_cultural_adaptation(translated_text, criterion_config)
                elif criterion_name == "Terminology":
                    result = await self._verify_terminology(translated_text, criterion_config)
                elif criterion_name == "Completeness":
                    result = await self._verify_completeness(translated_text, criterion_config)
                elif criterion_name == "Format":
                    result = await self._verify_format(translated_text, criterion_config)
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

            verification_logger.info(f"Translation verification complete: score={overall_score}")
            return report

        except Exception as e:
            verification_logger.error(f"Translation verification failed: {e}")
            raise Exception(f"Verification failed: {str(e)}") from e

    async def _verify_accuracy(self, text: str, criterion_config: Dict[str, Any], source_url: str) -> tuple[str, str, float]:
        """Verify translation accuracy using AI.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            description = criterion_config.get("description", "")

            # Extract source and target languages from description
            import re
            languages = re.findall(r'(\w+)\s+to\s+(\w+)', description.lower())
            if languages:
                source_lang, target_lang = languages[0]
            else:
                source_lang, target_lang = "source", "target"

            prompt = f"""
            Evaluate this translation for accuracy.

            Source language: {source_lang}
            Target language: {target_lang}
            Translation context: {description}

            Translated text: {text[:2000]}

            Respond in JSON format:
            {{
                "accuracy_score": 0-100,
                "has_major_errors": true/false,
                "major_errors": ["list of mistranslations or major errors"],
                "has_minor_errors": true/false,
                "minor_errors": ["list of minor issues"],
                "overall_quality": "excellent/good/fair/poor",
                "explanation": "Brief explanation of evaluation"
            }}
            """

            system_prompt = "You are a professional translator and linguist. Evaluate translation accuracy objectively."

            response = await openrouter_client.generate_json_completion(prompt, system_prompt)

            accuracy = response.get("accuracy_score", 80)
            quality = response.get("overall_quality", "fair")

            if accuracy >= 90 and quality in ["excellent", "good"]:
                return "PASS", f"Excellent translation accuracy: {accuracy}%", 1.0
            elif accuracy >= 80:
                return "PASS", f"Good translation accuracy: {accuracy}%", 0.85
            elif accuracy >= 60:
                return "PARTIAL", f"Fair translation accuracy: {accuracy}%", 0.5
            else:
                return "FAIL", f"Poor translation accuracy: {accuracy}%", 0.0

        except Exception as e:
            verification_logger.error(f"Accuracy check failed: {e}")
            return "FAIL", f"Failed to verify accuracy: {str(e)}", 0.0

    async def _verify_word_count_match(self, text: str, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify word count is appropriate for translation.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            word_count = len(text.split())

            # Get expected range from description
            description = criterion_config.get("description", "")
            import re
            match = re.search(r'(\d+)\s*-\s*(\d+)\s*words?', description.lower())
            if match:
                min_words = int(match.group(1))
                max_words = int(match.group(2))
            else:
                min_words, max_words = 50, 10000  # Default

            if min_words <= word_count <= max_words:
                return "PASS", f"Word count ({word_count}) within range ({min_words}-{max_words})", 1.0
            elif word_count < min_words:
                return "FAIL", f"Word count ({word_count}) below minimum ({min_words})", 0.0
            else:
                return "PASS", f"Word count ({word_count}) above maximum ({max_words}) - may be verbose", 0.75

        except Exception as e:
            verification_logger.error(f"Word count check failed: {e}")
            return "FAIL", f"Failed to verify word count: {str(e)}", 0.0

    async def _verify_language(self, text: str, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify translation is in correct language.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            description = criterion_config.get("description", "")

            # Extract target language from description
            import re
            match = re.search(r'to\s+(\w+)', description.lower())
            target_lang = match.group(1) if match else None

            if not target_lang:
                return "PASS", "No specific language requirement", 1.0

            prompt = f"""
            Identify the language of this text.

            Text: {text[:1000]}

            Target language: {target_lang}

            Respond in JSON format:
            {{
                "detected_language": "language name",
                "confidence": "high/medium/low",
                "matches_target": true/false,
                "notes": "Any additional observations"
            }}
            """

            system_prompt = "You are a language detection expert."

            response = await openrouter_client.generate_json_completion(prompt, system_prompt)

            if response.get("matches_target"):
                return "PASS", f"Correct language: {response.get('detected_language')}", 1.0
            else:
                detected = response.get("detected_language", "unknown")
                return "FAIL", f"Wrong language detected: {detected} (expected: {target_lang})", 0.0

        except Exception as e:
            verification_logger.error(f"Language check failed: {e}")
            return "FAIL", f"Failed to verify language: {str(e)}", 0.0

    async def _verify_grammar_style(self, text: str) -> tuple[str, str, float]:
        """Verify grammar and style.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            prompt = f"""
            Check this translated text for grammar and style issues.

            Text: {text[:2000]}

            Respond in JSON format:
            {{
                "has_grammar_errors": true/false,
                "grammar_errors": ["list of grammar errors"],
                "has_style_issues": true/false,
                "style_issues": ["list of style issues"],
                "overall_quality": "excellent/good/fair/poor",
                "explanation": "Brief evaluation"
            }}
            """

            system_prompt = "You are a grammar and style expert. Evaluate text objectively."

            response = await openrouter_client.generate_json_completion(prompt, system_prompt)

            has_errors = response.get("has_grammar_errors", False) or response.get("has_style_issues", False)
            quality = response.get("overall_quality", "fair")

            if not has_errors and quality in ["excellent", "good"]:
                return "PASS", f"Excellent grammar and style: {quality}", 1.0
            elif not has_errors:
                return "PASS", f"Good grammar and style: {quality}", 0.85
            elif quality in ["fair", "good"]:
                return "PARTIAL", f"Grammar/style: {quality} (some issues)", 0.5
            else:
                return "FAIL", f"Poor grammar and style: {quality}", 0.0

        except Exception as e:
            verification_logger.error(f"Grammar/style check failed: {e}")
            return "FAIL", f"Failed to verify grammar/style: {str(e)}", 0.0

    async def _verify_cultural_adaptation(self, text: str, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify cultural adaptation.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            description = criterion_config.get("description", "")

            prompt = f"""
            Evaluate this translation for cultural adaptation.

            Context: {description}

            Text: {text[:2000]}

            Respond in JSON format:
            {{
                "is_culturally_appropriate": true/false,
                "cultural_issues": ["list of cultural issues if any"],
                "cultural_adaptation_score": 0-100,
                "explanation": "Brief evaluation"
            }}
            """

            system_prompt = "You are a cultural adaptation expert. Evaluate translation for cultural appropriateness."

            response = await openrouter_client.generate_json_completion(prompt, system_prompt)

            if response.get("is_culturally_appropriate"):
                score = response.get("cultural_adaptation_score", 90)
                return "PASS", f"Good cultural adaptation: {score}%", 1.0
            else:
                issues = response.get("cultural_issues", [])
                return "PARTIAL", f"Cultural issues: {'; '.join(issues[:3])}", 0.5

        except Exception as e:
            verification_logger.error(f"Cultural adaptation check failed: {e}")
            return "INFO", "Could not verify cultural adaptation", 1.0

    async def _verify_terminology(self, text: str, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify terminology consistency.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            description = criterion_config.get("description", "")

            # Extract required terminology from description
            import re
            terms = re.findall(r'"([^"]+)"', description)

            if not terms:
                return "PASS", "No specific terminology requirements", 1.0

            text_lower = text.lower()
            found_terms = [t for t in terms if t.lower() in text_lower]

            if len(found_terms) == len(terms):
                return "PASS", f"All required terminology used", 1.0
            else:
                missing = set(t.lower() for t in terms) - set(t.lower() for t in found_terms)
                return "FAIL", f"Missing terminology: {', '.join(missing)}", 0.0

        except Exception as e:
            verification_logger.error(f"Terminology check failed: {e}")
            return "FAIL", f"Failed to verify terminology: {str(e)}", 0.0

    async def _verify_completeness(self, text: str, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify translation is complete.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            description = criterion_config.get("description", "")

            # Check for obvious incompleteness markers
            incomplete_markers = [
                "[", "...", "etc.", "TBD", "to be continued",
                "incomplete", "unfinished", "not yet"
            ]

            text_lower = text.lower()
            has_markers = any(marker in text_lower for marker in incomplete_markers)

            if has_markers:
                return "FAIL", "Translation appears incomplete (contains markers like [...], etc., TBD)", 0.0

            # Check length
            word_count = len(text.split())
            if word_count < 20:
                return "FAIL", f"Translation too short: {word_count} words", 0.0

            prompt = f"""
            Evaluate if this translation appears complete.

            Context: {description}

            Text: {text[:2000]}

            Respond in JSON format:
            {{
                "appears_complete": true/false,
                "completeness_score": 0-100,
                "missing_elements": ["list of potentially missing elements"],
                "explanation": "Brief evaluation"
            }}
            """

            system_prompt = "You are a translation evaluation expert."

            response = await openrouter_client.generate_json_completion(prompt, system_prompt)

            if response.get("appears_complete"):
                return "PASS", "Translation appears complete", 1.0
            else:
                score = response.get("completeness_score", 70)
                if score >= 70:
                    return "PASS", f"Mostly complete: {score}%", 0.75
                else:
                    return "FAIL", f"Translation incomplete: {score}%", 0.0

        except Exception as e:
            verification_logger.error(f"Completeness check failed: {e}")
            return "FAIL", f"Failed to verify completeness: {str(e)}", 0.0

    async def _verify_format(self, text: str, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify translation format.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            description = criterion_config.get("description", "")

            # Check for format requirements
            format_notes = []

            # Check for HTML tags if required
            if "html" in description.lower() or "website" in description.lower():
                has_html = bool("<" in text and ">" in text)
                if has_html:
                    format_notes.append("Contains HTML tags")
                else:
                    return "FAIL", "Expected HTML format, no tags found", 0.0

            # Check for paragraph structure
            has_paragraphs = len([p for p in text.split('\n\n') if p.strip()]) > 1
            if has_paragraphs:
                format_notes.append("Has paragraph structure")

            # Check for sentence structure
            has_sentences = any(text.strip().endswith(c) for c in ['.', '!', '?', '。', '！', '？'])
            if has_sentences:
                format_notes.append("Has sentence structure")

            if format_notes:
                return "PASS", f"Format: {', '.join(format_notes)}", 1.0
            else:
                return "INFO", "Basic text format", 1.0

        except Exception as e:
            verification_logger.error(f"Format check failed: {e}")
            return "FAIL", f"Failed to verify format: {str(e)}", 0.0

    def get_criterion_status(self, name: str, result: tuple) -> tuple[str, str, float]:
        """Determine criterion status based on verification result."""
        status, detail, score = result
        return status, detail, score
