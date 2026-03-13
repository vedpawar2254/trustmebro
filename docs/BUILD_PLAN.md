# trustmebro — Build Plan

## Overview
This document breaks down every feature from the PRD into actionable implementation tasks with clear dependencies, acceptance criteria, and time estimates.

---

## PHASE 1: FOUNDATION (Days 1-2)

### 1.1 Schema Agreement (Day 1, Hours 1-2)
**Priority:** BLOCKER - Must be done before any implementation

**Tasks:**
- [ ] Agree on VerificationReport JSON schema (see PRD for template)
- [ ] Agree on ChatMessage JSON schema (see PRD for template)
- [ ] Agree on API contract for all endpoints
- [ ] Create shared TypeScript types file
- [ ] Document in `CONTRACTS.md`

**Acceptance Criteria:**
- TypeScript types file created and committed
- All team members have read-only access to schema docs
- Frontend can mock responses using these schemas

**Time:** 2 hours

---

### 1.2 Project Setup (Day 1, Hours 2-4)

**Frontend (Next.js):**
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Tailwind CSS
- [ ] Configure shadcn/ui or similar component library
- [ ] Set up routing structure
- [ ] Create base layout (header, footer, nav)
- [ ] Set up state management (Zustand or Context)
- [ ] Configure API client (axios or fetch wrapper)

**Backend (Node/Express or Python/FastAPI):**
- [ ] Initialize project with chosen framework
- [ ] Set up database (PostgreSQL with Prisma or Python equivalent)
- [ ] Configure authentication (JWT tokens)
- [ ] Set up CORS and security headers
- [ ] Create API middleware (auth, logging, error handling)
- [ ] Set up file upload handling (multer or equivalent)

**AI Engine (Python):**
- [ ] Set up Python project structure
- [ ] Configure LLM API (OpenAI/Anthropic)
- [ ] Set up GitHub API integration
- [ ] Set up plagiarism API integration
- [ ] Create modular verification lane structure

**Acceptance Criteria:**
- Frontend: Can navigate to /login and /register pages
- Backend: Health endpoint responds with 200
- AI Engine: Can call test LLM endpoint successfully

**Time:** 2 hours per person (6 total hours)

---

## PHASE 2: AUTHENTICATION (Day 2)

### 2.1 User Registration & Login

**Frontend:**
- [ ] Create employer registration form
- [ ] Create freelancer registration form
- [ ] Create login form (role-aware)
- [ ] Implement form validation
- [ ] Connect to auth API
- [ ] Store JWT in secure cookies
- [ ] Create role-based routing middleware

**Backend:**
- [ ] Create User model with roles (employer/freelancer)
- [ ] Implement registration endpoint
- [ ] Implement login endpoint
- [ ] Implement JWT generation
- [ ] Create password hashing (bcrypt)
- [ ] Add email verification (basic)

**Acceptance Criteria:**
- Employer can register and log in
- Freelancer can register and log in
- Login redirects to correct dashboard based on role
- Invalid credentials show clear error message

**Time:** 4 hours

---

### 2.2 Role-Based Views

**Frontend:**
- [ ] Create employer dashboard shell
- [ ] Create freelancer dashboard shell
- [ ] Implement role-based sidebar navigation
- [ ] Add user profile header (PFI score for freelancers)

**Backend:**
- [ ] Add role middleware to protected routes
- [ ] Create /api/user/me endpoint

**Acceptance Criteria:**
- Employers see employer-specific navigation
- Freelancers see freelancer-specific navigation
- Freelancers see their PFI score on dashboard
- Users cannot access opposite role's pages

**Time:** 2 hours

---

## PHASE 3: GIG TYPE SYSTEM (Day 3)

### 3.1 Gig Type Classification

**Frontend:**
- [ ] Create gig type icons/components
- [ ] Display gig type on job cards
- [ ] Add gig type filter on job browse page

**Backend:**
- [ ] Create GigType enum (SOFTWARE, COPYWRITING, DATA_ENTRY, TRANSLATION)
- [ ] Create GigSubtype enum for each type
- [ ] Create database tables for gig types and subtypes

**AI Engine:**
- [ ] Create gig type classifier function
- [ ] Train/prompt LLM for gig type detection
- [ ] Create subtype classifier function

