# TrustMeBro - Hackathon Implementation Plan

## Hackathon Focus

**Goal:** Complete working flow from job creation → payment release

**NOT focusing on:**
- Scalability
- Complex edge cases
- Full security hardening
- Advanced features

---

## Complete Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRUSTMEBRO COMPLETE FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   REGISTER  │───▶│ CREATE JOB  │───▶│  GENERATE   │───▶│   PUBLISH   │  │
│  │   & LOGIN   │    │   (Draft)   │    │    SPEC     │    │     JOB     │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                                   │         │
│                                                                   ▼         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  FUND       │◀───│  LOCK SPEC  │◀───│  NEGOTIATE  │◀───│ FREELANCER  │  │
│  │  ESCROW     │    │  (Both)     │    │  (AI Chat)  │    │    BIDS     │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│        │                                                                    │
│        ▼                                                                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   WORK      │───▶│   SUBMIT    │───▶│   VERIFY    │───▶│  RELEASE    │  │
│  │  BEGINS     │    │    WORK     │    │    (AI)     │    │  PAYMENT    │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                                   │         │
│                                                                   ▼         │
│                                              ┌─────────────────────────┐   │
│                                              │     JOB COMPLETE        │   │
│                                              │   (Rate & Review)       │   │
│                                              └─────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Epics & User Stories

---

## EPIC 1: Authentication & Users

**Goal:** Users can register, login, and have role-based access

### Stories

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| AUTH-1 | As a user, I can register as either an Employer or Freelancer | P0 | 2 |
| AUTH-2 | As a user, I can login with email/password | P0 | 1 |
| AUTH-3 | As a user, I can view my profile with PFI score | P1 | 1 |
| AUTH-4 | As a user, I can logout | P0 | 0.5 |
| AUTH-5 | As a user, I see different dashboards based on my role | P0 | 2 |

**Total Points:** 6.5

### Acceptance Criteria

**AUTH-1: Register**
- [ ] Email, password, name, role selection
- [ ] Password validation (8+ chars, letter + number)
- [ ] Returns JWT token
- [ ] Creates user with starting PFI (Employer: 100, Freelancer: 90)

**AUTH-2: Login**
- [ ] Email + password
- [ ] Returns JWT token
- [ ] Error on invalid credentials

**AUTH-5: Role-based Dashboard**
- [ ] Employer sees: My Jobs, Post Job, Pending Bids
- [ ] Freelancer sees: Browse Jobs, My Bids, Active Jobs

---

## EPIC 2: Job Creation & Spec Generation

**Goal:** Employer can create a job with AI-generated spec

### Stories

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| JOB-1 | As an employer, I can create a new job with basic details | P0 | 2 |
| JOB-2 | As an employer, I can chat with AI to generate spec | P0 | 5 |
| JOB-3 | As an employer, I can view and edit the generated spec | P1 | 2 |
| JOB-4 | As an employer, I can publish the job | P0 | 1 |
| JOB-5 | As an employer, I can see my draft and published jobs | P0 | 1 |

**Total Points:** 11

### Acceptance Criteria

**JOB-1: Create Job**
- [ ] Title, description, gig type, budget range, deadline
- [ ] Job created in DRAFT status
- [ ] Linked to employer

**JOB-2: AI Spec Generation (Bro Intake)**
- [ ] Chat interface with Bro
- [ ] Bro asks clarifying questions based on gig type
- [ ] Bro generates structured spec with:
  - Primary/Secondary/Tertiary requirements
  - Milestones with deadlines
  - Deliverables list
- [ ] Spec saved to job

**JOB-4: Publish Job**
- [ ] Job must have spec
- [ ] Status changes to PUBLISHED
- [ ] Job visible in marketplace

---

## EPIC 3: Job Marketplace & Bidding

**Goal:** Freelancers can browse jobs and place bids

### Stories

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| BID-1 | As a freelancer, I can browse published jobs with filters | P0 | 2 |
| BID-2 | As a freelancer, I can view job details and spec | P0 | 1 |
| BID-3 | As a freelancer, I can place a bid with cover letter | P0 | 2 |
| BID-4 | As an employer, I can view bids on my job | P0 | 1 |
| BID-5 | As an employer, I can accept a bid | P0 | 2 |
| BID-6 | As a freelancer, I can see my bids and their status | P1 | 1 |

