# Escrow & Payout Policies - Finalized Design

## Overview

Money is held by the platform until work is verified. This protects both parties:
- **Client:** Doesn't pay until work is delivered and verified
- **Freelancer:** Guaranteed payment once work is verified

---

## Money Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MONEY FLOW                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLIENT                 PLATFORM                 FREELANCER                 │
│    │                       │                          │                     │
│    │──── Funds Escrow ────▶│                          │                     │
│    │     ($550 + $55 fee)  │                          │                     │
│    │                       │                          │                     │
│    │                       │ (Holds $605)             │                     │
│    │                       │                          │                     │
│    │                       │                          │──── Submits Work    │
│    │                       │                          │                     │
│    │                       │◀─── Verification Pass ──│                     │
│    │                       │                          │                     │
│    │                       │──── Releases $100 ──────▶│ (Milestone 1)      │
│    │                       │                          │                     │
│    │                       │──── Releases $100 ──────▶│ (Milestone 2)      │
│    │                       │                          │                     │
│    │                       │          ...             │                     │
│    │                       │                          │                     │
│    │                       │──── Releases $150 ──────▶│ (Final milestone)  │
│    │                       │                          │                     │
│    │                       │ (Keeps $55 platform fee) │                     │
│    │                       │                          │                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Escrow Funding Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ESCROW FUNDING TIMELINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Job Created (Draft)                                                        │
│       │                                                                     │
│       ▼                                                                     │
│  Spec Generated ──────────────────── No escrow yet                         │
│       │                                                                     │
│       ▼                                                                     │
│  Job Published ───────────────────── No escrow yet                         │
│       │                                                                     │
│       ▼                                                                     │
│  Freelancer Bids                                                            │
│       │                                                                     │
│       ▼                                                                     │
│  Client Accepts Bid                                                         │
│       │                                                                     │
│       ▼                                                                     │
│  Negotiation Phase ───────────────── No escrow yet                         │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  SPEC LOCK TRIGGERED                                                │   │
│  │                                                                     │   │
│  │  Both parties agree to spec                                        │   │
│  │            ↓                                                        │   │
│  │  Client MUST fund escrow to complete lock                          │   │
│  │            ↓                                                        │   │
│  │  If not funded within 24 hours → Lock expires                      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                     │
│       ▼                                                                     │
│  ESCROW FUNDED ───────────────────── 💰 FUNDS HELD BY PLATFORM            │
│       │                                                                     │
│       ▼                                                                     │
│  Work Begins                                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Escrow Amount Calculation

| Component | Calculation | Example |
|-----------|-------------|---------|
| **Job Budget** | Agreed amount | $550 |
| **Platform Fee** | 10% of budget | $55 |
| **Total Escrow** | Budget + Fee | $605 |

### Platform Fee Rules

| Scenario | Fee Handling |
|----------|--------------|
| Job completes successfully | Platform keeps fee |
| Job disputed (any outcome) | Fee **refunded** to client |
| Job cancelled before lock | N/A (no escrow funded) |
| Job cancelled after lock (mutual) | Fee **refunded** to client |

---

## Escrow Funding UI

