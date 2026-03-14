# TrustMeBro - Frontend Requirements

## Project Overview

TrustMeBro is a freelance marketplace platform with AI-powered escrow management and submission verification. The frontend must support two distinct user roles (Employer & Freelancer) with role-specific interfaces.

---

## Pages Overview

| # | Page | URL | Auth Required | Roles |
|---|------|-----|---------------|-------|
| 1 | Landing Page | `/` | No | All |
| 2 | Login | `/login` | No | All |
| 3 | Register | `/register` | No | All |
| 4 | Email Verification | `/verify-email` | No | All |
| 5 | Dashboard | `/dashboard` | Yes | Both |
| 6 | Job Marketplace | `/jobs` | No | All |
| 7 | Job Details | `/jobs/:id` | No | All |
| 8 | Create Job | `/jobs/create` | Yes | Employer |
| 9 | Manage Job | `/jobs/:id/manage` | Yes | Employer |
| 10 | My Jobs | `/my-jobs` | Yes | Both |
| 11 | Place Bid | `/jobs/:id/bid` | Yes | Freelancer |
| 12 | My Bids | `/my-bids` | Yes | Freelancer |
| 13 | Job Chat | `/jobs/:id/chat` | Yes | Both |
| 14 | Submit Work | `/jobs/:id/submit` | Yes | Freelancer |
| 15 | Submission Review | `/jobs/:id/submissions/:subId` | Yes | Both |
| 16 | Escrow Management | `/jobs/:id/escrow` | Yes | Employer |
| 17 | Profile Settings | `/settings` | Yes | Both |
| 18 | 404 Not Found | `*` | No | All |

---

## Page Details

---

### 1. Landing Page (`/`)

**Purpose:** Marketing page introducing the platform and its key features.

**Sections:**
- **Hero Section**
  - Headline: "Freelancing with Trust & AI-Powered Verification"
  - Subheadline explaining escrow + AI verification concept
  - Two CTAs: "Hire Talent" (→ `/register?role=employer`) | "Find Work" (→ `/register?role=freelancer`)

- **How It Works**
  - 4-step visual flow for Employers: Post Job → Review Bids → Fund Escrow → Auto-Verified Payment
  - 4-step visual flow for Freelancers: Browse Jobs → Place Bid → Submit Work → Get Paid

- **Key Features Section**
  - AI-Generated Job Specs & Milestones
  - Smart Submission Verification
  - Secure Escrow Payments
  - PFI (Platform Feedback Index) Trust Scores

- **Gig Categories**
  - Display 4 categories: Software, Copywriting, Data Entry, Translation
  - Each with icons and example subtypes

- **Testimonials** (placeholder)

- **Footer**
  - Links: About, How It Works, Contact, Terms, Privacy
  - Login/Register buttons

---

### 2. Login Page (`/login`)

**Purpose:** Authenticate existing users.

**Components:**
- Logo/Brand
- Email input field
- Password input field (with show/hide toggle)
- "Remember me" checkbox
- Submit button: "Log In"
- Link: "Forgot password?" (future feature)
- Link: "Don't have an account? Register"
- Error display for invalid credentials

**Validation:**
- Email: Required, valid email format
- Password: Required

**API:** `POST /api/auth/login`

**On Success:** Redirect to `/dashboard`

---

### 3. Register Page (`/register`)

**Purpose:** Create new user accounts.

**Components:**
- Logo/Brand
- Role selector: Two cards/tabs - "I want to hire" (Employer) | "I want to work" (Freelancer)
- Full Name input
- Email input
- Password input (with strength indicator)
- Confirm Password input
- Terms & Conditions checkbox
- Submit button: "Create Account"
- Link: "Already have an account? Log In"
- Error display for validation failures

**Validation:**
- Name: Required, 2-255 characters
- Email: Required, valid format, unique
- Password: Required, min 8 characters, must contain letter + digit
- Confirm Password: Must match password
- Terms: Must be checked

