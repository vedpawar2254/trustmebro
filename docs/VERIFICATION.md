# Verification System - Finalized Design

## Overview

When a freelancer submits work, the system verifies:
1. Does it meet **basic standards**? (not garbage)
2. Does it satisfy **primary requirements**? (must have - blocks payment)
3. Does it satisfy **secondary requirements**? (should have - affects score)
4. Does it satisfy **tertiary requirements**? (nice to have - bonus)

---

## Verification Policies

Client selects a verification policy when creating the job. This determines how strict the system is.

### Policy Options

| Policy | Auto-Release Threshold | Partial (70-89) | Failed (<70) | Best For |
|--------|------------------------|-----------------|--------------|----------|
| **Strict** | Score ≥ 95 + all Primary pass | Must resubmit | Auto-reject | High-stakes, legal, medical |
| **Standard** | Score ≥ 90 + all Primary pass | Client decides | Auto-reject | Most jobs |
| **Flexible** | Score ≥ 85 + all Primary pass | Client decides | Client decides | Creative, subjective work |
| **Trust-Based** | Score ≥ 80 OR client approves | Client decides | Client decides | Repeat freelancers, simple tasks |

### Policy Details

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VERIFICATION POLICIES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STRICT                                                                     │
│  ├── Auto-release: Score ≥ 95 AND all Primary pass                         │
│  ├── Partial (70-89): Must resubmit, no client override                    │
│  ├── Failed (<70): Auto-reject                                             │
│  ├── Fails to dispute: 3                                                   │
│  └── Use case: Legal documents, medical content, compliance                │
│                                                                             │
│  STANDARD (Default)                                                         │
│  ├── Auto-release: Score ≥ 90 AND all Primary pass                         │
│  ├── Partial (70-89): Client chooses [Accept] or [Request Resubmit]        │
│  ├── Failed (<70): Auto-reject                                             │
│  ├── Fails to dispute: 5                                                   │
│  └── Use case: Most professional work                                      │
│                                                                             │
│  FLEXIBLE                                                                   │
│  ├── Auto-release: Score ≥ 85 AND all Primary pass                         │
│  ├── Partial (70-89): Client chooses                                       │
│  ├── Failed (<70): Client chooses                                          │
│  ├── Fails to dispute: 5                                                   │
│  └── Use case: Creative work, design, subjective deliverables              │
│                                                                             │
│  TRUST-BASED                                                                │
│  ├── Auto-release: Score ≥ 80 OR client manually approves                  │
│  ├── Partial (70-89): Client chooses                                       │
│  ├── Failed (<70): Client chooses                                          │
│  ├── Fails to dispute: 7                                                   │
│  └── Use case: Established relationships, simple/quick tasks               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Scoring System

### Formula

```
Verification Score =
  (Primary Score × 60%) +
  (Secondary Score × 30%) +
  (Tertiary Score × 10%)

Conditions for Auto-Release:
1. Overall score meets policy threshold (90/95/85/80)
2. ALL Primary requirements pass (100%)
3. No critical flags from AI
```

### Score Interpretation

| Score Range | Status | What Happens |
|-------------|--------|--------------|
| ≥ Threshold + Primary Pass | **VERIFIED** | Auto-release payment |
| 70-89 OR some Primary fail | **PARTIAL** | Policy determines (client decides or must resubmit) |
| < 70 | **FAILED** | Auto-reject (most policies) or client decides |

### Example Calculation

```
Job: Blog Post
Primary Requirements (5): 4 passed, 1 failed = 80%
Secondary Requirements (4): 3 passed, 1 failed = 75%
Tertiary Requirements (2): 1 passed, 1 failed = 50%

Weighted Score:
  Primary:   80% × 60 = 48
  Secondary: 75% × 30 = 22.5
  Tertiary:  50% × 10 = 5
  ─────────────────────────
  Total: 75.5

Status: PARTIAL (score is 75.5, but 1 Primary failed)
→ Even if score was 95, the failed Primary blocks auto-release
```

