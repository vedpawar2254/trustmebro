# EPIC 2: Job Creation & Spec Generation

## Overview

Employers can create jobs and use AI (Bro) to generate detailed specifications through a guided conversation.

**Dependencies:** EPIC 1 (Auth)
**Blocked By:** AUTH-1, AUTH-2
**Blocks:** EPIC 3 (Bidding)

---

## User Stories

### JOB-1: Create Job Draft

**As an** employer
**I want to** create a new job with basic details
**So that** I can start the job posting process

**Priority:** P0
**Points:** 2

#### Acceptance Criteria

- [ ] Employer can enter: title, description, gig type, budget range, deadline
- [ ] Gig types: SOFTWARE, COPYWRITING, TRANSLATION, DATA_ENTRY
- [ ] Budget: min and max values
- [ ] Deadline: must be in the future
- [ ] Job created in DRAFT status
- [ ] Job linked to current employer

#### API Endpoint

```
POST /api/jobs

Headers:
Authorization: Bearer <token>

Request:
{
  "title": "string",              // 10-500 chars
  "description": "string",        // min 50 chars
  "gig_type": "COPYWRITING",      // enum
  "budget_min": 100.0,
  "budget_max": 500.0,
  "deadline": "2026-03-31T23:59:59Z"
}

Response (201):
{
  "id": 1,
  "employer_id": 1,
  "title": "5 Blog Posts on AI Healthcare",
  "description": "...",
  "gig_type": "COPYWRITING",
  "budget_min": 100.0,
  "budget_max": 500.0,
  "deadline": "2026-03-31T23:59:59Z",
  "status": "DRAFT",
  "created_at": "2026-03-15T10:00:00Z"
}
```

#### Validation Rules

```python
class CreateJobRequest(BaseModel):
    title: str = Field(..., min_length=10, max_length=500)
    description: str = Field(..., min_length=50)
    gig_type: GigType
    budget_min: float = Field(..., gt=0)
    budget_max: float = Field(..., gt=0)
    deadline: datetime

    @validator('budget_max')
    def budget_max_gte_min(cls, v, values):
        if 'budget_min' in values and v < values['budget_min']:
            raise ValueError('budget_max must be >= budget_min')
        return v

    @validator('deadline')
    def deadline_in_future(cls, v):
        if v <= datetime.utcnow():
            raise ValueError('deadline must be in the future')
        return v
```

#### UI Components

```
CreateJobPage (Step 1: Basic Info):
├── Header ("Create New Job")
├── Form
│   ├── TitleInput
│   ├── DescriptionTextarea (rich text optional)
│   ├── GigTypeSelect
│   │   ├── Software
│   │   ├── Copywriting
│   │   ├── Translation
│   │   └── Data Entry
│   ├── BudgetRangeInputs (min, max)
│   └── DeadlineDatePicker
├── Actions
│   ├── SaveDraftButton
│   └── NextButton ("Generate Spec with AI")
└── ValidationErrors
```

---

### JOB-2: AI Spec Generation (Bro Intake)

**As an** employer
**I want to** chat with Bro to generate a detailed job spec
**So that** my requirements are clear and verifiable

**Priority:** P0
**Points:** 5

#### Acceptance Criteria

- [ ] Chat interface with Bro appears after job creation
- [ ] Bro asks clarifying questions based on gig type
- [ ] Employer answers questions in natural language
- [ ] Bro generates structured spec with:
  - Primary requirements (must have)
  - Secondary requirements (should have)
  - Tertiary requirements (nice to have)
  - Milestones with deliverables and deadlines
- [ ] Employer can see generated spec
- [ ] Spec saved to job