**API:** `POST /api/auth/register`

**On Success:**
- Show "Verification email sent" message
- Redirect to `/dashboard` with email verification banner

---

### 4. Email Verification Page (`/verify-email`)

**Purpose:** Handle email verification tokens.

**URL Params:** `?token=<verification_token>`

**Components:**
- Loading state while verifying
- Success state: "Email verified! Redirecting..."
- Error state: "Invalid or expired token" with resend option

**API:** `POST /api/auth/verify-email`

**On Success:** Redirect to `/dashboard` after 2 seconds

---

### 5. Dashboard (`/dashboard`)

**Purpose:** Role-specific overview of user's activity.

---

#### 5a. Employer Dashboard

**Sections:**

- **Stats Overview Cards**
  - Total Jobs Posted
  - Active Jobs (in progress)
  - Pending Bids to Review
  - Completed Jobs

- **PFI Score Display**
  - Circular progress indicator showing score (0-100)
  - Score label (e.g., "Excellent", "Good", "Fair")

- **Quick Actions**
  - "Post New Job" button → `/jobs/create`
  - "View Marketplace" button → `/jobs`

- **Active Jobs Table**
  - Columns: Job Title, Status, Freelancer, Deadline, Actions
  - Status badges: DRAFT, PUBLISHED, ASSIGNED, ESCROW_FUNDED, IN_PROGRESS, COMPLETED, DISPUTED
  - Actions: View, Manage, Chat
  - Link: "View All Jobs" → `/my-jobs`

- **Recent Submissions Requiring Review**
  - List of submissions awaiting verification
  - Show: Job title, Milestone, Freelancer, Submitted date
  - Quick action: "Review" → `/jobs/:id/submissions/:subId`

- **Pending Bids**
  - Count of unreviewed bids across all jobs
  - List of recent bids with freelancer name, job, proposed budget
  - Quick action: "Review Bids" → `/jobs/:id/manage`

---

#### 5b. Freelancer Dashboard

**Sections:**

- **Stats Overview Cards**
  - Active Jobs (assigned)
  - Pending Bids
  - Completed Jobs
  - Total Earnings (from released escrows)

- **PFI Score Display**
  - Circular progress indicator showing score (0-100)
  - Score label

- **Quick Actions**
  - "Browse Jobs" button → `/jobs`
  - "View My Bids" button → `/my-bids`

- **Current Assignments Table**
  - Columns: Job Title, Employer, Status, Deadline, Next Milestone, Actions
  - Actions: View, Chat, Submit Work

- **Milestones Due Soon**
  - List of upcoming milestone deadlines
  - Show: Job title, Milestone name, Due date, Days remaining
  - Color coding: Red (<3 days), Yellow (3-7 days), Green (>7 days)

- **Recent Submission Status**
  - Last 5 submissions with verification status
  - Status badges: PENDING, VERIFIED, PARTIAL, FAILED
  - Show verification score where applicable

- **Pending Bid Status**
  - List of active bids with status
  - Show: Job title, Proposed budget, Days since bid

---

### 6. Job Marketplace (`/jobs`)

**Purpose:** Browse and search all published jobs.

**Components:**

- **Search Bar**
  - Keyword search input
  - Search button

- **Filters Sidebar/Panel**
  - Gig Type dropdown: All, Software, Copywriting, Data Entry, Translation
  - Gig Subtype dropdown (dynamic based on type selection)
  - Budget Range: Min/Max inputs or slider
  - Deadline: Date picker or preset options (This week, This month, etc.)
  - Clear Filters button

- **Sort Dropdown**
  - Options: Newest First, Deadline (Soonest), Budget (High to Low), Budget (Low to High)

- **Results Count**
  - "Showing X jobs"

- **Job Cards Grid/List**
  Each card displays:
  - Job Title (clickable → `/jobs/:id`)
  - Employer name + PFI score badge
  - Gig Type & Subtype tags
  - Budget range: "$X - $Y"
  - Deadline with countdown
  - Description excerpt (first 150 chars)
  - Number of bids placed
  - "View Details" button