---

## Verification by Gig Type

### Copywriting

| Requirement Type | Check | Method | Automated |
|------------------|-------|--------|-----------|
| Primary | Word count in range | Count | ✅ Yes |
| Primary | Plagiarism < threshold | Copyscape/API | ✅ Yes |
| Primary | Topic coverage | AI semantic analysis | ✅ Yes (AI) |
| Primary | Tone match | AI tone detection | ✅ Yes (AI) |
| Secondary | Readability score | Flesch-Kincaid | ✅ Yes |
| Secondary | Grammar/spelling | Grammarly API | ✅ Yes |
| Secondary | Structure (intro/body/conclusion) | AI analysis | ✅ Yes (AI) |
| Secondary | Examples included | AI detection | ✅ Yes (AI) |
| Secondary | Sources cited | AI detection | ✅ Yes (AI) |
| Tertiary | SEO optimization | Keyword analysis | ✅ Yes |
| Tertiary | Exceeds word count | Count | ✅ Yes |

### Translation

| Requirement Type | Check | Method | Automated |
|------------------|-------|--------|-----------|
| Primary | Completeness (no missing sections) | AI paragraph mapping | ✅ Yes (AI) |
| Primary | Semantic accuracy | AI source↔target comparison | ✅ Yes (AI) |
| Primary | Target language grammar | LanguageTool API | ✅ Yes |
| Secondary | Terminology consistency | Glossary check + AI | ✅ Yes (AI) |
| Secondary | Localization level matches request | AI analysis | ✅ Yes (AI) |
| Secondary | Formatting preserved | Structure comparison | ✅ Yes |
| Tertiary | Natural fluency | AI readability in target | ✅ Yes (AI) |
| Tertiary | Cultural adaptation | AI analysis | ✅ Yes (AI) |

### Data Entry

| Requirement Type | Check | Method | Automated |
|------------------|-------|--------|-----------|
| Primary | Record count matches | Row count | ✅ Yes |
| Primary | Required fields complete | Empty cell check | ✅ Yes |
| Primary | Format validation (email, phone, etc.) | Regex | ✅ Yes |
| Secondary | No duplicates | Hash comparison | ✅ Yes |
| Secondary | Spelling in text fields | Spell check | ✅ Yes |
| Secondary | Source accuracy (sampling) | OCR comparison | ⚠️ Partial |
| Tertiary | Data normalization | Format consistency | ✅ Yes |
| Tertiary | Additional validation rules | Custom rules | ✅ Yes |

---

## Submission & Verification Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SUBMISSION FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. FREELANCER SUBMITS                                                      │
│     └── Upload files / paste text / link GitHub                            │
│                                                                             │
│  2. AUTOMATED CHECKS RUN                                                    │
│     ├── Word count, plagiarism, format validation                          │
│     ├── AI analysis (topic, tone, structure, etc.)                         │
│     └── Results compiled into verification report                          │
│                                                                             │
│  3. SCORE CALCULATED                                                        │
│     ├── Primary: X/Y passed                                                │
│     ├── Secondary: X/Y passed                                              │
│     ├── Tertiary: X/Y passed                                               │
│     └── Weighted total calculated                                          │
│                                                                             │
│  4. STATUS DETERMINED                                                       │
│     │                                                                       │
│     ├── VERIFIED (score ≥ threshold + all Primary pass)                    │
│     │   └── Auto-release payment                                           │
│     │                                                                       │
│     ├── PARTIAL (70-89 OR some Primary fail)                               │
│     │   ├── Notify client                                                  │
│     │   └── Client decides: [Accept] or [Request Resubmit]                 │
│     │                                                                       │
│     └── FAILED (<70)                                                        │
│         ├── Auto-reject (Strict/Standard)                                  │
│         ├── Notify freelancer with vague feedback                          │
│         └── Resubmission required                                          │
│                                                                             │
│  5. IF RESUBMISSION NEEDED                                                  │
│     ├── Freelancer gets feedback in chat                                   │
│     ├── AI suggests deadline extension                                     │
│     ├── Freelancer resubmits (uses 1 of 2 attempts)                        │
│     └── After 5 total fails → DISPUTE                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Resubmission System