**Total Points:** 9

### Acceptance Criteria

**BID-1: Browse Jobs**
- [ ] List of PUBLISHED jobs
- [ ] Filter by gig type
- [ ] Show title, budget, deadline, bid count

**BID-3: Place Bid**
- [ ] Cover letter (required)
- [ ] Proposed budget (optional)
- [ ] Proposed timeline (optional)
- [ ] Can't bid on own jobs
- [ ] Can't bid twice on same job

**BID-5: Accept Bid**
- [ ] Assigns freelancer to job
- [ ] Job status → ASSIGNED
- [ ] Other bids auto-rejected
- [ ] Creates chat channel

---

## EPIC 4: Negotiation & Spec Lock

**Goal:** Employer and freelancer negotiate in AI-mediated chat and lock spec

### Stories

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| NEG-1 | As a participant, I can chat in the job channel | P0 | 3 |
| NEG-2 | Bro monitors chat and facilitates discussion | P0 | 5 |
| NEG-3 | As a participant, I can propose spec changes (pre-lock) | P1 | 2 |
| NEG-4 | As either party, I can confirm spec lock | P0 | 2 |
| NEG-5 | Spec becomes immutable after both parties lock | P0 | 1 |

**Total Points:** 13

### Acceptance Criteria

**NEG-1: Chat Channel**
- [ ] Real-time messaging (polling is fine for hackathon)
- [ ] Shows sender, timestamp, message
- [ ] Bro messages styled differently

**NEG-2: Bro in Chat**
- [ ] Welcomes both parties, summarizes spec
- [ ] Responds to questions about process
- [ ] Detects scope changes and flags them
- [ ] Facilitates agreement

**NEG-4: Spec Lock**
- [ ] Both parties must click "Lock & Agree"
- [ ] Shows confirmation UI with spec summary
- [ ] After both confirm → spec locked

---

## EPIC 5: Escrow Funding

**Goal:** Employer funds escrow to start work

### Stories

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| ESC-1 | As an employer, I can fund escrow after spec lock | P0 | 3 |
| ESC-2 | As a participant, I can see escrow status | P0 | 1 |
| ESC-3 | Job status changes to ESCROW_FUNDED after payment | P0 | 1 |

**Total Points:** 5

### Acceptance Criteria

**ESC-1: Fund Escrow**
- [ ] Shows amount breakdown (budget + 10% fee)
- [ ] Mock payment (no real Stripe for hackathon)
- [ ] Creates escrow record with FUNDED status
- [ ] Job status → ESCROW_FUNDED

**ESC-2: Escrow Status**
- [ ] Both parties see current escrow status
- [ ] Amount funded
- [ ] Amount released vs remaining

---

## EPIC 6: Work Submission

**Goal:** Freelancer can submit work for milestones

### Stories

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| SUB-1 | As a freelancer, I can submit work for a milestone | P0 | 3 |
| SUB-2 | As a freelancer, I can upload files or paste text/links | P0 | 2 |
| SUB-3 | As an employer, I can see submissions | P0 | 1 |
| SUB-4 | Job status changes to IN_PROGRESS on first submission | P0 | 0.5 |

**Total Points:** 6.5

### Acceptance Criteria

**SUB-1: Submit Work**
- [ ] Select milestone
- [ ] Choose submission type (text, link, file)
- [ ] Add submission notes
- [ ] Creates submission record with PENDING status

**SUB-2: Submission Types**
- [ ] GitHub link: URL field
- [ ] Text paste: Large textarea
- [ ] File upload: File input (store in local/S3)

---

## EPIC 7: Verification

**Goal:** AI verifies submissions against spec requirements

### Stories

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| VER-1 | As an employer, I can trigger verification on a submission | P0 | 2 |
| VER-2 | AI verifies submission against spec requirements | P0 | 5 |
| VER-3 | Verification produces score and detailed report | P0 | 2 |
| VER-4 | As a freelancer, I can see verification results | P0 | 1 |
| VER-5 | As a freelancer, I can resubmit if verification fails | P1 | 2 |

**Total Points:** 12

### Acceptance Criteria

