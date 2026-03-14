# Spec Pipeline - Finalized Design

## Core Problem

We need to get something that is in the head of the client - his mental model, then get that onto a doc, then the freelancer sees it and bids on it, gets accepted, and the project is active. Timeline, payment, etc. is decided and everything is witnessed by AI in the chat. On each milestone completion and final submission, we "verify":
1. If it reaches basic standards
2. If the client's primary, secondary, and tertiary requirements are solved

**The spec document = single source of detailed truth.**

---

## Spec Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SPEC PIPELINE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: CLIENT INTAKE (Chat-Only)                                         │
│  ├── Client selects gig type                                                │
│  ├── AI conducts guided conversation (structured questions, chat format)    │
│  ├── AI fills in unknowns, makes assumptions explicit                       │
│  ├── AI categorizes requirements: Primary / Secondary / Tertiary            │
│  ├── AI adds suggested requirements (highlighted as AI-added)               │
│  └── Draft spec generated                                                   │
│                                                                             │
│  PHASE 2: BIDDING                                                           │
│  ├── Job published with draft spec visible                                  │
│  ├── Freelancers see spec + can ask questions before bidding                │
│  └── Freelancer places bid (budget/timeline proposals allowed)              │
│                                                                             │
│  PHASE 3: ASSIGNMENT + NEGOTIATION                                          │
│  ├── Client accepts bid → Freelancer assigned                               │
│  ├── AI group chat opens (Client + Freelancer + AI Mediator)                │
│  ├── Freeform negotiation: timeline, budget, assets, requirements           │
│  ├── AI mediates, detects conflicts, suggests resolutions                   │
│  └── Spec refined collaboratively                                           │
│                                                                             │
│  PHASE 4: MUTUAL LOCK                                                       │
│  ├── Both parties review final spec                                         │
│  ├── Both must click "Lock & Agree"                                         │
│  ├── Spec becomes immutable                                                 │
│  ├── Escrow must be funded                                                  │
│  └── Change requests now count (limited pool)                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Client Intake (Guided Chat)

### Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  NEW JOB                                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  What type of work do you need?                                 │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │  Copywriting │  │  Translation │                             │
│  └──────────────┘  └──────────────┘                             │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │  Data Entry  │  │   Software   │                             │
│  └──────────────┘  └──────────────┘                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  AI GUIDED CHAT                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [AI] Great! Let's figure out exactly what you need.            │
│       What kind of copywriting? (blog posts, landing pages,     │
│       email sequences, social media, other?)                    │
│                                                                 │
│  [Client] Blog posts about AI in healthcare                     │
│                                                                 │
│  [AI] Got it - blog posts on AI in healthcare.                  │
│       How many posts do you need?                               │
│                                                                 │
│  [Client] 5                                                     │
│                                                                 │
│  [AI] And roughly how long should each post be?                 │
│       • Short (500-800 words)                                   │
│       • Medium (800-1200 words)                                 │
│       • Long (1200-2000 words)                                  │
│       • Not sure                                                │
│                                                                 │
│  [Client] Not sure                                              │
│                                                                 │
│  [AI] No problem. For in-depth healthcare topics, I'd           │
│       recommend 1000-1200 words per post. That gives enough     │
│       room for examples and sources.                            │
│                                                                 │
│       ⚠️ AI ASSUMPTION: 1000-1200 words per post                │
│                                                                 │
│       Does that work?                                           │
│       [Yes, sounds good] [No, let me specify]                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### AI Behaviors During Intake

| Behavior | Example |
|----------|---------|
| **Detect gaps** | "You mentioned blog posts but not the target audience. Who's reading these?" |
| **Detect conflicts** | "You want 500 words but 10 subtopics - that's only 50 words each. Increase word count or reduce topics?" |
| **Fill unknowns** | "I'll assume professional tone unless you specify otherwise." (marked as AI assumption) |
| **Add suggestions** | "For SEO, I'd recommend including keywords. Want me to add that as a requirement?" (marked as AI-suggested) |
| **Categorize requirements** | AI assigns Primary/Secondary/Tertiary, client can adjust |