- **Pagination**
  - Page numbers or infinite scroll
  - Items per page selector (10, 20, 50)

- **Empty State**
  - "No jobs found matching your criteria"
  - Suggestion to adjust filters

**API:** `GET /api/jobs` with query params: `gig_type`, `budget_min`, `budget_max`, `deadline_before`, `keyword`, `skip`, `limit`

---

### 7. Job Details Page (`/jobs/:id`)

**Purpose:** View complete job information, specs, and place bids.

**Layout:** Two-column on desktop (main content + sidebar)

**Main Content:**

- **Header**
  - Job Title
  - Status badge
  - Gig Type & Subtype tags
  - Posted date / Published date

- **Employer Info Card**
  - Employer name
  - PFI Score with visual indicator
  - Member since date
  - Jobs completed count (if available)

- **Job Description**
  - Full description text
  - Markdown rendering support

- **Budget & Timeline**
  - Budget: "$X - $Y"
  - Deadline: Date + "X days remaining"

- **Job Specification** (if generated)
  - Lock status indicator
  - Milestones accordion/list:
    - Milestone number & name
    - Description/Criteria
    - Deliverables list
    - Deadline
  - Required Assets list

**Sidebar:**

- **Bid CTA** (Freelancer only, if job is PUBLISHED)
  - "Place Your Bid" button → `/jobs/:id/bid`
  - Or "Bid Placed" indicator if already bid

- **Employer Actions** (Employer only, if owner)
  - "Manage Job" button → `/jobs/:id/manage`
  - "View Bids" button
  - "Edit" button (if DRAFT)

- **Assigned Freelancer** (if assigned)
  - Freelancer name + PFI score
  - "Open Chat" button

- **Job Stats**
  - Number of bids
  - Views count (if tracked)

- **Similar Jobs** (optional)
  - 2-3 related job cards

---

### 8. Create Job Page (`/jobs/create`)

**Purpose:** Multi-step job creation wizard for employers.

**Access:** Employer only

**Steps:**

#### Step 1: Basic Information
- Job Title input (10-500 chars)
- Job Description textarea (min 50 chars, rich text optional)
- Gig Type dropdown
- Gig Subtype dropdown (dynamic)
- Budget Min input
- Budget Max input
- Deadline date picker
- "Save as Draft" button
- "Next: Generate Spec" button

#### Step 2: AI Specification Generation
- Display: "Generating AI-powered job specification..."
- Loading animation
- On completion, show:
  - Generated Milestones with edit capability
  - Required Assets list with edit capability
  - "Regenerate Spec" button
  - "Edit Spec" button (inline editing)
  - "Next: Review" button

#### Step 3: Review & Lock Spec
- Read-only display of complete job details
- Milestones summary
- Required Assets summary
- Warning: "Once locked, the specification cannot be changed"
- "Edit" button (goes back to Step 2)
- "Lock Specification" button
- Confirmation modal for locking

#### Step 4: Publish
- Final review of all details
- "Save as Draft" option
- "Publish Job" button
- Success confirmation → Redirect to `/jobs/:id`

**APIs:**
- `POST /api/jobs` - Create draft
- `POST /api/jobs/:id/spec` - Generate spec
- `PUT /api/jobs/:id/spec` - Update spec
- `POST /api/jobs/:id/spec/lock` - Lock spec
- `POST /api/jobs/:id/publish` - Publish job

---

### 9. Manage Job Page (`/jobs/:id/manage`)

**Purpose:** Employer's command center for managing a specific job.

**Access:** Employer (job owner) only

**Layout:** Tabbed interface

#### Tab: Overview
- Job status with status change history
- Key metrics: Bids received, Days to deadline, Escrow status
- Current milestone progress
- Quick actions based on status

