# Change Request System - Finalized Design

## Overview

After spec lock, changes are **limited and tracked**. This prevents scope creep while allowing legitimate adjustments.

---

## Allocation

| Party | Default Allocation | Can Purchase More? | Price |
|-------|-------------------|-------------------|-------|
| **Client** | 3 | Yes | $25 per additional |
| **Freelancer** | 2 | No | N/A |

**Why freelancer can't buy more?** Freelancer shouldn't be changing scope - they're delivering to spec. Their 2 are for emergencies (discovered impossibilities, technical blockers, etc.)

---

## What Counts vs. Doesn't Count

### Counts as Change Request ✅

| Action | Why It Counts |
|--------|---------------|
| "Add a 6th blog post" | New deliverable |
| "Change word count from 1000 to 1500" | Modifying requirement |
| "Actually, make it formal tone not casual" | Changing requirement |
| "Extend deadline by 1 week" | Timeline change |
| "Increase budget by $100" | Budget change |
| "Remove the SEO requirement" | Removing requirement |
| "Add infographic to each post" | Adding new requirement |

### Does NOT Count ❌

| Action | Why It Doesn't Count |
|--------|----------------------|
| "What did you mean by 'engaging'?" | Clarification of existing spec |
| "You spelled my company name wrong" | Error/typo fix |
| "Can you send in PDF instead of Word?" | Minor format (unless spec explicitly required Word) |
| "The link you sent is broken" | Technical issue |
| "Here's the keyword list I promised" | Client fulfilling their obligation |
| "Can you clarify the citation format?" | Clarification |
| "The file is corrupted, can you resend?" | Technical issue |

---