**Acceptance Criteria:**
- System can correctly classify "build a react app" as SOFTWARE → WEB_DEVELOPMENT
- System can correctly classify "write a blog post" as COPYWRITING → BLOG_POSTS
- Gig types display correctly on UI

**Time:** 3 hours

---

### 3.2 Verification Criteria Templates

**AI Engine:**
- [ ] Create template for SOFTWARE verification criteria
- [ ] Create template for COPYWRITING verification criteria
- [ ] Create template for DATA_ENTRY verification criteria
- [ ] Create template for TRANSLATION verification criteria
- [ ] Create subtype-specific criteria for all 24 subtypes

**Frontend:**
- [ ] Display criteria based on gig type
- [ ] Show criteria in spec preview
- [ ] Allow editing of criteria text

**Acceptance Criteria:**
- Software gig shows repo structure, dependencies, README criteria
- Copywriting gig shows word count, keywords, plagiarism criteria
- Data entry gig shows schema, row count, data type criteria
- Translation gig shows word count match, content presence criteria

**Time:** 4 hours

---

## PHASE 4: JOB POSTING (Days 3-4)

### 4.1 Job Description Input

**Frontend:**
- [ ] Create job posting form
- [ ] Add free-text textarea for job description
- [ ] Add submit button with loading state
- [ ] Add job title input
- [ ] Add budget range input
- [ ] Add deadline input

**Backend:**
- [ ] Create Job model
- [ ] Create draft job endpoint (POST /api/jobs/draft)
- [ ] Store raw job description

**Acceptance Criteria:**
- Employer can paste job description
- Form validates required fields
- Job is saved as draft

**Time:** 2 hours

---

### 4.2 AI Spec Generation (Basic)

**AI Engine:**
- [ ] Create job description parser
- [ ] Extract gig type and subtype
- [ ] Generate milestone breakdown (2-5 milestones based on complexity)
- [ ] Generate verifiable criteria per milestone (template-based)
- [ ] Flag vague requirements (basic keyword matching)
- [ ] Generate required assets checklist (template-based)
- [ ] Create API endpoint: POST /api/ai/generate-spec

**Frontend:**
- [ ] Show loading animation during spec generation
- [ ] Display generated spec in editable form
- [ ] Show gig type badge
- [ ] Show milestone timeline
- [ ] Show criteria per milestone
- [ ] Flagged requirements highlighted in red

**Backend:**
- [ ] Proxy spec generation request to AI engine
- [ ] Save generated spec to job
- [ ] Create endpoint: GET /api/jobs/:id/spec

**Acceptance Criteria:**
- Pasted description generates structured spec within 10 seconds
- Spec shows correct gig type
- Spec has 2-5 milestones with deadlines
- Each milestone has 3-5 criteria
- Vague items are flagged

**Time:** 6 hours

---

### 4.3 Spec Review & Publish

**Frontend:**
- [ ] Make milestone fields editable
- [ ] Add/remove milestone buttons
- [ ] Make criteria text editable
- [ ] Add/remove criteria buttons
- [ ] Resolve flagged items (define OR move to PFI-only)
- [ ] Show "Resolve All" progress indicator
- [ ] Add publish button (disabled if flags unresolved)
- [ ] Add preview modal

**Backend:**
- [ ] Update job spec endpoint (PUT /api/jobs/:id/spec)
- [ ] Publish job endpoint (POST /api/jobs/:id/publish)
- [ ] Update job status to PUBLISHED

**Acceptance Criteria:**
- Employer can edit all spec fields
- Cannot publish if flagged items unresolved
- Published job appears in job feed
- Spec becomes read-only after publish

**Time:** 3 hours

---

## PHASE 5: FREELANCER JOB BROWSING (Day 4)

### 5.1 Job Feed

**Frontend:**
- [ ] Create job card component
- [ ] Show: job title, gig type, budget, deadline, employer PFI
- [ ] Add gig type filter dropdown
- [ ] Add budget range filter
- [ ] Add deadline filter
- [ ] Add search by keyword
- [ ] Implement pagination
- [ ] Add "View Spec" button

**Backend:**
- [ ] Get published jobs endpoint (GET /api/jobs)
- [ ] Add filter query parameters
- [ ] Add pagination
- [ ] Join with employer PFI data

