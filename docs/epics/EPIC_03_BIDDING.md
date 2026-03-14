# EPIC 3: Job Marketplace & Bidding

## Overview

Freelancers can browse published jobs, view details, and place bids. Employers can view and accept bids.

**Dependencies:** EPIC 1 (Auth), EPIC 2 (Job Creation)
**Blocks:** EPIC 4 (Negotiation)

---

## User Stories

### BID-1: Browse Jobs Marketplace

**As a** freelancer
**I want to** browse all published jobs
**So that** I can find work opportunities

**Priority:** P0
**Points:** 2

#### Acceptance Criteria

- [ ] List shows only PUBLISHED jobs
- [ ] Shows: title, gig type, budget range, deadline, bid count, employer PFI
- [ ] Can filter by gig type
- [ ] Can search by keyword
- [ ] Sorted by newest first (default)
- [ ] Pagination support

#### API Endpoint

```
GET /api/jobs

Query params:
- gig_type: "COPYWRITING" | "SOFTWARE" | etc (optional)
- keyword: string (optional, searches title and description)
- skip: int (default 0)
- limit: int (default 20)

Response:
{
  "jobs": [
    {
      "id": 1,
      "title": "5 Blog Posts on AI Healthcare",
      "description": "Create 5 in-depth blog posts...",  // truncated
      "gig_type": "COPYWRITING",
      "budget_min": 100.0,
      "budget_max": 500.0,
      "deadline": "2026-03-31T23:59:59Z",
      "bid_count": 5,
      "employer": {
        "id": 1,
        "name": "Sarah Chen",
        "pfi_score": 94
      },
      "published_at": "2026-03-15T12:00:00Z",
      "has_spec": true
    }
  ],
  "total": 25,
  "skip": 0,
  "limit": 20
}
```

#### UI Components

```
JobMarketplacePage:
├── Header ("Find Work")
├── SearchBar
│   └── KeywordInput + SearchButton
├── Filters
│   ├── GigTypeSelect (All, Software, Copywriting, etc.)
│   └── ClearFiltersButton
├── ResultsCount ("Showing 25 jobs")
├── JobCardGrid
│   └── JobCard[]
│       ├── Title (link to details)
│       ├── GigTypeBadge
│       ├── BudgetRange ("$100 - $500")
│       ├── Deadline ("Due: Mar 31, 2026")
│       ├── EmployerInfo (name, PFI badge)
│       ├── BidCount ("5 bids")
│       └── ViewDetailsButton
└── Pagination
```

---

### BID-2: View Job Details

**As a** freelancer
**I want to** view full job details and spec
**So that** I can decide whether to bid

**Priority:** P0
**Points:** 1

#### Acceptance Criteria

- [ ] Shows complete job information
- [ ] Shows full spec with requirements and milestones
- [ ] Shows employer profile with PFI score
- [ ] Shows "Place Bid" button (if not already bid)
- [ ] Shows "Bid Placed" indicator (if already bid)

#### API Endpoint

```
GET /api/jobs/{job_id}

Response:
{
  "id": 1,
  "title": "5 Blog Posts on AI Healthcare",
  "description": "Full description...",
  "gig_type": "COPYWRITING",
  "budget_min": 100.0,
  "budget_max": 500.0,
  "deadline": "2026-03-31T23:59:59Z",
  "status": "PUBLISHED",
  "employer": {
    "id": 1,
    "name": "Sarah Chen",
    "pfi_score": 94,
    "jobs_completed": 12
  },
  "spec": {
    "requirements": {
      "primary": [...],
      "secondary": [...],
      "tertiary": [...]
    },
    "milestones": [...],
    "deliverables": [...]
  },
  "bid_count": 5,
  "my_bid": null,  // or bid object if freelancer has bid
  "published_at": "2026-03-15T12:00:00Z"
}
```

#### UI Components

```
JobDetailsPage:
├── BackButton ("← Back to Jobs")
├── Header
│   ├── Title
│   ├── StatusBadge
│   ├── GigTypeBadge
│   └── PostedDate
├── MainContent (2-column)
│   ├── LeftColumn
│   │   ├── DescriptionSection
│   │   ├── SpecSection
│   │   │   ├── RequirementsList
│   │   │   │   ├── PrimarySection
│   │   │   │   ├── SecondarySection
│   │   │   │   └── TertiarySection
│   │   │   └── MilestonesList
│   │   └── DeliverablesSection
│   └── RightColumn (Sidebar)
│       ├── BudgetCard ("$100 - $500")
│       ├── DeadlineCard ("Mar 31, 2026 • 16 days left")
│       ├── EmployerCard
│       │   ├── Name
│       │   ├── PFIScore
│       │   └── JobsCompleted
│       ├── BidCountCard ("5 freelancers have bid")
│       └── Actions
│           └── PlaceBidButton / BidPlacedIndicator
└── SimilarJobsSection (optional)
```