### Attempts

- **Max resubmissions per milestone:** 2
- **Total fails before dispute:** 5 (across all attempts)
- **Fails are cumulative:** Original submission + resubmissions

### Deadline Handling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RESUBMISSION DEADLINE FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Submission rejected → AI analyzes feedback scope                           │
│                                                                             │
│  AI SUGGESTS EXTENSION:                                                     │
│  "Based on the required changes, I recommend extending the deadline         │
│   by 2 days (March 19 → March 21)"                                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  OPTION A: Accept AI Suggestion                                     │   │
│  │  • Deadline extended to March 21                                    │   │
│  │  • Normal resubmission flow                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  OPTION B: Client Insists on Original Deadline                      │   │
│  │  • Client: "I need this by March 19, no extension"                  │   │
│  │  • AI asks freelancer: "Client requests original deadline.          │   │
│  │    Do you accept?"                                                  │   │
│  │                                                                     │   │
│  │  If Freelancer Accepts:                                             │   │
│  │  • Deadline stays March 19                                          │   │
│  │  • Freelancer's ACCOUNTABILITY SCORE +15 points                     │   │
│  │  • Logged: "Accepted tight deadline under pressure"                 │   │
│  │                                                                     │   │
│  │  If Freelancer Declines:                                            │   │
│  │  • AI mediates negotiation                                          │   │
│  │  • Must reach agreement or escalate                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  OPTION C: Custom Negotiation                                       │   │
│  │  • Either party proposes different deadline                         │   │
│  │  • AI facilitates agreement                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Accountability Score Boost

When freelancer accepts a tight deadline (client insists, no extension):

| Scenario | Accountability Score Change |
|----------|----------------------------|
| Accepts tight deadline + delivers on time + passes | +15 to +20 |
| Accepts tight deadline + delivers on time + partial | +10 |
| Accepts tight deadline + delivers late | +5 (still honored commitment) |
| Accepts tight deadline + fails | No bonus (but no extra penalty) |

---

## Feedback System

### Feedback Levels

| Level | When Sent | Content | Purpose |
|-------|-----------|---------|---------|
| **Vague** | Auto-sent on rejection | General categories | Encourage self-review |
| **Detailed** | On freelancer request | Specific line-by-line | Actionable fixes |
| **Spec Clarification** | When ambiguity detected | Triggers spec update | Resolve confusion |

### Vague Feedback (Default)

```
┌─────────────────────────────────────────────────────────────────┐
│  [AI Feedback - Chat Message]                                   │
│                                                                 │
│  Your submission scored 72/100 (PARTIAL).                       │
│                                                                 │
│  Areas needing attention:                                       │
│  • Content length does not meet requirements                    │
│  • Some sections lack supporting evidence                       │
│  • Citation formatting needs improvement                        │
│                                                                 │
│  You have 2 resubmission attempts remaining.                    │
│  Reply "details" for specific feedback.                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Detailed Feedback (On Request)

```
┌─────────────────────────────────────────────────────────────────┐
│  [Freelancer] details                                           │
│                                                                 │
│  [AI - Detailed Breakdown]                                      │
│                                                                 │
│  PRIMARY REQUIREMENTS:                                          │
│  ✗ P1: Word count - 876 words (need 1000-1200)                 │
│    → Suggestion: Expand sections 2 and 3                        │
│                                                                 │
│  ✓ P2: Plagiarism - 3% (threshold: <10%) ✓                     │
│                                                                 │
│  ✓ P3: Topic coverage - PASSED                                 │
│    → AI confidence: 87%                                         │
│                                                                 │
│  ✓ P4: Professional tone - PASSED                              │
│    → AI confidence: 92%                                         │
│                                                                 │
│  ✗ P5: Source citations - 1 found (need 2+)                    │
│    → Location: Section 3, paragraph 2 mentions "a study"        │
│      but doesn't cite it                                        │
│    → Suggestion: Add source or find second citation             │
│                                                                 │
│  SECONDARY REQUIREMENTS:                                        │
│  ✗ S1: Examples - 2 found (need 3+)                            │
│    → Section 2 has no concrete examples                         │
│                                                                 │
│  ✓ S2: Readability - Grade 11 (target: 10-12) ✓                │
│                                                                 │
│  ... (continues)                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Spec Clarification Flow

