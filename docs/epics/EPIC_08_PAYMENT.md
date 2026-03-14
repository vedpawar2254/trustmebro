# EPIC 8: Payment Release

## Overview

Payment released to freelancer when verification passes. Auto-release for high scores, manual option for employer.

**Dependencies:** EPIC 7 (Verification)
**Blocks:** None (End of main flow)

---

## User Stories

### PAY-1: Auto-Release on Verification

**As the** system
**I want to** auto-release payment when verification passes
**So that** freelancers get paid quickly

**Priority:** P0
**Points:** 2

#### Acceptance Criteria

- [ ] Auto-release when: score ≥90 AND all primary requirements pass
- [ ] Releases milestone amount from escrow to freelancer
- [ ] Updates escrow record
- [ ] Notifies both parties

#### Implementation

```python
async def verify_submission(job_id: int, submission_id: int, user: User) -> dict:
    # ... verification logic ...

    # After verification completes
    if status == "VERIFIED":
        # Auto-release payment
        release_result = auto_release_payment(job_id, submission.milestone_id)

    return {
        "submission_id": submission_id,
        "status": status,
        "score": report["overall_score"],
        "report": report,
        "payment_released": status == "VERIFIED"
    }


def auto_release_payment(job_id: int, milestone_id: int) -> dict:
    escrow = get_escrow(job_id)
    spec = get_job_spec(job_id)

    # Find milestone payout
    milestone = find_milestone(spec.milestones_json, milestone_id)
    amount = calculate_milestone_payout(escrow.amount, spec.milestones_json, milestone_id)

    # Create release record
    release = create_escrow_release(
        escrow_id=escrow.id,
        milestone_id=milestone_id,
        amount=amount
    )

    # Update escrow totals (if tracking)
    update_escrow_released_amount(escrow.id, amount)

    # Notify via chat
    send_bro_message(
        channel_id=get_channel_id(job_id),
        content=f"""💰 Payment Released!

Milestone {milestone_id}: {milestone['name']} has been verified and payment of ${amount:.2f} has been released to Marcus.

Great work! 🎉"""
    )

    return {"amount": amount, "milestone_id": milestone_id}
```

---

### PAY-2: Manual Approve and Release

**As an** employer
**I want to** manually approve and release payment
**So that** I can accept work even if AI score is low

**Priority:** P0
**Points:** 1

#### Acceptance Criteria

- [ ] Employer can approve PARTIAL submissions
- [ ] Releases payment for that milestone
- [ ] Logged as "client override"

#### API Endpoint

```
POST /api/jobs/{job_id}/submissions/{submission_id}/approve

Response (200):
{
  "success": true,
  "submission": {
    "id": 1,
    "status": "VERIFIED",  // Updated
    "client_override": true
  },
  "payment": {
    "amount": 100.00,
    "milestone_id": 1,
    "released_at": "2026-03-20T12:00:00Z"
  }
}
```

#### Business Logic

```python
def manual_approve(job_id: int, submission_id: int, user: User) -> dict:
    job = get_job(job_id)
    submission = get_submission(submission_id)

    # Validations
    if job.employer_id != user.id:
        raise HTTPException(403, "Only employer can approve")

    if submission.status not in ["PENDING", "PARTIAL", "FAILED"]:
        raise HTTPException(400, "Submission already verified")

    # Update submission
    submission.status = "VERIFIED"
    submission.verification_report_json["client_override"] = True
    submission.verified_at = datetime.utcnow()
    save_submission(submission)

    # Release payment
    release_result = auto_release_payment(job_id, submission.milestone_id)

    return {
        "success": True,
        "submission": submission,
        "payment": release_result
    }
```

---

### PAY-3: View Released Payments

**As a** freelancer
**I want to** see my released payments
**So that** I can track my earnings

**Priority:** P0
**Points:** 1

#### Acceptance Criteria

- [ ] Shows all released payments for job
- [ ] Shows total earned vs pending
- [ ] Shows payment history

