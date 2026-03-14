# EPIC 4: Negotiation & Spec Lock

## Overview

After bid acceptance, employer and freelancer negotiate final terms in AI-mediated chat (with Bro). Both parties must agree and lock the spec before work begins.

**Dependencies:** EPIC 3 (Bidding)
**Blocks:** EPIC 5 (Escrow)

---

## User Stories

### NEG-1: Job Chat Channel

**As a** job participant (employer or assigned freelancer)
**I want to** chat in the job channel
**So that** I can communicate about the project

**Priority:** P0
**Points:** 3

#### Acceptance Criteria

- [ ] Chat channel created when bid is accepted
- [ ] Only employer and assigned freelancer can access
- [ ] Real-time message display (polling is fine)
- [ ] Shows sender name, avatar, timestamp
- [ ] Bro messages styled differently
- [ ] Message history persists

#### API Endpoints

**Get/Create Channel:**
```
GET /api/jobs/{job_id}/chat

Response:
{
  "channel_id": 1,
  "job_id": 1,
  "employer": {"id": 1, "name": "Sarah Chen"},
  "freelancer": {"id": 2, "name": "Marcus Johnson"},
  "is_active": true,
  "created_at": "2026-03-16T14:00:00Z"
}
```

**Get Messages:**
```
GET /api/jobs/{job_id}/chat/messages

Query params:
- after_id: int (optional, for polling new messages)
- limit: int (default 50)

Response:
{
  "messages": [
    {
      "id": 1,
      "sender_id": null,
      "sender_type": "AI_MEDIATOR",
      "sender_name": "Bro",
      "content": "👋 Hey Sarah and Marcus! Welcome to your project chat...",
      "is_ai_generated": true,
      "created_at": "2026-03-16T14:00:00Z"
    },
    {
      "id": 2,
      "sender_id": 2,
      "sender_type": "FREELANCER",
      "sender_name": "Marcus Johnson",
      "content": "Hi Sarah! I reviewed the spec and have a few questions...",
      "is_ai_generated": false,
      "created_at": "2026-03-16T14:05:00Z"
    }
  ],
  "has_more": false
}
```

**Send Message:**
```
POST /api/jobs/{job_id}/chat/messages

Request:
{
  "content": "string"  // 1-5000 chars
}

Response:
{
  "message": {
    "id": 3,
    "sender_id": 1,
    "sender_type": "EMPLOYER",
    "sender_name": "Sarah Chen",
    "content": "Sure, what questions do you have?",
    "is_ai_generated": false,
    "created_at": "2026-03-16T14:10:00Z"
  },
  "bro_response": null  // or Bro's response if he has something to say
}
```

#### UI Components

```
ChatPage:
├── Header
│   ├── JobTitle
│   ├── ParticipantInfo
│   │   ├── EmployerAvatar + Name
│   │   └── FreelancerAvatar + Name
│   └── JobStatusBadge
├── ChatArea
│   ├── MessageList (scrollable)
│   │   ├── DateSeparator
│   │   ├── Message (user)
│   │   │   ├── Avatar
│   │   │   ├── Name
│   │   │   ├── Content
│   │   │   └── Timestamp
│   │   └── BroMessage (AI - different styling)
│   │       ├── BroAvatar
│   │       ├── Content (may have action buttons)
│   │       └── Timestamp
│   └── ScrollToBottomButton
├── InputArea
│   ├── TextInput (multiline)
│   ├── CharacterCount
│   └── SendButton
└── Sidebar (collapsible)
    ├── SpecSummary
    ├── MilestoneStatus
    └── QuickActions
```

---

### NEG-2: Bro Mediator in Chat

**As a** participant
**I want** Bro to facilitate our discussion
**So that** negotiations are smooth and fair

**Priority:** P0
**Points:** 5

#### Acceptance Criteria

- [ ] Bro sends welcome message when chat starts
- [ ] Bro responds to questions about process/spec
- [ ] Bro detects scope changes and flags them
- [ ] Bro summarizes agreements
- [ ] Bro prompts for spec lock when ready
- [ ] Bro provides quick-reply buttons when appropriate

#### Bro Behaviors

**Welcome Message:**
```
[Bro] 👋 Hey Sarah and Marcus! Welcome to your project chat.

I'm Bro, and I'll be here throughout the project to help with:
• Clarifying the spec
• Managing any changes
• Keeping things on track

Current spec summary:
• 5 blog posts (1000-1200 words each)
• Budget: $550
• Deadline: March 31

Marcus, please review the full spec and raise any concerns before we lock.

[View Full Spec]
```

**Scope Creep Detection:**
```
[Sarah] Can you also make social media posts for each blog?

[Bro] ⚠️ Heads up - this looks like a new deliverable.

Current spec includes:
• 5 blog posts (1000-1200 words)

Not currently included:
• Social media posts

Sarah, adding social media posts would use 1 of your 3 change requests
(but we haven't locked the spec yet, so pre-lock changes are free!)

Would you like to add this to the spec?
[Yes, add to spec] [No, keep current scope]
```