When feedback reveals ambiguity in the original spec:

```
┌─────────────────────────────────────────────────────────────────┐
│  [Freelancer] Wait, the spec says "cite sources" but Sarah      │
│  told me in chat that just mentioning them is fine. Which is it?│
│                                                                 │
│  [AI Mediator] ⚠️ I'm detecting a spec ambiguity.              │
│                                                                 │
│  Current spec says: "Cite at least 2 credible sources"          │
│  But earlier in chat, Sarah said: "just mention studies"        │
│                                                                 │
│  Sarah, can you clarify what you need?                          │
│  • Formal citations (Author, Year, URL)                         │
│  • Informal mentions ("According to a Harvard study...")        │
│                                                                 │
│  [Client - Sarah] Informal mentions are fine, no formal cite    │
│                                                                 │
│  [AI Mediator] ✅ Spec Clarification Applied                   │
│                                                                 │
│  Requirement P5 updated:                                        │
│  FROM: "Cite at least 2 credible sources"                       │
│  TO:   "Reference at least 2 studies or sources (formal         │
│         citation not required)"                                 │
│                                                                 │
│  This is a CLARIFICATION (does not count as change request)    │
│                                                                 │
│  Marcus, your submission will be re-verified with updated spec. │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### When Clarification Becomes Change Request

```
┌─────────────────────────────────────────────────────────────────┐
│  [Client - Sarah] Actually, can we also add a requirement       │
│  for including an infographic?                                  │
│                                                                 │
│  [AI Mediator] ⚠️ This is a NEW requirement, not a             │
│  clarification of existing ones.                                │
│                                                                 │
│  Adding "include infographic" would count as 1 of your          │
│  3 remaining change requests.                                   │
│                                                                 │
│  Proceed?                                                       │
│  [Yes, use change request] [No, withdraw]                       │
│                                                                 │
│  [Client - Sarah] Yes, use change request                       │
│                                                                 │
│  [AI Mediator] ✅ Change Request Applied                       │
│                                                                 │
│  New requirement added (Secondary):                             │
│  "Include 1 infographic summarizing key points"                 │
│                                                                 │
│  Change requests remaining: 2 of 3                              │
│                                                                 │
│  Marcus, do you accept this change?                             │
│  [Accept] [Negotiate timeline/budget]                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Appeal System

Freelancer can appeal AI verification if they believe it's wrong.

### Appeal Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPEAL FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. FREELANCER INITIATES APPEAL                                             │
│     └── "I believe the AI incorrectly flagged [requirement]"               │
│                                                                             │
│  2. APPEAL GOES TO CLIENT FIRST                                             │
│     ├── Client reviews submission + AI feedback                            │
│     ├── Client can: [Agree with AI] or [Override - Accept Submission]      │
│     └── If client overrides → Payment released, appeal resolved            │
│                                                                             │
│  3. IF CLIENT AGREES WITH AI                                                │
│     ├── Freelancer can escalate to platform review                         │
│     ├── Platform fee: $X (refunded if freelancer wins)                     │
│     └── Human reviewer examines submission                                 │
│                                                                             │
│  4. PLATFORM REVIEW OUTCOMES                                                │
│     │                                                                       │
│     ├── FREELANCER WINS                                                     │
│     │   ├── Submission marked as VERIFIED                                  │
│     │   ├── Payment released                                               │
│     │   ├── Appeal fee refunded                                            │
│     │   └── Client's PFI slightly reduced (disputed valid work)            │
│     │                                                                       │
│     ├── AI WAS CORRECT                                                      │
│     │   ├── Original verdict stands                                        │
│     │   ├── Appeal fee kept by platform                                    │
│     │   └── Freelancer must resubmit or accept rejection                   │
│     │                                                                       │
│     └── SPEC WAS AMBIGUOUS                                                  │
│         ├── Spec clarified                                                 │
│         ├── Submission re-evaluated                                        │
│         ├── Appeal fee refunded                                            │
│         └── No penalty to either party                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Appeal UI

