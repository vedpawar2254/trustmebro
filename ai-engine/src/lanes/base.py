"""Abstract base class for verification lanes."""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

from pydantic import BaseModel


class CriterionType:
    """Criterion priority types with weights."""
    PRIMARY = "PRIMARY"      # 60% weight - Must-have requirements
    SECONDARY = "SECONDARY"  # 30% weight - Should-have requirements
    TERTIARY = "TERTIARY"    # 10% weight - Nice-to-have requirements


class Criterion(BaseModel):
    """Verification criterion result."""

    name: str
    type: str  # PRIMARY, SECONDARY, or TERTIARY
    status: str  # PASS, FAIL, PARTIAL
    detail: str
    weight: float  # 0-1 (relative weight within its type)


class PFISignal(BaseModel):
    """PFI (Performance & Faith Index) signal."""

    name: str
    status: str  # WARNING or INFO
    detail: str


class VerificationReport(BaseModel):
    """Complete verification report."""

    milestone_id: str
    gig_type: str
    gig_subtype: str
    overall_score: float  # 0-100
    payment_decision: str  # AUTO_RELEASE, HOLD, DISPUTE
    criteria: list[Criterion]
    pfi_signals: list[PFISignal]
    resubmissions_remaining: int
    feedback_for_freelancer: str
    verification_lane: Optional[str] = None


class VerificationLane(ABC):
    """Abstract base class for verification lanes.

    Each gig type (Software, Copywriting, Data Entry, Translation)
    has its own verification lane with specific checks.
    """

    def __init__(self):
        """Initialize verification lane."""
        self.lane_name = self.__class__.__name__

    @abstractmethod
    async def verify(self, submission: Dict[str, Any], criteria: list[Dict[str, Any]]) -> VerificationReport:
        """Verify a submission and generate a report.

        Args:
            submission: Submission data (github_url, file_url, etc.)
            criteria: List of criteria to verify against

        Returns:
            VerificationReport with scores and decisions

        Raises:
            Exception: If verification fails
        """
        pass

    @abstractmethod
    def get_criterion_status(self, name: str, result: Any) -> tuple[str, str, float]:
        """Determine criterion status based on verification result.

        Args:
            name: Criterion name
            result: Verification result

        Returns:
            Tuple of (status, detail, score)
        """
        pass

    def calculate_overall_score(
        self, criteria: list[Criterion], pfi_signals: list[PFISignal]
    ) -> float:
        """Calculate overall score from criteria results using 60-30-10 weighting.

        Scoring Formula:
        - PRIMARY criteria: 60% of total score
        - SECONDARY criteria: 30% of total score
        - TERTIARY criteria: 10% of total score

        Args:
            criteria: List of criterion results
            pfi_signals: List of PFI signals

        Returns:
            Overall score (0-100)
        """
        # Group criteria by type
        primary_criteria = [c for c in criteria if c.type == CriterionType.PRIMARY]
        secondary_criteria = [c for c in criteria if c.type == CriterionType.SECONDARY]
        tertiary_criteria = [c for c in criteria if c.type == CriterionType.TERTIARY]

        def calculate_type_score(type_criteria: list[Criterion]) -> float:
            """Calculate score for a specific criterion type."""
            if not type_criteria:
                return 1.0  # Full score if no criteria of this type

            total_weight = sum(c.weight for c in type_criteria)
            if total_weight == 0:
                return 1.0

            weighted_score = 0.0
            for criterion in type_criteria:
                if criterion.status == "PASS":
                    weighted_score += criterion.weight
                elif criterion.status == "PARTIAL":
                    weighted_score += criterion.weight * 0.5
                # FAIL contributes 0

            return weighted_score / total_weight

        # Calculate scores for each type (0-1 scale)
        primary_score = calculate_type_score(primary_criteria)
        secondary_score = calculate_type_score(secondary_criteria)
        tertiary_score = calculate_type_score(tertiary_criteria)

        # Apply 60-30-10 weighting (result is 0-100)
        base_score = (
            primary_score * 60 +      # 60% weight for PRIMARY
            secondary_score * 30 +    # 30% weight for SECONDARY
            tertiary_score * 10       # 10% weight for TERTIARY
        )

        # PFI signals can slightly reduce score (warnings)
        warning_count = sum(1 for signal in pfi_signals if signal.status == "WARNING")
        penalty = min(warning_count * 5, 20)  # Max 20 point penalty

        final_score = max(0, base_score - penalty)

        return round(final_score, 1)

    def determine_payment_decision(self, overall_score: float) -> str:
        """Determine payment decision based on overall score.

        Args:
            overall_score: Overall verification score (0-100)

        Returns:
            Payment decision: AUTO_RELEASE, HOLD, or DISPUTE
        """
        if overall_score >= 90:
            return "AUTO_RELEASE"
        elif overall_score >= 50:
            return "HOLD"
        else:
            return "DISPUTE"

    def generate_feedback(self, criteria: list[Criterion]) -> str:
        """Generate actionable feedback for freelancer.

        Args:
            criteria: List of criterion results

        Returns:
            Formatted feedback string
        """
        failed_criteria = [c for c in criteria if c.status in ["FAIL", "PARTIAL"]]

        if not failed_criteria:
            return "Great work! All criteria met."

        feedback_parts = []
        for criterion in failed_criteria:
            feedback_parts.append(f"{criterion.detail}")

        return "\n".join(feedback_parts)