**Process Questions:**
```
[Marcus] How does payment work?

[Bro] Great question! Here's how payment works:

1. Sarah funds escrow after we lock the spec
2. You submit work for each milestone
3. AI verifies your submission against the spec
4. If verification passes (score ≥90), payment auto-releases
5. If it needs revision, you get 2 attempts

The budget is split across milestones, with a bit more on the final one.

Any other questions?
```

#### API Endpoint for Bro Response

```
POST /api/jobs/{job_id}/chat/bro

Request:
{
  "context": "user_message",
  "message_id": 5  // The message Bro should respond to
}

Response:
{
  "response": {
    "content": "...",
    "action_buttons": [
      {"label": "Yes, add to spec", "action": "add_to_spec"},
      {"label": "No, keep current", "action": "dismiss"}
    ]
  },
  "detected_intent": "scope_change",  // or "question", "agreement", etc.
  "should_respond": true
}
```

#### Bro AI Prompt

```python
BRO_CHAT_SYSTEM_PROMPT = """
You are Bro, a friendly and neutral AI mediator in a freelance job chat.

Job Details:
- Title: {job_title}
- Status: {job_status}
- Budget: ${budget}
- Deadline: {deadline}

Spec: {spec_json}

Participants:
- Employer: {employer_name}
- Freelancer: {freelancer_name}

Your role:
1. Stay neutral - never take sides
2. Detect scope changes (new requirements not in spec)
3. Facilitate agreement on terms
4. Answer questions about the process
5. Prompt for spec lock when both parties seem ready
6. Be friendly but professional

When you detect a scope change:
- Flag it clearly
- Explain what's in spec vs what's new
- Ask if they want to add it

When answering questions:
- Be concise and helpful
- Reference the spec when relevant

Keep responses short (2-4 sentences usually).
Use emojis sparingly (👋 ⚠️ ✅ 📋).
"""
```

#### Business Logic

```python
async def get_bro_response(job_id: int, message_id: int) -> dict:
    job = get_job(job_id)
    spec = get_job_spec(job_id)
    messages = get_recent_messages(job_id, limit=20)
    target_message = get_message(message_id)

    # Analyze message
    analysis = await analyze_message_intent(target_message.content, spec)

    if analysis["type"] == "scope_change":
        # Generate scope change response
        response = generate_scope_change_response(
            original_scope=spec,
            proposed_change=analysis["change"]
        )
    elif analysis["type"] == "question":
        # Answer the question
        response = await answer_question(
            question=target_message.content,
            context={"job": job, "spec": spec}
        )
    else:
        # General response (if needed)
        response = await generate_general_response(messages)

    # Save Bro's message
    if response["should_respond"]:
        save_message(
            channel_id=get_channel_id(job_id),
            sender_type="AI_MEDIATOR",
            content=response["content"],
            is_ai_generated=True
        )

    return response
```

---

### NEG-3: Propose Spec Changes (Pre-Lock)

**As a** participant
**I want to** propose changes to the spec before locking
**So that** we can refine the agreement

**Priority:** P1
**Points:** 2

#### Acceptance Criteria

- [ ] Changes proposed through chat (Bro detects and facilitates)
- [ ] Both parties must agree to changes
- [ ] Changes update the spec
- [ ] Pre-lock changes don't use change request allocation
- [ ] Change history tracked

#### Flow

```
1. User proposes change in chat
2. Bro detects and clarifies the change
3. Bro asks other party to confirm
4. If confirmed, spec is updated
5. Bro announces the update
```

#### API Endpoint

```
POST /api/jobs/{job_id}/spec/propose-change

Request:
{
  "change_type": "add_requirement" | "modify_requirement" | "change_timeline" | "change_budget",
  "details": {
    // Depends on change_type
    "requirement": "Include social media posts",
    "tier": "secondary"
  }
}

Response:
{
  "proposal_id": 1,
  "status": "pending_approval",
  "message": "Marcus, Sarah wants to add a requirement..."
}
```

---

### NEG-4: Confirm Spec Lock

**As a** participant
**I want to** confirm and lock the spec
**So that** work can begin with clear terms

**Priority:** P0
**Points:** 2

#### Acceptance Criteria

- [ ] Either party can initiate lock
- [ ] Both parties must confirm
- [ ] Shows spec summary before confirming
- [ ] After both confirm, spec is locked
- [ ] Locked spec cannot be edited (only via change requests)

#### Flow

```
1. Party A clicks "Lock Spec"
2. UI shows spec summary + confirmation checkbox
3. Party A confirms
4. Party B is notified
5. Party B reviews and confirms
6. Spec status = locked
7. Job ready for escrow funding
```

#### API Endpoints

**Initiate/Confirm Lock:**
```
POST /api/jobs/{job_id}/spec/lock

Response (first party):
{
  "status": "awaiting_other_party",
  "locked_by": ["employer"],
  "message": "Waiting for Marcus to confirm spec lock"
}

Response (second party - lock complete):
{
  "status": "locked",
  "locked_by": ["employer", "freelancer"],
  "locked_at": "2026-03-16T15:00:00Z",
  "message": "Spec locked! Sarah can now fund escrow."
}
```