```
┌─────────────────────────────────────────────────────────────────┐
│  APPEAL VERIFICATION RESULT                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Submission: Blog Post 1 - AI Diagnostics                       │
│  AI Score: 72/100 (PARTIAL)                                     │
│                                                                 │
│  Which requirement(s) are you appealing?                        │
│                                                                 │
│  ☐ P1: Word count (AI says: 876, need 1000-1200)               │
│  ☑ P5: Source citations (AI says: 1 found, need 2)             │
│  ☐ S1: Examples (AI says: 2 found, need 3)                     │
│                                                                 │
│  Explain why you believe AI is wrong:                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ I cited two sources: the WHO report in paragraph 2      │   │
│  │ and the Stanford study in paragraph 4. The AI may have  │   │
│  │ missed the WHO reference because it's hyperlinked, not  │   │
│  │ written as a formal citation.                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Submit Appeal to Client]                                      │
│                                                                 │
│  ℹ️ The client will review first. If they agree with AI,       │
│     you can escalate to platform review ($15 fee, refunded     │
│     if you win).                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Client Override

Client can approve any submission regardless of AI score.

### Override Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  SUBMISSION REVIEW                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Milestone: Blog Post 1 - AI Diagnostics                        │
│  AI Score: 68/100 (FAILED)                                      │
│                                                                 │
│  AI Recommendation: Reject and request resubmission             │
│                                                                 │
│  Failed Requirements:                                           │
│  ✗ P1: Word count 876 (need 1000-1200)                         │
│  ✗ P5: Only 1 source cited (need 2)                            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [View Full Submission]                                         │
│                                                                 │
│  Your Options:                                                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ACCEPT ANYWAY (Override AI)                            │   │
│  │  Release payment despite failed verification            │   │
│  │  ⚠️ Logged as "Client Override"                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  REQUEST RESUBMISSION                                   │   │
│  │  Freelancer has 2 attempts remaining                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  REJECT & DISPUTE                                       │   │
│  │  Escalate to dispute resolution                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dispute Flow

After 5 consecutive fails OR either party requests dispute:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DISPUTE FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TRIGGERS:                                                                  │
│  • 5 consecutive failed submissions                                         │
│  • Client manually initiates dispute                                        │
│  • Freelancer manually initiates dispute                                    │
│  • Fundamental disagreement on requirements                                 │
│                                                                             │
│  DISPUTE PROCESS:                                                           │
│  1. Job status → DISPUTED                                                   │
│  2. Work paused                                                             │
│  3. All evidence preserved (chat, submissions, spec, verification reports)  │
│  4. Platform mediator assigned                                              │
│                                                                             │
│  POSSIBLE OUTCOMES:                                                         │
│  │                                                                          │
│  ├── CLIENT WINS                                                            │
│  │   ├── Escrow refunded to client (minus platform fee already paid)       │
│  │   ├── Platform fee: REFUNDED to client                                  │
│  │   ├── Freelancer PFI: Significant decrease                              │
│  │   └── Job marked: CANCELLED - Freelancer fault                          │
│  │                                                                          │
│  ├── FREELANCER WINS                                                        │
│  │   ├── Escrow released to freelancer                                     │
│  │   ├── Platform fee: REFUNDED to client                                  │
│  │   ├── Client PFI: Significant decrease                                  │
│  │   └── Job marked: COMPLETED - Disputed                                  │
│  │                                                                          │
│  ├── SPLIT DECISION                                                         │
│  │   ├── Partial escrow to freelancer (based on work done)                 │
│  │   ├── Partial refund to client                                          │
│  │   ├── Platform fee: REFUNDED to client                                  │
│  │   ├── Minor PFI impact to both                                          │
│  │   └── Job marked: CANCELLED - Mutual                                    │
│  │                                                                          │
│  └── SPEC WAS UNCLEAR (Nobody at fault)                                    │
│      ├── Escrow returned to client OR split fairly                         │
│      ├── Platform fee: REFUNDED to client                                  │
│      ├── No PFI impact                                                     │
│      └── Job marked: CANCELLED - Spec unclear                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Verification Report Structure

```yaml
verification_report:
  # ═══════════════════════════════════════════════════════════════
  # META
  # ═══════════════════════════════════════════════════════════════
  meta:
    report_id: "ver_12345"
    submission_id: "sub_789"
    milestone_id: 1
    job_id: "job_456"
    created_at: "2026-03-19T14:30:00Z"
    policy: "standard"

  # ═══════════════════════════════════════════════════════════════
  # OVERALL RESULT
  # ═══════════════════════════════════════════════════════════════
  result:
    score: 72
    status: "partial"  # verified | partial | failed
    auto_released: false
    reason: "Score below threshold and 1 primary requirement failed"

  # ═══════════════════════════════════════════════════════════════
  # REQUIREMENT BREAKDOWN
  # ═══════════════════════════════════════════════════════════════
  requirements:
    primary:
      total: 5
      passed: 4
      failed: 1
      score: 80  # 4/5 = 80%

      details:
        - id: "P1"
          description: "Each post must be 1000-1200 words"
          status: "failed"
          expected: "1000-1200 words"
          actual: "876 words"
          shortfall: "124 words below minimum"
          verification_method: "automated_word_count"

        - id: "P2"
          description: "Plagiarism < 10%"
          status: "passed"
          expected: "<10%"
          actual: "3%"
          verification_method: "copyscape_api"

        - id: "P3"
          description: "Cover assigned topic"
          status: "passed"
          confidence: 0.87
          verification_method: "ai_semantic_analysis"
          ai_notes: "Covers radiology AI applications comprehensively"

        - id: "P4"
          description: "Professional tone"
          status: "passed"
          confidence: 0.92
          verification_method: "ai_tone_analysis"

        - id: "P5"
          description: "Cite 2+ sources"
          status: "passed"
          expected: "2+"
          actual: "2 detected"
          verification_method: "ai_citation_detection"

    secondary:
      total: 4
      passed: 2
      failed: 2
      score: 50  # 2/4 = 50%

      details:
        - id: "S1"
          description: "Include 3+ examples"
          status: "failed"
          expected: "3+"
          actual: "2 detected"
          locations: ["Section 2: paragraph 3", "Section 4: paragraph 1"]
          verification_method: "ai_content_analysis"

        - id: "S2"
          description: "Readability Grade 10-12"
          status: "passed"
          expected: "Grade 10-12"
          actual: "Grade 11"
          verification_method: "flesch_kincaid"

        - id: "S3"
          description: "Clear structure"
          status: "passed"
          verification_method: "ai_structure_analysis"
          ai_notes: "Has intro, 4 body sections, conclusion"

        - id: "S4"
          description: "SEO-optimized headlines"
          status: "failed"
          verification_method: "ai_seo_analysis"
          ai_notes: "Headlines don't include target keywords"

    tertiary:
      total: 1
      passed: 0
      failed: 1
      score: 0  # 0/1 = 0%

      details:
        - id: "T1"
          description: "Include statistics with citations"
          status: "failed"
          actual: "Statistics mentioned but not cited"
          verification_method: "ai_content_analysis"

  # ═══════════════════════════════════════════════════════════════
  # SCORING CALCULATION
  # ═══════════════════════════════════════════════════════════════
  scoring:
    weights:
      primary: 60
      secondary: 30
      tertiary: 10

    calculation:
      primary_contribution: 48    # 80% × 60 = 48
      secondary_contribution: 15  # 50% × 30 = 15
      tertiary_contribution: 0    # 0% × 10 = 0

    total_score: 63  # Before primary-must-pass rule

    adjustments:
      - reason: "Primary requirement failed"
        impact: "Cannot auto-release regardless of score"

    final_score: 72  # Display score
    final_status: "partial"

  # ═══════════════════════════════════════════════════════════════
  # FEEDBACK
  # ═══════════════════════════════════════════════════════════════
  feedback:
    vague: |
      Your submission scored 72/100 (PARTIAL).

      Areas needing attention:
      • Content length does not meet requirements
      • Some sections lack supporting examples
      • Headlines could be more SEO-optimized

      You have 2 resubmission attempts remaining.
      Reply "details" for specific feedback.

    detailed:
      - requirement_id: "P1"
        issue: "Word count is 876, requirement is 1000-1200"
        suggestion: "Expand Section 2 (Current Applications) and Section 3 (Case Studies) with more detail"
        priority: "high"

      - requirement_id: "S1"
        issue: "Only 2 concrete examples found, need 3+"
        suggestion: "Add example in Section 2 about a specific AI diagnostic tool (e.g., Google's diabetic retinopathy detection)"
        priority: "medium"

      - requirement_id: "S4"
        issue: "Headlines don't contain target keywords"
        suggestion: "Revise headline from 'How Machines See X-Rays' to 'AI Radiology: How Machines Diagnose X-Rays'"
        priority: "low"

  # ═══════════════════════════════════════════════════════════════
  # RESUBMISSION
  # ═══════════════════════════════════════════════════════════════
  resubmission:
    required: true
    attempts_used: 0
    attempts_remaining: 2

    deadline:
      original: "2026-03-19T23:59:59Z"
      ai_suggested_extension: "2026-03-21T23:59:59Z"
      ai_reasoning: "Word count expansion and example addition typically requires 1-2 days"
      current: "pending_negotiation"

  # ═══════════════════════════════════════════════════════════════
  # ACTIONS AVAILABLE
  # ═══════════════════════════════════════════════════════════════
  actions:
    client:
      - action: "accept_override"
        description: "Accept submission despite failed verification"
        available: true

      - action: "request_resubmission"
        description: "Ask freelancer to fix and resubmit"
        available: true

      - action: "dispute"
        description: "Escalate to dispute resolution"
        available: true

    freelancer:
      - action: "resubmit"
        description: "Submit revised work"
        available: true
        attempts_remaining: 2

      - action: "appeal"
        description: "Appeal AI verification result"
        available: true

      - action: "request_clarification"
        description: "Ask for spec clarification"
        available: true
```

---

## Summary Table

| Aspect | Value |
|--------|-------|
| **Policies** | Strict, Standard (default), Flexible, Trust-Based |
| **Auto-release threshold** | 80-95 depending on policy + all Primary must pass |
| **Partial range** | 70-89 OR any Primary fails |
| **Failed range** | <70 |
| **Fails to dispute** | 5 (Strict: 3, Trust-Based: 7) |
| **Resubmissions per milestone** | 2 |
| **Deadline on resubmit** | AI suggests extension; if client insists + freelancer accepts = accountability boost |
| **Feedback levels** | Vague (default) → Detailed (on request) → Spec clarification |
| **Appeal path** | Freelancer → Client review → Platform review (fee applies) |
| **Client override** | Yes, can approve any submission |
| **Platform fee on dispute** | Refunded to client |

---

## Next Topics

- [ ] Change Request System - Detailed mechanics
- [ ] Escrow & Payout Policies
- [ ] PFI / Accountability Scoring
- [ ] AI Mediator Behaviors
