# trustmebro — UI Design Specification

## Design Philosophy

This platform is about **trust** and **clarity**. Every UI decision should reinforce:
- Transparency: What's happening is always visible
- Authority: The AI mediator feels in control, not passive
- Professionalism: This is serious business, not a casual chat app
- Edge cases: Real disputes exist, and the UI must handle tension

---

## Color Palette

### Primary Colors
```
Primary (Actions):      #1a4d2e  — Forest Green
Hover:                  #2d6a4f
Active:                 #0f3820

Secondary (Structure):  #f8fafc  — Cool White
Background:             #faf7f2  — Warm Cream
Cards/Sections:         #ffffff  — Pure White
Borders:                #e2e8f0  — Light Gray

Text Colors:
Headings:               #1e293b  — Charcoal
Body:                   #475569  — Slate
Muted:                  #94a3b8  — Soft Gray
```

### Semantic Colors
```
Success (Pass):         #16a34a  — Green
Warning (Hold/Partial): #f59e0b  — Amber
Error (Fail/Dispute):   #dc2626  — Red
Info (AI Mediator):     #0891b2  — Cyan
```

### Usage Rules
- **Never** use pure black (#000000) or pure white (#ffffff) as text
- **Always** add 4px border-radius for cards, 8px for buttons
- **Never** use more than 3 semantic colors on one screen
- **Always** use warm cream background for main content, pure white for cards
- **Never** use generic blue as primary

---

## Typography

### Font Stack
```
Primary:  "IBM Plex Sans", system-ui, sans-serif
Mono:     "JetBrains Mono", monospace
Headings: "Space Grotesk", sans-serif (for numbers and headers)
```

### Size Scale
```
Hero Title:     32px  (h1)
Section Title:  24px  (h2)
Card Title:     18px  (h3)
Body Large:     16px  (p)
Body:           14px  (p)
Small:          12px  (caption)
Tiny:           10px  (microcopy)
```

### Weight Scale
```
Regular:  400
Medium:   500
Semibold: 600
Bold:     700
```

### Usage Rules
- **Hero Titles** (h1): Space Grotesk, Bold, Charcoal
- **Section Titles** (h2): IBM Plex Sans, Semibold, Charcoal
- **Card Titles** (h3): IBM Plex Sans, Semibold, Slate
- **Body Text**: IBM Plex Sans, Regular, Slate
- **Numbers**: Space Grotesk, Semibold (for scores, amounts)
- **Code/Mono**: JetBrains Mono, Regular, Slate

---

## Spacing System

### Scale (4px base unit)
```
xs:  4px   — Micro spacing (icon padding)
sm:  8px   — Button padding, tight spacing
md:  16px  — Card padding, standard spacing
lg:  24px  — Section padding, loose spacing
xl:  32px  — Page padding, major spacing
xxl: 48px  — Hero sections
```

### Usage Rules
- **Cards**: 24px padding, 4px border-radius
- **Buttons**: 12px padding (vertical), 24px padding (horizontal)
- **Sections**: 32px padding (vertical), 0 padding (horizontal - page width)
- **Lists**: 16px between items

---

## Component Library

### Buttons

#### Primary Button
```
Background:  #1a4d2e
Text:        #ffffff
Border:      none
Border-radius: 8px
Padding:     12px 24px
Font:        IBM Plex Sans, Semibold, 14px
Hover:       #2d6a4f
Active:      #0f3820
Disabled:    #94a3b8, cursor: not-allowed

Usage: Main actions (Submit, Publish, Accept)
```

#### Secondary Button
```
Background:  transparent
Text:        #1a4d2e
Border:      1px solid #1a4d2e
Border-radius: 8px
Padding:     12px 24px
Font:        IBM Plex Sans, Semibold, 14px
Hover:       #f8fafc (background)
Active:      #e2e8f0 (background)

Usage: Alternative actions (Cancel, Back, Decline)
```

#### Tertiary Button
```
Background:  transparent
Text:        #475569
Border:      none
Border-radius: 8px
Padding:     8px 16px
Font:        IBM Plex Sans, Regular, 14px
Hover:       #f1f5f9 (background)
Text-decoration: underline

Usage: Link-like actions (View spec, Edit)
```

#### Destructive Button
```
Background:  #dc2626
Text:        #ffffff
Border:      none
Border-radius: 8px
Padding:     12px 24px
Font:        IBM Plex Sans, Semibold, 14px
Hover:       #b91c1c
Active:      #991b1b

Usage: Critical actions (Delete, Decline, Dispute)
```

---

### Cards

#### Standard Card
```
Background:  #ffffff
Border:      1px solid #e2e8f0
Border-radius: 4px
Padding:     24px
Box-shadow:  0 1px 3px rgba(0, 0, 0, 0.1)
Hover:       0 4px 6px rgba(0, 0, 0, 0.1) (interactive cards)

Structure:
- Title: h3, 18px, Semibold, Charcoal, margin-bottom: 16px
- Body: 14px, Regular, Slate, line-height: 1.6
- Actions: aligned right, margin-top: 24px
```

#### Spec Card
```
Background:  #ffffff
Border:      2px solid #1a4d2e (locked spec)
Border-radius: 4px
Padding:     24px
Left border: 4px solid #1a4d2e (accent)

Structure:
- Header: gig type badges + title, margin-bottom: 24px
- Milestones: vertical stack, 16px between
- Criteria: indented under milestones, 8px between
- Footer: assets checklist + PFI signals, margin-top: 32px
```

#### Verification Report Card
```
Background:  #ffffff
Border:      1px solid #e2e8f0
Border-radius: 4px
Padding:     32px

Header:
- Score: 72px, Space Grotesk, Bold, centered
- Color-coded: green (>90), amber (50-89), red (<50)
- Payment decision badge below score

Body:
- Criteria list, each with status indicator
- Status pill: PASS (green), FAIL (red), PARTIAL (amber)
- Failure reason in red text below FAIL items

Footer:
- PFI signals in yellow section
- Resubmissions remaining count
- Feedback for freelancer
```

---

### Form Elements

#### Input Field
```
Background:  #ffffff
Border:      1px solid #e2e8f0
Border-radius: 8px
Padding:     12px 16px
Font:        IBM Plex Sans, Regular, 14px
Color:       #1e293b
Placeholder: #94a3b8
Focus:       border-color: #1a4d2e, outline: none
Error:       border-color: #dc2626

Label:       12px, Semibold, #475569, margin-bottom: 4px
```

#### Textarea
```
Same as input, but min-height: 120px
Resize:     vertical only
Line-height: 1.6
```

#### Select Dropdown
```
Background:  #ffffff
Border:      1px solid #e2e8f0
Border-radius: 8px
Padding:     12px 16px
Font:        IBM Plex Sans, Regular, 14px
Appearance:  none (custom arrow icon)
Focus:       border-color: #1a4d2e
```

#### Checkbox
```
Box:         16px × 16px, border: 2px solid #e2e8f0, border-radius: 4px
Checked:     background: #1a4d2e, border-color: #1a4d2e
Checkmark:   white, SVG, 10px
Focus:       outline: 2px solid #1a4d2e
```

---

### Badges & Tags

#### Gig Type Badge
```
Background:  #f1f5f9
Text:        #1a4d2e
Border:      1px solid #e2e8f0
Border-radius: 9999px
Padding:     4px 12px
Font:        12px, Semibold, uppercase
Icon:        gig type icon, 12px, margin-right: 4px
```

#### Status Badge
```
Published:   background: #dcfce7, text: #166534
In Progress: background: #dbeafe, text: #1e40af
Completed:   background: #f3f4f6, text: #374151
Disputed:    background: #fee2e2, text: #991b1b
```

#### PFI Score Badge
```
Background:  #1a4d2e
Text:        #ffffff
Border-radius: 4px
Padding:     4px 8px
Font:        Space Grotesk, Bold, 14px
Display:     inline-flex, align-items: center
Icon:        trophy icon, 12px, margin-right: 4px
```

---

### Chat Components

#### Chat Bubble (Employer)
```
Background:  #dbeafe (light blue)
Text:        #1e40af (dark blue)
Border-radius: 4px
Padding:     12px 16px
Max-width:   70%
Align:       right

Sender:      10px, Semibold, #1e40af, margin-bottom: 4px
Timestamp:   10px, Regular, #94a3b8, margin-top: 4px
```

#### Chat Bubble (Freelancer)
```
Background:  #f1f5f9 (light gray)
Text:        #1e293b (dark slate)
Border-radius: 4px
Padding:     12px 16px
Max-width:   70%
Align:       left

Sender:      10px, Semibold, #1e293b, margin-bottom: 4px
Timestamp:   10px, Regular, #94a3b8, margin-top: 4px
```

#### Chat Bubble (AI Mediator)
```
Background:  #cffafe (light cyan)
Text:        #0e7490 (cyan)
Border:      2px solid #0891b2
Border-radius: 4px
Padding:     16px 20px
Max-width:   80%
Align:       left

Sender:      12px, Bold, #0891b2, margin-bottom: 8px
Icon:        AI icon, 16px, margin-right: 6px
Timestamp:   10px, Regular, #94a3b8, margin-top: 4px
```

#### Chat Input Area
```
Background:  #f8fafc
Border-top:  1px solid #e2e8f0
Padding:     16px 24px
Position:    fixed, bottom: 0

Input:       full-width, rounded-lg
Send Button: primary, square, 40px × 40px
```

---

### Status Indicators

#### Verification Status Indicator
```
Layout:     horizontal flex, centered items
Size:       24px × 24px

Pass:       green circle with checkmark, #16a34a
Fail:       red circle with X, #dc2626
Partial:    amber circle with minus, #f59e0b
Loading:    spinner, #1a4d2e
```

#### PFI Score Display
```
Layout:     flex, align-items: center, gap: 8px

Score:      24px, Space Grotesk, Bold, Charcoal
Bar:        80px wide, 4px high, rounded-full
Fill:       green (≥80), amber (50-79), red (<50)
Label:      12px, Regular, #475569

Compact (avatar):
Circle:     48px × 48px, #1a4d2e
Text:       20px, Bold, #ffffff, centered
```

---

## Layout Patterns

### Page Structure

#### Standard Page Layout
```
Header (64px fixed top)
├─ Logo left
├─ Navigation center (employer/freelancer)
└─ User menu right (PFI badge, avatar, dropdown)

Main Content (100vh - 64px)
├─ Page Title Section (48px padding)
│  ├─ H1: Page title
│  ├─ Breadcrumbs (if needed)
│  └─ Page-level actions
│
├─ Content Area (max-width: 1200px, centered)
│  └─ [Component-specific layout]
│
└─ Footer (48px padding, optional)
```

#### Dashboard Layout
```
Sidebar (240px fixed left)
├─ Logo top
├─ Navigation links
└─ User info bottom

Main Content (flex-1)
└─ [Standard page structure]
```

---

### Grid Systems

#### Two-Column Grid (Spec View)
```
Left Column (2/3 width):
├─ Job title
├─ Gig type badges
├─ Milestones (accordion)
└─ Verification report (if submitted)

Right Column (1/3 width):
├─ Project status card
├─ Timeline
├─ PFI scores
└─ Chat button

Gap: 24px, Responsive: stacks on mobile
```

#### Three-Column Grid (Job Browse)
```
Left Column (1/4 width):
└─ Filters (gig type, budget, deadline)

Middle Column (1/2 width):
└─ Job cards (vertical stack, 16px gap)

Right Column (1/4 width):
└─ Selected job spec preview

Gap: 24px, Responsive: filters become drawer on mobile
```

---

## Key Screen Designs

### 1. Login / Register Page

**Layout:** Centered card, 480px wide, vertically centered
**Structure:**
```
┌─────────────────────────────────────┐
│  [Logo: trustmebro]                │
│                                     │
│  Employer Sign In                  │
│                                     │
│  [Email field]                     │
│  [Password field]                  │
│                                     │
│  [Primary: Sign In]                │
│                                     │
│  Don't have an account?            │
│  [Tertiary: Sign up as Employer]   │
│  [Tertiary: Sign up as Freelancer] │
└─────────────────────────────────────┘
```

**Details:**
- Logo: 32px height, primary color
- Title: 18px, Semibold, Charcoal
- Fields: 24px gap
- Links: centered, 12px text, Slate

---

### 2. Job Posting Form

**Layout:** Two-column grid, max-width 1000px

**Left Column (2/3):**
```
Job Title [Input]
Budget [Input: $____]
Deadline [Date Input]

Job Description [Textarea: min 200px]
┌────────────────────────────────────────┐
│ Paste your job description here...    │
│                                        │
│                                        │
│                                        │
└────────────────────────────────────────┘

[Primary: Generate Spec]
```

**Right Column (1/3):**
```
Tips for Great Job Posts
┌─────────────────────────┐
│ • Be specific about      │
│   deliverables           │
│ • Include required       │
│   skills/technologies    │
│ • Set realistic         │
│   deadlines              │
└─────────────────────────┘

Previous Specs (3 most recent)
┌─────────────────────────┐
│ [Spec 1] [Spec 2] [Spec 3]│
└─────────────────────────┘
```

---

### 3. AI-Generated Spec Review

**Layout:** Two-column grid, 1000px wide

**Left Column (2/3):**
```
Job Title: Build a React E-commerce Platform
[Software] [Web Development] [Full Stack]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Milestone 1: Project Setup
Deadline: Mar 20, 2024
Status: ⚠️ 2 vague items flagged

[Criteria list]
☐ Initialize Next.js project
☐ Set up PostgreSQL database
⚠️ "Good user experience" → Too subjective
⚠️ "Modern design" → Define specific requirements

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Milestone 2: Core Features
Deadline: Mar 27, 2024

[Criteria list]
☐ User authentication
☐ Product catalog
☐ Shopping cart
```

**Right Column (1/3):**
```
Spec Status: 2 flags remaining

Required Assets Checklist
☐ Brand guidelines (logos, colors)
☐ Product data (CSV)
☐ Example screenshots

[Primary: Publish Job]
[Secondary: Add Milestone]
```

---

### 4. Spec Lock Screen (Freelancer)

**Layout:** Centered card, 600px wide

```
┌─────────────────────────────────────────┐
│ 🔒 Spec Lock                            │
│                                         │
│ Review the full spec before starting.   │
│ Once locked, changes require formal    │
│ Change Requests.                        │
│                                         │
├─────────────────────────────────────────┤
│ [Spec preview - read-only]             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Milestone 1: Project Setup              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ • Initialize Next.js project            │
│ • Set up PostgreSQL database            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Milestone 2: Core Features              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ • User authentication                   │
│ • Product catalog                       │
│ • Shopping cart                         │
└─────────────────────────────────────────┘

Before you start, the AI asks:

❓ Do you have all required access and assets?
   • Brand guidelines: [ ] Yes [ ] No
   • Product data: [ ] Yes [ ] No
   • Example screenshots: [ ] Yes [ ] No

❓ Is the timeline realistic?
   • 2 weeks for both milestones: [ ] Yes [ ] No

❓ Any concerns before starting?
   [Text area for concerns]

[Secondary: Flag Concern]
[Primary: Accept & Start]
```

---

### 5. Verification Report Page

**Layout:** Centered card, 700px wide

```
┌─────────────────────────────────────────┐
│                                         │
│           72                            │
│          Score                         │
│                                         │
│      [Amber Pill: ON HOLD]              │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Milestone 2: Core Features             │
│                                         │
│  ✅ User Authentication                  │
│     Login, signup, password reset      │
│     all working correctly               │
│                                         │
│  ✅ Product Catalog                     │
│     All 50 products displayed correctly │
│                                         │
│  ⚠️  Shopping Cart                      │
│     Cart items persist on refresh       │
│     BUT missing quantity controls       │
│                                         │
│  ❌ Checkout Flow                       │
│     Payment integration incomplete -     │
│     Stripe not connected to backend     │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🟡 PFI Signals (Quality, Not Failure)  │
│                                         │
│  ⚠️  Code Quality                       │
│     Some TODO comments in production    │
│     code. Consider refactoring.        │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Resubmissions remaining: 2             │
│                                         │
│  💡 Feedback for Freelancer              │
│                                         │
│  1. Connect Stripe to backend for      │
│     payment processing                   │
│  2. Add quantity controls to cart      │
│  3. Remove TODO comments from           │
│     production files                    │
│                                         │
│  [Primary: Resubmit Work]               │
└─────────────────────────────────────────┘
```

---

### 6. AI-Mediated Chat Interface

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Header: Project Title                            │
│ [Software] [In Progress]  [PFI: 87]             │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Chat history]                                  │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ Alice (Employer)                   10:30│   │
│ │ ┌─────────────────────────────────────┐ │   │
│ │ │ We need the checkout flow done by   │ │   │
│ │ │ Friday, can you make that happen?   │ │   │
│ │ └─────────────────────────────────────┘ │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ 🤖 AI Mediator                     10:31│   │
│ │ ┌─────────────────────────────────────┐ │   │
│ │ │ The original spec has the checkout  │ │   │
│ │ │ flow in Milestone 3, not Milestone   │ │   │
│ │ │ 2. This appears to be a timeline     │ │   │
│ │ │ change request.                      │ │   │
│ │ │                                       │ │   │
│ │ │ Would you like to submit a formal    │ │   │
│ │ │ Change Request to accelerate the     │ │   │
│ │ │ checkout flow to Milestone 2?        │ │   │
│ │ └─────────────────────────────────────┘ │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ Bob (Freelancer)                  10:32│   │
│ │ ┌─────────────────────────────────────┐ │   │
│ │ │ I can try, but that means I'll     │ │   │
│ │ │ need to deprioritize the admin      │ │   │
│ │ │ panel from Milestone 2. Is that     │ │   │
│ │ │ OK?                                 │ │   │
│ │ └─────────────────────────────────────┘ │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ 🤖 AI Mediator                     10:33│   │
│ │ ┌─────────────────────────────────────┐ │   │
│ │ │ Bob is asking for a trade-off:       │ │   │
│ │ │ admin panel now vs checkout now.     │ │   │
│ │ │                                       │ │   │
│ │ │ Alice, please confirm:               │ │   │
│ │ │ [ ] OK to move admin panel to later   │ │   │
│ │ │ [ ] Need both admin + checkout now    │ │   │
│ │ │                                       │ │   │
│ │ │ Your answer will be logged as a       │ │   │
│ │ │ formal spec clarification.            │ │   │
│ │ └─────────────────────────────────────┘ │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ Alice (Employer)                   10:34│   │
│ │ ┌─────────────────────────────────────┐ │   │
│ │ │ [x] OK to move admin panel to later   │ │   │
│ │ │                                       │ │   │
│ │ │ Yes, that works. Checkout first.     │ │   │
│ │ └─────────────────────────────────────┘ │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ 🤖 AI Mediator                     10:35│   │
│ │ ┌─────────────────────────────────────┐ │   │
│ │ │ ✓ Spec clarification logged.         │ │   │
│ │ │                                       │ │   │
│ │ │ Updated spec:                        │ │   │
│ │ │ Milestone 2: Checkout Flow (accelerated)│ │
│ │ │ Milestone 3: Admin Panel (moved from 2)│ │
│ │ │                                       │ │   │
│ │ │ This is now binding. Both parties    │ │   │
│ │ │ have been notified.                   │ │   │
│ │ └─────────────────────────────────────┘ │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Input field: Type a message...]     [Send →]   │
└─────────────────────────────────────────────────┘
```

---

### 7. Employer Dashboard

**Layout:** Dashboard grid

```
┌─────────────────────────────────────────────────┐
│ Header: Dashboard                               │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌──────────────┐  ┌──────────────┐              │
│ │ Active Jobs   │  │ Total Spent  │              │
│ │      3        │  │    $4,250    │              │
│ └──────────────┘  └──────────────┘              │
│                                                 │
│ ┌──────────────┐  ┌──────────────┐              │
│ │ Pending      │  │ In Progress  │              │
│ │    Bids       │  │    Projects  │              │
│ │      7        │  │      3       │              │
│ └──────────────┘  └──────────────┘              │
│                                                 │
│ Recent Activity                                 │
│ ┌───────────────────────────────────────────┐  │
│ │ Bob submitted Milestone 2        2h ago  │  │
│ │ React E-commerce Platform                │  │
│ │ [View Verification Report]               │  │
│ ├───────────────────────────────────────────┤  │
│ │ New bid from Sarah               5h ago  │  │
│ │ Mobile App Development                  │  │
│ │ [View Bid]                              │  │
│ ├───────────────────────────────────────────┤  │
│ │ Project completed                 1d ago │  │
│ │ Copywriting Package                    │  │
│ │ [View Report]                          │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ [Primary: Post New Job]                     ││
│ └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

