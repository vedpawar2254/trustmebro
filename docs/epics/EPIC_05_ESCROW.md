# EPIC 5: Escrow Funding

## Overview

After spec lock, employer funds escrow to start work. Escrow holds payment until work is verified.

**Dependencies:** EPIC 4 (Negotiation - Spec Lock)
**Blocks:** EPIC 6 (Submissions)

---

## User Stories

### ESC-1: Fund Escrow

**As an** employer
**I want to** fund escrow after spec lock
**So that** the freelancer can start work with payment guaranteed

**Priority:** P0
**Points:** 3

#### Acceptance Criteria

- [ ] Escrow amount = job budget + 10% platform fee
- [ ] Can only fund after spec is locked
- [ ] Mock payment for hackathon (no real Stripe)
- [ ] Creates escrow record with FUNDED status
- [ ] Job status changes to ESCROW_FUNDED
- [ ] Freelancer notified

#### API Endpoint

```
POST /api/jobs/{job_id}/escrow

Request:
{
  "amount": 550.00,  // Job budget
  "payment_method": "mock"  // For hackathon
}

Response (201):
{
  "escrow": {
    "id": 1,
    "job_id": 1,
    "amount": 550.00,
    "platform_fee": 55.00,
    "total_funded": 605.00,
    "currency": "USD",
    "status": "FUNDED",
    "funded_at": "2026-03-16T16:00:00Z"
  },
  "job": {
    "id": 1,
    "status": "ESCROW_FUNDED"
  }
}

Response (400):
{
  "detail": "Spec must be locked before funding escrow"
}
```

#### Validation

```python
def fund_escrow(job_id: int, amount: float, user: User) -> dict:
    job = get_job(job_id)
    spec = get_job_spec(job_id)

    # Validations
    if job.employer_id != user.id:
        raise HTTPException(403, "Not your job")

    if not spec.is_locked:
        raise HTTPException(400, "Spec must be locked before funding escrow")

    if get_escrow(job_id):
        raise HTTPException(400, "Escrow already funded")

    if amount < job.budget_min:
        raise HTTPException(400, f"Amount must be at least ${job.budget_min}")

    # Calculate fee
    platform_fee = amount * 0.10
    total = amount + platform_fee

    # Create escrow (mock payment)
    escrow = create_escrow(
        job_id=job_id,
        amount=amount,
        platform_fee=platform_fee,
        status="FUNDED",
        funded_at=datetime.utcnow()
    )

    # Update job status
    job.status = "ESCROW_FUNDED"
    save_job(job)

    # Notify freelancer
    notify_freelancer_escrow_funded(job)

    return {"escrow": escrow, "job": job}
```

#### UI Components

```
FundEscrowPage:
├── Header ("Fund Escrow to Start Project")
├── JobSummaryCard
│   ├── Title
│   ├── Freelancer
│   └── Deadline
├── EscrowBreakdown
│   ├── JobBudget ("$550.00")
│   ├── PlatformFee ("$55.00 (10%)")
│   ├── Divider
│   └── TotalToFund ("$605.00")
├── MilestoneAllocation
│   ├── Milestone1 ("$100 - 18.2%")
│   ├── Milestone2 ("$100 - 18.2%")
│   └── ...
├── PaymentMethod (mock for hackathon)
│   └── MockPaymentButton
├── Guarantees
│   ├── "✓ Funds held until work verified"
│   ├── "✓ Released per milestone"
│   └── "✓ Refunded if disputed"
└── FundButton ("Fund Escrow - $605.00")
```

---

### ESC-2: View Escrow Status

**As a** job participant
**I want to** see the current escrow status
**So that** I know the payment situation

**Priority:** P0
**Points:** 1

#### Acceptance Criteria

- [ ] Both employer and freelancer can view
- [ ] Shows: total funded, amount released, amount remaining
- [ ] Shows milestone-by-milestone breakdown
- [ ] Shows escrow status (FUNDED, RELEASED, etc.)

#### API Endpoint

```
GET /api/jobs/{job_id}/escrow

Response:
{
  "escrow": {
    "id": 1,
    "job_id": 1,
    "amount": 550.00,
    "platform_fee": 55.00,
    "total_funded": 605.00,
    "currency": "USD",
    "status": "FUNDED",
    "funded_at": "2026-03-16T16:00:00Z",
    "released_at": null
  },
  "breakdown": {
    "total_funded": 550.00,
    "released": 200.00,
    "pending": 350.00,
    "milestones": [
      {"id": 1, "name": "Blog Post 1", "amount": 100.00, "status": "released"},
      {"id": 2, "name": "Blog Post 2", "amount": 100.00, "status": "released"},
      {"id": 3, "name": "Blog Post 3", "amount": 100.00, "status": "pending"},
      {"id": 4, "name": "Blog Post 4", "amount": 100.00, "status": "pending"},
      {"id": 5, "name": "Blog Post 5", "amount": 150.00, "status": "pending"}
    ]
  }
}
```

