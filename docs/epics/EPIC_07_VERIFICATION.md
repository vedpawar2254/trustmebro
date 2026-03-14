# EPIC 7: Verification

## Overview

AI verifies submissions against spec requirements. Produces score and detailed feedback.

**Dependencies:** EPIC 6 (Submissions)
**Blocks:** EPIC 8 (Payment Release)

---

## User Stories

### VER-1: Trigger Verification

**As an** employer
**I want to** trigger AI verification on a submission
**So that** work quality is objectively assessed

**Priority:** P0
**Points:** 2

#### Acceptance Criteria

- [ ] Only employer can trigger verification
- [ ] Only for PENDING submissions
- [ ] Verification runs asynchronously (or sync for hackathon)
- [ ] Updates submission with score and report

#### API Endpoint

```
POST /api/jobs/{job_id}/submissions/{submission_id}/verify

Response (200):
{
  "submission_id": 1,
  "status": "VERIFIED",  // or PARTIAL, FAILED
  "score": 94,
  "report": {
    "overall_score": 94,
    "status": "VERIFIED",
    "requirements": {
      "primary": [
        {"id": "P1", "description": "1000-1200 words", "status": "PASS", "actual": "1,150 words"},
        {"id": "P2", "description": "Original content", "status": "PASS", "actual": "3% plagiarism"}
      ],
      "secondary": [...],
      "tertiary": [...]
    },
    "scoring": {
      "primary_score": 100,
      "secondary_score": 85,
      "tertiary_score": 50,
      "weighted_total": 94
    },
    "feedback": "Excellent work! All primary requirements met..."
  }
}
```

#### Business Logic

```python
async def verify_submission(job_id: int, submission_id: int, user: User) -> dict:
    job = get_job(job_id)
    submission = get_submission(submission_id)
    spec = get_job_spec(job_id)

    # Validations
    if job.employer_id != user.id:
        raise HTTPException(403, "Only employer can verify")

    if submission.status != "PENDING":
        raise HTTPException(400, "Submission already verified")

    # Get milestone requirements
    milestone = find_milestone(spec.milestones_json, submission.milestone_id)

    # Run AI verification
    report = await run_verification(
        submission=submission,
        requirements=spec.requirements_json,
        milestone=milestone
    )

    # Determine status
    if report["overall_score"] >= 90 and report["all_primary_pass"]:
        status = "VERIFIED"
    elif report["overall_score"] >= 70:
        status = "PARTIAL"
    else:
        status = "FAILED"

    # Update submission
    submission.status = status
    submission.verification_score = report["overall_score"]
    submission.verification_report_json = report
    submission.verified_at = datetime.utcnow()
    save_submission(submission)

    # Notify via chat
    send_verification_result_message(job_id, submission, report)

    return {
        "submission_id": submission_id,
        "status": status,
        "score": report["overall_score"],
        "report": report
    }
```

---

### VER-2: AI Verification Engine

**As the** system
**I want to** verify submissions against requirements
**So that** quality is objectively measured

**Priority:** P0
**Points:** 5

#### Verification Checks by Type

**Text (Copywriting):**
- Word count (automated)
- Plagiarism check (mock for hackathon)
- Topic coverage (AI)
- Tone analysis (AI)
- Structure check (AI)
- Grammar (AI)

**GitHub Link:**
- Link validity (automated)
- Basic code analysis (AI)
- Requirements matching (AI)

**File Upload:**
- File exists (automated)
- Content analysis (AI based on file type)

#### AI Verification Prompt