## Change Request Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CHANGE REQUEST FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. REQUEST INITIATED                                                       │
│     ├── Client or Freelancer proposes change in chat                       │
│     └── AI detects: "This looks like a scope change"                       │
│                                                                             │
│  2. AI CLASSIFICATION                                                       │
│     ├── AI categorizes: Change Request OR Clarification                    │
│     ├── If Change Request → Warns about using allocation                   │
│     └── Requester confirms: "Yes, use my change request"                   │
│                                                                             │
│  3. OTHER PARTY REVIEW                                                      │
│     ├── Notified of change request                                         │
│     ├── Can: [Accept] [Negotiate] [Reject]                                 │
│     └── Must respond within 48 hours (or reminder → 72h escalate)          │
│                                                                             │
│  4. IMPACT ASSESSMENT                                                       │
│     ├── Does this affect timeline? → Negotiate new deadline                │
│     ├── Does this affect budget? → Additional escrow required              │
│     └── AI suggests fair adjustments                                       │
│                                                                             │
│  5. MUTUAL AGREEMENT                                                        │
│     ├── Both parties confirm adjusted terms                                │
│     ├── Spec updated with change logged                                    │
│     └── Change request counter decremented                                 │
│                                                                             │
│  6. IF REJECTED                                                             │
│     ├── Original spec stands                                               │
│     ├── Change request NOT consumed (wasn't accepted)                      │
│     └── Work continues as before                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Chat Interaction Examples

### Example 1: Simple Change Request

```
┌─────────────────────────────────────────────────────────────────┐
│  JOB CHAT                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Client - Sarah] Hey Marcus, can we make the blog posts        │
│  1500 words instead of 1000-1200? I realized we need more depth.│
│                                                                 │
│  [AI Mediator] ⚠️ This is a CHANGE REQUEST                     │
│                                                                 │
│  Current spec: 1000-1200 words per post                         │
│  Proposed: 1500 words per post (+25-50% more content)           │
│                                                                 │
│  Sarah, this will use 1 of your 3 remaining change requests.    │
│                                                                 │
│  Proceed?                                                       │
│  [Yes, submit change request] [Cancel]                          │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [Client - Sarah] Yes, submit change request                    │
│                                                                 │
│  [AI Mediator] 📋 Change Request #1 submitted                  │
│                                                                 │
│  Request: Increase word count from 1000-1200 to 1500 per post   │
│                                                                 │
│  Impact Assessment:                                             │
│  • ~25-50% more writing per post                                │
│  • Suggested timeline extension: +3 days                        │
│  • Suggested budget increase: +$100 (20%)                       │
│                                                                 │
│  Marcus, do you accept this change?                             │
│  [Accept as-is] [Accept with adjustments] [Reject]              │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [Freelancer - Marcus] I'll accept but need the timeline        │
│  extension. Budget increase would be nice but not required.     │
│                                                                 │
│  [AI Mediator] Marcus accepts with conditions:                  │
│  ✓ Word count: 1500 per post                                   │
│  ✓ Timeline: +3 days (March 31 → April 3)                      │
│  ✗ Budget: No change requested                                 │
│                                                                 │
│  Sarah, do you accept these terms?                              │
│  [Accept] [Counter-offer]                                       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [Client - Sarah] Accept                                        │
│                                                                 │
│  [AI Mediator] ✅ Change Request #1 APPROVED                   │
│                                                                 │
│  Spec updated:                                                  │
│  • Word count: 1000-1200 → 1500 per post                       │
│  • Deadline: March 31 → April 3                                 │
│                                                                 │
│  Change requests remaining:                                     │
│  • Sarah: 2 of 3                                               │
│  • Marcus: 2 of 2                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Example 2: Change Request with Budget Impact

```
┌─────────────────────────────────────────────────────────────────┐
│  CHANGE REQUEST WITH BUDGET IMPACT                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Client - Sarah] Can we add 2 more blog posts? (5 → 7 total)  │
│                                                                 │
│  [AI Mediator] ⚠️ This is a significant scope change.          │
│                                                                 │
│  Current: 5 blog posts @ $550                                   │
│  Proposed: 7 blog posts                                         │
│                                                                 │
│  Impact Assessment:                                             │
│  • 40% more deliverables                                        │
│  • Suggested budget increase: +$220                             │
│  • Suggested timeline extension: +5 days                        │
│                                                                 │
│  ⚠️ Additional escrow funding required                         │
│                                                                 │
│  If Marcus accepts, you'll need to fund an additional $242      │
│  ($220 + $22 platform fee) before this change takes effect.    │
│                                                                 │
│  This will use 1 of your 3 remaining change requests.          │
│                                                                 │
│  Proceed?                                                       │
│  [Yes, I'll fund additional escrow] [Cancel]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Example 3: Rejected Change Request

```
┌─────────────────────────────────────────────────────────────────┐
│  CHANGE REQUEST REJECTED                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Freelancer - Marcus] Reject                                   │
│                                                                 │
│  Please provide a reason (optional):                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Timeline is already tight, can't add 50% more content   │   │
│  │ without significant delay that doesn't work for me.     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Submit Rejection]                                             │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [AI Mediator] ❌ Change Request #1 REJECTED                   │
│                                                                 │
│  Marcus has declined to increase word count to 1500.            │
│  Reason: "Timeline is already tight, can't add 50% more         │
│  content without significant delay that doesn't work for me."   │
│                                                                 │
│  Original spec remains in effect:                               │
│  • Word count: 1000-1200 per post                              │
│                                                                 │
│  ✓ Change request NOT consumed (was not accepted)              │
│  Sarah's remaining: 3 of 3                                     │
│                                                                 │
│  Options:                                                       │
│  [Negotiate Different Terms] [Accept Original Spec]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Example 4: AI Distinguishes Clarification from Change

```
┌─────────────────────────────────────────────────────────────────┐
│  CLARIFICATION (NOT A CHANGE REQUEST)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Client - Sarah] When I said "professional tone", I mean       │
│  no contractions and formal language. Is that clear?            │
│                                                                 │
│  [AI Mediator] ✓ This is a CLARIFICATION                       │
│                                                                 │
│  You're explaining what "professional tone" means, not          │
│  changing the requirement.                                      │
│                                                                 │
│  This does NOT count against your change requests.              │
│                                                                 │
│  Spec annotation added:                                         │
│  "Professional tone = no contractions, formal language"         │
│                                                                 │
│  Marcus, please confirm you understand this clarification.      │
│                                                                 │
│  [Freelancer - Marcus] Got it, understood.                      │
│                                                                 │
│  [AI Mediator] ✅ Clarification acknowledged by both parties.  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Purchasing Additional Change Requests

