# API Contracts

This document defines all API contracts between frontend, backend, and AI engine.

## Base URLs

```
Frontend: http://localhost:3000
Backend API: http://localhost:3001/api
AI Engine: http://localhost:3002
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Or as an httpOnly cookie (preferred):

```
Cookie: token=<token>
```

---

## API Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "employer" // or "freelancer"
}
```

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "employer"
  }
}
```

**Errors:**
- `400`: Invalid input (weak password, invalid email)
- `409`: Email already registered
- `500`: Server error

---

#### POST /auth/login
Authenticate a user and return JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "employer"
  }
}
```

**Errors:**
- `400`: Missing email or password
- `401`: Invalid credentials
- `500`: Server error

---

#### POST /auth/logout
Logout user (invalidate token).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Users

#### GET /users/me
Get current user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "employer",
    "pfi_score": 92
  }
}
```

---

### Jobs

#### POST /jobs
Create a new job (draft).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Build a React E-commerce Platform",
  "description": "Looking for a full-stack developer...",
  "budget_min": 3000,
  "budget_max": 5000,
  "deadline": "2024-04-15T23:59:59Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "job_id": "job_123",
    "employer_id": "user_123",
    "title": "Build a React E-commerce Platform",
    "description": "Looking for a full-stack developer...",
    "gig_type": null,
    "gig_subtype": null,
    "budget_range": {
      "min": 3000,
      "max": 5000,
      "currency": "USD"
    },
    "deadline": "2024-04-15T23:59:59Z",
    "status": "DRAFT",
    "created_at": "2024-03-14T10:00:00Z"
  }
}
```

---

#### GET /jobs
Get list of published jobs with filtering.

**Query Parameters:**
```
gig_type: SOFTWARE | COPYWRITING | DATA_ENTRY | TRANSLATION
min_budget: number
max_budget: number
deadline_before: string (ISO 8601)
keyword: string
page: number (default: 1)
page_size: number (default: 12)
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "job_id": "job_123",
      "employer_id": "user_123",
      "title": "Build a React E-commerce Platform",
      "description": "Looking for a full-stack developer...",
      "gig_type": "SOFTWARE",
      "gig_subtype": "WEB_DEVELOPMENT",
      "budget_range": {
        "min": 3000,
        "max": 5000,
        "currency": "USD"
      },
      "deadline": "2024-04-15T23:59:59Z",
      "status": "PUBLISHED",
      "employer_name": "Alice Johnson",
      "employer_pfi": 92,
      "created_at": "2024-03-14T10:00:00Z"
    }
  ],
  "total": 12,
  "page": 1,
  "page_size": 12,
  "has_more": false
}
```

---

#### GET /jobs/:jobId
Get job details by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "job_id": "job_123",
    "employer_id": "user_123",
    "title": "Build a React E-commerce Platform",
    "description": "Looking for a full-stack developer...",
    "gig_type": "SOFTWARE",
    "gig_subtype": "WEB_DEVELOPMENT",
    "budget_range": {
      "min": 3000,
      "max": 5000,
      "currency": "USD"
    },
    "deadline": "2024-04-15T23:59:59Z",
    "status": "PUBLISHED",
    "spec": {
      "spec_id": "spec_123",
      "job_id": "job_123",
      "milestones": [...],
      "required_assets": [...],
      "version": 1,
      "is_locked": false,
      "clarifications": []
    },
    "employer_name": "Alice Johnson",
    "employer_pfi": 92,
    "created_at": "2024-03-14T10:00:00Z"
  }
}
```

---

#### POST /jobs/:jobId/spec
Generate AI spec for a job.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "job_id": "job_123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "spec_id": "spec_123",
    "job_id": "job_123",
    "gig_type": "SOFTWARE",
    "gig_subtype": "WEB_DEVELOPMENT",
    "milestones": [
      {
        "milestone_id": "m1",
        "order": 1,
        "title": "Project Setup",
        "deadline": "2024-03-20T23:59:59Z",
        "criteria": [
          {
            "criterion_id": "c1",
            "name": "Repository Structure",
            "description": "Standard Next.js structure...",
            "is_verifiable": true,
            "status": "PENDING",
            "is_vague": false,
            "vague_resolved": false,
            "weight": 0.15
          }
        ],
        "submission_requirements": [
          {
            "type": "github_link",
            "description": "GitHub repository link"
          }
        ]
      }
    ],
    "required_assets": [
      {
        "asset_id": "a1",
        "name": "Brand Guidelines",
        "description": "Logo, colors, fonts",
        "is_delivered": false
      }
    ],
    "version": 1,
    "is_locked": false,
    "clarifications": []
  }
}
```