#### UI Components

```
EscrowStatusCard:
├── Header ("Escrow Status")
├── StatusBadge ("FUNDED")
├── AmountSummary
│   ├── TotalFunded ("$550")
│   ├── Released ("$200")
│   └── Remaining ("$350")
├── ProgressBar (40% released)
├── MilestoneBreakdown
│   ├── Milestone (✓ Released - $100)
│   ├── Milestone (✓ Released - $100)
│   ├── Milestone (⏳ Pending - $100)
│   └── ...
└── LastUpdated
```

---

### ESC-3: Job Status Update

**As the** system
**I want to** update job status when escrow is funded
**So that** the workflow progresses correctly

**Priority:** P0
**Points:** 1

#### Acceptance Criteria

- [ ] Job status → ESCROW_FUNDED after funding
- [ ] Freelancer can now submit work
- [ ] Chat notified of escrow funding

#### Business Logic

Already covered in ESC-1. After escrow funded:

```python
# Update job status
job.status = "ESCROW_FUNDED"
save_job(job)

# Send Bro message
send_bro_message(
    channel_id=get_channel_id(job_id),
    content=f"""💰 Escrow funded!

Sarah has funded ${escrow.amount} to escrow. The project is ready to begin!

Marcus, you can now start working on Milestone 1: {first_milestone.name}
Deadline: {first_milestone.deadline}

Good luck! 🚀"""
)
```

---

## Database Schema

```sql
-- Escrow table
CREATE TABLE escrows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER UNIQUE NOT NULL REFERENCES jobs(id),
    amount FLOAT NOT NULL,
    platform_fee FLOAT NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'FUNDED',  -- FUNDED, PARTIALLY_RELEASED, RELEASED, REFUNDED
    funded_at TIMESTAMP,
    released_at TIMESTAMP,
    refunded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Escrow releases (per milestone)
CREATE TABLE escrow_releases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    escrow_id INTEGER NOT NULL REFERENCES escrows(id),
    milestone_id INTEGER NOT NULL,
    amount FLOAT NOT NULL,
    released_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX idx_escrows_job ON escrows(job_id);
```

---

## Milestone Payment Allocation

Calculate payout per milestone (equal split, backloaded final):

```python
def calculate_milestone_payouts(total_budget: float, milestones: list) -> list:
    """
    Distribute budget across milestones.
    Equal split with 1.5x on final milestone.
    """
    count = len(milestones)
    if count == 0:
        return []

    if count == 1:
        return [{"milestone_id": milestones[0]["id"], "amount": total_budget}]

    # Calculate base amount (final gets 1.5x)
    # total = (count - 1) * base + 1.5 * base
    # total = base * (count - 1 + 1.5)
    # total = base * (count + 0.5)
    base = total_budget / (count + 0.5)
    final_amount = base * 1.5

    payouts = []
    for i, milestone in enumerate(milestones):
        is_final = i == count - 1
        amount = round(final_amount if is_final else base, 2)
        payouts.append({
            "milestone_id": milestone["id"],
            "amount": amount
        })

    # Adjust for rounding
    total_allocated = sum(p["amount"] for p in payouts)
    if total_allocated != total_budget:
        diff = total_budget - total_allocated
        payouts[-1]["amount"] += diff

    return payouts
```

---

## Mock Payment Flow

For hackathon, simulate payment:

```python
def mock_payment(amount: float) -> dict:
    """
    Simulate payment processing.
    In production, this would call Stripe.
    """
    # Simulate success
    return {
        "success": True,
        "transaction_id": f"mock_{uuid.uuid4().hex[:8]}",
        "amount": amount,
        "timestamp": datetime.utcnow().isoformat()
    }
```

---

## Testing Checklist

- [ ] Cannot fund escrow before spec lock → error
- [ ] Cannot fund escrow if already funded → error
- [ ] Fund escrow → escrow created with FUNDED status
- [ ] Fund escrow → job status = ESCROW_FUNDED
- [ ] Fund escrow → Bro announces in chat
- [ ] View escrow status → shows correct amounts
- [ ] Milestone breakdown shows correct allocation

---

## Files to Create/Modify

### Backend
- [ ] `backend/src/routes/escrow.py` - Escrow routes
- [ ] `backend/src/models.py` - Add Escrow model
- [ ] `backend/src/services/payment.py` - Mock payment service

### Frontend
- [ ] `frontend/src/pages/jobs/[id]/escrow.tsx` - Fund escrow page
- [ ] `frontend/src/components/escrow/EscrowStatus.tsx`
- [ ] `frontend/src/components/escrow/MilestoneBreakdown.tsx`