---

### BID-3: Place Bid

**As a** freelancer
**I want to** place a bid on a job
**So that** I can be considered for the work

**Priority:** P0
**Points:** 2

#### Acceptance Criteria

- [ ] Can write cover letter (50-5000 chars)
- [ ] Can optionally propose different budget
- [ ] Can optionally propose different timeline
- [ ] Cannot bid on own jobs
- [ ] Cannot bid twice on same job
- [ ] Bid created with PENDING status

#### API Endpoint

```
POST /api/jobs/{job_id}/bids

Request:
{
  "cover_letter": "string",      // 50-5000 chars
  "proposed_budget": 450.0,      // optional
  "proposed_deadline": "2026-03-28T23:59:59Z"  // optional
}

Response (201):
{
  "id": 1,
  "job_id": 1,
  "freelancer_id": 2,
  "cover_letter": "...",
  "proposed_budget": 450.0,
  "proposed_deadline": "2026-03-28",
  "status": "PENDING",
  "created_at": "2026-03-16T10:00:00Z"
}

Response (400):
{
  "detail": "You have already bid on this job"
}

Response (403):
{
  "detail": "Cannot bid on your own job"
}
```

#### Validation

```python
class CreateBidRequest(BaseModel):
    cover_letter: str = Field(..., min_length=50, max_length=5000)
    proposed_budget: Optional[float] = None
    proposed_deadline: Optional[datetime] = None

    @validator('proposed_budget')
    def budget_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Budget must be positive')
        return v
```

#### UI Components

```
PlaceBidPage (or Modal):
├── Header ("Place Your Bid")
├── JobSummaryCard (title, budget, deadline)
├── Form
│   ├── CoverLetterTextarea
│   │   ├── Placeholder ("Explain your relevant experience...")
│   │   └── CharacterCount
│   ├── ProposedBudgetInput (optional)
│   │   └── HelpText ("Leave blank to accept client's range")
│   └── ProposedDeadlineInput (optional)
│       └── HelpText ("Leave blank to accept client's deadline")
├── Tips Panel
│   └── "Tips for a great bid..."
├── SubmitButton ("Submit Bid")
└── CancelButton
```

---

### BID-4: View Bids (Employer)

**As an** employer
**I want to** view all bids on my job
**So that** I can choose a freelancer

**Priority:** P0
**Points:** 1

#### Acceptance Criteria

- [ ] Only employer can see bids
- [ ] Shows all bids with: freelancer info, PFI, cover letter, proposed terms
- [ ] Can expand/collapse cover letters
- [ ] Can sort by date, PFI score
- [ ] Shows accept/reject buttons for pending bids

#### API Endpoint

```
GET /api/jobs/{job_id}/bids

Response:
{
  "bids": [
    {
      "id": 1,
      "freelancer": {
        "id": 2,
        "name": "Marcus Johnson",
        "pfi_score": 88,
        "jobs_completed": 23
      },
      "cover_letter": "I have 5 years of experience...",
      "proposed_budget": 450.0,
      "proposed_deadline": "2026-03-28",
      "status": "PENDING",
      "created_at": "2026-03-16T10:00:00Z"
    }
  ],
  "total": 5
}
```

#### UI Components

```
ViewBidsPage:
├── Header ("Bids for: {job_title}")
├── StatsBar ("5 bids • 3 pending")
├── SortSelect (Newest, Highest PFI, Lowest Budget)
├── BidsList
│   └── BidCard[]
│       ├── FreelancerInfo
│       │   ├── Avatar
│       │   ├── Name (link to profile)
│       │   ├── PFIBadge
│       │   └── JobsCompleted
│       ├── ProposedTerms
│       │   ├── Budget (if different from job)
│       │   └── Deadline (if different from job)
│       ├── CoverLetter (expandable)
│       ├── BidDate
│       └── Actions (if PENDING)
│           ├── AcceptButton
│           └── RejectButton
└── EmptyState ("No bids yet")
```

---

### BID-5: Accept Bid

**As an** employer
**I want to** accept a bid
**So that** I can assign the freelancer to my job

**Priority:** P0
**Points:** 2

#### Acceptance Criteria

- [ ] Only employer can accept bids
- [ ] Job must be in PUBLISHED status
- [ ] Accepting a bid:
  - Assigns freelancer to job
  - Changes job status to ASSIGNED
  - Changes accepted bid status to ACCEPTED
  - Auto-rejects all other pending bids
  - Creates chat channel between parties

#### API Endpoint

```
POST /api/jobs/{job_id}/bids/{bid_id}/accept

Response (200):
{
  "success": true,
  "job": {
    "id": 1,
    "status": "ASSIGNED",
    "assigned_freelancer_id": 2,
    "assigned_at": "2026-03-16T14:00:00Z"
  },
  "bid": {
    "id": 1,
    "status": "ACCEPTED"
  },
  "chat_channel_id": 1
}

Response (400):
{
  "detail": "Job is not in PUBLISHED status"
}
```

