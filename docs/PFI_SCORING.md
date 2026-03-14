# PFI & Accountability Scoring - Finalized Design

## Overview

Two interconnected scores measure user trustworthiness on the platform:

| Score | Full Name | Who Has It | Purpose |
|-------|-----------|------------|---------|
| **PFI** | Platform Feedback Index | Both | Overall trust/reliability |
| **Accountability** | Accountability Score | Freelancers only | Handling pressure, changes, deadlines |

---

## Score Structure

PFI is a **composite score** with visible breakdown:

```
┌─────────────────────────────────────────────────────────┐
│  MARCUS JOHNSON                                         │
│  ⭐ PFI: 88                                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Score Breakdown:                                       │
│  ├── Reliability:     85  ████████████████░░░░         │
│  ├── Quality:         90  ██████████████████░░         │
│  └── Accountability:  94  ███████████████████░         │
│                                                         │
│  Jobs Completed: 23                                     │
│  On-Time Rate: 96%                                      │
│  Avg Verification Score: 91                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Component Weights (Freelancer)

| Component | Weight | Measures |
|-----------|--------|----------|
| **Reliability** | 40% | On-time delivery, responsiveness, no ghosting |
| **Quality** | 35% | Verification scores, first-try passes |
| **Accountability** | 25% | Handling changes, tight deadlines, pressure |

### Client PFI (Simpler)

Clients have a simpler PFI without breakdown:

```
┌─────────────────────────────────────────────────────────┐
│  SARAH CHEN                                             │
│  ⭐ PFI: 94                                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Jobs Posted: 12                                        │
│  Jobs Completed: 11                                     │
│  Avg Response Time: 4 hours                             │
│  Payment Rating: Excellent                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Starting Scores

| Role | Starting PFI | Rationale |
|------|--------------|-----------|
| **Client** | 100 | Benefit of the doubt, paying customer |
| **Freelancer** | 90 | Must prove themselves, but fair start |

### New User Indicator

New users get a badge instead of being penalized:

```
Marcus Johnson 🆕
PFI: 90 (New)
2 jobs completed
```

---

## Score Ranges & Consequences

```
0 ─────────────────────────────────────────────────────── 100
│                                                         │
▼                                                         ▼
CRITICAL       RESTRICTED         GOOD          EXCELLENT
(0-30)          (31-60)         (61-85)         (86-100)
```

| Range | Status | Consequences |
|-------|--------|--------------|
| **86-100** | Excellent | Full access, featured in search, trust badges, priority support |
| **61-85** | Good | Normal access, standard visibility |
| **31-60** | Restricted | Warning displayed on profile, limited bidding, manual job review |
| **0-30** | Critical | Account suspension review, may be permanently banned |

### Restriction Details

When PFI drops below 60:

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ ACCOUNT RESTRICTED                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Your PFI has dropped to 52, which restricts some       │
│  platform features:                                     │
│                                                         │
│  • You can only bid on 3 jobs at a time                │
│  • Your profile shows a warning to clients             │
│  • New jobs require manual review before starting      │
│                                                         │
│  To restore full access:                                │
│  • Complete jobs successfully                          │
│  • Maintain good communication                         │
│  • Avoid further negative incidents                    │
│                                                         │
│  [View Recovery Guide]                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Events That Affect PFI

### Freelancer Events

#### Positive Events

| Event | PFI Impact | Component Affected |
|-------|------------|-------------------|
| Job completed successfully | +2 to +5 | All |
| Verification score 95+ | +5 | Quality |
| Verification score 90-94 | +3 | Quality |
| Delivered on time | +1 | Reliability |
| Delivered early | +2 | Reliability |
| Milestone verified first try | +0.5 | Quality |
| Client gives 5-star rating | +3 | All |
| Client gives 4-star rating | +1 | All |
| Appeal won against AI | +2 | Quality |
| Accepted tight deadline + delivered | +10 to +20 | Accountability |
| Handled change request gracefully | +2 | Accountability |
| Handled 3+ change requests well | +5 | Accountability |
| Proactively communicated blockers | +1 | Reliability |

#### Negative Events

| Event | PFI Impact | Component Affected |
|-------|------------|-------------------|
| Multiple resubmissions needed | -1 per extra | Quality |
| Missed deadline (1-3 days late) | -3 | Reliability |
| Missed deadline (3+ days late) | -5 | Reliability |
| Failed verification (all attempts) | -5 | Quality |
| Dispute lost | -10 to -15 | All |
| Dispute split decision | -3 | All |
| Ghost (72h+ no response) | -15 | Reliability |
| Abandoned job | -20 to -30 | All |
| Client gives 1-2 star rating | -5 | All |
| Client gives 3 star rating | -1 | All |
| Rejected reasonable change request | -2 | Accountability |
| Required multiple deadline extensions | -3 | Accountability |