#### Tab: Bids (if PUBLISHED or later)
- Bid cards/table:
  - Freelancer name + PFI score + avatar
  - Cover letter (expandable)
  - Proposed budget
  - Proposed deadline
  - Bid date
  - Actions: "Accept Bid" | "Reject Bid" | "View Profile"
- Sorting: Date, Budget, PFI Score
- Filtering: Pending only, All
- Accept bid triggers assignment flow

#### Tab: Specification
- View locked/unlocked spec
- Milestones list
- Required assets
- Edit button (if unlocked)

#### Tab: Submissions (if IN_PROGRESS or later)
- Submissions table:
  - Milestone
  - Submitted date
  - Type (GitHub/File/Text)
  - Status badge
  - Verification score
  - Actions: "View" | "Verify"
- Verify triggers AI verification

#### Tab: Escrow
- Current escrow status
- Amount funded
- Fund escrow form (if not funded)
- Release button (if all milestones verified)
- Refund button (for disputes)
- Transaction history

#### Tab: Change Requests
- List of pending/resolved change requests
- Approve/Reject buttons for pending
- Request details: Type, Description, Proposed changes

#### Tab: Chat
- Embedded chat interface
- Link to full chat page

**APIs:** Multiple (bids, submissions, escrow, chat endpoints)

---

### 10. My Jobs Page (`/my-jobs`)

**Purpose:** List all jobs relevant to the current user.

---

#### 10a. Employer View
- Table/cards of all jobs created by employer
- Columns: Title, Status, Bids, Freelancer, Deadline, Actions
- Filters: Status dropdown
- Actions: View, Manage, Delete (if DRAFT)

#### 10b. Freelancer View
- Table/cards of all assigned jobs
- Columns: Title, Employer, Status, Deadline, Next Milestone, Actions
- Filters: Status dropdown
- Actions: View, Chat, Submit Work

**API:** `GET /api/jobs/my`

---

### 11. Place Bid Page (`/jobs/:id/bid`)

**Purpose:** Freelancer submits a bid for a job.

**Access:** Freelancer only, job must be PUBLISHED

**Components:**

- **Job Summary Card**
  - Job title
  - Budget range
  - Deadline
  - Quick link to full job details

- **Bid Form**
  - Cover Letter textarea (50-5000 chars)
    - Character counter
    - Tips: "Explain your relevant experience and approach"
  - Proposed Budget input (optional)
    - Must be within job's budget range
  - Proposed Timeline date picker (optional)
    - Must be before job deadline
  - "Submit Bid" button

- **Guidelines Panel**
  - Tips for writing effective bids
  - Reminder about PFI score impact

**Validation:**
- Cover letter: 50-5000 characters
- Budget: Optional, but must be within range if provided
- Timeline: Optional, but must be valid date before deadline

**API:** `POST /api/jobs/:id/bids`

**On Success:** Redirect to `/my-bids` with success toast

---

### 12. My Bids Page (`/my-bids`)

**Purpose:** Freelancer views all their submitted bids.

**Access:** Freelancer only

**Components:**

- **Stats Cards**
  - Total Bids
  - Pending
  - Accepted
  - Rejected

- **Bids Table/Cards**
  - Columns: Job Title, Employer, Proposed Budget, Status, Date, Actions
  - Status badges: PENDING, ACCEPTED, REJECTED, WITHDRAWN
  - Actions:
    - View Job
    - Withdraw (if PENDING)

- **Filters**
  - Status dropdown

- **Empty State**
  - "No bids yet"
  - CTA: "Browse Jobs" → `/jobs`

**APIs:**
- `GET /api/jobs/my` (filter for jobs user has bid on)
- `DELETE /api/jobs/:id/bids/:bidId` (withdraw)

---

### 13. Job Chat Page (`/jobs/:id/chat`)

**Purpose:** Real-time communication between employer and freelancer.

**Access:** Employer or assigned Freelancer only

**Layout:** Full-page chat interface

**Components:**