```python
VERIFICATION_PROMPT = """
You are a verification system checking if submitted work meets requirements.

## Job Spec Requirements

### Primary Requirements (MUST pass all):
{primary_requirements}

### Secondary Requirements:
{secondary_requirements}

### Tertiary Requirements:
{tertiary_requirements}

## Submitted Work

Type: {submission_type}
Content:
{submission_content}

## Your Task

For EACH requirement, determine:
1. PASS or FAIL
2. Actual value or finding
3. Brief explanation

Then calculate scores:
- Primary score: (passed / total) * 100
- Secondary score: (passed / total) * 100
- Tertiary score: (passed / total) * 100
- Weighted total: (primary * 0.6) + (secondary * 0.3) + (tertiary * 0.1)

Return JSON:
{
  "all_primary_pass": true/false,
  "overall_score": number,
  "requirements": {
    "primary": [
      {"id": "P1", "description": "...", "status": "PASS/FAIL", "actual": "...", "reason": "..."}
    ],
    "secondary": [...],
    "tertiary": [...]
  },
  "scoring": {
    "primary_score": number,
    "primary_passed": number,
    "primary_total": number,
    "secondary_score": number,
    "secondary_passed": number,
    "secondary_total": number,
    "tertiary_score": number,
    "tertiary_passed": number,
    "tertiary_total": number,
    "weighted_total": number
  },
  "feedback": "Overall feedback paragraph"
}
"""
```

#### Implementation

```python
async def run_verification(submission: Submission, requirements: dict, milestone: dict) -> dict:
    # Get submission content
    content = get_submission_content(submission)

    # Build requirements text
    primary_text = format_requirements(requirements.get("primary", []))
    secondary_text = format_requirements(requirements.get("secondary", []))
    tertiary_text = format_requirements(requirements.get("tertiary", []))

    # Run automated checks first
    automated_results = run_automated_checks(submission, requirements)

    # Run AI verification
    prompt = VERIFICATION_PROMPT.format(
        primary_requirements=primary_text,
        secondary_requirements=secondary_text,
        tertiary_requirements=tertiary_text,
        submission_type=submission.submission_type,
        submission_content=content[:10000]  # Limit for token size
    )

    ai_response = await openai_chat(
        system="You are a strict but fair verification system.",
        messages=[{"role": "user", "content": prompt}],
        response_format="json"
    )

    report = json.loads(ai_response)

    # Merge automated results
    merge_automated_results(report, automated_results)

    return report


def run_automated_checks(submission: Submission, requirements: dict) -> dict:
    """Run non-AI checks that can be automated."""
    results = {}

    if submission.submission_type == "text_paste":
        text = submission.content_json.get("text", "")

        # Word count
        word_count = len(text.split())
        results["word_count"] = word_count

        # Mock plagiarism (random for hackathon)
        results["plagiarism_score"] = random.randint(1, 8)  # 1-8% for demo

    elif submission.submission_type == "github_link":
        # Verify URL is valid
        link = submission.content_json.get("github_link", "")
        results["link_valid"] = link.startswith("https://github.com/")

    return results
```

---

### VER-3: Verification Report

**As a** participant
**I want to** see detailed verification results
**So that** I understand the assessment

**Priority:** P0
**Points:** 2

#### Acceptance Criteria

- [ ] Shows overall score prominently
- [ ] Shows pass/fail for each requirement
- [ ] Shows detailed feedback
- [ ] Color-coded status (green=pass, red=fail)

#### UI Components

```
VerificationReportPage:
├── Header ("Verification Report")
├── SubmissionInfo
│   ├── Milestone
│   ├── SubmittedDate
│   └── VerifiedDate
├── ScoreCard
│   ├── OverallScore (large, circular)
│   │   └── "94 / 100"
│   ├── StatusBadge ("VERIFIED" green / "PARTIAL" yellow / "FAILED" red)
│   └── ScoreBreakdown
│       ├── PrimaryScore ("100% (5/5)")
│       ├── SecondaryScore ("85% (4/5)")
│       └── TertiaryScore ("50% (1/2)")
├── RequirementsSection
│   ├── PrimaryRequirements
│   │   └── RequirementRow[]
│   │       ├── StatusIcon (✓ or ✗)
│   │       ├── Description
│   │       ├── ActualValue
│   │       └── Reason
│   ├── SecondaryRequirements
│   │   └── RequirementRow[]
│   └── TertiaryRequirements
│       └── RequirementRow[]
├── FeedbackSection
│   └── FeedbackText (AI-generated summary)
└── Actions
    ├── ResubmitButton (if PARTIAL/FAILED, attempts remaining)
    └── BackButton
```

---

### VER-4: View Verification Results (Freelancer)

**As a** freelancer
**I want to** see my verification results
**So that** I know if I need to revise

**Priority:** P0
**Points:** 1

Same UI as VER-3, with freelancer perspective.

---

### VER-5: Resubmission