```
┌─────────────────────────────────────────────────────────────────┐
│  FUND ESCROW TO START PROJECT                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Job: 5 Blog Posts on AI Healthcare                             │
│  Freelancer: Marcus Johnson (PFI: 88)                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ESCROW BREAKDOWN                                       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                         │   │
│  │  Job Budget                           $550.00           │   │
│  │  Platform Fee (10%)                   + $55.00          │   │
│  │  ─────────────────────────────────────────────          │   │
│  │  Total to Fund                        $605.00           │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  How escrow is released:                                        │
│  • Milestone 1: $100 (18.2%)                                   │
│  • Milestone 2: $100 (18.2%)                                   │
│  • Milestone 3: $100 (18.2%)                                   │
│  • Milestone 4: $100 (18.2%)                                   │
│  • Milestone 5: $150 (27.3%) - Final                           │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Payment Method:                                                │
│  ● Credit Card (Visa •••• 4242)                     [Change]   │
│  ○ Bank Transfer (ACH)                                         │
│  ○ PayPal                                                       │
│  ○ Platform Balance ($1,200.00 available)                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              💰 FUND ESCROW - $605.00                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ✓ Funds held securely until work verified                    │
│  ✓ Released per milestone upon verification                   │
│  ✓ Full refund if project is cancelled or disputed            │
│  ✓ Platform fee refunded if any dispute occurs                │
│                                                                 │
│  ⏱️ You have 24 hours to fund. After that, the lock expires.  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Milestone-Based Release

Escrow is divided across milestones and released as each is verified.

```yaml
escrow:
  total_funded: 605.00
  currency: "USD"
  funded_at: "2026-03-15T10:35:00Z"

  allocation:
    milestones:
      - id: 1
        name: "Blog Post 1"
        amount: 100.00
        percentage: 18.2%
      - id: 2
        name: "Blog Post 2"
        amount: 100.00
        percentage: 18.2%
      - id: 3
        name: "Blog Post 3"
        amount: 100.00
        percentage: 18.2%
      - id: 4
        name: "Blog Post 4"
        amount: 100.00
        percentage: 18.2%
      - id: 5
        name: "Blog Post 5 (Final)"
        amount: 150.00
        percentage: 27.3%

    platform_fee: 55.00

  current_status:
    released_to_freelancer: 200.00
    pending_in_escrow: 350.00
    platform_fee_held: 55.00

  release_history:
    - milestone_id: 1
      amount: 100.00
      released_at: "2026-03-19T16:00:00Z"
      trigger: "auto_verified"
      verification_score: 94

    - milestone_id: 2
      amount: 100.00
      released_at: "2026-03-22T14:30:00Z"
      trigger: "client_approved"
      verification_score: 87
      note: "Client override - accepted partial score"
```

---

## Release Triggers

| Trigger | Description | Processing Time |
|---------|-------------|-----------------|
| **Auto-release** | Verification score meets threshold + all Primary pass | 24-48h hold |
| **Client approves** | Client manually approves submission | 24-48h hold |
| **Client override** | Client accepts despite failed verification | 24-48h hold |
| **Dispute - Freelancer wins** | Platform rules in freelancer's favor | Immediate |

### Processing Hold (24-48 hours)

After release is triggered:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RELEASE PROCESSING                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Milestone Verified / Client Approves                                       │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PROCESSING HOLD: 24-48 hours                                      │   │
│  │                                                                     │   │
│  │  Purpose:                                                          │   │
│  │  • Window for client to flag urgent issues                         │   │
│  │  • Fraud prevention                                                │   │
│  │  • Allows system reconciliation                                    │   │
│  │                                                                     │   │
│  │  During this time:                                                 │   │
│  │  • Freelancer sees "Payment processing..."                        │   │
│  │  • Client can flag issues (triggers review, may pause release)    │   │
│  │  • If no issues → Release proceeds automatically                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                     │
│       ▼                                                                     │
│  Funds transferred to freelancer's platform balance                        │
│       │                                                                     │
│       ▼                                                                     │
│  Freelancer can withdraw                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Note:** For Trust-Based verification policy jobs, processing can be instant (0-24h) at platform discretion.

---

## Partial Payments & Disputes

### Scenario: Job Disputed Mid-Way

```
┌─────────────────────────────────────────────────────────────────┐
│  ESCROW STATUS AT DISPUTE                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Job: 5 Blog Posts ($550 budget)                               │
│  Status: DISPUTED at Milestone 4                                │
│                                                                 │
│  MILESTONE STATUS:                                              │
│  ✓ M1: $100 - Verified & Released                              │
│  ✓ M2: $100 - Verified & Released                              │
│  ✓ M3: $100 - Verified & Released                              │
│  ✗ M4: $100 - Failed, under dispute                            │
│  ⏸ M5: $150 - Not started                                       │
│                                                                 │
│  FUNDS STATUS:                                                  │
│  Already paid to freelancer:     $300                           │
│  Remaining in escrow:            $250                           │
│  Platform fee held:              $55                            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  DISPUTE RESOLUTION OUTCOMES:                                   │
│                                                                 │
│  A) FREELANCER WINS M4 DISPUTE                                  │
│     • $100 released for M4                                      │
│     • Work continues on M5                                      │
│     • Client PFI reduced                                        │
│                                                                 │
│  B) CLIENT WINS M4 DISPUTE                                      │
│     • M4 payment withheld                                       │
│     • Option: Freelancer resubmits M4, or...                   │
│     • Option: Job terminated                                    │
│                                                                 │
│  C) JOB TERMINATED (any reason)                                 │
│     • Freelancer keeps: $300 (already released)                │
│     • Client refunded: $250 (unreleased milestones)            │
│     • Platform fee: $55 refunded to client                     │
│                                                                 │
│  D) SPLIT DECISION                                              │
│     • Fair split determined by reviewer                        │
│     • Platform fee: $55 refunded to client                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Refund Scenarios

