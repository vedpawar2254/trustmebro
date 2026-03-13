# trustmebro — Feature List & Build Flow
### Start Here. Build This.

---

## THE FLOWS (Read These First)

There are four distinct user flows. Every feature belongs to one of them.

```
FLOW A: EMPLOYER POSTS A JOB
FLOW B: FREELANCER ACCEPTS & DELIVERS
FLOW C: AI VERIFIES & MONEY MOVES
FLOW D: AI-MEDIATED CHAT (Runs alongside A-C)
```

---

## FLOW A — EMPLOYER POSTS A JOB

```
A1. Employer signs up / logs in
        ↓
A2. Employer pastes job description (free text)
        ↓
A3. AI parses description and generates:
        - Gig type classification (Software / Copywriting / Data Entry / Translation)
        - Gig subtype classification (see GIG TYPES below)
        - Milestone breakdown (with deadlines)
        - Verifiable criteria per milestone
        - Flags vague requirements ("too subjective to verify")
        - Required assets checklist (what employer must provide)
        ↓
A4. Employer reviews AI-generated spec
        - Can edit milestones
        - Must resolve all flagged vague items
          (either define them specifically OR accept they move to PFI-only)
        ↓
A5. Employer confirms and publishes job
        ↓
A6. Job is live — freelancers can see full structured spec
```

---

## FLOW B — FREELANCER ACCEPTS & DELIVERS

```
B1. Freelancer signs up / logs in
        ↓
B2. Freelancer browses jobs (sees structured spec, not raw description)
        ↓
B3. Freelancer bids on a job
        ↓
B4. Employer selects freelancer
        ↓
B5. SPEC LOCK MOMENT — Freelancer reviews full spec, AI asks:
        - "Do you have all required access and assets?"
        - "Is the timeline realistic?"
        - "Any concerns before starting?"
        ↓
B6. Freelancer can:
        → ACCEPT → proceed
        → FLAG CONCERN → goes back to employer to resolve
        → COUNTER-OFFER on specific milestone → employer accepts/rejects
        ↓
B7. Both confirm → Employer funds escrow → Spec is LOCKED → Chat channel opens
        ↓
B8. Work begins. Freelancer works on Milestone 1.
        ↓
B9. Freelancer submits Milestone 1:
        - Software gig → GitHub repo link
        - Copywriting gig → Document upload or paste
        - Data Entry gig → File upload (CSV, XLSX)
        - Translation gig → Document upload with source/target
        ↓
        [FLOW C TAKES OVER HERE]
        ↓
B10. Freelancer receives verification report
        ↓
B11a. PASS → Payment released for this milestone → Work on next milestone
B11b. PARTIAL → Feedback received → Resubmit (up to 2 attempts)
B11c. FAIL → Dispute process begins
        ↓
B12. Repeat B8–B11 for each milestone
        ↓
B13. Final milestone complete → Project closed → PFI updated
```

---

## FLOW C — AI VERIFIES & MONEY MOVES

