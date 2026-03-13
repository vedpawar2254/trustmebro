# trustmebro — Frontend Design Plan

## Overview

trustmebro is an AI-mediated freelance platform. The design must communicate **trust, clarity, and fairness** — the core product promise. Every screen should feel structured and professional, not chaotic like typical gig platforms.

---

## Design Principles

1. **Clarity over decoration** — Users need to understand complex AI-generated specs at a glance
2. **Status is king** — Every project, milestone, and submission has a clear status. Make it unmissable
3. **AI feels helpful, not intrusive** — AI mediator messages have a distinct but calm visual identity
4. **Trust signals everywhere** — PFI scores, escrow balances, locked specs all reinforce the platform promise
5. **Mobile-first, dashboard-optimized** — Most work happens on dashboards; design for that

---

## Color System (Already Defined in globals.css)

```
Primary:    #1a4d2e  (Forest Green)  — Trust, growth, money
Background: #faf7f2  (Warm Cream)    — Calm, professional
Card:       #ffffff  (White)         — Clean content areas
Success:    #16a34a  (Green)         — PASS, released payments
Warning:    #f59e0b  (Amber)         — HOLD, partial, attention
Error:      #dc2626  (Red)           — FAIL, disputes
Info:       #0891b2  (Cyan)          — Active, in-progress
```

---

## Typography

- Headings: `font-bold`, tight tracking
- Body: `text-muted-foreground`, 1.6 line-height
- Labels: `text-sm font-medium`
- Tiny metadata: `text-xs text-muted-foreground`

---

## Component Inventory

### Existing (keep/extend)
- `Button` — primary, secondary, tertiary, destructive, ghost, link variants
- `Card` — base card with hover shadow
- `Input` — with focus ring
- `Label`, `Textarea` — form elements
- `Navbar` — role-aware, sticky
- `Footer` — 4-column

### To Build

| Component | Used In |
|-----------|---------|
| `Badge` | Status labels (PASS/FAIL/HOLD), gig type tags |
| `StatusBadge` | Verification criterion status |
| `ScoreRing` | Circular score display on verification report |
| `MilestoneCard` | Spec viewer, milestone accordion |
| `CriterionRow` | Per-criterion PASS/FAIL/PARTIAL row |
| `JobCard` | Job feed listing |
| `BidCard` | Bid list for employer |
| `ChatBubble` | Chat messages (employer/freelancer/AI) |
| `AIInterceptBanner` | AI mediator action callout in chat |
| `EscrowWidget` | Escrow balance + status |
| `PFIBadge` | PFI score display |
| `VerificationReport` | Full report layout |
| `SpecViewer` | Read-only spec display |
| `SpecEditor` | Editable spec with vague flags |
| `SubmissionForm` | Gig-type-specific submission |
| `LoadingSpinner` | Async states |
| `EmptyState` | Empty lists |
| `Toast` | Notifications |

---

## Page Inventory & Routes

### Public
| Route | Page | Priority |
|-------|------|----------|
| `/` | Landing page | Done |
| `/login` | Login | Done |
| `/register` | Register | Done |

### Employer Flow
| Route | Page | Priority |
|-------|------|----------|
| `/employer/dashboard` | Dashboard | Done (stub) |
| `/employer/post-job` | Post job + AI spec generation | Tier 1 |
| `/employer/jobs` | My jobs list | Tier 1 |
| `/employer/jobs/[jobId]` | Job detail + bids | Tier 1 |
| `/employer/jobs/[jobId]/spec` | Spec editor/reviewer | Tier 1 |
| `/employer/jobs/[jobId]/project` | Active project view | Tier 1 |

### Freelancer Flow
| Route | Page | Priority |
|-------|------|----------|
| `/freelancer/dashboard` | Dashboard | Done (stub) |
| `/freelancer/jobs` | Job feed/browse | Tier 1 |
| `/freelancer/jobs/[jobId]` | Job detail + bid form | Tier 1 |
| `/freelancer/projects` | My active projects | Tier 1 |
| `/freelancer/projects/[jobId]` | Project detail + submit | Tier 1 |