#### Business Logic

```python
def accept_bid(job_id: int, bid_id: int, user: User) -> dict:
    job = get_job(job_id)
    bid = get_bid(bid_id)

    # Validations
    if job.employer_id != user.id:
        raise HTTPException(403, "Not your job")

    if job.status != "PUBLISHED":
        raise HTTPException(400, "Job is not in PUBLISHED status")

    if bid.job_id != job_id:
        raise HTTPException(400, "Bid does not belong to this job")

    if bid.status != "PENDING":
        raise HTTPException(400, "Bid is not pending")

    # Accept this bid
    bid.status = "ACCEPTED"
    save_bid(bid)

    # Assign freelancer to job
    job.assigned_freelancer_id = bid.freelancer_id
    job.status = "ASSIGNED"
    job.assigned_at = datetime.utcnow()
    save_job(job)

    # Reject all other pending bids
    reject_other_bids(job_id, bid_id)

    # Create chat channel
    channel = create_chat_channel(
        job_id=job_id,
        employer_id=job.employer_id,
        freelancer_id=bid.freelancer_id
    )

    return {
        "success": True,
        "job": job,
        "bid": bid,
        "chat_channel_id": channel.id
    }
```

---

### BID-6: My Bids (Freelancer)

**As a** freelancer
**I want to** see all my bids
**So that** I can track their status

**Priority:** P1
**Points:** 1

#### Acceptance Criteria

- [ ] Shows all bids placed by freelancer
- [ ] Shows: job title, employer, proposed budget, status, date
- [ ] Can filter by status (Pending, Accepted, Rejected)
- [ ] Can click to view job details

#### API Endpoint

```
GET /api/bids/my

Query params:
- status: "PENDING" | "ACCEPTED" | "REJECTED" (optional)

Response:
{
  "bids": [
    {
      "id": 1,
      "job": {
        "id": 1,
        "title": "5 Blog Posts",
        "gig_type": "COPYWRITING",
        "deadline": "2026-03-31"
      },
      "employer": {
        "id": 1,
        "name": "Sarah Chen"
      },
      "proposed_budget": 450.0,
      "status": "PENDING",
      "created_at": "2026-03-16T10:00:00Z"
    }
  ],
  "total": 5,
  "counts": {
    "pending": 3,
    "accepted": 1,
    "rejected": 1
  }
}
```

---

## Database Schema

```sql
-- Bids table
CREATE TABLE bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    freelancer_id INTEGER NOT NULL REFERENCES users(id),
    cover_letter TEXT NOT NULL,
    proposed_budget FLOAT,
    proposed_deadline TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(job_id, freelancer_id)  -- One bid per freelancer per job
);

-- Chat channels (created on bid acceptance)
CREATE TABLE chat_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER UNIQUE NOT NULL REFERENCES jobs(id),
    employer_id INTEGER NOT NULL REFERENCES users(id),
    freelancer_id INTEGER NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_bids_job ON bids(job_id);
CREATE INDEX idx_bids_freelancer ON bids(freelancer_id);
CREATE INDEX idx_bids_status ON bids(status);
```

---

## Testing Checklist

- [ ] Browse jobs → only PUBLISHED jobs shown
- [ ] Filter by gig type → correct filtering
- [ ] Search by keyword → correct results
- [ ] View job details → full spec visible
- [ ] Place bid with valid cover letter → success
- [ ] Place bid with short cover letter → error
- [ ] Place duplicate bid → error
- [ ] Bid on own job → error
- [ ] Employer view bids → sees all bids
- [ ] Freelancer view bids → forbidden
- [ ] Accept bid → job ASSIGNED, bid ACCEPTED, others REJECTED
- [ ] Accept bid creates chat channel
- [ ] My bids → shows freelancer's bids

---

## Files to Create/Modify

### Backend
- [ ] `backend/src/routes/jobs.py` - Add marketplace endpoint
- [ ] `backend/src/routes/bids.py` - Bid CRUD routes
- [ ] `backend/src/models.py` - Add Bid, ChatChannel models
- [ ] `backend/src/schemas.py` - Add bid schemas

### Frontend
- [ ] `frontend/src/pages/jobs/index.tsx` - Marketplace
- [ ] `frontend/src/pages/jobs/[id]/index.tsx` - Job details
- [ ] `frontend/src/pages/jobs/[id]/bid.tsx` - Place bid
- [ ] `frontend/src/pages/jobs/[id]/bids.tsx` - View bids (employer)
- [ ] `frontend/src/pages/bids/my.tsx` - My bids (freelancer)
- [ ] `frontend/src/components/jobs/JobCard.tsx`
- [ ] `frontend/src/components/bids/BidCard.tsx`