| Scenario | Escrow | Platform Fee | Notes |
|----------|--------|--------------|-------|
| **Client cancels before lock** | N/A | N/A | No escrow funded yet |
| **Client doesn't fund within 24h** | N/A | N/A | Lock expires, freelancer can leave |
| **Freelancer ghosts after lock** | Full refund | Refunded | Freelancer PFI tanks |
| **Mutual cancellation** | Pro-rated | Refunded | Based on work completed |
| **Dispute - Client wins** | Remaining refunded | Refunded | Freelancer PFI reduced |
| **Dispute - Freelancer wins** | Released to freelancer | Refunded | Client PFI reduced |
| **Dispute - Split** | Split fairly | Refunded | Minor impact both |
| **Dispute - Spec unclear** | Split or refund | Refunded | No PFI impact |

---

## Additional Escrow (Change Requests)

When a change request increases scope/budget:

```
┌─────────────────────────────────────────────────────────────────┐
│  ADDITIONAL ESCROW REQUIRED                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Change Request Approved: Add 2 more blog posts                 │
│                                                                 │
│  Additional budget: $200                                        │
│  Additional fee (10%): $20                                      │
│  Additional escrow needed: $220                                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ESCROW UPDATE                                          │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                         │   │
│  │  Current Escrow:        $605 ($550 + $55 fee)          │   │
│  │  Additional Required:   $220 ($200 + $20 fee)          │   │
│  │  ─────────────────────────────────────────────         │   │
│  │  New Total:             $825                            │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Fund Additional $220]                                         │
│                                                                 │
│  ⚠️ Change will not take effect until funded.                  │
│  ℹ️ If you cancel this change, the $220 will not be charged.  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Freelancer Earnings & Withdrawal

### Earnings Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  EARNINGS                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │  AVAILABLE    │  │  PENDING      │  │  THIS MONTH   │       │
│  │  $495.00      │  │  $750.00      │  │  $1,245.00    │       │
│  │  [Withdraw]   │  │  In escrow    │  │  Total earned │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  RECENT TRANSACTIONS                                            │
│                                                                 │
│  Mar 22  Blog Post 2 - AI Healthcare     +$100.00  Processing  │
│  Mar 19  Blog Post 1 - AI Healthcare     +$100.00  ✓ Cleared   │
│  Mar 16  Data Entry - Acme Corp          +$200.00  ✓ Cleared   │
│  Mar 14  Translation - Legal Doc         +$195.00  ✓ Cleared   │
│  Mar 10  Withdrawal to Bank ••7890       -$400.00  ✓ Complete  │
│                                                                 │
│  [View All Transactions]                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Withdrawal UI

```
┌─────────────────────────────────────────────────────────────────┐
│  WITHDRAW FUNDS                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Available Balance: $495.00                                     │
│                                                                 │
│  Amount to withdraw:                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  $ [495.00                                         ]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│  [Withdraw All]                                                │
│                                                                 │
│  Withdraw to:                                                   │
│                                                                 │
│  ● Bank Account (ACH)                                          │
│    Chase Bank •••• 7890                                        │
│    Fee: Free                                                   │
│    Arrives: 1-3 business days                                  │
│                                                                 │
│  ○ PayPal                                                       │
│    marcus@email.com                                            │
│    Fee: 2.9% + $0.30 ($14.65)                                  │
│    Arrives: Instant                                            │
│                                                                 │
│  ○ Wire Transfer                                                │
│    For amounts over $1,000                                     │
│    Fee: $25                                                    │
│    Arrives: 1-2 business days                                  │
│                                                                 │
│  [+ Add New Withdrawal Method]                                  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Summary:                                                       │
│  Withdrawal amount:                           $495.00           │
│  Fee:                                         -$0.00            │
│  You'll receive:                              $495.00           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              WITHDRAW $495.00                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Withdrawal Rules