**Check Lock Status:**
```
GET /api/jobs/{job_id}/spec/lock-status

Response:
{
  "is_locked": false,
  "employer_confirmed": true,
  "freelancer_confirmed": false,
  "employer_confirmed_at": "2026-03-16T14:55:00Z",
  "freelancer_confirmed_at": null
}
```

#### UI Components

```
SpecLockModal:
├── Header ("Lock Spec & Start Project")
├── SpecSummary
│   ├── DeliverablesList
│   ├── Budget
│   ├── Deadline
│   ├── MilestonesList
│   └── RequirementsCounts
├── WarningBox
│   └── "Once locked, changes require change requests (limited)"
├── Checkbox ("I have read and agree to this spec")
├── Actions
│   ├── LockButton ("Lock & Agree")
│   └── CancelButton
└── OtherPartyStatus
    └── "Sarah has confirmed" / "Waiting for Marcus"
```

---

### NEG-5: Spec Immutability After Lock

**As a** platform
**We want** the spec to be immutable after lock
**So that** both parties have a clear agreement

**Priority:** P0
**Points:** 1

#### Acceptance Criteria

- [ ] Spec cannot be edited after lock
- [ ] API rejects edit attempts with clear error
- [ ] UI hides edit buttons after lock
- [ ] Change requests are the only way to modify (covered in EPIC 9)

#### Business Logic

```python
def update_spec(job_id: int, updates: dict, user: User) -> JobSpec:
    spec = get_job_spec(job_id)

    if spec.is_locked:
        raise HTTPException(400, "Spec is locked. Use change requests to modify.")

    # ... update logic
```

---

## Database Schema

```sql
-- Chat messages table
CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER NOT NULL REFERENCES chat_channels(id),
    sender_id INTEGER REFERENCES users(id),  -- NULL for AI
    sender_type VARCHAR(20) NOT NULL,  -- 'EMPLOYER', 'FREELANCER', 'AI_MEDIATOR'
    content TEXT NOT NULL,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    metadata_json JSON,  -- For action buttons, detected intents, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Spec lock tracking
ALTER TABLE job_specs ADD COLUMN employer_locked_at TIMESTAMP;
ALTER TABLE job_specs ADD COLUMN freelancer_locked_at TIMESTAMP;

-- Spec change proposals (pre-lock)
CREATE TABLE spec_change_proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    proposed_by_id INTEGER NOT NULL REFERENCES users(id),
    change_type VARCHAR(50) NOT NULL,
    details_json JSON NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, rejected
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_messages_channel ON chat_messages(channel_id);
CREATE INDEX idx_messages_created ON chat_messages(created_at);
```

---

## Chat Polling Strategy

For hackathon, use simple polling instead of WebSockets:

```typescript
// Frontend polling
useEffect(() => {
  const pollMessages = async () => {
    const lastId = messages[messages.length - 1]?.id || 0;
    const newMessages = await api.get(`/jobs/${jobId}/chat/messages?after_id=${lastId}`);
    if (newMessages.length > 0) {
      setMessages(prev => [...prev, ...newMessages]);
    }
  };

  const interval = setInterval(pollMessages, 3000); // Poll every 3 seconds
  return () => clearInterval(interval);
}, [jobId, messages]);
```

---

## Bro Response Triggers

| User Action | Bro Response |
|-------------|--------------|
| Chat created | Welcome message |
| Asks about process | Explains process |
| Asks about spec | References relevant spec section |
| Proposes new requirement | Flags as scope change |
| Proposes timeline change | Facilitates discussion |
| Proposes budget change | Facilitates discussion |
| Agreement reached | Summarizes and prompts lock |
| Frustration detected | De-escalates |
| 24h no activity | Check-in message |

---

## Testing Checklist

- [ ] Chat channel created on bid acceptance
- [ ] Only participants can access chat
- [ ] Can send and receive messages
- [ ] Bro welcome message appears
- [ ] Bro responds to process questions
- [ ] Bro detects scope change in message
- [ ] Pre-lock changes can be made
- [ ] Both parties can initiate lock
- [ ] Lock requires both confirmations
- [ ] Locked spec cannot be edited
- [ ] Job status updates after lock

---

## Files to Create/Modify

### Backend
- [ ] `backend/src/routes/chat.py` - Chat routes
- [ ] `backend/src/services/bro.py` - Bro AI logic
- [ ] `backend/src/models.py` - Add ChatMessage model
- [ ] `backend/src/routes/spec.py` - Add lock endpoints

### Frontend
- [ ] `frontend/src/pages/jobs/[id]/chat.tsx` - Chat page
- [ ] `frontend/src/components/chat/MessageList.tsx`
- [ ] `frontend/src/components/chat/MessageInput.tsx`
- [ ] `frontend/src/components/chat/BroMessage.tsx`
- [ ] `frontend/src/components/spec/SpecLockModal.tsx`