### After Guided Chat → Draft Spec Generated

Once AI has enough info, it generates a draft spec with:
- All requirements categorized (Primary/Secondary/Tertiary)
- AI assumptions clearly marked
- AI suggestions clearly marked
- Deliverables listed
- Suggested milestones
- Suggested timeline and budget range

---

## Phase 2: Bidding

- Job published with draft spec visible
- Freelancers can see full spec before bidding
- Freelancers can ask clarifying questions (public Q&A or private)
- Bid includes:
  - Cover letter
  - Proposed budget (can differ from client's range)
  - Proposed timeline (can differ from client's deadline)

---

## Phase 3: Assignment + Negotiation (AI Group Chat)

### Chat Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  JOB CHAT: "5 Blog Posts on AI Healthcare"                      │
│  Status: NEGOTIATING SPEC                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [AI Mediator] 📋 Welcome! You're now connected.                │
│  Current spec is attached. Let's finalize the details.          │
│                                                                 │
│  Key items to confirm:                                          │
│  • Timeline: March 15 - March 28 (13 days)                      │
│  • Budget: $500                                                 │
│  • Milestones: 5 (one per post)                                 │
│                                                                 │
│  Marcus, please review and raise any concerns.                  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [Freelancer - Marcus] I can do this, but I'd need the          │
│  keyword list upfront. Also, 13 days is tight for 5 posts       │
│  with research. Can we do 16 days?                              │
│                                                                 │
│  [AI Mediator] 📝 Marcus requests:                              │
│  1. Keyword list provided before start                          │
│  2. Timeline extension: March 28 → March 31 (+3 days)           │
│                                                                 │
│  Sarah, do you accept these?                                    │
│  [Accept Both] [Accept #1 Only] [Negotiate]                     │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [Client - Sarah] I can do keywords by tomorrow. Timeline       │
│  extension is fine.                                             │
│                                                                 │
│  [AI Mediator] ✅ Updated spec:                                 │
│  • Client will provide keyword list by March 16                 │
│  • New deadline: March 31                                       │
│                                                                 │
│  Anything else before we lock?                                  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [Freelancer - Marcus] Can we bump budget to $550? The          │
│  research on healthcare AI is intensive.                        │
│                                                                 │
│  [AI Mediator] 💰 Budget change requested: $500 → $550          │
│  Sarah, do you accept?                                          │
│  [Accept] [Counter-offer] [Decline]                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### What Can Be Negotiated (Pre-Lock)

| Item | Negotiable? | Notes |
|------|-------------|-------|
| Timeline | ✅ Yes | Both can propose changes |
| Budget | ✅ Yes | Freelancer can ask for more |
| Requirements | ✅ Yes | Can clarify, adjust, remove |
| Milestones | ✅ Yes | Can restructure |
| Asset requirements | ✅ Yes | Freelancer can request client provide materials |
| Deliverable format | ✅ Yes | e.g., "I deliver in Notion, not Word" |

**Pre-lock negotiation is FREE.** Change request limits only apply AFTER lock.

---

## Phase 4: Mutual Lock

### Lock Requirements

Both parties must:
1. Review final spec
2. Check "I agree to this spec"
3. Click "Lock & Start Project"

### Lock Confirmation UI

```
┌────────────────────────────────────────────────────────────────┐
│                    LOCK SPEC & START PROJECT                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Job: "5 Blog Posts on AI Healthcare"                          │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ FINAL SPEC SUMMARY                                       │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Deliverables: 5 blog posts (1000-1200 words each)        │  │
│  │ Timeline: March 15 - March 31 (16 days)                  │  │
│  │ Budget: $550                                             │  │
│  │ Milestones: 5 (equal split, backloaded final)            │  │
│  │ Primary Requirements: 4                                  │  │
│  │ Secondary Requirements: 4                                │  │
│  │ Tertiary Requirements: 2                                 │  │
│  │                                                          │  │
│  │ [View Full Spec]                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ CLIENT CONFIRMATION                                      │  │
│  │ ☑ I agree to this spec                                  │  │
│  │ ☑ I will fund $550 escrow upon lock                     │  │
│  │ Status: ✅ Confirmed                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ FREELANCER CONFIRMATION                                  │  │
│  │ ☑ I agree to this spec                                  │  │
│  │ ☑ I will deliver according to these requirements        │  │
│  │ Status: ⏳ Awaiting                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ⚠️ Once locked:                                              │
│  • Spec cannot be changed (only via change requests)          │
│  • Change requests are limited (Client: 3, Freelancer: 2)     │
│  • Escrow will be funded and held                             │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           🔒 LOCK & START PROJECT                        │  │
│  │              (Waiting for freelancer)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### After Lock

- Spec is immutable
- Escrow must be funded by client
- Change request counters activate
- Work begins

---

## Requirement Tiers

### Definitions

| Tier | Definition | Verification Impact | Payment Impact |
|------|------------|---------------------|----------------|
| **Primary** | Must-have. Job fails without these. | Must score 100% | Blocks payment if not met |
| **Secondary** | Should-have. Expected quality. | Weighted 30% of score | Reduces verification score |
| **Tertiary** | Nice-to-have. Above and beyond. | Weighted 10% of score | No penalty if missing, bonus if present |

### Scoring Formula

```
Verification Score =
  (Primary Score × 60%) +
  (Secondary Score × 30%) +
  (Tertiary Score × 10%)

Where:
- Primary Score must be 100% for payment release
- Secondary/Tertiary affect overall score but don't block
```

### Who Categorizes?

1. **AI categorizes** during intake based on context
2. **Client reviews and approves** - can promote/demote requirements
3. **Freelancer can suggest changes** during negotiation
4. **Final categories locked** with spec

### Example

**Copywriting Job:**

| Requirement | AI Suggested Tier | Client Adjusted |
|-------------|-------------------|-----------------|
| Word count 1000-1200 | Primary | Primary ✓ |
| Original content (<10% plagiarism) | Primary | Primary ✓ |
| Cover assigned topic | Primary | Primary ✓ |
| Professional tone | Primary | Primary ✓ |
| Include 3+ examples | Secondary | Secondary ✓ |
| Cite 2+ sources | Secondary | Primary ⬆️ |
| Readability Grade 10-12 | Secondary | Secondary ✓ |
| Proper structure (intro/body/conclusion) | Secondary | Secondary ✓ |
| Include statistics | Tertiary | Tertiary ✓ |
| Suggest internal links | Tertiary | Removed ❌ |
| SEO-optimized headlines | AI-Suggested | Approved ✓ |

---

## Final Spec Structure

```yaml
job_spec:
  # ═══════════════════════════════════════════════════════════════
  # META
  # ═══════════════════════════════════════════════════════════════
  meta:
    id: "job_12345"
    version: 1
    status: "locked"  # draft | negotiating | locked
    created_at: "2026-03-14T09:00:00Z"
    locked_at: "2026-03-15T10:30:00Z"

  # ═══════════════════════════════════════════════════════════════
  # PARTIES
  # ═══════════════════════════════════════════════════════════════
  parties:
    client:
      id: 101
      name: "Sarah Chen"
      pfi_score: 94
      confirmed_at: "2026-03-15T10:28:00Z"

    freelancer:
      id: 205
      name: "Marcus Johnson"
      pfi_score: 88
      confirmed_at: "2026-03-15T10:30:00Z"

  # ═══════════════════════════════════════════════════════════════
  # JOB OVERVIEW
  # ═══════════════════════════════════════════════════════════════
  overview:
    title: "5 Blog Posts on AI in Healthcare"
    gig_type: "COPYWRITING"
    gig_subtype: "blog_posts"
    summary: >
      Create 5 in-depth blog posts exploring different applications
      of artificial intelligence in the healthcare industry. Target
      audience is healthcare executives and IT decision-makers.

  # ═══════════════════════════════════════════════════════════════
  # REQUIREMENTS (Tiered)
  # ═══════════════════════════════════════════════════════════════
  requirements:
    primary:  # MUST have - blocks payment if ANY fails
      - id: "P1"
        description: "Each post must be 1000-1200 words"
        verification_method: "automated_word_count"

      - id: "P2"
        description: "Content must be original (plagiarism < 10%)"
        verification_method: "automated_plagiarism_check"

      - id: "P3"
        description: "Must cover assigned topic comprehensively"
        verification_method: "ai_topic_analysis"

      - id: "P4"
        description: "Professional tone, no casual language"
        verification_method: "ai_tone_analysis"

      - id: "P5"
        description: "Cite at least 2 credible sources per post"
        verification_method: "ai_source_detection"
        source: "promoted_from_secondary"  # Client moved this up

    secondary:  # SHOULD have - reduces score if missing
      - id: "S1"
        description: "Include 3+ real-world examples per post"
        verification_method: "ai_content_analysis"

      - id: "S2"
        description: "Readability score between Grade 10-12"
        verification_method: "automated_readability"

      - id: "S3"
        description: "Clear structure: introduction, body, conclusion"
        verification_method: "ai_structure_analysis"

      - id: "S4"
        description: "SEO-optimized headlines and subheadings"
        verification_method: "ai_seo_check"
        source: "ai_suggested"  # AI added this, client approved

    tertiary:  # NICE to have - bonus points
      - id: "T1"
        description: "Include relevant statistics with citations"
        verification_method: "ai_content_analysis"

  # ═══════════════════════════════════════════════════════════════
  # DELIVERABLES
  # ═══════════════════════════════════════════════════════════════
  deliverables:
    - id: "D1"
      type: "blog_post"
      title: "AI Diagnostics in Radiology"
      format: "Google Doc"
      milestone_id: 1

    - id: "D2"
      type: "blog_post"
      title: "Machine Learning for Drug Discovery"
      format: "Google Doc"
      milestone_id: 2

    - id: "D3"
      type: "blog_post"
      title: "Chatbots in Patient Care"
      format: "Google Doc"
      milestone_id: 3

    - id: "D4"
      type: "blog_post"
      title: "Predictive Analytics for Hospital Management"
      format: "Google Doc"
      milestone_id: 4

    - id: "D5"
      type: "blog_post"
      title: "Ethics of AI in Healthcare"
      format: "Google Doc"
      milestone_id: 5

  # ═══════════════════════════════════════════════════════════════
  # CLIENT ASSETS
  # ═══════════════════════════════════════════════════════════════
  client_assets:
    provided:
      - type: "brand_guidelines"
        filename: "healthtech_brand_guide.pdf"
        uploaded_at: "2026-03-14T11:00:00Z"

      - type: "reference_article"
        url: "https://example.com/sample-post"
        note: "Write in this style"

    promised:
      - type: "keyword_list"
        description: "SEO keywords for each topic"
        due_by: "2026-03-16T00:00:00Z"
        status: "pending"

  # ═══════════════════════════════════════════════════════════════
  # MILESTONES
  # ═══════════════════════════════════════════════════════════════
  milestones:
    distribution: "equal_backloaded"  # Equal split, more on final

    items:
      - id: 1
        name: "Blog Post 1: AI Diagnostics"
        deliverable_ids: ["D1"]
        deadline: "2026-03-19T23:59:59Z"
        payout:
          amount: 100.00
          percentage: 18.2%

      - id: 2
        name: "Blog Post 2: Drug Discovery"
        deliverable_ids: ["D2"]
        deadline: "2026-03-22T23:59:59Z"
        payout:
          amount: 100.00
          percentage: 18.2%

      - id: 3
        name: "Blog Post 3: Patient Care Chatbots"
        deliverable_ids: ["D3"]
        deadline: "2026-03-25T23:59:59Z"
        payout:
          amount: 100.00
          percentage: 18.2%

      - id: 4
        name: "Blog Post 4: Predictive Analytics"
        deliverable_ids: ["D4"]
        deadline: "2026-03-28T23:59:59Z"
        payout:
          amount: 100.00
          percentage: 18.2%

      - id: 5
        name: "Blog Post 5: AI Ethics (Final)"
        deliverable_ids: ["D5"]
        deadline: "2026-03-31T23:59:59Z"
        payout:
          amount: 150.00  # Backloaded
          percentage: 27.3%
        is_final: true

  # ═══════════════════════════════════════════════════════════════
  # TIMELINE & BUDGET
  # ═══════════════════════════════════════════════════════════════
  timeline:
    start_date: "2026-03-15"
    end_date: "2026-03-31"
    total_days: 16

  budget:
    total: 550.00
    currency: "USD"
    escrow_funded: 550.00
    platform_fee: 55.00  # 10%
    freelancer_receives: 495.00

  # ═══════════════════════════════════════════════════════════════
  # CHANGE REQUEST POLICY
  # ═══════════════════════════════════════════════════════════════
  change_requests:
    client:
      allocated: 3
      remaining: 3
      can_purchase_more: true
      price_per_additional: 25.00

    freelancer:
      allocated: 2
      remaining: 2

    what_counts:
      change_request:
        - "Adding new deliverables"
        - "Changing existing requirements"
        - "Modifying scope significantly"

      not_change_request:
        - "Clarifying existing requirements"
        - "Fixing typos or errors in deliverables"
        - "Answering questions"

    budget_timeline_changes:
      - "Budget increases require new escrow funding"
      - "Timeline changes require mutual agreement"
      - "Both count against change request allocation"

  # ═══════════════════════════════════════════════════════════════
  # VERIFICATION SETTINGS
  # ═══════════════════════════════════════════════════════════════
  verification:
    auto_verify: true
    auto_release_threshold: 90

    scoring_weights:
      primary: 60%
      secondary: 30%
      tertiary: 10%

    primary_must_pass: true  # All primary must be 100%

    resubmissions:
      max_per_milestone: 2

  # ═══════════════════════════════════════════════════════════════
  # SIGNATURES
  # ═══════════════════════════════════════════════════════════════
  signatures:
    client:
      agreed_at: "2026-03-15T10:28:00Z"
      statement: "I agree to this spec and have funded escrow"

    freelancer:
      agreed_at: "2026-03-15T10:30:00Z"
      statement: "I agree to deliver according to this spec"
```

---

## Edge Cases

### 1. Client abandons during intake
- No freelancer assigned yet
- Job expires after X days (e.g., 30 days)
- No penalty

### 2. Freelancer ghosts during negotiation
- **Ghost Protocol:** Freelancer's PFI/accountability score tanks
- Client can unassign after X hours of no response
- Freelancer gets warning notification before penalty

### 3. Endless negotiation
- After X days (e.g., 7 days), AI escalates
- AI: "You've been negotiating for 7 days. Please finalize or consider parting ways."
- Low priority feature

### 4. Fundamental disagreement
- Either party can request unassignment
- No penalty for either party (pre-lock)
- Job goes back to bidding phase

### 5. Client doesn't fund escrow after lock
- Lock is conditional on escrow funding
- If not funded within 24 hours, lock expires
- Freelancer can choose to wait or request unassignment

---

## Open Questions for Later

1. **What if client's promised assets never arrive?** (e.g., keyword list due March 16)
2. **How long can negotiation phase last before timing out?**
3. **Can client reject all bids and re-post?**

---

## Next Topics

- [ ] Verification - How each gig type is verified
- [ ] Change Request System - Detailed mechanics
- [ ] Escrow & Payout Policies
- [ ] PFI / Accountability Scoring
- [ ] AI Mediator Behaviors