**Acceptance Criteria:**
- Freelancers see list of published jobs
- Filters work correctly
- Pagination works
- Clicking "View Spec" shows full spec

**Time:** 3 hours

---

### 5.2 Spec Viewer

**Frontend:**
- [ ] Create spec detail page
- [ ] Show gig type and subtype badges
- [ ] Show milestone timeline
- [ ] Expandable milestone accordion
- [ ] Show criteria per milestone
- [ ] Show PFI-only items separately
- [ ] Show required assets checklist
- [ ] Add "Place Bid" button

**Acceptance Criteria:**
- Spec displays cleanly
- Freelancer can read all details before bidding
- Structured spec (not raw description)

**Time:** 2 hours

---

### 5.3 Bidding System

**Frontend:**
- [ ] Create bid form (cover letter, proposed timeline)
- [ ] Submit bid button
- [ ] Show "Bid Placed" confirmation

**Backend:**
- [ ] Create Bid model
- [ ] Place bid endpoint (POST /api/jobs/:id/bids)
- [ ] Get job bids endpoint (GET /api/jobs/:id/bids)

**Acceptance Criteria:**
- Freelancer can place bid
- Employer can see bid on job page
- Bid shows freelancer PFI

**Time:** 2 hours

---

## PHASE 6: FREELANCER SELECTION (Day 5)

### 6.1 Bid Review

**Frontend (Employer):**
- [ ] Show bids on job detail page
- [ ] Display freelancer PFI score
- [ ] Display cover letter
- [ ] Display proposed timeline
- [ ] Add "Accept Bid" button per bid

**Backend:**
- [ ] Update bid status endpoint
- [ ] Assign freelancer to job endpoint (POST /api/jobs/:id/assign)

**Acceptance Criteria:**
- Employer sees all bids
- Can select one freelancer
- Job status changes to ASSIGNED

**Time:** 2 hours

---

## PHASE 7: SPEC LOCK & ESCROW (Day 5)

### 7.1 Spec Lock Screen

**Frontend (Freelancer):**
- [ ] Create spec lock acknowledgment screen
- [ ] Display full spec (read-only)
- [ ] AI asks three questions:
  - Do you have all required access and assets?
  - Is the timeline realistic?
  - Any concerns before starting?
- [ ] Add "Flag Concern" button
- [ ] Add "Accept & Start" button
- [ ] Add "Counter-Offer" button (per milestone item)

**AI Engine:**
- [ ] Generate spec lock questions (basic template)
- [ ] Validate concern flagging

**Acceptance Criteria:**
- Freelancer sees AI questions
- Can accept, flag concern, or counter-offer
- Concern goes back to employer

**Time:** 3 hours

---

### 7.2 Escrow Funding

**Frontend (Employer):**
- [ ] Show escrow funding prompt
- [ ] Display total amount
- [ ] Add "Fund Escrow" button
- [ ] Add mock payment flow

**Backend:**
- [ ] Create Escrow model
- [ ] Fund escrow endpoint (POST /api/jobs/:id/escrow)
- [ ] Update job status to ESCROW_FUNDED

**Acceptance Criteria:**
- Employer can fund escrow
- Job status changes
- Escrow balance visible to both parties

**Time:** 2 hours

---

### 7.3 Spec Lock & Chat Open

**Frontend:**
- [ ] Show "Spec Locked" confirmation
- [ ] Open chat channel automatically
- [ ] Redirect to project page
- [ ] Make spec read-only
- [ ] Show "Work Started" timestamp

**Backend:**
- [ ] Lock spec (prevent edits)
- [ ] Create chat channel (POST /api/jobs/:id/chat)
- [ ] Update job status to IN_PROGRESS

**Acceptance Criteria:**
- Spec is locked and read-only
- Chat opens automatically
- Both parties can see project page

**Time:** 2 hours

---

## PHASE 8: WORK SUBMISSION (Day 5-6)

### 8.1 Submission Forms (Gig Type Specific)

**Frontend (Freelancer):**
- [ ] Software: GitHub link input field
- [ ] Copywriting: File upload + text paste textarea
- [ ] Data Entry: File upload (CSV/XLSX)
- [ ] Translation: File upload (source/target)
- [ ] Add milestone selector
- [ ] Add "Submit Work" button
- [ ] Show submission confirmation