### Client Events

#### Positive Events

| Event | PFI Impact |
|-------|------------|
| Job completed successfully | +1 to +2 |
| Funded escrow promptly | +0.5 |
| Responded to submissions within 24h | +0.5 |
| Freelancer gives 5-star rating | +2 |
| Clear spec, no disputes | +1 |

#### Negative Events

| Event | PFI Impact |
|-------|------------|
| Used all change requests + bought more | -1 |
| Dispute lost | -10 to -15 |
| Dispute split decision | -3 |
| Failed to fund escrow (lock expired) | -5 |
| Unreasonable rejection of verified work | -5 |
| Ghost (no response to submissions 72h+) | -10 |
| Scope creep flagged by Bro (per incident) | -2 |
| Freelancer gives 1-2 star rating | -3 |

---

## Accountability Score Deep Dive

Accountability is a sub-score measuring how freelancers handle:
- Evolving requirements
- Tight deadlines
- Pressure situations
- Change requests

### Accountability Events

| Event | Impact | Notes |
|-------|--------|-------|
| **Accepted tight deadline + delivered on time** | +15 to +20 | Major boost - proves reliability under pressure |
| **Accepted tight deadline + delivered + verified 90+** | +20 | Maximum boost |
| **Accepted change request, delivered smoothly** | +2 | Shows flexibility |
| **Handled 3+ change requests in one job** | +5 bonus | Highly adaptable |
| **Delivered despite client-caused delays** | +3 | Professional attitude |
| **Proactively flagged potential issues** | +1 | Good communication |
| **Rejected reasonable change request** | -2 | Inflexible |
| **Excessive complaints about changes (Bro detected)** | -3 | Poor attitude |
| **Accepted tight deadline but missed it** | -5 | Overpromised |
| **Required 2+ deadline extensions same job** | -3 | Poor estimation |

### How Tight Deadline Boost Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TIGHT DEADLINE ACCOUNTABILITY BOOST                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SITUATION:                                                                 │
│  • Submission rejected, resubmission needed                                │
│  • Bro suggests: Extend deadline by 2 days                                 │
│  • Client insists: Keep original deadline                                  │
│                                                                             │
│  IF FREELANCER ACCEPTS TIGHT DEADLINE:                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Outcome                              │ Accountability Impact       │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Delivers on time + Verified 90+      │ +20 points                  │   │
│  │  Delivers on time + Verified 70-89    │ +15 points                  │   │
│  │  Delivers on time + Verified <70      │ +10 points                  │   │
│  │  Delivers late                        │ +5 points (honored intent)  │   │
│  │  Fails to deliver                     │ No boost, no extra penalty  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Note: Accepting a tight deadline is NEVER penalized extra.                │
│  The freelancer took a risk to help the client.                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Accountability Display