---

#### PUT /jobs/:jobId/spec
Update job spec.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "milestones": [...],
  "required_assets": [...]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "spec_id": "spec_123",
    "version": 2,
    "is_locked": false
  }
}
```

---

#### POST /jobs/:jobId/publish
Publish a job (makes it visible to freelancers).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "job_id": "job_123",
    "status": "PUBLISHED",
    "published_at": "2024-03-14T10:30:00Z"
  }
}
```

---

### Bids

#### POST /jobs/:jobId/bids
Place a bid on a job.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "cover_letter": "I have 5 years of experience...",
  "proposed_timeline": "2024-04-20T23:59:59Z",
  "proposed_budget": 4500
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "bid_id": "bid_123",
    "job_id": "job_123",
    "freelancer_id": "user_456",
    "freelancer_name": "Bob Smith",
    "freelancer_pfi": 87,
    "cover_letter": "I have 5 years of experience...",
    "proposed_deadline": "2024-04-20T23:59:59Z",
    "proposed_budget": 4500,
    "status": "PENDING",
    "created_at": "2024-03-14T11:00:00Z"
  }
}
```

**Validation:**
- Cover letter: min 50 characters, max 5000 characters

**Errors:**
- `400`: Validation error (cover letter too short/long)
- `401`: Unauthorized
- `404`: Job not found
- `409`: User already bid on this job (update existing bid)

---

#### GET /jobs/:jobId/bids
Get all bids for a job (employer only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "bid_id": "bid_123",
      "job_id": "job_123",
      "freelancer_id": "user_456",
      "freelancer_name": "Bob Smith",
      "freelancer_pfi": 87,
      "cover_letter": "I have 5 years of experience...",
      "proposed_deadline": "2024-04-20T23:59:59Z",
      "proposed_budget": 4500,
      "status": "PENDING",
      "created_at": "2024-03-14T11:00:00Z"
    }
  ]
}
```

---

#### POST /jobs/:jobId/assign
Assign a freelancer to a job (employer only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "bid_id": "bid_123",
  "freelancer_id": "user_456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "job_id": "job_123",
    "status": "ASSIGNED",
    "assigned_freelancer_id": "user_456",
    "assigned_at": "2024-03-14T12:00:00Z"
  }
}
```

---

### Escrow

#### POST /jobs/:jobId/escrow
Fund escrow for a job (employer only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 4500
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "escrow_id": "escrow_123",
    "job_id": "job_123",
    "amount": 4500,
    "currency": "USD",
    "status": "FUNDED",
    "funded_at": "2024-03-14T13:00:00Z"
  }
}
```

---