**Backend:**
- [ ] Create Submission model
- [ ] Create submission endpoint (POST /api/jobs/:id/submissions)
- [ ] Handle file uploads
- [ ] Store GitHub links

**Acceptance Criteria:**
- Correct submission form based on gig type
- Files upload successfully
- GitHub links saved
- Submission stored with milestone ID

**Time:** 3 hours

---

## PHASE 9: AI VERIFICATION (Days 6-7)

### 9.1 Verification Lane Routing

**AI Engine:**
- [ ] Route submission to correct lane based on gig type
- [ ] Create lane abstraction layer
- [ ] Unified entry point: POST /api/ai/verify

**Acceptance Criteria:**
- Software submissions go to Software Lane
- Copywriting submissions go to Copywriting Lane
- Data Entry submissions go to Data Entry Lane
- Translation submissions go to Translation Lane

**Time:** 2 hours

---

### 9.2 Software Lane Verification

**AI Engine:**
- [ ] Clone GitHub repo
- [ ] Check repo exists and accessible
- [ ] Scan dependencies (package.json / requirements.txt)
- [ ] Compare tech stack to spec
- [ ] Check repo structure (basic folder validation)
- [ ] Check README exists and has sections
- [ ] Analyze commit history (spread vs last-minute dump)
- [ ] Read key files and evaluate feature implementation
- [ ] Screenshot deployed URL if provided

**Acceptance Criteria:**
- Returns VerificationReport JSON for software gigs
- All checks produce scores or pass/fail
- Fails if repo inaccessible

**Time:** 4 hours

---

### 9.3 Copywriting Lane Verification

**AI Engine:**
- [ ] Count words
- [ ] Check against word count range
- [ ] Run plagiarism check (API integration)
- [ ] Check keyword frequency
- [ ] Check required sections present
- [ ] LLM evaluates topic coverage
- [ ] LLM evaluates tone adherence (if tone defined)

**Acceptance Criteria:**
- Returns VerificationReport JSON for copywriting gigs
- All checks produce scores or pass/fail
- Plagiarism score affects overall score

**Time:** 3 hours

---

### 9.4 Data Entry Lane Verification

**AI Engine:**
- [ ] Parse CSV/XLSX
- [ ] Check schema (column names, types)
- [ ] Count rows
- [ ] Check data types
- [ ] Check for duplicates
- [ ] Check for nulls (per spec)
- [ ] Sample 20% rows for accuracy check

**Acceptance Criteria:**
- Returns VerificationReport JSON for data entry gigs
- All checks produce scores or pass/fail
- Sampling produces accuracy percentage

**Time:** 3 hours

---

### 9.5 Translation Lane Verification

**AI Engine:**
- [ ] Parse source and target documents
- [ ] Count words in both
- [ ] Check word count match (±10% tolerance)
- [ ] Verify all content present
- [ ] LLM evaluates meaning preservation
- [ ] LLM evaluates tone preservation
- [ ] LLM evaluates formatting preservation
- [ ] Check terminology consistency (if glossary provided)
- [ ] Detect machine-generated translation

**Acceptance Criteria:**
- Returns VerificationReport JSON for translation gigs
- All checks produce scores or pass/fail
- Machine detection produces warning

**Time:** 3 hours

---

### 9.6 Score Calculation & Decision

**AI Engine:**
- [ ] Calculate overall score (0-100%)
- [ ] Determine payment decision:
  - ≥90%: AUTO_RELEASE
  - 50-89%: HOLD
  - <50%: HOLD + DISPUTE_FLAG
- [ ] Generate feedback for freelancer
- [ ] Return VerificationReport JSON

**Acceptance Criteria:**
- Scores calculated correctly
- Payment decision matches thresholds
- Feedback is specific and actionable

**Time:** 2 hours

---

### 9.7 Report Storage & Notification

**Backend:**
- [ ] Create VerificationReport model
- [ ] Store verification report
- [ ] Create report notification
- [ ] Update submission status
- [ ] GET /api/jobs/:id/verifications/:id endpoint