```
C1. Submission received (file / link / text)
        ↓
C2. AI routes to correct verification lane:
        → Software Lane
        → Copywriting Lane
        → Data Entry Lane
        → Translation Lane
        ↓

--- SOFTWARE LANE ---
C3a. Pull repo from GitHub link
C4a. Check: Does repo exist and is it accessible?
C5a. Scan dependencies — does tech stack match spec?
C6a. Check repo structure — does it match the project type?
C7a. Check README — present and covers setup/usage?
C8a. Check commit history — work spread over timeline or dumped last minute?
C9a. LLM reads key files, evaluates: does the code implement specified features?
C10a. If deployed URL provided — fetch and screenshot, compare to spec
        ↓

--- COPYWRITING LANE ---
C3b. Receive document
C4b. Count words — within specified range?
C5b. Run plagiarism check — above originality threshold?
C6b. Check keywords — required keywords present at required frequency?
C7b. Check structure — required sections present?
C8b. LLM evaluates: does the content cover all specified topics?
C9b. If tone was defined with examples — LLM scores tone adherence
        ↓

--- DATA ENTRY LANE ---
C3c. Receive file (CSV / XLSX)
C4c. Check schema — correct columns present with correct names?
C5c. Check row count — all expected records present?
C6c. Check data types — dates as dates, numbers as numbers?
C7c. Check for duplicates (if spec said no duplicates)
C8c. Check for nulls (if spec defined null handling)
C9c. Random sample 20% of rows — accuracy spot check against source
        ↓

--- TRANSLATION LANE ---
C3d. Receive source and target documents
C4d. Check word count matches between source and target (within tolerance)
C5d. Verify all content from source present in target
C6d. LLM evaluates: does translation preserve meaning, tone, and formatting?
C7d. If terminology glossary provided — LLM checks term consistency
C8d. Plagiarism check on translation (machine-generated detection)
        ↓

C11. All lanes produce IDENTICAL output format:
        - Overall score (0–100%)
        - Per-criterion: PASS / FAIL / PARTIAL
        - Specific failure reason for each FAIL
        - PFI-only signals (noted but don't affect score)
        ↓
C12. Score threshold decision:
        ≥ 90%  → AUTO-RELEASE milestone payment       ✅
        50–89% → HOLD + send feedback to freelancer   🔄
        < 50%  → HOLD + flag for dispute              ⚠️
        ↓
C13. Both employer AND freelancer see the same report
        ↓
C14. PFI updated for both parties
```

---

## FLOW D — AI-MEDIATED CHAT (Live Throughout Project)

```
D1. Chat channel opens when spec is locked and escrow funded
        ↓
D2. Three participants: Employer, Freelancer, AI Mediator
        ↓
D3. AI Mediator has specific jobs:

--- WHEN FREELANCER ASKS CLARIFYING QUESTION ---
D4a. Freelancer: "For milestone 2, did you want X or Y?"
        ↓
D5a. AI intercepts: "This appears to be a spec gap — X/Y wasn't defined.
        Client, your answer will be logged as a formal spec clarification
        and will be binding. Please confirm: X or Y?"
        ↓
D6a. Client answers → appended to spec as official clarification → timestamped → locked

--- WHEN CLIENT TRIES TO ADD SCOPE ---
D4b. Client: "Also while you're at it, can you add X?"
        ↓
D5b. AI catches: "X wasn't in the original spec. This looks like new scope.
        Would you like to submit a formal Change Request?
        The freelancer can then accept or decline it."
        ↓
D6b. If client submits Change Request → goes through Change Request flow (F46-F49)

--- WHEN TENSION RISES ---
D4c. Client: "This doesn't look anything like what I asked for"
        ↓
D5c. AI depersonalises: "Let's check this against the agreed spec.
        The current milestone criteria are: [lists them].
        Freelancer, would you like to address each point?
        Client, please reference specific criteria when raising concerns."

--- WHEN CHAT CONTRADICTS SPEC ---
D4d. Anyone says something that contradicts agreed spec
        ↓
D5d. AI flags in real-time: "Note: This conversation cannot override the
        agreed spec. Any changes must go through formal Change Request flow."

D6. Chat remains visible throughout project → full conversation record for disputes
```

**Crucial Design Rule:** Chat cannot override the spec. Ever.

---

## GIG TYPES & SUBTYPES (Finalized)

```
1. SOFTWARE
   - Web Development (Full Stack, Frontend, Backend)
   - Mobile Development (iOS, Android, Cross-platform)
   - Desktop Applications
   - APIs & Integrations
   - Database Design & Optimization
   - DevOps & Infrastructure

2. COPYWRITING
   - Blog Posts & Articles
   - Website Copy (Landing pages, About pages, etc.)
   - Email Marketing Copy
   - Social Media Content
   - Product Descriptions
   - Sales & Marketing Materials

3. DATA ENTRY
   - Form Digitization
   - Database Population
   - Data Cleaning & Formatting
   - Spreadsheet Creation & Maintenance
   - Document Transcription
   - Data Extraction & Scraping

4. TRANSLATION
   - Website & App Localization
   - Document Translation (Technical, Legal, Marketing)
   - Subtitle & Caption Translation
   - Marketing Material Translation
   - Software/UI String Translation
   - Audio/Video Content Translation
```

