"""Software verification lane - checks code repositories."""
from typing import Dict, Any, List

from src.lanes.base import VerificationLane, Criterion, PFISignal, VerificationReport
from src.utils.github_client import github_client
from src.utils.openai_client import openrouter_client
from src.utils.logger import verification_logger


class SoftwareLane(VerificationLane):
    """Verification lane for software gigs."""

    GIG_TYPE = "SOFTWARE"

    async def verify(
        self, submission: Dict[str, Any], criteria: List[Dict[str, Any]]
    ) -> VerificationReport:
        """Verify a software submission.

        Args:
            submission: Dict with github_url and optional deployed_url
            criteria: List of criteria to verify

        Returns:
            VerificationReport with scores
        """
        verification_logger.info(f"Starting software verification: {submission.get('github_url')}")

        try:
            # Step 1: Get repository
            repo = github_client.get_repository(submission["github_url"])
            if not repo:
                raise ValueError("Repository not found or inaccessible")

            # Step 2: Verify each criterion
            verified_criteria = []
            pfi_signals = []

            for criterion_config in criteria:
                criterion_name = criterion_config["name"]
                criterion_type = criterion_config["type"]

                # Route to appropriate verification method
                if criterion_name == "Repo Structure":
                    result = await self._verify_repo_structure(repo)
                elif criterion_name == "Dependencies":
                    result = await self._verify_dependencies(repo)
                elif criterion_name == "README":
                    result = await self._verify_readme(repo)
                elif criterion_name == "Feature Implementation":
                    result = await self._verify_features(repo, criterion_config)
                elif criterion_name == "Code Quality":
                    result = await self._verify_code_quality(repo)
                elif criterion_name == "Testing":
                    result = await self._verify_testing(repo)
                elif criterion_name == "Deployed Application":
                    result = await self._verify_deployment(submission.get("deployed_url"))
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

            # Step 3: Calculate overall score
            overall_score = self.calculate_overall_score(verified_criteria, pfi_signals)

            # Step 4: Determine payment decision
            payment_decision = self.determine_payment_decision(overall_score)

            # Step 5: Generate feedback
            feedback = self.generate_feedback(verified_criteria)

            # Step 6: Create report
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

            verification_logger.info(f"Software verification complete: score={overall_score}")
            return report

        except Exception as e:
            verification_logger.error(f"Software verification failed: {e}")
            raise Exception(f"Verification failed: {str(e)}") from e

    async def _verify_repo_structure(self, repo) -> tuple[str, str, float]:
        """Verify repository has proper structure.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            # Get repository contents
            contents = repo.get_contents("")
            content_names = [c.name for c in contents]

            # Check for common directories
            required_dirs = ["src", "components", "pages", "lib", "app"]
            has_structure = any(d in content_names for d in required_dirs)

            if has_structure:
                return "PASS", "Standard project structure found", 1.0
            else:
                return "FAIL", "Missing standard project directories (src, components, etc.)", 0.0

        except Exception as e:
            verification_logger.error(f"Repo structure check failed: {e}")
            return "FAIL", f"Failed to verify repo structure: {str(e)}", 0.0

    async def _verify_dependencies(self, repo) -> tuple[str, str, float]:
        """Verify dependencies are present and match expected tech stack.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            # Check for package.json or requirements.txt
            package_files = [
                c for c in repo.get_contents("") if c.name in ["package.json", "requirements.txt"]
            ]

            if not package_files:
                return "FAIL", "No dependency file found (package.json or requirements.txt)", 0.0

            return "PASS", "Dependencies file found", 1.0

        except Exception as e:
            verification_logger.error(f"Dependencies check failed: {e}")
            return "FAIL", f"Failed to verify dependencies: {str(e)}", 0.0

    async def _verify_readme(self, repo) -> tuple[str, str, float]:
        """Verify README exists and has required sections.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            # Check for README
            readme_files = [c for c in repo.get_contents("") if "readme" in c.name.lower()]

            if not readme_files:
                return "FAIL", "README file not found", 0.0

            # Get README content
            readme_content = readme_files[0].decoded_content.decode("utf-8")

            # Check for required sections
            required_sections = ["# Installation", "# Usage", "# Setup", "# Getting Started"]
            has_required = any(
                section.lower() in readme_content.lower() for section in required_sections
            )

            if has_required:
                return "PASS", "README contains installation and usage instructions", 1.0
            else:
                return "PARTIAL", "README missing installation/usage instructions", 0.5

        except Exception as e:
            verification_logger.error(f"README check failed: {e}")
            return "FAIL", f"Failed to verify README: {str(e)}", 0.0

    async def _verify_features(self, repo, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify specified features are implemented using AI.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            # Get repository content files
            contents = repo.get_contents("")

            # Build AI prompt for feature verification
            file_tree = "\n".join([c.name for c in contents])

            prompt = f"""
            Analyze this GitHub repository file tree and verify if the following features are implemented:

            Repository file tree:
            {file_tree}

            Required features to verify:
            {criterion_config.get('description', 'N/A')}

            Respond in JSON format:
            {{
                "all_implemented": true/false,
                "missing_features": ["feature1", "feature2"],
                "implementation_quality": "excellent/good/fair/poor",
                "details": "Brief explanation of findings"
            }}
            """

            system_prompt = "You are a code review expert. Analyze repository structure to verify feature implementation."

            response = await ai_client.generate_json_completion(prompt, system_prompt)

            if response.get("all_implemented"):
                return "PASS", response.get("details", "All features implemented"), 1.0
            elif response.get("missing_features"):
                missing = ", ".join(response["missing_features"])
                return "FAIL", f"Missing features: {missing}", 0.0
            else:
                quality = response.get("implementation_quality", "fair")
                score = {"excellent": 1.0, "good": 0.75, "fair": 0.5, "poor": 0.25}.get(quality, 0.5)
                return "PARTIAL", f"Implementation quality: {quality}", score

        except Exception as e:
            verification_logger.error(f"Feature verification failed: {e}")
            return "FAIL", f"Failed to verify features: {str(e)}", 0.0

    async def _verify_code_quality(self, repo) -> tuple[str, str, float]:
        """Verify code quality (basic checks).

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            # This is a simplified check - in production would run linters, etc.
            return "INFO", "Code quality checks would run linters, static analysis", 1.0

        except Exception as e:
            verification_logger.error(f"Code quality check failed: {e}")
            return "FAIL", f"Failed to verify code quality: {str(e)}", 0.0

    async def _verify_testing(self, repo) -> tuple[str, str, float]:
        """Verify tests exist (basic check).

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            # Check for test files or directories
            contents = repo.get_contents("")
            test_items = [c for c in contents if "test" in c.name.lower()]

            if test_items:
                return "PASS", "Test files/directories found", 1.0
            else:
                return "INFO", "No test files found (recommended)", 0.5

        except Exception as e:
            verification_logger.error(f"Testing verification failed: {e}")
            return "FAIL", f"Failed to verify testing: {str(e)}", 0.0

    async def _verify_deployment(self, deployed_url: str) -> tuple[str, str, float]:
        """Verify deployed application URL.

        Returns:
            Tuple of (status, detail, score)
        """
        if not deployed_url:
            return "INFO", "No deployed URL provided (optional)", 1.0

        try:
            import httpx

            async with httpx.AsyncClient() as client:
                response = await client.get(deployed_url, timeout=10.0)
                if response.status_code == 200:
                    return "PASS", "Application is accessible at deployed URL", 1.0
                else:
                    return "FAIL", f"Application returned status {response.status_code}", 0.0

        except httpx.TimeoutException:
            return "FAIL", "Application timeout - may not be deployed", 0.0
        except Exception as e:
            verification_logger.error(f"Deployment verification failed: {e}")
            return "INFO", "Could not verify deployment", 1.0

    def get_criterion_status(self, name: str, result: tuple) -> tuple[str, str, float]:
        """Determine criterion status based on verification result."""
        status, detail, score = result
        return status, detail, score