---

### 8. Freelancer Dashboard

**Layout:** Dashboard grid

```
┌─────────────────────────────────────────────────┐
│ Header: Dashboard                               │
│                                               │
│          [PFI: 87] 🏆                         │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌──────────────┐  ┌──────────────┐              │
│ │ Active       │  │ Total        │              │
│ │ Projects     │  │ Earned       │              │
│ │      3        │  │    $2,850    │              │
│ └──────────────┘  └──────────────┘              │
│                                                 │
│ ┌──────────────┐  ┌──────────────┐              │
│ │ Pending      │  │ Completed    │              │
│ │ Submissions  │  │ Projects     │              │
│ │      1        │  │     12       │              │
│ └──────────────┘  └──────────────┘              │
│                                                 │
│ Active Projects                                 │
│ ┌───────────────────────────────────────────┐  │
│ │ React E-commerce Platform          ⚠️ Hold│  │
│ │ Milestone 2: Core Features                  │  │
│ │ Score: 72 - Needs 1 resubmission            │  │
│ │ [View Report] [Resubmit Work]              │  │
│ ├───────────────────────────────────────────┤  │
│ │ Mobile App Development          🟡 Active│  │
│ │ Milestone 1: Prototype                      │  │
│ │ Due in 3 days                              │  │
│ │ [View Spec] [Submit Work]                  │  │
│ ├───────────────────────────────────────────┤  │
│ │ Data Entry Project                🟢 Active│  │
│ │ Milestone 3: Final Review                    │  │
│ │ Due in 5 days                              │  │
│ │ [View Spec] [Submit Work]                  │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ Available Jobs                                  │
│ ┌───────────────────────────────────────────┐  │
│ │ [Software] Backend API Development  $800  │  │
│ │ Employer PFI: 92                          │  │
│ │ [View Spec] [Place Bid]                   │  │
│ ├───────────────────────────────────────────┤  │
│ │ [Copywriting] Blog Series (5 posts) $500  │  │
│ │ Employer PFI: 88                          │  │
│ │ [View Spec] [Place Bid]                   │  │
│ └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## Micro-Interactions

### Button States
```
Hover:    transform: translateY(-1px), 150ms ease
Active:   transform: translateY(1px), 100ms ease
Disabled: opacity: 0.6, cursor: not-allowed
Loading:  spinner icon, button text hidden
```

### Form Fields
```
Focus:    border-color transitions to primary, 200ms ease
Error:    shake animation on submit
Success:  green checkmark appears, 300ms fade in
```

### Cards
```
Hover:    subtle lift, 200ms ease
Click:    quick press animation, 100ms ease
```

### Chat Bubbles
```
Appear:   slide up from bottom, 200ms ease, staggered
New msg:  pulse animation on unread indicator
```

### Loading States
```
Skeleton: subtle gradient animation, 1.5s loop
Spinner:  1s rotation, infinite
Progress: fill animates from left, 300ms ease
```

---

## Responsive Breakpoints

```
Mobile:     < 640px  (sm)
Tablet:     640px - 1024px (md)
Desktop:    > 1024px (lg)
```

### Mobile Adaptations
- Grids stack vertically
- Sidebar becomes drawer (slide-in)
- Chat becomes full-screen overlay
- Forms reduce padding to 16px
- Text scales down 10%
- Buttons become 100% width

---

## Accessibility

### Color Contrast
- All text meets WCAG AA (4.5:1 minimum)
- Primary button background to text: 8.5:1 ✓
- Error text to background: 5.2:1 ✓
- Disabled text to background: 3.8:1 ✗ → Use darker gray (#6b7280)

### Focus States
- All interactive elements have visible focus outline
- Focus color: #1a4d2e with 2px outline

### Screen Readers
- All images have alt text
- Icons use aria-label
- Form labels are properly associated
- Live regions for chat updates
- ARIA roles for complex components

### Keyboard Navigation
- Tab order matches visual flow
- Enter/Space activates buttons
- Escape closes modals/drawers
- Skip link for keyboard users

---

## Edge Case UI States

### Network Errors
```
┌─────────────────────────────────────────┐
│  ⚠️ Connection Error                    │
│                                         │
│  Something went wrong. Please check     │
│  your internet connection and try       │
│  again.                                 │
│                                         │
│  [Secondary: Retry]                     │
└─────────────────────────────────────────┘
```

### Empty States
```
No active jobs yet.
┌─────────────────────────────────────────┐
│                                         │
│   📭                                    │
│                                         │
│   You haven't posted any jobs yet.      │
│   Let's get started!                    │
│                                         │
│  [Primary: Post Your First Job]         │
└─────────────────────────────────────────┘
```

### Timeout States
```
┌─────────────────────────────────────────┐
│  ⏱️ Taking longer than expected...      │
│                                         │
│  The AI is still processing. This       │
│  usually takes 10-15 seconds.           │
│                                         │
│  [Spinner animation]                    │
│                                         │
│  If this takes more than 30 seconds,    │
│  [Secondary: Cancel and retry]          │
└─────────────────────────────────────────┘
```

### Conflict States (Chat Tension)
```
┌─────────────────────────────────────────┐
│  ⚠️ Conflict Detected                   │
│                                         │
│  The AI has detected a disagreement.    │
│  Let's resolve this by referencing      │
│  the agreed spec.                       │
│                                         │
│  Agreed criteria for this milestone:   │
│  • User authentication                  │
│  • Product catalog                      │
│  • Shopping cart                        │
│                                         │
│  Please reference specific criteria    │
│  when raising concerns.                 │
│                                         │
│  [Primary: Continue to Chat]            │
└─────────────────────────────────────────┘
```

---

## Icon Set

Use **Phosphor Icons** (consistent, professional):
- Size: 16px (small), 20px (medium), 24px (large)
- Weight: Regular or Light (avoid Bold/Heavy)
- Color: inherit from text color, semantic colors for status

Key icons:
- Logo: Shield + handshake (custom)
- Job: Briefcase
- Spec: Document text
- Verification: Check circle, Warning circle, X circle
- Chat: Chat circle, Robot (for AI)
- PFI: Trophy
- Dispute: Gavel
- Escrow: Lock

---

## File Structure

```
components/
├── ui/                    # Base components (buttons, cards, etc.)
├── forms/                 # Form components
├── chat/                  # Chat-specific components
├── verification/          # Verification report components
├── layout/                # Layout components
└── features/              # Feature-specific components

