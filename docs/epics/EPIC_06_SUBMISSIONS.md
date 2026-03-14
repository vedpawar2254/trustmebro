# EPIC 6: Work Submission

## Overview

Freelancer submits work for milestones. Supports multiple submission types (text, links, files).

**Dependencies:** EPIC 5 (Escrow)
**Blocks:** EPIC 7 (Verification)

---

## User Stories

### SUB-1: Submit Work for Milestone

**As a** freelancer
**I want to** submit my work for a milestone
**So that** it can be verified and I can get paid

**Priority:** P0
**Points:** 3

#### Acceptance Criteria

- [ ] Select which milestone to submit for
- [ ] Choose submission type (text, link, file)
- [ ] Add optional notes
- [ ] Creates submission with PENDING status
- [ ] Employer notified
- [ ] Job status → IN_PROGRESS (on first submission)

#### API Endpoint

```
POST /api/jobs/{job_id}/submissions

Request:
{
  "milestone_id": 1,
  "submission_type": "text_paste",  // or "github_link", "file_upload"
  "content": {
    "text": "Full blog post content here...",
    // OR
    "github_link": "https://github.com/...",
    // OR
    "file_urls": ["uploads/file1.pdf"]
  },
  "notes": "Optional notes about the submission"
}

Response (201):
{
  "submission": {
    "id": 1,
    "job_id": 1,
    "milestone_id": 1,
    "freelancer_id": 2,
    "submission_type": "text_paste",
    "content": {...},
    "notes": "...",
    "status": "PENDING",
    "resubmission_count": 0,
    "created_at": "2026-03-20T10:00:00Z"
  },
  "job": {
    "status": "IN_PROGRESS"
  }
}
```

#### Validation

```python
class CreateSubmissionRequest(BaseModel):
    milestone_id: int
    submission_type: Literal["text_paste", "github_link", "file_upload"]
    content: dict
    notes: Optional[str] = None

    @validator('content')
    def validate_content(cls, v, values):
        sub_type = values.get('submission_type')

        if sub_type == 'text_paste':
            if 'text' not in v or len(v['text']) < 100:
                raise ValueError('Text submission must be at least 100 characters')

        elif sub_type == 'github_link':
            if 'github_link' not in v:
                raise ValueError('GitHub link required')
            if not v['github_link'].startswith('https://github.com/'):
                raise ValueError('Must be a valid GitHub URL')

        elif sub_type == 'file_upload':
            if 'file_urls' not in v or len(v['file_urls']) == 0:
                raise ValueError('At least one file required')

        return v
```

#### Business Logic

```python
def create_submission(job_id: int, data: CreateSubmissionRequest, user: User) -> dict:
    job = get_job(job_id)

    # Validations
    if job.assigned_freelancer_id != user.id:
        raise HTTPException(403, "Not assigned to this job")

    if job.status not in ["ESCROW_FUNDED", "IN_PROGRESS"]:
        raise HTTPException(400, "Job not ready for submissions")

    # Check milestone exists
    spec = get_job_spec(job_id)
    milestone = find_milestone(spec.milestones_json, data.milestone_id)
    if not milestone:
        raise HTTPException(400, "Invalid milestone")

    # Check for existing pending submission
    existing = get_pending_submission(job_id, data.milestone_id)
    if existing:
        raise HTTPException(400, "Already have a pending submission for this milestone")

    # Create submission
    submission = create_submission_record(
        job_id=job_id,
        milestone_id=data.milestone_id,
        freelancer_id=user.id,
        submission_type=data.submission_type,
        content_json=data.content,
        notes=data.notes,
        status="PENDING"
    )

    # Update job status if first submission
    if job.status == "ESCROW_FUNDED":
        job.status = "IN_PROGRESS"
        save_job(job)

    # Notify employer
    notify_employer_submission(job, submission)

    # Bro message
    send_bro_message(
        channel_id=get_channel_id(job_id),
        content=f"""📥 New submission!

Marcus submitted work for Milestone {data.milestone_id}: {milestone['name']}

Sarah, please review and trigger verification when ready.

[View Submission]"""
    )

    return {"submission": submission, "job": job}
```

#### UI Components

```
SubmitWorkPage:
├── Header ("Submit Work")
├── MilestoneSelector
│   └── MilestoneCard[] (radio selection)
│       ├── Name
│       ├── Deadline
│       ├── Status (pending/submitted/verified)
│       └── PayoutAmount
├── SubmissionTypeSelector
│   ├── Tab ("Text/Document")
│   ├── Tab ("GitHub Link")
│   └── Tab ("File Upload")
├── SubmissionContent
│   ├── TextPasteArea (if text selected)
│   │   └── RichTextEditor or Textarea
│   ├── GitHubLinkInput (if github selected)
│   │   ├── URLInput
│   │   ├── BranchInput (optional)
│   │   └── CommitInput (optional)
│   └── FileUploader (if file selected)
│       ├── DropZone
│       ├── FileList
│       └── UploadProgress
├── NotesTextarea ("Additional notes for the client")
├── RequirementsChecklist
│   └── Requirement[] (self-check before submit)
└── SubmitButton
```

---

### SUB-2: Multiple Submission Types

**As a** freelancer
**I want to** submit different types of work
**So that** I can deliver appropriately for each gig type