**Frontend:**
- [ ] Show verification complete notification
- [ ] Link to verification report

**Acceptance Criteria:**
- Report stored in database
- Both parties notified
- Can retrieve report via API

**Time:** 2 hours

---

## PHASE 10: VERIFICATION REPORT UI (Day 7)

### 10.1 Report Display

**Frontend:**
- [ ] Create verification report page
- [ ] Show overall score prominently (large number, color-coded)
- [ ] Show payment decision badge (RELEASED / HELD / DISPUTE)
- [ ] Show per-criterion breakdown (accordion or cards)
- [ ] Show PASS/FAIL/PARTIAL with colors
- [ ] Show specific failure reasons
- [ ] Show PFI-only signals separately (yellow warning style)
- [ ] Show resubmissions remaining
- [ ] Show feedback for freelancer

**Acceptance Criteria:**
- Report is clear and scannable
- Score is immediately visible
- Status is immediately obvious
- Each criterion has clear pass/fail indicator

**Time:** 4 hours

---

## PHASE 11: PAYMENT DECISIONS (Day 7)

### 11.1 Payment Display

**Frontend:**
- [ ] Show payment status on job page
- [ ] Show "Auto-Released" if score ≥90%
- [ ] Show "On Hold" if score 50-89%
- [ ] Show "Under Review" if score <50%
- [ ] Show escrow balance

**Backend:**
- [ ] Update escrow status based on payment decision
- [ ] Release funds endpoint (if auto-release)
- [ ] Refund endpoint (if dispute)

**Acceptance Criteria:**
- Payment status clear to both parties
- Auto-release triggers automatically
- Manual refund available for disputes

**Time:** 2 hours

---

## PHASE 12: BASIC PFI (Day 8)

### 12.1 PFI Display & Update

**Frontend:**
- [ ] Show freelancer PFI on profile
- [ ] Show PFI on job cards (employer view)
- [ ] Show PFI update notification after milestone

**Backend:**
- [ ] Create PFI model
- [ ] Calculate basic PFI score (completion rate + average verification score)
- [ ] Update PFI after milestone resolution
- [ ] GET /api/freelancers/:id/pfi endpoint

**Acceptance Criteria:**
- Freelancer PFI visible on profile
- PFI updates after each milestone
- PFI is simple average for v1

**Time:** 3 hours

---

## PHASE 13: AI-MEDIATED CHAT (Days 8-9)

### 13.1 Chat Infrastructure

**Frontend:**
- [ ] Create chat layout (left sidebar: channels, right: messages)
- [ ] Three participants: Employer, Freelancer, AI Mediator
- [ ] Message list with timestamps
- [ ] Input field for new messages
- [ ] Real-time message updates (WebSocket or polling)
- [ ] Message bubbles with sender color coding
- [ ] AI messages have distinct style

**Backend:**
- [ ] Create ChatChannel model
- [ ] Create Message model
- [ ] Create chat endpoint (POST /api/chat/:channelId/messages)
- [ ] Get messages endpoint (GET /api/chat/:channelId/messages)
- [ ] WebSocket support for real-time
- [ ] Chat persists throughout project

**Acceptance Criteria:**
- Chat opens when spec locked
- Both parties can send messages
- Messages appear in real-time
- Chat history loads on page load

**Time:** 4 hours

---

### 13.2 AI Message Detection & Classification

**AI Engine:**
- [ ] Classify incoming messages:
  - QUESTION (clarifying)
  - SCOPE_CREEP (new requirement)
  - COMPLAINT (tension)
  - CONTRADICTION (vs spec)
  - NORMAL (no action needed)
- [ ] Detect spec gaps in questions
- [ ] Detect new scope in client requests
- [ ] Detect conflicts and tensions
- [ ] Detect contradictions to agreed spec

**Acceptance Criteria:**
- Message classification is accurate
- Spec gaps detected when freelancer asks about undefined items
- Scope creep detected when client adds requirements

**Time:** 4 hours

---

### 13.3 AI Mediator Responses

**AI Engine:**
- [ ] Generate spec clarification prompts
- [ ] Generate scope creep intercepts
- [ ] Generate conflict de-escalation responses
- [ ] Generate contradiction warnings
- [ ] Enforce "chat cannot override spec" rule
- [ ] POST /api/ai/chat-respond endpoint