**As a** freelancer
**I want to** resubmit if verification fails
**So that** I can fix issues and get paid

**Priority:** P1
**Points:** 2

#### Acceptance Criteria

- [ ] Can resubmit if status is PARTIAL or FAILED
- [ ] Maximum 2 resubmissions per milestone
- [ ] Shows remaining attempts
- [ ] Resubmission creates new submission record

#### API Endpoint

```
POST /api/jobs/{job_id}/submissions/{submission_id}/resubmit

Request:
{
  "submission_type": "text_paste",
  "content": {
    "text": "Updated content..."
  },
  "notes": "Fixed the issues mentioned"
}

Response (201):
{
  "submission": {
    "id": 3,
    "milestone_id": 1,
    "status": "PENDING",
    "resubmission_count": 1,  // Incremented
    ...
  },
  "previous_submission_id": 1,
  "attempts_remaining": 1
}

Response (400):
{
  "detail": "No resubmission attempts remaining"
}
```

#### Business Logic

```python
def resubmit(job_id: int, submission_id: int, data: CreateSubmissionRequest, user: User) -> dict:
    original = get_submission(submission_id)

    # Validations
    if original.freelancer_id != user.id:
        raise HTTPException(403, "Not your submission")

    if original.status not in ["PARTIAL", "FAILED"]:
        raise HTTPException(400, "Cannot resubmit a verified submission")

    # Check resubmission limit (2 max)
    current_count = original.resubmission_count
    if current_count >= 2:
        raise HTTPException(400, "No resubmission attempts remaining")

    # Create new submission
    new_submission = create_submission_record(
        job_id=job_id,
        milestone_id=original.milestone_id,
        freelancer_id=user.id,
        submission_type=data.submission_type,
        content_json=data.content,
        notes=data.notes,
        status="PENDING",
        resubmission_count=current_count + 1
    )

    # Mark original as superseded
    original.status = "SUPERSEDED"
    save_submission(original)

    return {
        "submission": new_submission,
        "previous_submission_id": original.id,
        "attempts_remaining": 2 - (current_count + 1)
    }
```

---

## Scoring Formula

```python
def calculate_weighted_score(report: dict) -> float:
    """
    Primary: 60% weight
    Secondary: 30% weight
    Tertiary: 10% weight
    """
    primary = report["scoring"]["primary_score"]
    secondary = report["scoring"]["secondary_score"]
    tertiary = report["scoring"]["tertiary_score"]

    weighted = (primary * 0.6) + (secondary * 0.3) + (tertiary * 0.1)
    return round(weighted, 1)
```

## Status Determination

```python
def determine_status(report: dict, policy: str = "standard") -> str:
    """
    Determine verification status based on score and policy.
    """
    score = report["overall_score"]
    all_primary_pass = report["all_primary_pass"]

    thresholds = {
        "strict": 95,
        "standard": 90,
        "flexible": 85,
        "trust_based": 80
    }

    threshold = thresholds.get(policy, 90)

    if score >= threshold and all_primary_pass:
        return "VERIFIED"
    elif score >= 70:
        return "PARTIAL"
    else:
        return "FAILED"
```

---

## Testing Checklist

- [ ] Only employer can trigger verification
- [ ] Verification runs and returns report
- [ ] Report has all requirement statuses
- [ ] Score calculated correctly
- [ ] VERIFIED status when score ≥90 + all primary pass
- [ ] PARTIAL status when score 70-89
- [ ] FAILED status when score <70
- [ ] Resubmission allowed for PARTIAL/FAILED
- [ ] Resubmission blocked after 2 attempts
- [ ] Verification result appears in chat

---

## Files to Create/Modify

### Backend
- [ ] `backend/src/routes/submissions.py` - Add verify endpoint
- [ ] `backend/src/services/verification.py` - Verification logic
- [ ] `backend/src/services/ai_verification.py` - AI prompts

### Frontend
- [ ] `frontend/src/pages/jobs/[id]/submissions/[subId].tsx` - Submission detail with report
- [ ] `frontend/src/components/verification/VerificationReport.tsx`
- [ ] `frontend/src/components/verification/RequirementRow.tsx`
- [ ] `frontend/src/components/verification/ScoreCard.tsx`