**Priority:** P0
**Points:** 2

#### Submission Types

| Type | Content Fields | Use Case |
|------|----------------|----------|
| `text_paste` | `text: string` | Blog posts, articles, copy |
| `github_link` | `github_link: string`, `branch?: string` | Code, software |
| `file_upload` | `file_urls: string[]` | Documents, images, spreadsheets |

#### File Upload (Simplified for Hackathon)

```python
# Upload endpoint
@router.post("/uploads")
async def upload_file(file: UploadFile, user: User = Depends(get_current_user)):
    # Validate file type
    allowed_types = ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx', 'png', 'jpg', 'jpeg']
    ext = file.filename.split('.')[-1].lower()
    if ext not in allowed_types:
        raise HTTPException(400, f"File type not allowed: {ext}")

    # Validate size (10MB max)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 10MB)")

    # Save locally for hackathon
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    path = f"uploads/{filename}"

    with open(path, "wb") as f:
        f.write(content)

    return {"url": path, "filename": file.filename, "size": len(content)}
```

---

### SUB-3: View Submissions (Employer)

**As an** employer
**I want to** see all submissions for my job
**So that** I can review and trigger verification

**Priority:** P0
**Points:** 1

#### Acceptance Criteria

- [ ] Shows all submissions grouped by milestone
- [ ] Shows: submission type, status, date, verification score
- [ ] Can view submission content
- [ ] Can trigger verification for pending submissions

#### API Endpoint

```
GET /api/jobs/{job_id}/submissions

Response:
{
  "submissions": [
    {
      "id": 1,
      "milestone_id": 1,
      "milestone_name": "Blog Post 1",
      "freelancer_id": 2,
      "submission_type": "text_paste",
      "status": "VERIFIED",
      "verification_score": 94,
      "created_at": "2026-03-20T10:00:00Z",
      "verified_at": "2026-03-20T10:30:00Z"
    },
    {
      "id": 2,
      "milestone_id": 2,
      "milestone_name": "Blog Post 2",
      "freelancer_id": 2,
      "submission_type": "text_paste",
      "status": "PENDING",
      "verification_score": null,
      "created_at": "2026-03-22T10:00:00Z",
      "verified_at": null
    }
  ],
  "by_milestone": {
    "1": {"status": "verified", "submission_id": 1},
    "2": {"status": "pending", "submission_id": 2},
    "3": {"status": "not_submitted"},
    "4": {"status": "not_submitted"},
    "5": {"status": "not_submitted"}
  }
}
```

#### UI Components

```
SubmissionsListPage:
├── Header ("Submissions for {job_title}")
├── MilestoneProgress
│   └── ProgressBar (2/5 milestones done)
├── MilestoneCards
│   └── MilestoneCard[]
│       ├── MilestoneHeader (name, deadline)
│       ├── Status (not submitted / pending / verified / failed)
│       ├── SubmissionPreview (if exists)
│       │   ├── Type
│       │   ├── SubmittedDate
│       │   └── VerificationScore (if verified)
│       └── Actions
│           ├── ViewButton
│           └── VerifyButton (if pending)
└── EmptyState ("Waiting for submissions")
```

---

### SUB-4: Job Status Update

**As the** system
**I want to** update job status on first submission
**So that** the workflow progresses

**Priority:** P0
**Points:** 0.5

#### Acceptance Criteria

- [ ] Job status → IN_PROGRESS when first submission created
- [ ] Status doesn't change on subsequent submissions

Already covered in SUB-1 business logic.

---

## Database Schema

```sql
-- Submissions table
CREATE TABLE submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    milestone_id INTEGER NOT NULL,
    freelancer_id INTEGER NOT NULL REFERENCES users(id),
    submission_type VARCHAR(50) NOT NULL,
    content_json JSON NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, VERIFIED, PARTIAL, FAILED
    verification_score FLOAT,
    verification_report_json JSON,
    resubmission_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_submissions_job ON submissions(job_id);
CREATE INDEX idx_submissions_milestone ON submissions(job_id, milestone_id);
CREATE INDEX idx_submissions_status ON submissions(status);
```

---

## Testing Checklist

- [ ] Cannot submit if not assigned freelancer → error
- [ ] Cannot submit if escrow not funded → error
- [ ] Submit text content → success
- [ ] Submit GitHub link → success
- [ ] Submit file → success
- [ ] First submission → job status = IN_PROGRESS
- [ ] Employer can view submissions
- [ ] Submission appears in chat via Bro

---

## Files to Create/Modify

### Backend
- [ ] `backend/src/routes/submissions.py` - Submission routes
- [ ] `backend/src/routes/uploads.py` - File upload routes
- [ ] `backend/src/models.py` - Add Submission model

### Frontend
- [ ] `frontend/src/pages/jobs/[id]/submit.tsx` - Submit work page
- [ ] `frontend/src/pages/jobs/[id]/submissions/index.tsx` - Submissions list
- [ ] `frontend/src/pages/jobs/[id]/submissions/[subId].tsx` - Submission detail
- [ ] `frontend/src/components/submissions/TextSubmission.tsx`
- [ ] `frontend/src/components/submissions/GitHubSubmission.tsx`
- [ ] `frontend/src/components/submissions/FileUploader.tsx`