- **Chat Header**
  - Job title
  - Other party's name + avatar
  - Job status badge
  - "View Job" link
  - Close chat button (Employer only, if job completed)

- **Messages Area**
  - Scrollable message list
  - Message bubbles:
    - Sender avatar
    - Sender name
    - Message content
    - Timestamp
    - AI indicator for AI-generated messages
  - AI Mediator messages styled differently (warning/info style)
  - Date separators between days
  - Scroll to bottom button

- **Message Input**
  - Textarea for message (1-5000 chars)
  - Send button
  - Character counter
  - Disabled state if chat is closed

- **Sidebar** (collapsible on mobile)
  - Job quick info
  - Milestones status
  - Change request quick actions
  - Report issue button

**Real-time Updates:**
- Polling every 3-5 seconds OR WebSocket connection
- New message indicators
- Typing indicator (optional)

**APIs:**
- `GET /api/jobs/:id/chat` - Get channel
- `GET /api/jobs/:id/chat/messages` - Get messages (paginated)
- `POST /api/jobs/:id/chat/messages` - Send message
- `GET /api/jobs/:id/chat/new` - Poll for new messages
- `POST /api/jobs/:id/chat/close` - Close channel

---

### 14. Submit Work Page (`/jobs/:id/submit`)

**Purpose:** Freelancer submits deliverables for a milestone.

**Access:** Freelancer (assigned) only, job must be ESCROW_FUNDED or IN_PROGRESS

**Components:**

- **Job & Milestone Info**
  - Job title
  - Current escrow status
  - Milestones list with completion status

- **Milestone Selector**
  - Dropdown to select which milestone
  - Show milestone criteria and deliverables

- **Submission Form**
  - Submission Type selector:
    - GitHub Link
    - File Upload
    - Text Paste
    - Document Pair (for translation)

  - **GitHub Link Fields** (if selected)
    - Repository URL input
    - Branch input (optional)
    - Commit hash input (optional)

  - **File Upload Fields** (if selected)
    - Drag-and-drop zone
    - File browser button
    - Multiple files support
    - File list with remove option
    - Max 10MB per file indicator
    - Allowed types: pdf, doc, docx, txt, csv, xlsx, xls, png, jpg, jpeg, gif, zip

  - **Text Paste Fields** (if selected)
    - Large textarea
    - Character/word count

  - **Document Pair Fields** (if selected, for translation)
    - Source document URL/upload
    - Translated document text/upload

- **Submission Notes** (optional)
  - Textarea for additional context

- **Resubmission Info** (if resubmitting)
  - Previous submission status
  - Verification feedback
  - Remaining attempts: "X of 2 resubmissions remaining"

- **Submit Button**
  - "Submit for Verification"
  - Loading state during upload

**APIs:**
- `POST /api/uploads` - Upload files first
- `POST /api/jobs/:id/submissions` - Create submission
- `POST /api/jobs/:id/submissions/:id/resubmit` - Resubmit

---

### 15. Submission Review Page (`/jobs/:id/submissions/:subId`)

**Purpose:** View submission details and verification results.

**Access:** Employer or Freelancer (job participants only)

**Components:**

- **Submission Header**
  - Job title
  - Milestone name
  - Submission date
  - Status badge

- **Submission Content**
  - Type indicator
  - GitHub link (clickable)
  - File list with download links
  - Text content (expandable)
  - Document pair display

- **Verification Section** (if verified)
  - Verification Score: Large circular indicator (0-100)
  - Score interpretation:
    - ≥90: "Verified - Excellent Work" (green)
    - 50-89: "Partial - Revisions Needed" (yellow)
    - <50: "Failed - Does Not Meet Criteria" (red)
  - Verification Report:
    - Criteria checklist with pass/fail
    - AI feedback comments
    - Improvement suggestions
  - Verified date