app/
├── employer/              # Employer routes
├── freelancer/            # Freelancer routes
├── jobs/                  # Job-related routes
└── chat/                  # Chat routes

styles/
├── globals.css            # Global styles, reset
├── colors.css             # Color variables
├── typography.css         # Font setup
└── utilities.css          # Tailwind config
```

---

## Implementation Priority

1. **Day 1-2:** Color palette, typography, spacing system
2. **Day 3:** Base components (buttons, inputs, cards)
3. **Day 4:** Form components, job posting UI
4. **Day 5:** Spec review UI, freelancer browsing
5. **Day 6:** Verification report UI (critical wow moment)
6. **Day 7:** Chat interface (critical wow moment)
7. **Day 8:** Dashboard layouts
8. **Day 9-10:** Edge cases, micro-interactions
9. **Day 11-14:** Polish, responsive, accessibility

---

## Design Review Checklist

- [ ] Color contrast meets WCAG AA
- [ ] All interactive elements have hover/focus/active states
- [ ] Loading states defined for all async operations
- [ ] Error states defined for all forms
- [ ] Empty states defined for all lists
- [ ] Mobile responsive tested
- [ ] Keyboard navigation works
- [ ] Screen reader labels present
- [ ] Edge cases handled (network errors, timeouts)
- [ ] Chat tension/conflict states visualized