```
┌─────────────────────────────────────────────────────────┐
│  ACCOUNTABILITY: 94                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ███████████████████████████████████████░░░░░ 94/100   │
│                                                         │
│  What this means:                                       │
│  • Highly adaptable to changing requirements            │
│  • Reliable under pressure                              │
│  • Handles tight deadlines professionally               │
│                                                         │
│  Recent highlights:                                     │
│  ✓ Accepted tight deadline, delivered on time (+15)    │
│  ✓ Handled 3 change requests smoothly (+5)             │
│  ✓ Proactively communicated a blocker (+1)             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Ghost Protocol

When a user goes silent:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GHOST PROTOCOL                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TIMELINE:                                                                  │
│                                                                             │
│  24 hours - No response                                                     │
│       │                                                                     │
│       ▼                                                                     │
│  [Bro] "Hey Marcus, Sarah sent a message yesterday.                        │
│         Just checking in - everything okay?"                                │
│       │                                                                     │
│       ▼                                                                     │
│  48 hours - Still no response                                              │
│       │                                                                     │
│       ▼                                                                     │
│  [Bro] "Marcus, it's been 48 hours. Please respond within                  │
│         24 hours. Extended silence can affect your standing."              │
│       │                                                                     │
│       ▼                                                                     │
│  72 hours - No response                                                     │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  GHOST PROTOCOL ACTIVATED                                          │   │
│  │                                                                     │   │
│  │  • PFI: -15 points (Reliability component)                         │   │
│  │  • Logged: "Unresponsive for 72+ hours"                           │   │
│  │  • Client notified: "Freelancer is unresponsive"                  │   │
│  │  • Client options: [Wait] [Reassign Job] [Open Dispute]           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                     │
│       ▼                                                                     │
│  7 days - Still no response                                                │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  JOB ABANDONED                                                     │   │
│  │                                                                     │   │
│  │  • PFI: Additional -15 points (total -30)                         │   │
│  │  • Escrow: Refunded to client                                     │   │
│  │  • Job status: "Abandoned by freelancer"                          │   │
│  │  • Account: Flagged for review                                    │   │
│  │  • If 2+ abandonments: Suspension review                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Ghost Protocol for Clients

Same timeline applies when clients ghost:

| Time | Action |
|------|--------|
| 24h | Bro reminds client to respond |
| 48h | Warning about impact |
| 72h | -10 PFI, freelancer can request reassignment or pause |
| 7d | Job considered abandoned by client, escrow options discussed |

---

## Score Recovery

### Automatic Recovery

| Method | Recovery Amount | Conditions |
|--------|-----------------|------------|
| **Time-based** | +1 per month | No negative events that month |
| **Job completion** | +2 to +5 | Normal job completion bonuses |
| **Excellent performance** | +5 bonus | Verification 95+, on-time |

### Recovery Limits

| Penalty Type | Recovery Timeline | Notes |
|--------------|-------------------|-------|
| **Minor (missed deadline)** | 1-2 months | Fast recovery with good behavior |
| **Moderate (dispute loss)** | 3-6 months | Consistent good performance needed |
| **Ghost penalty** | 3-6 months | Must complete 3+ jobs without issues |
| **Abandonment** | 6-12 months | Hard to recover, flagged in history |
| **Multiple offenses** | May be permanent | Account review required |

### Recovery Appeal

Users can request a one-time appeal for extraordinary circumstances:

```
┌─────────────────────────────────────────────────────────┐
│  REQUEST SCORE REVIEW                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Your PFI dropped due to: "Unresponsive for 72+ hours" │
│                                                         │
│  If there were extenuating circumstances (medical      │
│  emergency, natural disaster, etc.), you can request   │
│  a review.                                              │
│                                                         │
│  Explain your situation:                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Attach supporting documentation (optional):            │
│  [Upload File]                                          │
│                                                         │
│  [Submit Review Request]                                │
│                                                         │
│  ℹ️ Reviews are processed within 3-5 business days.    │
│     Score may be partially or fully restored.          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Badges & Trust Indicators

### Achievement Badges

| Badge | Name | Requirement | Display |
|-------|------|-------------|---------|
| 🆕 | New | <3 jobs completed | Shows they're new |
| ⭐ | Rising Star | 5+ jobs, PFI 85+ | Promising newcomer |
| 🏆 | Top Rated | 15+ jobs, PFI 92+ | Consistently excellent |
| 💎 | Elite | 50+ jobs, PFI 95+, 0 disputes | Best of the best |
| 🎯 | Accountability Pro | Accountability 95+, 10+ changes handled | Highly adaptable |
| ⚡ | Quick Responder | Avg response <2 hours | Fast communicator |
| ⏰ | Always On Time | 100% on-time, 10+ jobs | Deadline master |
| 🛡️ | Trusted Client | PFI 95+, 10+ jobs, 0 disputes | Reliable employer |

### Badge Display

```
┌─────────────────────────────────────────────────────────┐
│  MARCUS JOHNSON                                         │
│  ⭐ PFI: 92   🏆 Top Rated  🎯 Accountability Pro       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Copywriter & Content Strategist                        │
│  23 jobs completed | 96% on-time | Member since 2024   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Score in Job Matching

PFI affects visibility and opportunities:

| PFI Range | Effect on Freelancer |
|-----------|---------------------|
| 90+ | Featured in search, recommended to clients |
| 80-89 | Normal visibility |
| 70-79 | Lower in search rankings |
| 60-69 | Shown with warning, limited bids |
| <60 | Restricted access |

| PFI Range | Effect on Client |
|-----------|------------------|
| 90+ | Trusted badge, freelancers more likely to bid |
| 80-89 | Normal |
| 70-79 | Some freelancers may be cautious |
| <70 | Warning shown to freelancers |

---

## Summary

| Aspect | Value |
|--------|-------|
| **Freelancer starting PFI** | 90 |
| **Client starting PFI** | 100 |
| **Components (Freelancer)** | Reliability (40%), Quality (35%), Accountability (25%) |
| **Excellent range** | 86-100 |
| **Restricted range** | 31-60 |
| **Critical range** | 0-30 |
| **Ghost penalty** | -15 at 72h, -15 more at 7d (total -30) |
| **Recovery rate** | +1 per month (if no issues) + job completion bonuses |
| **Tight deadline bonus** | +10 to +20 accountability |