**Frontend:**
- [ ] Display AI responses with distinct styling
- [ ] Highlight AI actions (clarification, scope catch, etc.)
- [ ] Show "Chat cannot override spec" warning prominently

**Backend:**
- [ ] Proxy AI mediator requests
- [ ] Store AI responses as messages
- [ ] Trigger spec clarification flow when needed
- [ ] Trigger Change Request flow when needed

**Acceptance Criteria:**
- AI intercepts spec gaps and prompts employer
- AI catches scope creep and prompts Change Request
- AI de-escalates conflicts by referencing spec
- AI warns about contradictions

**Time:** 4 hours

---

### 13.4 Spec Clarification Flow

**Frontend (Employer):**
- [ ] Show AI prompt for clarification
- [ ] Add input field for employer answer
- [ ] Add "Confirm as Spec Clarification" button
- [ ] Show spec update confirmation

**Backend:**
- [ ] Create SpecClarification model
- [ ] Store clarification with timestamp
- [ ] Append clarification to spec
- [ ] Update spec version
- [ ] Notify freelancer of spec update

**Acceptance Criteria:**
- Clarification is logged and timestamped
- Spec is updated with clarification
- Both parties notified
- Clarification is binding

**Time:** 3 hours

---

### 13.5 Scope Creep Detection Flow

**Frontend (Employer):**
- [ ] Show AI scope creep warning
- [ ] Add "Submit Change Request" button
- [ ] Add "Cancel" button

**Backend:**
- [ ] Integrate with Change Request flow (see Phase 15)
- [ ] Create draft Change Request from chat message

**Acceptance Criteria:**
- Scope creep is caught and flagged
- Client is prompted to submit formal Change Request

**Time:** 2 hours

---

## PHASE 14: REVISION LOOP (Day 9)

### 14.1 Feedback Display

**Frontend (Freelancer):**
- [ ] Show verification feedback prominently
- [ ] Show specific failure reasons
- [ ] Show resubmissions remaining
- [ ] Add "Resubmit Work" button

**Acceptance Criteria:**
- Feedback is clear and specific
- Freelancer knows exactly what to fix
- Resubmission limit shown

**Time:** 2 hours

---

### 14.2 Resubmission Flow

**Frontend (Freelancer):**
- [ ] Same submission form as initial
- [ ] Show previous submission for reference
- [ ] Decrement resubmission counter

**Backend:**
- [ ] Accept resubmission endpoint
- [ ] Store new submission
- [ ] Trigger new verification
- [ ] Update resubmissions_remaining

**Acceptance Criteria:**
- Freelancer can resubmit up to 2 times
- Each resubmission creates new verification
- Counter decrements correctly

**Time:** 2 hours

---

## PHASE 15: CHANGE REQUESTS (Day 10)

### 15.1 Change Request Submission