| Rule | Policy |
|------|--------|
| **Minimum withdrawal** | None |
| **Maximum withdrawal** | No limit (full balance) |
| **Daily/weekly limits** | None (free flow) |
| **Processing time** | 1-3 business days (bank), instant (PayPal) |

---

## Payment Methods

### Client (Funding Escrow)

| Method | Available | Fees | Notes |
|--------|-----------|------|-------|
| Credit/Debit Card | ✅ Yes | 2.9% + $0.30 | Most common |
| Bank Transfer (ACH) | ✅ Yes | Free | 3-5 days to clear |
| PayPal | ✅ Yes | 2.9% + $0.30 | Instant |
| Platform Balance | ✅ Yes | Free | From refunds or deposits |
| Wire Transfer | ✅ Yes | $25 | Large amounts |

### Freelancer (Withdrawing)

| Method | Available | Fees | Processing |
|--------|-----------|------|------------|
| Bank Transfer (ACH) | ✅ Yes | Free | 1-3 business days |
| PayPal | ✅ Yes | 2.9% + $0.30 | Instant |
| Wire Transfer | ✅ Yes | $25 | 1-2 business days |
| Keep as Balance | ✅ Yes | Free | Use for platform services |

---

## Currency Handling

| Aspect | Policy |
|--------|--------|
| **Platform Currency** | USD |
| **Other Currencies** | Converted to USD at funding time |
| **Exchange Rate** | Market rate at time of transaction |
| **Conversion Fees** | Passed to user (transparent, typically 1-3%) |
| **Freelancer Payout** | USD or local currency (freelancer's choice) |
| **Rate Lock** | Exchange rate locked at escrow funding |

---

## Client Escrow Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  MY ESCROW                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │  IN ESCROW    │  │  RELEASED     │  │  REFUNDED     │       │
│  │  $605.00      │  │  $200.00      │  │  $0.00        │       │
│  │  1 active job │  │  This month   │  │  This month   │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ACTIVE ESCROWS                                                 │
│                                                                 │
│  5 Blog Posts on AI Healthcare                                  │
│  ├── Freelancer: Marcus Johnson                                │
│  ├── Total Funded: $605.00                                     │
│  ├── Released: $200.00 (2 of 5 milestones)                     │
│  ├── Remaining: $405.00                                        │
│  └── [View Details]                                            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  RECENT ACTIVITY                                                │
│                                                                 │
│  Mar 22  M2 payment processing          $100.00   ⏳ Pending   │
│  Mar 19  M1 released to Marcus          $100.00   ✓ Complete   │
│  Mar 15  Escrow funded                  $605.00   ✓ Complete   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Escrow Protection Guarantees

```
┌─────────────────────────────────────────────────────────────────┐
│  TRUSTMEBRO ESCROW PROTECTION                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FOR CLIENTS:                                                   │
│  ✓ Money held until work is delivered and verified             │
│  ✓ Full refund if freelancer fails to deliver                  │
│  ✓ Platform fee refunded on any dispute                        │
│  ✓ Partial refund for incomplete work                          │
│  ✓ 24-48h review window before each release                    │
│                                                                 │
│  FOR FREELANCERS:                                               │
│  ✓ Payment guaranteed once work is verified                    │
│  ✓ Client cannot withdraw funds after lock                     │
│  ✓ Milestone payments released as you complete                 │
│  ✓ Appeal process if AI verification is wrong                  │
│  ✓ No chargebacks after release (platform absorbs risk)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

| Aspect | Policy |
|--------|--------|
| **When funded** | At spec lock (must fund within 24h) |
| **Platform fee** | 10% of job budget |
| **Fee refund** | On any dispute or cancellation |
| **Release trigger** | Verification pass (auto) or client approval |
| **Processing hold** | 24-48 hours (instant for Trust-Based jobs) |
| **Milestone release** | Per-milestone as verified |
| **Withdrawal limits** | None (free flow) |
| **Minimum job value** | None |
| **Currency** | USD primary, conversion at funding |
| **Dispute outcome** | Remaining escrow refunded or released per ruling |