---

## COMPLETE FEATURE LIST

Organised by priority. Build in this order.

---

### 🔴 TIER 1 — CORE FOUNDATION (Must have, won't change)

**Authentication**
- [ ] F01 — Employer signup / login
- [ ] F02 — Freelancer signup / login
- [ ] F03 — Role-based views (employer sees employer UI, freelancer sees freelancer UI)

**Gig Type System**
- [ ] F04 — Gig type classification (Software / Copywriting / Data Entry / Translation)
- [ ] F05 — Gig subtype classification based on category
- [ ] F06 — Subtype-specific verification criteria templates

**Basic Job Posting**
- [ ] F07 — Free-text job description input
- [ ] F08 — Basic AI parsing → gig type + subtype identification
- [ ] F09 — Basic milestone breakdown with deadlines
- [ ] F10 — Basic verifiable criteria per milestone (template-based)
- [ ] F11 — Basic vague requirement flagging
- [ ] F12 — Basic required assets checklist
- [ ] F13 — Employer edits and confirms structured spec
- [ ] F14 — Job published and visible to freelancers

**Freelancer Job Browsing**
- [ ] F15 — Freelancer views structured spec (not raw description)
- [ ] F16 — Freelancer bids on job
- [ ] F17 — Employer selects freelancer

**Spec Lock & Escrow**
- [ ] F18 — Spec Lock screen — freelancer acknowledges spec with AI questions
- [ ] F19 — Freelancer can flag a concern before accepting
- [ ] F20 — Both confirm → escrow funded → spec locked (read-only)
- [ ] F21 — Mock escrow deposit on project start
- [ ] F22 — Escrow balance visible to both parties

**Work Submission**
- [ ] F23 — GitHub link submission (software gigs)
- [ ] F24 — Document upload / text paste (copywriting gigs)
- [ ] F25 — File upload CSV/XLSX (data entry gigs)
- [ ] F26 — Document upload with source/target (translation gigs)

**Basic Verification Engine (Template-Based)**
- [ ] F27 — Software Lane: repo structure + dependency + README check
- [ ] F28 — Copywriting Lane: word count + keyword check
- [ ] F29 — Data Entry Lane: schema + row count + data type + duplicate check
- [ ] F30 — Translation Lane: word count match + content presence check
- [ ] F31 — Basic LLM feature/coverage evaluation (all lanes)
- [ ] F32 — Unified verification report generation (same format all lanes)

**Verification Report UI**
- [ ] F33 — Overall score display
- [ ] F34 — Per-criterion PASS / FAIL / PARTIAL breakdown
- [ ] F35 — Specific failure reasons shown
- [ ] F36 — PFI-only signals displayed separately
- [ ] F37 — Payment decision displayed clearly

**Payment Decisions (Basic)**
- [ ] F38 — Auto-release on score ≥ 90%
- [ ] F39 — Hold on score 50–89%
- [ ] F40 — Refund initiation on score < 50%

**Basic PFI**
- [ ] F41 — Freelancer PFI score displayed on profile
- [ ] F42 — PFI updates after each milestone resolution (basic scoring)

---

### 🔴 TIER 1 — AI-MEDIATED CHAT (Product Story Priority)

**Chat Infrastructure**
- [ ] F43 — Group chat channel (Employer + Freelancer + AI Mediator)
- [ ] F44 — Chat opens when spec locked and escrow funded
- [ ] F45 — Chat history persists throughout project
- [ ] F46 — Chat available for dispute reference