**Frontend (Employer):**
- [ ] Create Change Request form
- [ ] Describe scope change
- [ ] Add new milestone or modify existing
- [ - Add budget adjustment
- [ ] Add deadline adjustment
- [ ] Submit to freelancer

**Backend:**
- [ ] Create ChangeRequest model
- [ ] Submit change request endpoint
- [ ] Update job status to PENDING_CHANGE_REQUEST

**Acceptance Criteria:**
- Employer can submit change request
- Freelancer receives notification
- Job status updates

**Time:** 3 hours

---

### 15.2 Change Request Review

**Frontend (Freelancer):**
- [ ] View change request details
- [ ] See budget and deadline changes
- [ ] See scope modifications
- [ ] Add "Accept" or "Decline" buttons
- [ ] Add comment field (optional)

**Backend:**
- [ ] Accept change request endpoint
- [ ] Decline change request endpoint
- [ ] If accepted: update spec, escrow tops up, job resumes
- [ ] If declined: job continues unchanged

**Acceptance Criteria:**
- Freelancer can accept or decline
- Accepted updates all affected fields
- Declined keeps original spec

**Time:** 3 hours

---

## PHASE 16: DISPUTES (Day 10)

### 16.1 Dispute Initiation

**Frontend:**
- [ ] Add "Initiate Dispute" button (when score <50%)
- [ ] Create dispute form
- [ ] Describe dispute reason
- [ ] Submit

**Backend:**
- [ ] Create Dispute model
- [ ] Initiate dispute endpoint
- [ ] Update job status to DISPUTED
- [ ] Show chat history as evidence

**Acceptance Criteria:**
- Either party can initiate dispute when flagged
- Chat history available as evidence
- Dispute status updated

**Time:** 2 hours

---

### 16.2 Dispute Resolution

**Frontend (Admin/Arbitrator):**
- [ ] View dispute details
- [ ] Review verification report
- [ ] Review chat history
- [ ] Render decision
- [ ] Assign penalty (optional)
- [ ] Award escrow to appropriate party

**Backend:**
- [ ] Resolve dispute endpoint
- [ ] Update PFI for loser (penalty)
- [ ] Release escrow to winner
- [ ] Update job status to RESOLVED

**Acceptance Criteria:**
- Admin can resolve disputes
- PFI penalty applied to loser
- Escrow released appropriately

**Time:** 3 hours

---

## PHASE 17: ASSET DELIVERY TRACKING (Day 11)

### 17.1 Asset Checklist Display

**Frontend:**
- [ ] Show required assets on job page
- [ ] Show delivery status per asset
- [ ] Add "Mark Delivered" button (employer)
- [ ] Show delivery timestamp

**Backend:**
- [ ] Create Asset model
- [ ] Mark delivered endpoint
- [ ] Check asset delivery deadlines

**Acceptance Criteria:**
- Both parties see asset checklist
- Employer can mark assets as delivered

**Time:** 2 hours

---

### 17.2 Automatic Deadline Extension

**Backend:**
- [ ] Check for overdue assets
- [ ] Pause project clock if assets overdue
- [ ] Calculate delay duration
- [ ] Extend freelancer deadline by delay duration
- [ ] Notify both parties

**Acceptance Criteria:**
- Project clock pauses on asset delay
- Freelancer deadline extended automatically
- Both parties notified

**Time:** 3 hours

---

## PHASE 18: POLISH (Days 12-14)

### 18.1 Counter-Offer Flow

- [ ] Freelancer submits counter-offer
- [ ] Employer accepts/rejects
- [ ] Terms locked if accepted

**Time:** 4 hours

---

### 18.2 Platform Dashboard

- [ ] Active projects overview
- [ ] Milestone timeline view
- [ ] Payment history

**Time:** 6 hours

---

### 18.3 Enhanced PFI

- [ ] PFI history graph
- [ ] Per-project breakdown
- [ ] Complexity weighting

**Time:** 4 hours

---

### 18.4 Cold Start

- [ ] Skill verification tasks
- [ ] Starter PFI from test results

**Time:** 3 hours

---

## DEPENDENCY GRAPH

```
Phase 1 (Foundation)
    └── Phase 2 (Authentication)
           └── Phase 3 (Gig Types)
                  └── Phase 4 (Job Posting)
                         ├── Phase 5 (Job Browsing)
                         │      └── Phase 6 (Freelancer Selection)
                         │             └── Phase 7 (Spec Lock & Escrow)
                         │                    ├── Phase 8 (Work Submission)
                         │                    │      └── Phase 9 (AI Verification)
                         │                    │             ├── Phase 10 (Report UI)
                         │                    │             ├── Phase 11 (Payment)
                         │                    │             ├── Phase 12 (PFI)
                         │                    │             └── Phase 14 (Revision Loop)
                         │                    └── Phase 13 (Chat)
                         │                           └── Phase 15 (Change Requests)
                         │                                  └── Phase 16 (Disputes)
                         │
                         └── Phase 17 (Asset Delivery)

Phase 18 (Polish) - parallel to everything above
```

---

## ROLLBACK PLAN

If a phase gets blocked:
1. Document the blocker
2. Identify alternative paths
3. Implement minimal viable version
4. Defer to Phase 18 if non-critical

---

## SUCCESS METRICS

- [ ] All Tier 1 features complete by Day 11
- [ ] Demo script executes without errors
- [ ] End-to-end flow works: post job → assign → submit → verify → pay
- [ ] Chat mediator catches scope creep
- [ ] Verification reports are accurate
- [ ] PFI updates correctly