#### API Endpoint

```
GET /api/jobs/{job_id}/payments

Response:
{
  "job_id": 1,
  "total_budget": 550.00,
  "total_released": 200.00,
  "total_pending": 350.00,
  "releases": [
    {
      "milestone_id": 1,
      "milestone_name": "Blog Post 1",
      "amount": 100.00,
      "released_at": "2026-03-19T12:00:00Z"
    },
    {
      "milestone_id": 2,
      "milestone_name": "Blog Post 2",
      "amount": 100.00,
      "released_at": "2026-03-22T12:00:00Z"
    }
  ]
}
```

#### UI Component

```
PaymentsCard:
├── Header ("Payments")
├── Summary
│   ├── TotalEarned ("$200")
│   ├── Pending ("$350")
│   └── ProgressBar
├── ReleaseHistory
│   └── ReleaseRow[]
│       ├── MilestoneName
│       ├── Amount
│       └── Date
└── WithdrawButton (future - link to external)
```

---

### PAY-4: Job Completion

**As the** system
**I want to** mark job complete when all milestones verified
**So that** the job lifecycle ends properly

**Priority:** P0
**Points:** 1

#### Acceptance Criteria

- [ ] Check after each verification
- [ ] All milestones verified → job status = COMPLETED
- [ ] Bro announces completion
- [ ] Chat remains accessible but marked complete

#### Implementation

```python
def check_job_completion(job_id: int):
    job = get_job(job_id)
    spec = get_job_spec(job_id)
    milestones = spec.milestones_json

    # Check each milestone
    for milestone in milestones:
        submission = get_verified_submission(job_id, milestone["id"])
        if not submission or submission.status != "VERIFIED":
            return False  # Not all complete

    # All milestones verified!
    job.status = "COMPLETED"
    job.completed_at = datetime.utcnow()
    save_job(job)

    # Send completion message
    send_bro_message(
        channel_id=get_channel_id(job_id),
        content=f"""🎉 Project Complete!

All milestones have been verified and payments released.

Great job, Sarah and Marcus!

Final stats:
• Total paid: ${escrow.amount}
• Completed: {days_taken} days
• Average verification score: {avg_score}%

Thanks for using TrustMeBro! 🤙"""
    )

    # Update PFI scores
    update_pfi_on_completion(job)

    return True
```

---

## Database Updates

```sql
-- Add client_override flag to submissions
ALTER TABLE submissions ADD COLUMN client_override BOOLEAN DEFAULT FALSE;

-- Add completion tracking
ALTER TABLE jobs ADD COLUMN completed_at TIMESTAMP;
```

---

## Freelancer Earnings Dashboard

For hackathon, simple view. Future: full earnings dashboard with withdrawals.

```
EarningsPage:
├── Header ("Your Earnings")
├── TotalBalance
│   └── "$2,450.00 available"
├── PendingEarnings
│   └── "$350.00 in active jobs"
├── RecentReleases
│   └── ReleaseCard[]
│       ├── JobTitle
│       ├── Milestone
│       ├── Amount
│       └── Date
└── WithdrawInfo
    └── "Withdrawal coming soon!"
```

---

## Testing Checklist

- [ ] Verification score ≥90 + all primary → auto-release
- [ ] Payment amount correct for milestone
- [ ] Escrow release record created
- [ ] Employer can manually approve PARTIAL
- [ ] Manual approve releases payment
- [ ] All milestones verified → job COMPLETED
- [ ] Completion message in chat
- [ ] Freelancer can view released payments

---

## Files to Create/Modify

### Backend
- [ ] `backend/src/routes/payments.py` - Payment routes
- [ ] `backend/src/services/payment.py` - Payment release logic
- [ ] `backend/src/routes/submissions.py` - Add approve endpoint

### Frontend
- [ ] `frontend/src/components/payments/PaymentsCard.tsx`
- [ ] `frontend/src/pages/earnings.tsx` - Freelancer earnings page
