"""Router to direct submissions to appropriate verification lanes."""
from typing import Dict, Any, List

from src.lanes.base import VerificationReport
from src.lanes.software import SoftwareLane
from src.utils.logger import verification_logger


class VerificationLaneRouter:
    """Routes submissions to correct verification lane based on gig type."""

    GIG_TYPES = {
        "SOFTWARE": SoftwareLane,
        # TODO: Add other lanes (Copywriting, Data Entry, Translation)
        # "COPYWRITING": CopywritingLane,
        # "DATA_ENTRY": DataEntryLane,
        # "TRANSLATION": TranslationLane,
    }

    def __init__(self):
        """Initialize router with lane instances."""
        self.lanes = {gig_type: lane_class() for gig_type, lane_class in self.GIG_TYPES.items()}
        verification_logger.info(f"Initialized {len(self.lanes)} verification lanes")

    async def verify(
        self,
        gig_type: str,
        submission: Dict[str, Any],
        criteria: List[Dict[str, Any]],
    ) -> VerificationReport:
        """Route submission to appropriate verification lane.

        Args:
            gig_type: Type of gig (SOFTWARE, COPYWRITING, DATA_ENTRY, TRANSLATION)
            submission: Submission data
            criteria: List of criteria to verify

        Returns:
            VerificationReport with scores

        Raises:
            ValueError: If gig type not supported
            Exception: If verification fails
        """
        gig_type = gig_type.upper()

        if gig_type not in self.lanes:
            verification_logger.error(f"Unsupported gig type: {gig_type}")
            raise ValueError(f"Unsupported gig type: {gig_type}")

        lane = self.lanes[gig_type]
        verification_logger.info(f"Routing to {lane.lane_name} lane")

        # Add gig type to submission for lane use
        submission["gig_type"] = gig_type
        submission["gig_subtype"] = submission.get("gig_subtype", "unknown")

        return await lane.verify(submission, criteria)

    def get_supported_gig_types(self) -> List[str]:
        """Get list of supported gig types.

        Returns:
            List of supported gig type strings
        """
        return list(self.GIG_TYPES.keys())


# Singleton instance
lane_router = VerificationLaneRouter()