**VER-2: AI Verification**
- [ ] Checks each requirement in spec
- [ ] For text: word count, plagiarism (mock), tone analysis
- [ ] Returns pass/fail per requirement
- [ ] Calculates overall score

**VER-3: Verification Report**
- [ ] Overall score (0-100)
- [ ] Status: VERIFIED / PARTIAL / FAILED
- [ ] Per-requirement breakdown
- [ ] Feedback text

**VER-5: Resubmission**
- [ ] Track resubmission count (max 2)
- [ ] Can resubmit with new content
- [ ] Previous submission archived

---

## EPIC 8: Payment Release

**Goal:** Payment released to freelancer on verification pass

### Stories

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| PAY-1 | Payment auto-releases when score ≥ 90 + all primary pass | P0 | 2 |
| PAY-2 | As an employer, I can manually approve and release | P0 | 1 |
| PAY-3 | As a freelancer, I can see released payments | P0 | 1 |
| PAY-4 | All milestones complete → Job COMPLETED | P0 | 1 |

**Total Points:** 5

### Acceptance Criteria

**PAY-1: Auto-Release**
- [ ] If verification score ≥ 90 AND all primary requirements pass
- [ ] Update escrow: release milestone amount
- [ ] Notify both parties

**PAY-2: Manual Approve**
- [ ] Employer can accept even if score < 90
- [ ] Releases payment for that milestone

**PAY-4: Job Complete**
- [ ] When all milestones verified/released
- [ ] Job status → COMPLETED
- [ ] Chat shows completion message

---

## EPIC 9: Change Requests (Post-Lock)

**Goal:** Limited changes allowed after spec lock

### Stories

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| CR-1 | Bro detects scope changes in chat and flags them | P1 | 3 |
| CR-2 | As a client, I can submit formal change request | P1 | 2 |
| CR-3 | As a freelancer, I can accept/reject change requests | P1 | 2 |
| CR-4 | Approved changes update the spec | P1 | 1 |
| CR-5 | Change request counter tracked per party | P1 | 1 |

**Total Points:** 9

### Acceptance Criteria

**CR-1: Scope Creep Detection**
- [ ] Bro analyzes messages for scope additions
- [ ] Flags and asks client to confirm as CR or withdraw

**CR-2: Submit Change Request**
- [ ] Description of change
- [ ] Uses 1 of allocation (client: 3, freelancer: 2)
- [ ] Notifies other party

---

## EPIC 10: PFI Scoring

**Goal:** Track user reputation

### Stories

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| PFI-1 | PFI updates on job completion | P2 | 2 |
| PFI-2 | PFI displayed on user profiles | P1 | 1 |
| PFI-3 | PFI affects visibility in job listings | P2 | 1 |

**Total Points:** 4

### Acceptance Criteria

**PFI-1: Score Updates**
- [ ] +3 on successful job completion
- [ ] +2 for on-time delivery
- [ ] -5 for dispute loss (if implemented)

---

## Priority Summary

### P0 - Must Have (MVP for Demo)

| Epic | Points |
|------|--------|
| Auth & Users | 6.5 |
| Job Creation & Spec | 11 |
| Marketplace & Bidding | 9 |
| Negotiation & Lock | 13 |
| Escrow Funding | 5 |
| Work Submission | 6.5 |
| Verification | 12 |
| Payment Release | 5 |
| **Total P0** | **68 points** |

### P1 - Should Have

| Epic | Points |
|------|--------|
| Change Requests | 9 |
| Profile improvements | 2 |
| **Total P1** | **11 points** |

### P2 - Nice to Have

| Epic | Points |
|------|--------|
| PFI Scoring | 4 |
| Advanced features | TBD |
| **Total P2** | **4 points** |

---

## Technical Architecture (Hackathon)

### Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                    React + Tailwind CSS                         │
│                      (or Next.js)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
│                   FastAPI (Python)                              │
│                                                                 │
│  Routes:                                                        │
│  ├── /auth (register, login)                                   │
│  ├── /jobs (CRUD, publish)                                     │
│  ├── /jobs/{id}/spec (generate, update, lock)                  │
│  ├── /jobs/{id}/bids (place, list, accept)                     │
│  ├── /jobs/{id}/chat (messages, send)                          │
│  ├── /jobs/{id}/escrow (fund, status)                          │
│  ├── /jobs/{id}/submissions (submit, list, verify)             │
│  └── /users (profile)                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE                                  │
│                   SQLite (hackathon)                            │
│                  or PostgreSQL                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI SERVICES                                │
│                  OpenRouter (GPT-4o)                            │
│                                                                 │
│  Uses:                                                          │
│  ├── Spec generation (intake chat)                             │
│  ├── Bro mediator (chat responses)                             │
│  ├── Verification (check against spec)                         │
│  └── Scope creep detection                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema (Simplified)

```sql
-- Users
users (
  id, email, password_hash, name, role, pfi_score, created_at
)

-- Jobs
jobs (
  id, employer_id, freelancer_id, title, description,
  gig_type, budget_min, budget_max, deadline, status, created_at
)

-- Specs
job_specs (
  id, job_id, version, is_locked, milestones_json,
  requirements_json, created_at
)

-- Bids
bids (
  id, job_id, freelancer_id, cover_letter,
  proposed_budget, proposed_deadline, status, created_at
)

-- Chat
chat_channels (id, job_id, employer_id, freelancer_id, is_active)
chat_messages (
  id, channel_id, sender_id, sender_type, content,
  is_ai_generated, created_at
)

-- Escrow
escrows (
  id, job_id, amount, status, funded_at, released_at
)

-- Submissions
submissions (
  id, job_id, milestone_id, freelancer_id,
  submission_type, content, status,
  verification_score, verification_report_json, created_at
)

-- Change Requests
change_requests (
  id, job_id, requested_by_id, description,
  status, created_at
)
```

### API Endpoints Summary

```
AUTH
POST   /api/auth/register
POST   /api/auth/login
GET    /api/users/me

JOBS
POST   /api/jobs                     # Create draft
GET    /api/jobs                     # List published (marketplace)
GET    /api/jobs/my                  # My jobs
GET    /api/jobs/{id}                # Job details
POST   /api/jobs/{id}/publish        # Publish job

SPEC
POST   /api/jobs/{id}/spec           # Generate spec (AI)
PUT    /api/jobs/{id}/spec           # Update spec
POST   /api/jobs/{id}/spec/lock      # Lock spec (per user)
GET    /api/jobs/{id}/spec           # Get spec

BIDS
POST   /api/jobs/{id}/bids           # Place bid
GET    /api/jobs/{id}/bids           # List bids (employer)
POST   /api/jobs/{id}/bids/{bid_id}/accept  # Accept bid

CHAT
GET    /api/jobs/{id}/chat           # Get/create channel
GET    /api/jobs/{id}/chat/messages  # Get messages
POST   /api/jobs/{id}/chat/messages  # Send message
POST   /api/jobs/{id}/chat/bro       # Get Bro's response (AI)

ESCROW
POST   /api/jobs/{id}/escrow         # Fund escrow
GET    /api/jobs/{id}/escrow         # Get status
POST   /api/jobs/{id}/escrow/release # Release (manual)

SUBMISSIONS
POST   /api/jobs/{id}/submissions              # Submit work
GET    /api/jobs/{id}/submissions              # List submissions
GET    /api/jobs/{id}/submissions/{sub_id}     # Get submission
POST   /api/jobs/{id}/submissions/{sub_id}/verify  # Trigger verification
POST   /api/jobs/{id}/submissions/{sub_id}/resubmit  # Resubmit
```

---

## Implementation Order

### Day 1: Foundation

```
Morning:
□ AUTH-1: Register
□ AUTH-2: Login
□ AUTH-4: Logout
□ JOB-1: Create job (draft)

Afternoon:
□ JOB-2: AI spec generation (Bro intake) ⭐ Core feature
□ JOB-4: Publish job
□ BID-1: Browse jobs
```

### Day 2: Bidding & Assignment

```
Morning:
□ BID-2: View job details
□ BID-3: Place bid
□ BID-4: View bids (employer)
□ BID-5: Accept bid

Afternoon:
□ NEG-1: Chat channel
□ NEG-2: Bro in chat ⭐ Core feature
□ NEG-4: Spec lock (both parties)
```

### Day 3: Work & Verification