- **Actions** (based on role and status)
  - Employer:
    - "Verify with AI" button (if PENDING)
    - "Request Revisions" (manual note to freelancer)
  - Freelancer:
    - "Resubmit" button (if PARTIAL/FAILED and attempts remaining)
    - Resubmissions remaining indicator

- **Submission History**
  - Timeline of submissions for this milestone
  - Previous attempts with scores

**APIs:**
- `GET /api/jobs/:id/submissions/:id`
- `POST /api/jobs/:id/submissions/:id/verify`
- `POST /api/jobs/:id/submissions/:id/resubmit`

---

### 16. Escrow Management Page (`/jobs/:id/escrow`)

**Purpose:** Employer manages escrow payments for a job.

**Access:** Employer only

**Components:**

- **Escrow Status Card**
  - Current status badge: FUNDED, HELD, RELEASED, REFUNDED
  - Amount: "$X USD"
  - Funded date

- **Fund Escrow Form** (if not funded)
  - Amount input
  - Minimum required: Job's budget_min
  - Payment method selection (placeholder)
  - "Fund Escrow" button
  - Terms reminder: "Funds held until work verified"

- **Release Controls** (if funded)
  - Milestone completion checklist
  - All milestones verified indicator
  - "Release Payment" button (enabled when all verified)
  - Confirmation modal: "Release $X to [Freelancer]?"

- **Refund Controls** (if funded)
  - "Request Refund" button
  - Reason textarea
  - Warning: "This will initiate a dispute"

- **Transaction History**
  - Timeline:
    - Escrow funded: Date, Amount
    - Released: Date, Amount, To whom
    - Refunded: Date, Amount, Reason

**APIs:**
- `GET /api/jobs/:id/escrow`
- `POST /api/jobs/:id/escrow`
- `POST /api/jobs/:id/escrow/release`
- `POST /api/jobs/:id/escrow/refund`

---

### 17. Profile Settings Page (`/settings`)

**Purpose:** User account management.

**Tabs:**

#### Profile Tab
- Avatar upload
- Name input
- Email display (read-only)
- Role display (read-only)
- PFI Score display
- Member since date
- "Save Changes" button

#### Security Tab
- Change password form:
  - Current password
  - New password
  - Confirm new password
- Email verification status
- "Resend Verification" button (if not verified)

#### Notifications Tab (future)
- Email notification preferences
- In-app notification preferences

#### Account Tab
- Account deletion option
- Export data option

**APIs:**
- `GET /api/users/me`
- `PUT /api/users/me` (future)
- `POST /api/auth/resend-verification`

---

### 18. 404 Not Found Page

**Components:**
- Large "404" display
- "Page not found" message
- "Go to Dashboard" button
- "Go to Homepage" button

---

## Global Components

### Navigation Bar

**Unauthenticated:**
- Logo → `/`
- "Browse Jobs" → `/jobs`
- "How It Works" → `/#how-it-works`
- "Login" button → `/login`
- "Register" button → `/register`

**Authenticated:**
- Logo → `/dashboard`
- "Dashboard" → `/dashboard`
- "Jobs" dropdown:
  - "Browse Jobs" → `/jobs`
  - "My Jobs" → `/my-jobs`
  - "Create Job" (Employer) → `/jobs/create`
  - "My Bids" (Freelancer) → `/my-bids`
- Notifications bell (count badge)
- User menu dropdown:
  - User name + avatar
  - PFI Score badge
  - "Settings" → `/settings`
  - "Logout"

### Email Verification Banner
- Shown when user is logged in but email not verified
- Yellow warning banner at top
- "Please verify your email" message
- "Resend" button

### Toast Notifications
- Success, Error, Warning, Info variants
- Auto-dismiss after 5 seconds
- Position: Top-right
- Actions: View, Dismiss

### Loading States
- Full-page loader for initial loads
- Skeleton loaders for content areas
- Button loading states
- Progress indicators for uploads

### Error Handling
- Error boundary for component crashes
- API error display components
- Retry mechanisms
- Offline indicator