### Shared
| Route | Page | Priority |
|-------|------|----------|
| `/projects/[jobId]/chat` | AI-mediated chat | Tier 1 |
| `/projects/[jobId]/verification/[subId]` | Verification report | Tier 1 |
| `/projects/[jobId]/spec` | Locked spec viewer | Tier 1 |

---

## Screen-by-Screen Design Specs

### 1. Landing Page (`/`) — Exists, polish only
- Hero: gradient bg, large headline, two CTAs
- Features: 6-card grid with emoji icons
- How it works: 4-step numbered flow
- CTA section: primary bg, white text

### 2. Login / Register — Exists, polish only
- Centered card, max-w-md
- Role selector on register (employer/freelancer toggle cards)
- Inline validation errors

### 3. Employer Dashboard (`/employer/dashboard`)
- Stats row: 4 cards (Active Jobs, Total Spent, Pending Bids, In Progress)
- Recent activity feed
- Quick action: "Post New Job" button prominent
- Active jobs table with status badges

### 4. Post Job (`/employer/post-job`)
**Step 1 — Describe**
- Large textarea for job description
- Title, budget range, deadline inputs
- "Generate Spec" CTA button

**Step 2 — Review AI Spec** (after generation)
- Gig type badge displayed
- Milestone accordion (editable)
- Per-milestone criteria list (editable, vague items flagged in amber)
- Required assets checklist
- "Resolve All Flags" progress indicator
- "Publish Job" button (disabled until flags resolved)

### 5. Job Feed (`/freelancer/jobs`)
- Filter bar: gig type, budget range, keyword search
- Job cards grid (2-col on desktop)
- Each card: title, gig type badge, budget, deadline, employer PFI, "View Spec" button

### 6. Job Detail / Spec Viewer (`/freelancer/jobs/[jobId]`)
- Full spec read-only view
- Milestone accordion with criteria
- Required assets section
- Bid form sidebar (cover letter, proposed budget/timeline)
- "Place Bid" CTA

### 7. Employer Job Detail (`/employer/jobs/[jobId]`)
- Job info + spec summary
- Bids list: freelancer name, PFI, cover letter preview, proposed budget
- "Accept Bid" button per bid
- Status badge on job

### 8. Spec Lock Screen (modal/page)
- Full spec read-only
- AI questions panel (3 questions with checkboxes)
- "Flag Concern" / "Accept & Start" buttons
- Concern input if flagging

### 9. Active Project View (`/employer/jobs/[jobId]/project` or `/freelancer/projects/[jobId]`)
- Project header: title, status, escrow balance
- Milestone timeline (vertical stepper)
- Current milestone highlighted
- Submission status per milestone
- "Open Chat" button
- "Submit Work" button (freelancer only, on active milestone)

### 10. Submission Form
- Gig-type-aware:
  - Software: GitHub URL input
  - Copywriting: file upload + text paste tabs
  - Data Entry: CSV/XLSX upload
  - Translation: source + target file upload
- Milestone selector
- Submit button with loading state

### 11. Verification Report (`/projects/[jobId]/verification/[subId]`)
- Score ring: large circular score (color-coded: green ≥90, amber 50-89, red <50)
- Payment decision badge: AUTO-RELEASED / ON HOLD / DISPUTE
- Criteria breakdown: accordion cards with PASS/FAIL/PARTIAL rows
- PFI signals section (amber warning style)
- Feedback for freelancer (if HOLD/FAIL)
- Resubmissions remaining counter
- "Resubmit" button (freelancer, if remaining > 0)

### 12. AI-Mediated Chat (`/projects/[jobId]/chat`)
- Three-column layout: spec sidebar | chat | participants
- Message bubbles: employer (right, primary), freelancer (left, gray), AI (center, distinct green/teal)
- AI intercept banners: full-width callout with action type label
- Spec clarification flow: inline form when AI prompts employer
- "Chat cannot override spec" persistent banner at top
- Input bar with send button

### 13. Freelancer Dashboard (`/freelancer/dashboard`)
- PFI score banner (prominent, top)
- Stats: Active Projects, Total Earned, Pending Submissions, Completed
- Active projects list with milestone status
- Available jobs preview (2-3 cards)