```
Morning:
□ ESC-1: Fund escrow (mock payment)
□ SUB-1: Submit work
□ SUB-2: Different submission types

Afternoon:
□ VER-2: AI verification ⭐ Core feature
□ VER-3: Verification report
□ PAY-1: Auto-release payment
□ PAY-4: Job completion
```

### Day 4: Polish & Demo Prep

```
Morning:
□ Fix bugs
□ UI polish
□ AUTH-5: Role-based dashboards

Afternoon:
□ Demo flow testing
□ Seed data for demo
□ Presentation prep
```

---

## Demo Script

### Happy Path Demo (5 minutes)

1. **Register two users** (30s)
   - Sarah (Employer)
   - Marcus (Freelancer)

2. **Sarah creates job** (1m)
   - Basic details
   - Chat with Bro to generate spec
   - Show AI-generated milestones
   - Publish job

3. **Marcus bids** (30s)
   - Browse marketplace
   - View job spec
   - Place bid

4. **Sarah accepts bid** (30s)
   - View bids
   - Accept Marcus

5. **Negotiation chat** (1m)
   - Show Bro facilitating
   - Quick agreement
   - Both lock spec

6. **Sarah funds escrow** (15s)
   - Mock payment
   - Show funded status

7. **Marcus submits work** (30s)
   - Submit for Milestone 1
   - Text/link submission

8. **Verification** (30s)
   - Trigger verification
   - Show AI checking requirements
   - Score appears

9. **Payment release** (15s)
   - Auto-release triggered
   - Show escrow update
   - Job complete (or show next milestone)

---

## AI Prompts Reference

### Spec Generation Prompt

```
You are Bro, a friendly AI assistant helping create a job specification.

The client wants: {job_description}
Gig type: {gig_type}

Your job:
1. Ask 3-5 clarifying questions to understand requirements
2. Generate a structured spec with:
   - Primary requirements (must have)
   - Secondary requirements (should have)
   - Tertiary requirements (nice to have)
   - Milestones with deliverables
   - Timeline suggestions

Be friendly, professional, use simple language.
```

### Bro Chat Prompt

```
You are Bro, a neutral AI mediator in a freelance job chat.

Job: {job_title}
Spec: {spec_json}
Parties: {client_name} (client), {freelancer_name} (freelancer)

Your role:
- Stay neutral
- Detect scope creep (new requirements not in spec)
- Facilitate agreement
- Answer process questions
- Be friendly but professional

Current conversation:
{chat_history}

User message: {new_message}

Respond as Bro. If you detect scope creep, flag it.
```

### Verification Prompt

```
You are a verification system checking if submitted work meets requirements.

Job Spec:
{spec_json}

Milestone being verified: {milestone_name}

Requirements to check:
{requirements_list}

Submitted work:
{submission_content}

For each requirement, determine:
- PASS or FAIL
- Explanation

Then calculate overall score (0-100):
- Primary requirements: 60% weight
- Secondary: 30% weight
- Tertiary: 10% weight

Return JSON:
{
  "score": number,
  "status": "VERIFIED" | "PARTIAL" | "FAILED",
  "requirements": [
    {"id": "P1", "status": "PASS", "reason": "..."},
    ...
  ],
  "feedback": "Overall feedback text"
}
```

---

## Quick Reference: Status Flows

### Job Status

```
DRAFT → PUBLISHED → ASSIGNED → ESCROW_FUNDED → IN_PROGRESS → COMPLETED
```

### Bid Status

```
PENDING → ACCEPTED (one) / REJECTED (others)
```

### Submission Status

```
PENDING → VERIFIED / PARTIAL / FAILED
           (if PARTIAL/FAILED) → can resubmit
```

### Escrow Status

```
FUNDED → HELD → RELEASED (per milestone)
```

---

## What to Skip for Hackathon

- [ ] Email verification
- [ ] Password reset
- [ ] Real payment integration
- [ ] File upload to cloud (use local or base64)
- [ ] Real plagiarism checking
- [ ] WebSocket (use polling)
- [ ] Complex PFI calculations
- [ ] Change request purchasing
- [ ] Disputes
- [ ] Account recovery
- [ ] Admin panel
- [ ] Notifications (email/push)