### Modal/Dialog System
- Confirmation dialogs
- Form modals
- Image previews
- PDF viewer modal

---

## Responsive Design Requirements

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Adaptations
- Hamburger menu for navigation
- Single-column layouts
- Bottom sheet for filters
- Swipe gestures for cards
- Touch-friendly tap targets (min 44px)
- Collapsible sidebars

### Desktop Features
- Multi-column layouts
- Hover states
- Keyboard navigation
- Side-by-side panels

---

## State Management Requirements

### Global State
- User authentication state
- Current user profile
- Notification count
- Theme preference

### Per-Page State
- Form data
- Filter selections
- Pagination state
- Sort preferences

### Cache Requirements
- Job listings (short TTL)
- User profile (medium TTL)
- Job specs (long TTL, immutable when locked)

---

## Real-time Features

### Chat
- Polling: GET new messages every 3-5 seconds
- Or WebSocket for live updates
- Unread message indicators
- Sound/visual notifications

### Notifications
- Bid received (Employer)
- Bid accepted/rejected (Freelancer)
- New submission (Employer)
- Verification complete (Freelancer)
- New chat message
- Escrow funded/released
- Deadline reminders

---

## Accessibility Requirements

- WCAG 2.1 AA compliance
- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios (4.5:1 minimum)
- Focus indicators
- Alt text for images
- Error announcements

---

## Security Considerations

### Authentication
- JWT token storage (httpOnly cookies preferred)
- Token refresh mechanism
- Automatic logout on token expiry
- CSRF protection

### Input Validation
- Client-side validation matching server rules
- XSS prevention (sanitize user content)
- File upload validation (type, size)

### Protected Routes
- Route guards for authenticated pages
- Role-based route protection
- Redirect unauthorized access

---

## File Upload Specifications

### Allowed Types
- Documents: pdf, doc, docx, txt
- Spreadsheets: csv, xlsx, xls
- Images: png, jpg, jpeg, gif
- Archives: zip

### Size Limits
- Maximum: 10MB per file
- Multiple files allowed

### Upload UX
- Progress indicator
- Cancel upload option
- Preview for images
- File type icons

---

## Status Badges Reference

### Job Status
| Status | Color | Description |
|--------|-------|-------------|
| DRAFT | Gray | Not yet published |
| PUBLISHED | Blue | Open for bids |
| ASSIGNED | Purple | Freelancer assigned |
| ESCROW_FUNDED | Orange | Payment held |
| IN_PROGRESS | Yellow | Work underway |
| COMPLETED | Green | Successfully finished |
| DISPUTED | Red | Issue raised |

### Bid Status
| Status | Color |
|--------|-------|
| PENDING | Yellow |
| ACCEPTED | Green |
| REJECTED | Red |
| WITHDRAWN | Gray |

### Submission Status
| Status | Color |
|--------|-------|
| PENDING | Yellow |
| VERIFIED | Green |
| PARTIAL | Orange |
| FAILED | Red |

### Escrow Status
| Status | Color |
|--------|-------|
| FUNDED | Blue |
| HELD | Yellow |
| RELEASED | Green |
| REFUNDED | Orange |

---

## API Integration Notes

### Base URL
```
/api
```

### Authentication Header
```
Authorization: Bearer <jwt_token>
```

### Pagination Pattern
```
?skip=0&limit=20
```

### Common Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response Format
```json
{
  "detail": "Error message"
}
```

---

## Recommended Tech Stack

- **Framework:** React 18+ or Next.js 14+
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand or React Query
- **Forms:** React Hook Form + Zod
- **Routing:** React Router or Next.js App Router
- **HTTP Client:** Axios or fetch with wrapper
- **Real-time:** Socket.io or polling utility
- **File Upload:** react-dropzone
- **Rich Text:** TipTap or Slate (if needed)
- **Charts:** Recharts (for dashboard stats)
- **Date Handling:** date-fns
- **Icons:** Lucide React