#### GET /jobs/:jobId/escrow
Get escrow status.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "escrow_id": "escrow_123",
    "job_id": "job_123",
    "amount": 4500,
    "currency": "USD",
    "status": "FUNDED",
    "funded_at": "2024-03-14T13:00:00Z"
  }
}
```

---

### Submissions

#### POST /jobs/:jobId/submissions
Submit work for a milestone.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
milestone_id: m1
submission_type: github_link
github_link: https://github.com/user/repo

OR

milestone_id: m1
submission_type: file_upload
files: [File]

OR

milestone_id: m1
submission_type: text_paste
text_content: "Here is the content..."

OR

milestone_id: m1
submission_type: document_pair
source_document: [File]
target_document: [File]
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "submission_id": "sub_123",
    "job_id": "job_123",
    "milestone_id": "m1",
    "freelancer_id": "user_456",
    "submission_type": "github_link",
    "github_link": "https://github.com/user/repo",
    "status": "PENDING",
    "resubmission_count": 0,
    "resubmissions_remaining": 2,
    "created_at": "2024-03-14T14:00:00Z"
  }
}
```

---

#### GET /jobs/:jobId/submissions/:submissionId
Get submission details and verification report.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "submission_id": "sub_123",
    "job_id": "job_123",
    "milestone_id": "m1",
    "freelancer_id": "user_456",
    "submission_type": "github_link",
    "github_link": "https://github.com/user/repo",
    "status": "VERIFIED",
    "verification_report": {
      "milestone_id": "m1",
      "gig_type": "SOFTWARE",
      "gig_subtype": "WEB_DEVELOPMENT",
      "overall_score": 72,
      "payment_decision": "HOLD",
      "criteria": [
        {
          "name": "Repo Structure",
          "type": "PRIMARY",
          "status": "PASS",
          "detail": "Standard Next.js structure...",
          "weight": 0.15
        },
        {
          "name": "Feature Implementation",
          "type": "PRIMARY",
          "status": "FAIL",
          "detail": "Missing password reset flow",
          "weight": 0.4
        }
      ],
      "pfi_signals": [
        {
          "name": "Code Quality",
          "status": "WARNING",
          "detail": "Some TODO comments in production code"
        }
      ],
      "resubmissions_remaining": 2,
      "feedback_for_freelancer": "Implement password reset flow...",
      "created_at": "2024-03-14T14:30:00Z"
    },
    "resubmission_count": 0,
    "resubmissions_remaining": 2,
    "created_at": "2024-03-14T14:00:00Z"
  }
}
```

---

### Chat

#### POST /chat/:channelId/messages
Send a message to a chat channel.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "For milestone 2, did you want the export in CSV or PDF?",
  "attachments": []
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "message_id": "msg_123",
    "channel_id": "channel_123",
    "sender": "freelancer",
    "content": "For milestone 2, did you want the export in CSV or PDF?",
    "timestamp": "2024-03-14T10:30:00Z",
    "type": "question"
  }
}
```

---

