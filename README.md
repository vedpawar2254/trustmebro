# trustmebro

**AI-mediated gig platform with escrow and automated verification**

---

## Quick Start

This is an AI-powered freelance marketplace that uses automated verification and AI-mediated chat to build trust between employers and freelancers.

### Core Features

- **AI Spec Generation**: Turn vague job descriptions into structured, verifiable specs
- **4 Gig Types**: Software, Copywriting, Data Entry, Translation (with 24 subtypes)
- **Automated Verification**: AI evaluates submissions across 4 verification lanes
- **AI-Mediated Chat**: Real-time AI catches scope creep and clarifies specs
- **Escrow & Payments**: Mock escrow with automatic release based on verification scores
- **PFI Scores**: Trust metrics for both employers and freelancers

---

## Documentation

All project documentation lives in the `/docs` folder:

| Document | Description |
|----------|-------------|
| [`PRD.md`](PRD.md) | Complete Product Requirements Document with feature list and flows |
| [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) | Detailed build plan with 18 phases, dependencies, and acceptance criteria |
| [`docs/UI_DESIGN.md`](docs/UI_DESIGN.md) | Comprehensive UI design specification with color palette, typography, and screen designs |
| [`docs/USER_STORIES.md`](docs/USER_STORIES.md) | Detailed user stories for Phases 1-3 and 5-6 with dummy data and code examples |

---

## Project Structure

```
trustmebro/
├── PRD.md                      # Product Requirements Document
├── README.md                   # This file
├── docs/                       # All documentation
│   ├── BUILD_PLAN.md          # Build plan (18 phases)
│   ├── UI_DESIGN.md           # UI design specs
│   └── USER_STORIES.md        # User stories with dummy data
├── frontend/                  # Next.js frontend (to be created)
├── backend/                   # Node/Express backend (to be created)
├── ai-engine/                 # Python AI verification engine (to be created)
└── shared/                    # Shared TypeScript types (to be created)
```

---

## Tech Stack (Planned)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui / Radix UI
- **State Management**: Zustand
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT

### AI Engine
- **Runtime**: Python 3.11+
- **LLM**: OpenAI GPT-4
- **GitHub**: PyGitHub
- **Plagiarism**: Plagiarism API (placeholder)

---

## The Product Story

### The Problem
Traditional freelance platforms lack transparency and trust:
- Vague job descriptions lead to disputes
- Scope creep happens in private chats
- Quality verification is subjective
- Payment disputes are common and painful

### The Solution
trustmebro uses AI to solve these problems at every step:

1. **Job Posting**: AI turns vague descriptions into structured, verifiable specs
2. **Work Submission**: AI evaluates submissions objectively across multiple criteria
3. **Chat Mediation**: AI catches scope creep in real-time, logs spec clarifications
4. **Payment Release**: Automatic based on verification scores (≥90% = release)

### The Demo Script

Six wow moments that tell the story:

1. **Spec Generation**: Watch AI transform vague text into structured spec
2. **Chat Opens**: Employer funds escrow, spec locks, chat opens automatically
3. **Clarification Interception**: Freelancer asks question → AI logs spec clarification
4. **Scope Creep Caught**: Client tries to add feature → AI prompts Change Request
5. **Real-Time Verification**: AI evaluates submission in seconds
6. **Auto-Release**: Score ≥90% → payment releases automatically

---

## Build Order (14-Day Sprint)

### Days 1-2: Foundation (BLOCKER)
- Schema agreement
- Project setup
- Authentication
- Role-based views

### Days 3-4: Core Features
- Gig type system
- Job posting
- Spec generation
- Job browsing

### Days 5-7: Work & Verification
- Freelancer selection
- Spec lock & escrow
- Work submission
- AI verification engine
- Verification report UI

### Days 8-9: Chat & Trust
- AI-mediated chat
- Chat infrastructure
- AI message detection

### Days 10-11: Advanced Features
- Revision loop
- Change requests
- Disputes
- PFI scoring

### Days 12-14: Polish
- Asset delivery tracking
- Counter-offers
- Dashboards
- Accessibility & responsiveness

See [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) for detailed breakdown.

---

## UI Design Principles

- **Trust First**: Every UI decision reinforces transparency and authority
- **Clean & Professional**: Forest green + warm cream palette (not generic blue/gray)
- **Edge Case Ready**: Real tension, conflicts, and disputes are handled
- **Information Hierarchy**: Scores, status, and PFI are always visible
- **Accessible**: WCAG AA compliant with keyboard navigation

See [`docs/UI_DESIGN.md`](docs/UI_DESIGN.md) for complete design system.

---

## Getting Started (Development)

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- OpenAI API key

### Setup (Coming Soon)

```bash
# Clone the repository
git clone <repo-url>
cd trustmebro

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Install AI engine dependencies
cd ../ai-engine
poetry install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and database URL

# Run migrations
cd backend
npx prisma migrate dev

# Start development servers
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: AI Engine
cd ai-engine
poetry run uvicorn src.main:app --reload
```

---

## Dummy Data

Phase 4 job postings have been pre-created with dummy data for testing:

- **12 Jobs** across all 4 gig types and multiple subtypes
- **5 Sample Bids** with realistic proposals
- **Complete Job Specs** with milestones and criteria

See [`docs/USER_STORIES.md`](docs/USER_STORIES.md) for full dummy data.

---

## API Contracts

All API contracts are defined in [`docs/USER_STORIES.md`](docs/USER_STORIES.md) under **Story 1.1**:

- VerificationReport JSON schema
- ChatMessage JSON schema
- JobSpec JSON schema
- TypeScript type definitions

These contracts are agreed upon before any implementation begins.

---

## Contributing

This is a solo developer project with Claude as the AI implementation partner.

### Branching Strategy
- `main`: Production-ready code
- `develop`: Active development
- `feature/*`: Feature branches
- `bugfix/*`: Bug fixes

### Commit Convention
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation update
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Maintenance tasks

---

## License

MIT

---

## Contact

For questions or feedback, open an issue on GitHub.

---

## Progress

- [ ] Phase 1: Foundation
- [ ] Phase 2: Authentication
- [ ] Phase 3: Gig Type System
- [ ] Phase 4: Job Posting (dummy data ready)
- [ ] Phase 5: Job Browsing
- [ ] Phase 6: Freelancer Selection
- [ ] Phase 7: Spec Lock & Escrow
- [ ] Phase 8: Work Submission
- [ ] Phase 9: AI Verification
- [ ] Phase 10: Verification Report UI
- [ ] Phase 11: Payment Decisions
- [ ] Phase 12: Basic PFI
- [ ] Phase 13: AI-Mediated Chat
- [ ] Phase 14: Revision Loop
- [ ] Phase 15: Change Requests
- [ ] Phase 16: Disputes
- [ ] Phase 17: Asset Delivery Tracking
- [ ] Phase 18: Polish

---

**Built for hackathon judges. Made for trust. 🤝**