When client exhausts their allocation:

```
┌─────────────────────────────────────────────────────────────────┐
│  PURCHASE ADDITIONAL CHANGE REQUESTS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  You've used all 3 of your change requests.                     │
│                                                                 │
│  Need more flexibility?                                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  +1 Change Request                              $25     │   │
│  │  [Purchase]                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  +3 Change Requests                     $60 (save $15)  │   │
│  │  [Purchase]                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  +5 Change Requests                     $90 (save $35)  │   │
│  │  [Purchase]                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ℹ️ Change requests are job-specific and don't roll over.      │
│     Purchased requests are non-refundable.                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Response Timeout

| Time | Action |
|------|--------|
| **48 hours** | Reminder sent to non-responding party |
| **72 hours** | AI escalates: "Please respond or this will be treated as rejection" |
| **96 hours** | Auto-treated as rejection, original spec stands |

---

## Disputed Classification

If either party disagrees with AI's classification (change vs clarification):

```
┌─────────────────────────────────────────────────────────────────┐
│  DISPUTE CLASSIFICATION                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Freelancer - Marcus] I think this is actually a change,       │
│  not a clarification. She's asking for formal citations now,    │
│  which wasn't in the original spec.                             │
│                                                                 │
│  [AI Mediator] Classification disputed.                         │
│                                                                 │
│  Original spec says: "Reference at least 2 studies or sources"  │
│  Client's message: "I need APA format citations"                │
│                                                                 │
│  AI Analysis:                                                   │
│  • Original spec: mentions references, no format specified      │
│  • Client request: specifies APA format                         │
│  • Verdict: This IS a change (adding format requirement)        │
│                                                                 │
│  Updated classification: CHANGE REQUEST                         │
│                                                                 │
│  Sarah, this will use 1 of your 3 change requests.             │
│  Proceed? [Yes] [Withdraw request]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

If parties still disagree → Platform review (rare, human reviewer decides).

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| **No response in 48h** | Reminder sent |
| **No response in 96h** | Auto-reject, original spec stands |
| **Freelancer has 0 requests left** | Must ask client to use theirs, or work with current spec |
| **Client demands change without allocation** | AI flags as scope creep, freelancer can refuse |
| **Change request during verification** | Verification paused until change resolved |
| **Change request after final milestone submitted** | Not allowed unless submission rejected |
| **Both parties want same change** | Uses requester's allocation (whoever proposed first) |

---

## Change Request Log

All changes are logged in the spec:

```yaml
change_log:
  - id: "CR001"
    requested_by: "client"
    requested_at: "2026-03-20T14:30:00Z"
    type: "requirement_change"
    description: "Increase word count from 1000-1200 to 1500 per post"

    impact:
      timeline: "+3 days"
      budget: "no change"

    response:
      by: "freelancer"
      at: "2026-03-20T15:45:00Z"
      decision: "accepted_with_conditions"
      conditions: "Timeline extension required"

    final_status: "approved"
    approved_at: "2026-03-20T16:00:00Z"

    spec_changes:
      - field: "requirements.primary.P1.description"
        from: "Each post must be 1000-1200 words"
        to: "Each post must be 1500 words"

      - field: "timeline.end_date"
        from: "2026-03-31"
        to: "2026-04-03"
```

---

## Summary

| Aspect | Value |
|--------|-------|
| **Client allocation** | 3 (can purchase more @ $25 each) |
| **Freelancer allocation** | 2 (cannot purchase more) |
| **Response timeout** | 48h reminder → 72h escalate → 96h auto-reject |
| **Classification** | AI categorizes, either party can dispute |
| **Budget changes** | Require additional escrow |
| **Rejected requests** | Don't consume allocation |
| **All changes** | Logged in spec with full audit trail |