#### Bro Intake Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  GENERATE SPEC WITH BRO                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Bro] Hey! I'm Bro, and I'll help you create a clear spec    │
│  for your job: "5 Blog Posts on AI Healthcare"                 │
│                                                                 │
│  I see this is a Copywriting job. Let me ask a few questions  │
│  to make sure freelancers know exactly what you need.         │
│                                                                 │
│  First up: How long should each blog post be?                  │
│  • Short (500-800 words)                                       │
│  • Medium (800-1200 words)                                     │
│  • Long (1200-2000 words)                                      │
│  • Not sure (I'll suggest based on topic)                      │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [You] Medium, around 1000-1200 words                          │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [Bro] Got it - 1000-1200 words per post.                      │
│                                                                 │
│  Who's the target audience? This helps set the right tone.    │
│  • General consumers                                           │
│  • Business professionals (B2B)                                │
│  • Technical/developers                                        │
│  • Other (please specify)                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### API Endpoints

**Start Spec Chat:**
```
POST /api/jobs/{job_id}/spec/chat

Request:
{
  "message": "string"  // Optional, empty to start
}

Response:
{
  "messages": [
    {
      "role": "assistant",
      "content": "Hey! I'm Bro...",
      "options": ["Short (500-800)", "Medium (800-1200)", ...]  // Optional quick replies
    }
  ],
  "spec_ready": false
}
```

**Continue Chat:**
```
POST /api/jobs/{job_id}/spec/chat

Request:
{
  "message": "Medium, around 1000-1200 words"
}

Response:
{
  "messages": [
    {
      "role": "user",
      "content": "Medium, around 1000-1200 words"
    },
    {
      "role": "assistant",
      "content": "Got it - 1000-1200 words per post. Who's the target audience?",
      "options": ["General consumers", "Business professionals", ...]
    }
  ],
  "spec_ready": false
}
```

**Get Generated Spec:**
```
POST /api/jobs/{job_id}/spec/generate

Response:
{
  "spec": {
    "version": 1,
    "requirements": {
      "primary": [
        {"id": "P1", "description": "Each post must be 1000-1200 words", "verification_method": "word_count"},
        {"id": "P2", "description": "Original content (plagiarism < 10%)", "verification_method": "plagiarism_check"}
      ],
      "secondary": [
        {"id": "S1", "description": "Include 3+ real-world examples", "verification_method": "ai_analysis"}
      ],
      "tertiary": [
        {"id": "T1", "description": "SEO-optimized headlines", "verification_method": "ai_analysis"}
      ]
    },
    "milestones": [
      {
        "id": 1,
        "name": "Blog Post 1: AI Diagnostics",
        "deliverables": ["D1"],
        "deadline": "2026-03-20",
        "payout_percentage": 18.2
      }
    ],
    "deliverables": [
      {"id": "D1", "type": "blog_post", "title": "AI Diagnostics in Radiology"}
    ]
  }
}
```

#### AI Prompt for Spec Generation

```python
SPEC_INTAKE_SYSTEM_PROMPT = """
You are Bro, a friendly AI assistant helping employers create clear job specifications.

Job Details:
- Title: {job_title}
- Description: {job_description}
- Gig Type: {gig_type}
- Budget: ${budget_min} - ${budget_max}
- Deadline: {deadline}

Your task:
1. Ask 4-6 clarifying questions to understand requirements
2. Questions should be specific to the gig type
3. Offer quick-reply options when possible
4. Be friendly and conversational
5. After gathering enough info, say "I have enough to create your spec!"

For COPYWRITING, ask about:
- Content length (word count)
- Target audience
- Tone/voice
- Number of pieces
- Topics/subjects
- SEO requirements
- Reference examples

For TRANSLATION, ask about:
- Source and target languages
- Document type
- Technical terminology
- Localization level

For DATA_ENTRY, ask about:
- Source format (PDF, images, etc.)
- Output format
- Number of records
- Fields to extract
- Accuracy requirements

For SOFTWARE, ask about:
- Tech stack
- Features needed
- Design requirements
- Testing requirements
"""

SPEC_GENERATION_PROMPT = """
Based on the conversation, generate a structured job specification.

Conversation:
{conversation_history}

Generate a JSON spec with:
1. requirements.primary - MUST have (3-5 items)
   - These are verifiable, objective requirements
   - Include verification_method for each

2. requirements.secondary - SHOULD have (2-4 items)
   - Expected quality standards

3. requirements.tertiary - NICE to have (1-2 items)
   - Bonus if included

4. milestones - Break the work into milestones
   - Each milestone has deadline (spread evenly before job deadline)
   - Each milestone has payout_percentage (equal split, slightly more on final)

5. deliverables - List of specific deliverables

Return valid JSON only.
"""
```

#### Business Logic

```python
async def chat_for_spec(job_id: int, message: str, user: User) -> dict:
    job = get_job(job_id)
    if job.employer_id != user.id:
        raise HTTPException(403, "Not your job")

    # Get or create chat history
    chat_history = get_spec_chat_history(job_id)

    if message:
        chat_history.append({"role": "user", "content": message})

    # Call AI
    response = await openai_chat(
        system=SPEC_INTAKE_SYSTEM_PROMPT.format(
            job_title=job.title,
            job_description=job.description,
            gig_type=job.gig_type,
            budget_min=job.budget_min,
            budget_max=job.budget_max,
            deadline=job.deadline
        ),
        messages=chat_history
    )

    chat_history.append({"role": "assistant", "content": response})
    save_spec_chat_history(job_id, chat_history)

    # Check if ready to generate
    spec_ready = "enough to create your spec" in response.lower()

    return {
        "messages": chat_history,
        "spec_ready": spec_ready
    }

async def generate_spec(job_id: int, user: User) -> dict:
    job = get_job(job_id)
    chat_history = get_spec_chat_history(job_id)

    # Generate spec with AI
    spec_json = await openai_chat(
        system=SPEC_GENERATION_PROMPT.format(
            conversation_history=format_conversation(chat_history)
        ),
        messages=[{"role": "user", "content": "Generate the spec now."}],
        response_format="json"
    )

    spec = json.loads(spec_json)

    # Save spec
    job_spec = create_job_spec(
        job_id=job_id,
        milestones_json=spec["milestones"],
        requirements_json=spec["requirements"],
        deliverables_json=spec.get("deliverables", [])
    )

    return {"spec": spec}
```

#### UI Components

```
SpecGenerationPage:
├── Header ("Generate Spec with Bro")
├── JobSummaryCard (title, type, budget, deadline)
├── ChatWindow
│   ├── MessageList
│   │   ├── BroMessage (avatar, text, quick-reply buttons)
│   │   └── UserMessage (text)
│   ├── QuickReplyButtons (when available)
│   └── InputArea
│       ├── TextInput
│       └── SendButton
├── SpecReadyBanner (when spec_ready=true)
│   └── GenerateSpecButton
└── ProgressIndicator (questions answered)
```

---

### JOB-3: View and Edit Spec

**As an** employer
**I want to** view and edit the generated spec
**So that** I can fine-tune requirements before publishing

**Priority:** P1
**Points:** 2

#### Acceptance Criteria

- [ ] Employer can view full spec after generation
- [ ] Can edit requirement descriptions
- [ ] Can change requirement tier (promote/demote)
- [ ] Can edit milestone names and deadlines
- [ ] Can add/remove requirements
- [ ] Changes saved to spec

#### API Endpoints

```
GET /api/jobs/{job_id}/spec

Response:
{
  "id": 1,
  "job_id": 1,
  "version": 1,
  "is_locked": false,
  "requirements": {...},
  "milestones": [...],
  "deliverables": [...],
  "created_at": "...",
  "updated_at": "..."
}
```

```
PUT /api/jobs/{job_id}/spec

Request:
{
  "requirements": {...},
  "milestones": [...],
  "deliverables": [...]
}

Response:
{
  "success": true,
  "spec": {...}
}
```

#### UI Components

```
SpecEditorPage:
├── Header ("Review & Edit Spec")
├── Tabs
│   ├── RequirementsTab
│   │   ├── Section ("Primary Requirements - Must Have")
│   │   │   └── RequirementCard[] (editable)
│   │   │       ├── DescriptionInput
│   │   │       ├── TierSelect (Primary/Secondary/Tertiary)
│   │   │       └── RemoveButton
│   │   ├── Section ("Secondary Requirements")
│   │   ├── Section ("Tertiary Requirements")
│   │   └── AddRequirementButton
│   ├── MilestonesTab
│   │   └── MilestoneCard[] (editable)
│   │       ├── NameInput
│   │       ├── DeadlinePicker
│   │       ├── PayoutPercentage
│   │       └── DeliverablesSelect
│   └── DeliverablesTab
│       └── DeliverableCard[]
├── Actions
│   ├── SaveButton
│   ├── RegenerateButton ("Chat with Bro again")
│   └── PublishButton ("Publish Job")
└── PreviewPanel (formatted view)
```

---

### JOB-4: Publish Job

**As an** employer
**I want to** publish my job
**So that** freelancers can see and bid on it

**Priority:** P0
**Points:** 1

#### Acceptance Criteria

- [ ] Job must have a spec to publish
- [ ] Publishing changes status to PUBLISHED
- [ ] Published jobs appear in marketplace
- [ ] Cannot edit job details after publishing (only spec before lock)

#### API Endpoint

```
POST /api/jobs/{job_id}/publish

Response (200):
{
  "success": true,
  "job": {
    "id": 1,
    "status": "PUBLISHED",
    "published_at": "2026-03-15T12:00:00Z",
    ...
  }
}

Response (400):
{
  "detail": "Job must have a spec before publishing"
}
```

#### Business Logic

```python
def publish_job(job_id: int, user: User) -> Job:
    job = get_job(job_id)

    if job.employer_id != user.id:
        raise HTTPException(403, "Not your job")

    if job.status != "DRAFT":
        raise HTTPException(400, "Only draft jobs can be published")

    spec = get_job_spec(job_id)
    if not spec:
        raise HTTPException(400, "Job must have a spec before publishing")

    job.status = "PUBLISHED"
    job.published_at = datetime.utcnow()
    save_job(job)

    return job
```

---

### JOB-5: My Jobs List

**As an** employer
**I want to** see all my jobs
**So that** I can manage them

**Priority:** P0
**Points:** 1

#### Acceptance Criteria

- [ ] List shows all jobs created by employer
- [ ] Shows: title, status, freelancer (if assigned), deadline, bid count
- [ ] Can filter by status
- [ ] Can click to view/manage job

#### API Endpoint

```
GET /api/jobs/my

Query params:
- status: "DRAFT" | "PUBLISHED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" (optional)

Response:
{
  "jobs": [
    {
      "id": 1,
      "title": "5 Blog Posts",
      "status": "PUBLISHED",
      "gig_type": "COPYWRITING",
      "budget_min": 100,
      "budget_max": 500,
      "deadline": "2026-03-31",
      "freelancer": null,
      "bid_count": 5,
      "created_at": "2026-03-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

## Database Schema

```sql
-- Jobs table
CREATE TABLE jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employer_id INTEGER NOT NULL REFERENCES users(id),
    assigned_freelancer_id INTEGER REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    gig_type VARCHAR(50) NOT NULL,
    budget_min FLOAT NOT NULL,
    budget_max FLOAT NOT NULL,
    deadline TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    assigned_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Job specs table
CREATE TABLE job_specs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER UNIQUE NOT NULL REFERENCES jobs(id),
    version INTEGER DEFAULT 1,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP,
    requirements_json JSON,
    milestones_json JSON,
    deliverables_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Spec chat history (for intake conversation)
CREATE TABLE spec_chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    messages_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_jobs_employer ON jobs(employer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_gig_type ON jobs(gig_type);
```

---

## Gig Types & Subtypes

```python
class GigType(str, Enum):
    SOFTWARE = "SOFTWARE"
    COPYWRITING = "COPYWRITING"
    TRANSLATION = "TRANSLATION"
    DATA_ENTRY = "DATA_ENTRY"

GIG_SUBTYPES = {
    "SOFTWARE": [
        "web_development",
        "mobile_app",
        "api_development",
        "desktop_app"
    ],
    "COPYWRITING": [
        "blog_posts",
        "website_copy",
        "marketing_emails",
        "social_media"
    ],
    "TRANSLATION": [
        "document_translation",
        "website_translation",
        "technical_translation"
    ],
    "DATA_ENTRY": [
        "spreadsheet_data",
        "pdf_extraction",
        "web_scraping"
    ]
}
```

---

## Testing Checklist

- [ ] Create job with valid data → success, status = DRAFT
- [ ] Create job with invalid budget (min > max) → error
- [ ] Create job with past deadline → error
- [ ] Start Bro chat → get first questions
- [ ] Answer questions → Bro continues
- [ ] Complete intake → spec_ready = true
- [ ] Generate spec → valid JSON structure
- [ ] Edit spec requirements → changes saved
- [ ] Publish without spec → error
- [ ] Publish with spec → status = PUBLISHED
- [ ] Published job appears in marketplace

---

## Files to Create/Modify

### Backend
- [ ] `backend/src/routes/jobs.py` - Job CRUD routes
- [ ] `backend/src/routes/spec.py` - Spec generation routes
- [ ] `backend/src/services/ai_spec.py` - AI spec generation logic
- [ ] `backend/src/models.py` - Add JobSpec model
- [ ] `backend/src/schemas.py` - Add job/spec schemas

### Frontend
- [ ] `frontend/src/pages/jobs/create.tsx` - Create job form
- [ ] `frontend/src/pages/jobs/[id]/spec.tsx` - Spec generation chat
- [ ] `frontend/src/pages/jobs/[id]/edit-spec.tsx` - Spec editor
- [ ] `frontend/src/pages/jobs/my.tsx` - My jobs list
- [ ] `frontend/src/components/spec/BroChat.tsx` - Chat component
- [ ] `frontend/src/components/spec/SpecEditor.tsx` - Editor component
