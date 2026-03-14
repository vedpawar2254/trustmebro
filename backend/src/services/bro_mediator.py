"""Bro AI Mediator service for chat analysis and scope creep detection."""
import json
import httpx
from typing import Optional, Dict, List, Any
from datetime import datetime

from src.config import settings
from src.utils.logger import api_logger


# Scope creep keywords and patterns
SCOPE_CREEP_KEYWORDS = [
    "can you also", "could you add", "one more thing", "additionally",
    "while you're at it", "quick addition", "small change", "just add",
    "extra feature", "bonus", "throw in", "include also", "plus",
    "on top of", "as well as", "along with", "in addition",
    "another thing", "by the way", "oh and", "also need",
    "would be nice if", "it would be great", "how about adding"
]

BUDGET_CHANGE_KEYWORDS = [
    "budget", "price", "cost", "pay", "payment", "rate",
    "increase", "decrease", "more money", "less money",
    "discount", "charge", "fee", "extra pay"
]

DEADLINE_CHANGE_KEYWORDS = [
    "deadline", "timeline", "due date", "delivery date",
    "extend", "extension", "delay", "postpone", "push back",
    "earlier", "sooner", "rush", "urgent", "asap"
]

PROCESS_QUESTION_KEYWORDS = [
    "how does", "how do", "what happens", "when will",
    "how long", "what if", "can i", "do i need",
    "payment work", "verification work", "submit",
    "milestone", "escrow", "release"
]


