# TrustMeBro

**An AI-mediated freelance marketplace with escrow, automated verification, and real-time scope creep detection.**

TrustMeBro reimagines how freelance work gets done. Instead of relying on subjective reviews and trust-me handshakes, every job goes through AI-generated specs, AI-verified submissions, and AI-mediated chat — with payments locked in escrow and released automatically when work passes verification.

---

## Why This Exists

Freelance platforms are broken in predictable ways:

- **Vague job posts** → disputes over what was actually agreed upon
- **Scope creep in chat** → "can you also just quickly..." spirals
- **Subjective quality reviews** → employer says it's bad, freelancer says it's done
- **Payment games** → ghosting, delayed releases, refund abuse

TrustMeBro solves each of these with a system-level intervention, not a policy page.

---

## What Makes This Different

### 1. AI Spec Generation
Employers write a plain-English job description. The AI transforms it into a structured, verifiable specification with milestones, weighted requirements (primary 60%, secondary 30%, tertiary 10%), deliverables, and required assets. No more ambiguity about what "done" means.

### 2. Two-Party Spec Lock
Both employer and freelancer must independently confirm the spec before work begins. Once locked, the spec becomes the single source of truth. Neither party can unilaterally change it — they must go through the formal Change Request system.

### 3. AI-Mediated Chat (Bro)
Every project chat has an AI mediator called **Bro** that monitors conversations in real-time:
- **Scope creep detection** — catches "can you also add..." and prompts a formal Change Request instead
- **Budget/deadline change detection** — flags informal negotiations and routes them to the proper workflow
- **Process questions** — answers questions about escrow, verification, milestones, and payments
- **Escalation warnings** — intervenes before disagreements become disputes

Chat cannot override the spec. A banner makes this explicit.

### 4. AI-Powered Submission Verification
Freelancers submit work per milestone. The AI evaluates submissions against the locked spec criteria and returns a score (0-100):
- **≥90%** → Verified. Payment auto-releases from escrow.
- **50-89%** → Partial. Needs revision or manual employer approval.
- **<50%** → Failed. Must resubmit (max 2 attempts per milestone).

Each verification produces a detailed report with per-criterion breakdowns, a verdict, and actionable suggestions.

### 5. Escrow with Milestone-Based Auto-Release
Employers fund escrow before work begins (10% platform fee). Payments are split across milestones and release automatically when AI verification passes. No manual release needed for clean submissions. Refunds are only possible if no work has been submitted.

### 6. PFI — Platform Fidelity Index
Every user has a reputation score (0-100) that reflects their behavior on the platform:
- **Bonuses**: verified submissions (+0.5), job completion (+1.0), manual approvals (+0.3)
- **Penalties**: failed submissions (-2.0), inactivity (-5 to -15), dispute losses (-10)
- **Enforcement**: PFI below 20 blocks bidding/submissions. Below 10 suspends the account.

PFI replaces subjective star ratings with a behavioral trust metric.

### 7. Ghost Protocol
Monitors user activity on active jobs. If someone goes silent:
- **24h** → friendly reminder via Bro
- **48h** → warning with PFI penalty preview
- **72h** → -5 PFI penalty applied
- **7 days** → account flagged, -15 PFI, other party can take action

### 8. Change Request System
After spec lock, changes go through a formal request system:
- Types: scope, budget, deadline
- Employers get 3 free requests, freelancers get 2
- Additional requests cost $25 each
- The other party must accept or reject
- Accepted changes auto-update the spec

### 9. Dispute Resolution
When things go wrong, either party can open a dispute:
- Types: quality, incomplete, non-delivery, scope disagreement
- Both parties submit statements and evidence
- AI analyzes and recommends resolution
- Outcomes: full refund, full release, or percentage-based split
- PFI penalties applied to the losing party