#### GET /chat/:channelId/messages
Get all messages for a chat channel.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
limit: number (default: 50, max: 100)
before: string (message_id for pagination)
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "message_id": "msg_123",
      "channel_id": "channel_123",
      "sender": "freelancer",
      "content": "For milestone 2, did you want the export in CSV or PDF?",
      "timestamp": "2024-03-14T10:30:00Z",
      "type": "question"
    },
    {
      "message_id": "msg_124",
      "channel_id": "channel_123",
      "sender": "ai_mediator",
      "content": "This appears to be a spec gap — the export format wasn't defined...",
      "timestamp": "2024-03-14T10:31:00Z",
      "type": "question",
      "ai_action": {
        "action_type": "spec_gap_intercept",
        "ai_response": "This appears to be a spec gap — the export format wasn't defined...",
        "requires_response": true,
        "response_type": "spec_clarification"
      }
    }
  ]
}
```

---

## AI Engine Endpoints

### Spec Generation

#### POST /ai/generate-spec
Generate job spec from description.

**Request Body:**
```json
{
  "job_id": "job_123",
  "title": "Build a React E-commerce Platform",
  "description": "Looking for a full-stack developer to build a modern e-commerce platform..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "gig_type": "SOFTWARE",
    "gig_subtype": "WEB_DEVELOPMENT",
    "milestones": [...],
    "required_assets": [...],
    "vague_items": [
      {
        "description": "good user experience",
        "reason": "Too subjective to verify",
        "suggestion": "Define specific UX metrics or requirements"
      }
    ]
  }
}
```

---

### Verification

#### POST /ai/verify
Verify a submission and generate verification report.

**Request Body:**
```json
{
  "milestone_id": "m1",
  "job_id": "job_123",
  "submission": {
    "type": "github_link",
    "github_url": "https://github.com/user/repo"
  },
  "criteria": [
    {
      "name": "Repo Structure",
      "check_type": "code_structure",
      "weight": 0.15
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "milestone_id": "m1",
    "gig_type": "SOFTWARE",
    "gig_subtype": "WEB_DEVELOPMENT",
    "overall_score": 72,
    "payment_decision": "HOLD",
    "criteria": [
      {
        "name": "Repo Structure",
        "type": "PRIMARY",
        "status": "PASS",
        "detail": "Standard Next.js structure...",
        "weight": 0.15
      },
      {
        "name": "Feature Implementation",
        "type": "PRIMARY",
        "status": "FAIL",
        "detail": "Missing password reset flow",
        "weight": 0.4
      }
    ],
    "pfi_signals": [
      {
        "name": "Code Quality",
        "status": "WARNING",
        "detail": "Some TODO comments in production code"
      }
    ],
    "resubmissions_remaining": 2,
    "feedback_for_freelancer": "Implement password reset flow..."
  }
}
```

---

### Chat AI

#### POST /ai/chat-respond
Generate AI response to a chat message.

**Request Body:**
```json
{
  "channel_id": "channel_123",
  "message_id": "msg_123",
  "content": "For milestone 2, did you want the export in CSV or PDF?",
  "sender": "freelancer",
  "spec_context": {
    "milestones": [...],
    "clarifications": [...]
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "action_type": "spec_gap_intercept",
    "ai_response": "This appears to be a spec gap — the export format wasn't defined. Client, your answer will be logged as a formal spec clarification and will be binding. Please confirm: CSV or PDF?",
    "requires_response": true,
    "response_type": "spec_clarification"
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE" // Optional
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing authentication token |
| `FORBIDDEN` | User doesn't have permission for this action |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request data |
| `ALREADY_EXISTS` | Resource already exists |
| `RATE_LIMITED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

---

## Rate Limiting

- **Unauthenticated**: 100 requests per hour
- **Authenticated**: 1000 requests per hour

Rate limit headers included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1678848000
```

---

## File Uploads

### Supported File Types

| Type | Extensions | Max Size |
|------|-----------|----------|
| Documents | .pdf, .doc, .docx, .txt | 10MB |
| Spreadsheets | .csv, .xlsx, .xls | 10MB |
| Images | .png, .jpg, .jpeg, .gif | 5MB |
| Archives | .zip | 20MB |

### Upload Process

1. Client makes POST request with multipart/form-data
2. Backend validates file type and size
3. File stored in secure storage (S3, local filesystem, etc.)
4. URL returned to client
5. Client uses URL in subsequent API calls

---

## Webhooks

### Submission Verified

Backend sends webhook to registered URLs when a submission is verified.

**Payload:**
```json
{
  "event": "submission.verified",
  "submission_id": "sub_123",
  "job_id": "job_123",
  "milestone_id": "m1",
  "overall_score": 72,
  "payment_decision": "HOLD",
  "timestamp": "2024-03-14T14:30:00Z"
}
```

### Payment Released

**Payload:**
```json
{
  "event": "payment.released",
  "job_id": "job_123",
  "milestone_id": "m1",
  "amount": 4500,
  "currency": "USD",
  "to": "user_456",
  "timestamp": "2024-03-14T15:00:00Z"
}
```

---

## Version

Current API version: `v1`

All endpoints should be prefixed with `/api/v1/`.

---

## Changes

This contract is versioned. Breaking changes will increment the version number.

See CHANGELOG.md for version history.