---

## Micro-Interactions

- Button hover: `transition-all duration-200 hover:scale-[1.02]`
- Card hover: `hover:shadow-md transition-shadow`
- Status badge pulse: `animate-pulse` on PENDING states
- Score ring: CSS stroke-dashoffset animation on mount
- Chat messages: `animate-fade-in-up` on new message
- AI intercept: slide-down animation from top of chat

---

## Implementation Order

### Phase 1 — Core Components (build these first, everything depends on them)
1. `Badge` component
2. `StatusBadge` component  
3. `LoadingSpinner` component
4. `EmptyState` component
5. `Toast` / notification system

### Phase 2 — Job Posting Flow (Employer)
6. Post Job page (Step 1: form)
7. AI Spec generation loading state + Step 2 (spec review)
8. `SpecEditor` component
9. `MilestoneCard` + `CriterionRow` components
10. Employer Jobs list page

### Phase 3 — Job Browsing Flow (Freelancer)
11. `JobCard` component
12. Job Feed page with filters
13. Job Detail / Spec Viewer page
14. `BidForm` component

### Phase 4 — Project Execution
15. Employer Job Detail (bids list + accept)
16. `BidCard` component
17. Spec Lock screen
18. `EscrowWidget` component
19. Active Project view (milestone stepper)
20. `SubmissionForm` component (gig-type-aware)

### Phase 5 — Verification & Chat
21. `ScoreRing` component
22. `CriterionRow` component
23. `VerificationReport` page
24. `ChatBubble` component
25. `AIInterceptBanner` component
26. Chat page

### Phase 6 — Polish
27. Dashboard enhancements (real data shapes)
28. Mobile responsiveness pass
29. Loading/error states throughout
30. Animations and micro-interactions

---

## Data Strategy (Frontend-Only Phase)

Until the backend is ready, all pages use **dummy data** from `frontend/data/` files:

```
frontend/data/
  dummy_jobs.ts       — 5 published jobs across all gig types
  dummy_bids.ts       — 5 bids per job
  dummy_spec.ts       — Full spec with milestones + criteria
  dummy_verification.ts — Sample verification reports (PASS/HOLD/FAIL)
  dummy_chat.ts       — Chat history with AI intercepts
  dummy_users.ts      — Employer + freelancer profiles
```

API calls are wrapped in `frontend/lib/api/` modules that return dummy data when `NEXT_PUBLIC_USE_MOCK=true`.

---

## File Structure (New Files to Create)

```
frontend/
  app/
    employer/
      post-job/page.tsx
      jobs/page.tsx
      jobs/[jobId]/page.tsx
      jobs/[jobId]/project/page.tsx
    freelancer/
      jobs/page.tsx
      jobs/[jobId]/page.tsx
      projects/page.tsx
      projects/[jobId]/page.tsx
    projects/
      [jobId]/
        chat/page.tsx
        verification/[submissionId]/page.tsx
        spec/page.tsx
  components/
    ui/
      badge.tsx
      score-ring.tsx
      loading-spinner.tsx
      empty-state.tsx
      toast.tsx
    jobs/
      JobCard.tsx
      JobFilters.tsx
      SpecViewer.tsx
      SpecEditor.tsx
      MilestoneCard.tsx
      CriterionRow.tsx
    bids/
      BidCard.tsx
      BidForm.tsx
    projects/
      MilestoneStepper.tsx
      EscrowWidget.tsx
      SubmissionForm.tsx
    verification/
      VerificationReport.tsx
      ScoreRing.tsx
      CriterionBreakdown.tsx
    chat/
      ChatBubble.tsx
      AIInterceptBanner.tsx
      ChatInput.tsx
  data/
    dummy_jobs.ts
    dummy_bids.ts
    dummy_spec.ts
    dummy_verification.ts
    dummy_chat.ts
    dummy_users.ts
  lib/
    api/
      jobs.ts
      bids.ts
      submissions.ts
      chat.ts
      verification.ts
```