class BroMediator:
    """AI Mediator (Bro) for chat analysis and intervention."""

    def __init__(self):
        self.ai_engine_url = settings.ai_engine_url

    def analyze_message(
        self,
        message_content: str,
        job_spec: Dict,
        sender_role: str,
        recent_messages: List[Dict] = None
    ) -> Dict[str, Any]:
        """
        Analyze a chat message for scope creep, questions, or other intervention needs.

        Returns:
            {
                "should_respond": bool,
                "intervention_type": str | None,
                "response": str | None,
                "detected_changes": list,
                "confidence": float
            }
        """
        message_lower = message_content.lower()

        # Check for scope creep
        scope_creep = self._detect_scope_creep(message_lower, job_spec)
        if scope_creep["detected"]:
            return {
                "should_respond": True,
                "intervention_type": "scope_creep",
                "response": self._generate_scope_creep_response(
                    scope_creep, sender_role, job_spec
                ),
                "detected_changes": scope_creep["changes"],
                "confidence": scope_creep["confidence"]
            }

        # Check for budget change discussion
        budget_change = self._detect_budget_change(message_lower)
        if budget_change["detected"]:
            return {
                "should_respond": True,
                "intervention_type": "budget_change",
                "response": self._generate_budget_change_response(sender_role),
                "detected_changes": ["budget"],
                "confidence": budget_change["confidence"]
            }

        # Check for deadline change discussion
        deadline_change = self._detect_deadline_change(message_lower)
        if deadline_change["detected"]:
            return {
                "should_respond": True,
                "intervention_type": "deadline_change",
                "response": self._generate_deadline_change_response(sender_role),
                "detected_changes": ["deadline"],
                "confidence": deadline_change["confidence"]
            }

        # Check for process questions
        process_question = self._detect_process_question(message_lower)
        if process_question["detected"]:
            return {
                "should_respond": True,
                "intervention_type": "process_question",
                "response": self._generate_process_response(
                    message_content, process_question["topic"]
                ),
                "detected_changes": [],
                "confidence": process_question["confidence"]
            }

        # No intervention needed
        return {
            "should_respond": False,
            "intervention_type": None,
            "response": None,
            "detected_changes": [],
            "confidence": 0.0
        }

    def _detect_scope_creep(self, message: str, job_spec: Dict) -> Dict:
        """Detect potential scope creep in message."""
        detected_keywords = []
        for keyword in SCOPE_CREEP_KEYWORDS:
            if keyword in message:
                detected_keywords.append(keyword)

        if not detected_keywords:
            return {"detected": False, "changes": [], "confidence": 0.0}

        # Calculate confidence based on keyword matches
        confidence = min(0.9, len(detected_keywords) * 0.3)

        # Extract what changes are being requested
        changes = []
        if "feature" in message or "functionality" in message:
            changes.append("new_feature")
        if "page" in message or "screen" in message:
            changes.append("new_page")
        if "design" in message or "style" in message:
            changes.append("design_change")
        if not changes:
            changes.append("scope_expansion")

        return {
            "detected": True,
            "keywords": detected_keywords,
            "changes": changes,
            "confidence": confidence
        }

    def _detect_budget_change(self, message: str) -> Dict:
        """Detect budget change discussion."""
        detected_keywords = []
        for keyword in BUDGET_CHANGE_KEYWORDS:
            if keyword in message:
                detected_keywords.append(keyword)

        if len(detected_keywords) >= 2:
            return {
                "detected": True,
                "keywords": detected_keywords,
                "confidence": min(0.85, len(detected_keywords) * 0.25)
            }

        return {"detected": False, "confidence": 0.0}

    def _detect_deadline_change(self, message: str) -> Dict:
        """Detect deadline change discussion."""
        detected_keywords = []
        for keyword in DEADLINE_CHANGE_KEYWORDS:
            if keyword in message:
                detected_keywords.append(keyword)

        if len(detected_keywords) >= 2:
            return {
                "detected": True,
                "keywords": detected_keywords,
                "confidence": min(0.85, len(detected_keywords) * 0.25)
            }

        return {"detected": False, "confidence": 0.0}

    def _detect_process_question(self, message: str) -> Dict:
        """Detect process-related questions."""
        # Check for question marks
        if "?" not in message:
            return {"detected": False, "confidence": 0.0}

        for keyword in PROCESS_QUESTION_KEYWORDS:
            if keyword in message:
                # Determine topic
                topic = "general"
                if "payment" in message or "pay" in message:
                    topic = "payment"
                elif "verification" in message or "verify" in message:
                    topic = "verification"
                elif "submit" in message or "submission" in message:
                    topic = "submission"
                elif "milestone" in message:
                    topic = "milestone"
                elif "escrow" in message:
                    topic = "escrow"

                return {
                    "detected": True,
                    "topic": topic,
                    "confidence": 0.7
                }

        return {"detected": False, "confidence": 0.0}

    def _generate_scope_creep_response(
        self,
        scope_creep: Dict,
        sender_role: str,
        job_spec: Dict
    ) -> str:
        """Generate response for scope creep detection."""
        sender = "employer" if sender_role == "employer" else "freelancer"
        other_party = "freelancer" if sender_role == "employer" else "employer"

        # Get current deliverables summary
        deliverables = job_spec.get("deliverables_json", [])
        deliverables_text = ", ".join([d.get("name", str(d)) for d in deliverables[:3]]) if deliverables else "the agreed deliverables"

        response = f"""Heads up - this looks like a potential scope change.

**Current spec includes:**
{deliverables_text}

**What's being discussed:**
This appears to be a new request not in the original spec.

{sender.title()}, if you want to add this, you'll need to use a formal change request.
{other_party.title()}, you can accept or reject the change request.

Would you like to submit this as a change request?"""

        return response

    def _generate_budget_change_response(self, sender_role: str) -> str:
        """Generate response for budget change discussion."""
        return """I noticed you're discussing budget changes.

Budget modifications require a formal change request after the spec is locked.

**Remember:**
- The current budget is locked in escrow
- Changes may require escrow adjustment
- Both parties must agree to budget changes

Would you like to submit a budget change request?"""

    def _generate_deadline_change_response(self, sender_role: str) -> str:
        """Generate response for deadline change discussion."""
        return """I noticed you're discussing deadline changes.

Timeline modifications require a formal change request after the spec is locked.

**Keep in mind:**
- Deadline extensions may affect milestone payouts
- Both parties must agree to timeline changes
- Consider the impact on project scope

Would you like to submit a deadline change request?"""

    def _generate_process_response(self, message: str, topic: str) -> str:
        """Generate response for process questions."""
        responses = {
            "payment": """Great question about payments! Here's how it works:

1. Employer funds escrow after spec lock
2. Freelancer submits work for each milestone
3. AI verifies submission against spec requirements
4. If score is 90%+, payment auto-releases
5. If lower, freelancer can resubmit (2 attempts) or employer can manually approve

Funds are held safely until work is verified.""",

            "verification": """Here's how verification works:

1. Freelancer submits work for a milestone
2. Employer triggers AI verification
3. AI checks work against spec requirements (primary, secondary, tertiary)
4. Score is calculated: Primary (60%) + Secondary (30%) + Tertiary (10%)
5. Results:
   - 90%+ = Verified (auto-release)
   - 50-89% = Partial (needs revision or manual approval)
   - <50% = Failed (needs revision)

Freelancers get 2 resubmission attempts per milestone.""",

            "submission": """To submit work:

1. Make sure escrow is funded
2. Go to the submission page
3. Select the milestone you're submitting for
4. Choose submission type (text, GitHub link, or file)
5. Add any notes for the employer
6. Submit!

The employer will then trigger verification.""",

            "milestone": """Milestones are your project checkpoints:

- Each milestone has specific deliverables
- Payment is split across milestones (final gets 1.5x)
- Submit work per milestone for verification
- All milestones verified = project complete!""",

            "escrow": """Escrow protects both parties:

- Employer funds escrow before work begins
- Funds are held securely by the platform
- Released to freelancer upon verified work
- Refunded to employer if project is disputed
- 10% platform fee applied at funding""",

            "general": """I'm here to help! Here's a quick overview:

1. **Spec Lock** - Both parties agree on requirements
2. **Escrow** - Employer funds the project
3. **Work** - Freelancer submits milestone deliverables
4. **Verify** - AI checks work against spec
5. **Pay** - Automatic release on verified work

What specifically would you like to know more about?"""
        }

        return responses.get(topic, responses["general"])

    async def analyze_with_ai(
        self,
        message_content: str,
        job_spec: Dict,
        recent_messages: List[Dict]
    ) -> Dict[str, Any]:
        """
        Use AI engine for more sophisticated analysis.

        Fallback to rule-based if AI engine unavailable.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.ai_engine_url}/analyze-chat",
                    json={
                        "message": message_content,
                        "spec": job_spec,
                        "recent_messages": recent_messages[-10:] if recent_messages else [],
                    },
                    timeout=10.0,
                )

                if response.status_code == 200:
                    return response.json()

        except Exception as e:
            api_logger.warning(f"AI chat analysis failed, using rules: {e}")

        # Fallback to rule-based analysis
        return self.analyze_message(message_content, job_spec, "unknown", recent_messages)


# Singleton instance
bro_mediator = BroMediator()