### 10. Auto-Approval Protection
If an employer doesn't review a submission within 48 hours, it auto-approves with a 90% score. This prevents employers from stalling payments by ignoring submissions.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Frontend                         │
│              Next.js 16 · React 19 · TypeScript         │
│           Tailwind CSS 4 · Radix UI · Zustand           │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐│
│  │ Employer  │  │Freelancer│  │   Shared Pages         ││
│  │ Dashboard │  │Dashboard │  │ Chat · Spec · Verify   ││
│  │ Post Job  │  │Browse    │  │ Payments · Settings    ││
│  │ Manage    │  │Bid · Work│  │                        ││
│  └──────────┘  └──────────┘  └────────────────────────┘│
│                       │                                  │
│              Axios API Client + Auth Interceptors        │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API
┌───────────────────────┴─────────────────────────────────┐
│                        Backend                           │
│             FastAPI · Python · SQLAlchemy                 │
│               JWT Auth · Bcrypt · SMTP                   │
│                                                          │
│  Routes:                                                 │
│  ├── /api/auth      → Register, Login, Email Verify      │
│  ├── /api/jobs      → CRUD, Specs, Bids, Assignment      │
│  ├── /api/jobs/escrow      → Fund, Release, Refund       │
│  ├── /api/jobs/submissions → Submit, Verify, Resubmit    │
│  ├── /api/jobs/chat        → Messages, Bro AI Mediator   │
│  ├── /api/jobs/disputes    → File, Evidence, Resolve     │
│  ├── /api/jobs/change-requests → Create, Respond         │
│  ├── /api/dashboard → Stats, Activity, PFI History       │
│  ├── /api/scheduler → Ghost Check, Auto-Approve, Remind  │
│  └── /api/users     → Notification Preferences           │
│                                                          │
│  Services:                                               │
│  ├── Bro Mediator   → Scope creep & chat analysis        │
│  ├── Ghost Protocol → Inactivity monitoring & penalties  │
│  ├── Email Service  → 10+ transactional email templates  │
│  └── Enforcement    → PFI checks, account suspension     │
│                        │                                 │
│                   SQLite / PostgreSQL                     │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP
┌───────────────────────┴─────────────────────────────────┐
│                   AI Engine (External)                    │
│          Spec Generation · Submission Verification       │
│                Chat Analysis · Scoring                   │
└─────────────────────────────────────────────────────────┘
```

### Data Model

The core entities and their relationships:

- **User** → has role (employer/freelancer), PFI score, notification preferences
- **Job** → lifecycle: DRAFT → PUBLISHED → ASSIGNED → ESCROW_FUNDED → IN_PROGRESS → COMPLETED/DISPUTED
- **JobSpec** → milestones, weighted requirements, deliverables, verification policy, two-party lock
- **Bid** → freelancer proposal with budget, timeline, cover letter
- **Escrow** → holds funds, tracks platform fee (10%), milestone-based releases
- **Submission** → work delivery per milestone, verification score, resubmission tracking (max 2)
- **ChatChannel** → per-job messaging between employer, freelancer, and Bro AI
- **ChangeRequest** → formal spec modifications after lock (limited free requests)
- **Dispute** → statements, evidence, AI recommendation, resolution with fund allocation
- **GhostEvent** → progressive inactivity warnings and PFI penalties

### Frontend Architecture

- **State**: Zustand store with localStorage persistence for auth
- **API Layer**: Typed Axios client with automatic token injection and 401 redirect
- **Services**: 11 service modules covering 40+ API endpoints
- **UI**: Custom dark purple theme, component library built on Radix UI primitives
- **Rendering**: Next.js App Router with role-based route groups (`/employer/*`, `/freelancer/*`)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, Zustand |
| Backend | FastAPI, Python, SQLAlchemy, JWT, Bcrypt |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Email | SMTP (Gmail compatible, dev mode logs to console) |
| AI | External AI engine for spec generation, verification, chat analysis |
| Icons | Lucide React |
| Maps | d3-geo, react-simple-maps |
| Deployment | Vercel (frontend) |

---

## Job Lifecycle

```
Employer creates job (DRAFT)
        │
        ▼
AI generates structured spec with milestones
        │
        ▼
Employer publishes job (PUBLISHED)
        │
        ▼
Freelancers browse, filter, and bid
        │
        ▼
Employer accepts bid → job ASSIGNED
        │
        ▼
Both parties lock spec (two-party confirmation)
        │
        ▼
Employer funds escrow → ESCROW_FUNDED (10% platform fee)
        │
        ▼
Chat opens with Bro AI mediator
        │
        ▼
Freelancer submits work per milestone (IN_PROGRESS)
        │
        ▼
AI verifies submission against spec → score 0-100
        │
   ┌────┴─────────────────┐
   │                      │
≥90%: VERIFIED        <90%: PARTIAL/FAILED
Payment auto-releases  Revise or employer approves
   │                      │
   └────┬─────────────────┘
        │
        ▼
All milestones verified → COMPLETED
Remaining escrow released, PFI bonuses applied
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm

### Backend

```bash
cd backend
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your config

# Run the server
uvicorn src.main:app --reload
```

### Frontend

```bash
cd frontend
npm install

# Run the dev server
npm run dev
```

The frontend runs on `http://localhost:3000` and the backend on `http://localhost:8000`.

---

## Gig Types

The platform supports 4 gig categories, each with specialized subtypes and verification criteria:

| Type | Subtypes |
|------|----------|
| Software | Web Development, Mobile App, API/Backend, DevOps, Data Science, Automation |
| Copywriting | Blog Posts, Technical Writing, Marketing Copy, Social Media, SEO Content, UX Writing |
| Data Entry | Spreadsheet, Database, Form Processing, Transcription, Research, Categorization |
| Translation | Document, Website, Technical, Legal, Creative, Subtitling |

---

## Project Structure

```
trustmebro/
├── backend/
│   └── src/
│       ├── main.py              # FastAPI app, CORS, error handlers
│       ├── models.py            # SQLAlchemy models (10+ tables)
│       ├── schemas.py           # Pydantic request/response schemas
│       ├── config.py            # Environment configuration
│       ├── database.py          # DB connection and session
│       ├── auth.py              # JWT token utilities
│       ├── routes/
│       │   ├── auth.py          # Registration, login, email verify
│       │   ├── jobs.py          # Jobs, specs, bids, assignment
│       │   ├── escrow_submissions.py  # Escrow + submission + verification
│       │   ├── chat.py          # Chat with Bro AI mediator
│       │   ├── disputes.py      # Dispute filing and resolution
│       │   ├── change_requests.py    # Formal change management
│       │   ├── dashboard.py     # Role-specific stats and activity
│       │   ├── payments.py      # Payment tracking per milestone
│       │   ├── scheduler.py     # Ghost checks, auto-approve, reminders
│       │   ├── uploads.py       # File upload/download
│       │   └── users.py         # Notification preferences
│       ├── services/
│       │   ├── bro_mediator.py  # Chat analysis, scope creep detection
│       │   ├── ghost_protocol.py # Inactivity monitoring
│       │   └── email_service.py # Transactional emails
│       └── utils/
│           ├── enforcement.py   # PFI checks, account suspension
│           ├── deadline.py      # Deadline tracking, grace periods
│           └── notifications.py # Preference-aware notification routing
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Landing page with canvas animation
│   │   ├── login/               # Authentication
│   │   ├── register/            # Role-based registration
│   │   ├── employer/
│   │   │   ├── dashboard/       # Stats, active jobs, pending bids
│   │   │   ├── jobs/            # Job listing and detail pages
│   │   │   └── post-job/        # Multi-step job creation with AI spec
│   │   ├── freelancer/
│   │   │   ├── dashboard/       # PFI score, earnings, projects
│   │   │   ├── jobs/            # Browse and bid on jobs
│   │   │   └── projects/        # Active projects and submissions
│   │   ├── projects/[jobId]/
│   │   │   ├── chat/            # Real-time chat with Bro AI
│   │   │   ├── spec/            # Locked spec viewer
│   │   │   └── verification/    # AI verification reports
│   │   ├── payments/            # Transaction history
│   │   └── settings/            # Profile, notifications, email verify
│   ├── components/
│   │   ├── ui/                  # Button, Card, Badge, Input, MeterRing
│   │   ├── layout/              # Navbar, Footer
│   │   ├── home/                # Hero with canvas particle animation
│   │   ├── jobs/                # JobCard, Filters, MilestoneCard, SpecViewer
│   │   ├── bids/                # BidCard, BidForm
│   │   ├── projects/            # SubmissionForm, MilestoneStepper, EscrowWidget
│   │   ├── chat/                # ChatBubble, AIInterceptBanner
│   │   └── verification/        # ScoreRing, VerificationReport, CriterionBreakdown
│   ├── lib/api/
│   │   ├── client.ts            # Axios wrapper with auth interceptors
│   │   └── services.ts          # 11 service modules, 40+ endpoints
│   └── store/
│       └── auth.ts              # Zustand auth store with persistence
└── docs/
    ├── BUILD_PLAN.md
    ├── UI_DESIGN.md
    └── USER_STORIES.md
```

---

## License

MIT