**AI Mediator Core**
- [ ] F47 — Detect clarifying questions → intercept and log as spec clarification
- [ ] F48 — Detect scope creep attempts → prompt Change Request flow
- [ ] F49 — Depersonalise conflicts → reference agreed spec
- [ ] F50 — Flag chat contradictions → enforce spec authority
- [ ] F51 — Chat cannot override spec (enforced rule)

**Spec Clarification Flow**
- [ ] F52 — AI identifies spec gap in freelancer question
- [ ] F53 — AI prompts employer for binding answer
- [ ] F54 — Employer answer logged → appended to spec → timestamped
- [ ] F55 — Both parties notified of spec update

**Scope Creep Detection**
- [ ] F56 — AI identifies new scope in client request
- [ ] F57 — AI prompts Change Request flow
- [ ] F58 — Integration with Change Request feature (F79-F82)

---

### 🟡 TIER 2 — ENHANCED SPEC GENERATION (May change, build basic version)

**AI Spec Generation**
- [ ] F57 — Advanced AI parsing → generates gig type + subtype
- [ ] F58 — AI generates milestone breakdown with deadlines (context-aware)
- [ ] F59 — AI generates verifiable criteria per milestone (subtype-specific)
- [ ] F60 — AI flags vague/subjective requirements (smart detection)
- [ ] F61 — AI generates required assets checklist (gig-type aware)

---

### 🟡 TIER 2 — ENHANCED VERIFICATION (May change, build basic version)

**Advanced Verification**
- [ ] F62 — Software Lane: LLM feature adherence evaluation (deep code analysis)
- [ ] F63 — Copywriting Lane: plagiarism check integration
- [ ] F64 — Copywriting Lane: tone evaluation with examples
- [ ] F65 — Data Entry Lane: statistical accuracy sampling
- [ ] F66 — Translation Lane: terminology consistency check
- [ ] F67 — Translation Lane: machine-generated detection
- [ ] F68 — Software Lane: deployed URL screenshot comparison

---

### 🟡 TIER 2 — ENHANCED PFI (May change, build basic version)

**Freelancer PFI**
- [ ] F69 — PFI history & score tracking
- [ ] F70 — Per-project PFI breakdown (what moved the score)
- [ ] F71 — Complexity-weighted scoring (hard projects count more)

**Employer PFI**
- [ ] F72 — Employer PFI score (spec quality, asset delivery, dispute record)
- [ ] F73 — Employer PFI visible to freelancers before bidding

**Cold Start**
- [ ] F74 — Skill verification tasks (short AI-graded tests)
- [ ] F75 — Starter PFI based on verification task performance

---

### 🟡 TIER 2 — STRONG (Makes demo impressive)

**Feedback & Resubmission Loop**
- [ ] F76 — AI generates specific resubmission feedback (not just "you failed")
- [ ] F77 — Freelancer can resubmit up to 2 times
- [ ] F78 — Resubmission count displayed
- [ ] F79 — Each resubmission re-evaluated fresh

**Spec Change Request**
- [ ] F80 — Client submits Change Request mid-project
- [ ] F81 — AI classifies: new scope vs implied in original spec
- [ ] F82 — Freelancer accepts or rejects Change Request
- [ ] F83 — If accepted: spec updates, new milestone added, escrow tops up

**Asset Delivery Tracking**
- [ ] F84 — Required assets checklist visible to both parties
- [ ] F85 — Employer marks assets as delivered
- [ ] F86 — If assets not delivered in time: project clock pauses automatically
- [ ] F87 — Freelancer deadline extends to match delay

**Dispute Penalty System**
- [ ] F88 — Formal dispute initiation (Level 2)
- [ ] F89 — Losing party absorbs arbitration fee
- [ ] F90 — PFI penalty applied to dispute loser

---

### 🟢 TIER 3 — POLISH (If time allows)

**Counter-Offer Flow**
- [ ] F91 — Freelancer submits counter-offer on specific milestone item
- [ ] F92 — Employer accepts / rejects / proposes middle ground
- [ ] F93 — Final terms locked if accepted

**Platform Dashboard**
- [ ] F94 — Active projects overview
- [ ] F95 — Milestone timeline view
- [ ] F96 — Payment history

---

## TEAM SPLIT (3-4 people)

```
PERSON 1 — AI Engine
  Owns: F08-F12, F27-F31, F57-F61, F62-F68, F47-F56
  Stack: Python / LLM API calls / GitHub API / Plagiarism API
  Delivers: Verification report JSON, AI Mediator responses

PERSON 2 — Frontend
  Owns: F01-F03, F13-F20, F33-F37, F43-F51
  Stack: React / Next.js
  Delivers: All UI screens, chat interface, consumes verification report JSON

PERSON 3 — Backend + Escrow
  Owns: F14, F21-F26, F38-F42, F79-F83
  Stack: Node / Python / DB
  Delivers: API layer, mock wallet, file handling, chat persistence

PERSON 4 (if available) — Tier 2 features
  Owns: F52-F56, F72-F75, F76-F78, F84-F90
  Fills gaps across all three above
```

**Day 1 non-negotiable:** Person 1 and Person 2 agree on the verification report JSON schema and chat message schema together. Everything else depends on this interface.

```json
{
  "milestone_id": "m2",
  "gig_type": "software",
  "gig_subtype": "web_development",
  "overall_score": 84,
  "payment_decision": "HOLD",
  "criteria": [
    {
      "name": "Repo Structure",
      "type": "PRIMARY",
      "status": "PASS",
      "detail": "Standard Next.js structure with components, pages, lib folders"
    },
    {
      "name": "Feature Implementation",
      "type": "PRIMARY",
      "status": "FAIL",
      "detail": "User authentication flow incomplete - missing password reset"
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
  "feedback_for_freelancer": "Implement password reset flow in auth module."
}
```

```json
{
  "message_id": "msg_123",
  "sender": "freelancer",
  "content": "For milestone 2, did you want the export in CSV or PDF?",
  "timestamp": "2024-03-14T10:30:00Z",
  "type": "question",
  "ai_action": {
    "action_type": "spec_gap_intercept",
    "ai_response": "This appears to be a spec gap — the export format wasn't defined. Client, your answer will be logged as a formal spec clarification and will be binding. Please confirm: CSV or PDF?",
    "requires_response": true,
    "response_type": "spec_clarification"
  },
  "outcome": {
    "status": "awaiting_client_response",
    "spec_update_pending": true
  }
}
```

---

## WHAT TO BUILD FIRST (Day 1 sequence)

```
Hour 1–2:   Agree on verification report JSON schema AND chat message schema (whole team)
Hour 2–4:   Person 1 starts AI engine (basic), Person 2 starts spec input UI
Hour 4–6:   Person 3 sets up backend + mock escrow API + chat persistence
Hour 6–8:   First end-to-end test: job posted → spec generated → shown to freelancer → spec locked → chat opens
Day 2:      Submission → verification → report displayed → payment decision → AI mediator in chat
Day 3:      Polish UI, add Tier 2 features, prepare demo script
```

---

## THE DEMO SCRIPT (What judges need to see)

```
1. Employer pastes a vague job description
2. Watch AI turn it into a structured spec (wow moment #1)
3. Freelancer reviews and acknowledges spec
4. Employer funds escrow — spec locks — chat opens (wow moment #2)
5. Freelancer asks clarifying question in chat
6. Watch AI mediator intercept and log spec clarification (wow moment #3)
7. Client tries to add scope in chat
8. Watch AI mediator catch and prompt Change Request (wow moment #4)
9. Freelancer submits work
10. Watch AI run verification in real time (wow moment #5)
11. Verification report appears — clear, detailed, fair
12. Score ≥ 90% → payment releases automatically (wow moment #6)
13. Show PFI updating on both profiles
```

Six wow moments. Everything else supports them.
