# EPIC 1: Authentication & Users

## Overview

Users can register, login, manage sessions, and access role-based features.

**Dependencies:** None (Foundation)
**Blocked By:** Nothing
**Blocks:** All other epics

---

## User Stories

### AUTH-1: User Registration

**As a** new user
**I want to** register with my email and choose my role
**So that** I can access the platform as an employer or freelancer

**Priority:** P0
**Points:** 2

#### Acceptance Criteria

- [ ] User can enter: name, email, password, confirm password, role
- [ ] Role selection: "I want to hire" (Employer) or "I want to work" (Freelancer)
- [ ] Password validation:
  - Minimum 8 characters
  - At least one letter
  - At least one number
- [ ] Email validation: valid format, unique in system
- [ ] On success: Creates user, returns JWT token, redirects to dashboard
- [ ] On error: Shows specific error message (email taken, password weak, etc.)
- [ ] User created with default PFI score (Employer: 100, Freelancer: 90)

#### API Endpoint

```
POST /api/auth/register

Request:
{
  "name": "string",           // 2-255 chars
  "email": "string",          // valid email, unique
  "password": "string",       // 8+ chars, letter + digit
  "role": "employer" | "freelancer"
}

Response (201):
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "Sarah Chen",
    "email": "sarah@example.com",
    "role": "employer",
    "pfi_score": 100.0,
    "created_at": "2026-03-15T10:00:00Z"
  }
}

Response (400):
{
  "detail": "Email already registered"
}

Response (422):
{
  "detail": [
    {"loc": ["body", "password"], "msg": "Password must be at least 8 characters"}
  ]
}
```

#### Database

```sql
-- Uses existing users table
INSERT INTO users (name, email, password_hash, role, pfi_score, created_at)
VALUES (?, ?, ?, ?, ?, NOW());
```

#### Business Logic

```python
def register_user(data: RegisterRequest) -> User:
    # 1. Validate email uniqueness
    if user_exists(data.email):
        raise HTTPException(400, "Email already registered")

    # 2. Validate password strength
    if not is_strong_password(data.password):
        raise HTTPException(422, "Password must contain letter and digit")

    # 3. Hash password
    password_hash = hash_password(data.password)

    # 4. Set initial PFI
    pfi_score = 100.0 if data.role == "employer" else 90.0

    # 5. Create user
    user = create_user(
        name=data.name,
        email=data.email,
        password_hash=password_hash,
        role=data.role,
        pfi_score=pfi_score
    )

    # 6. Generate JWT
    token = create_jwt_token(user.id)

    return {"token": token, "user": user}
```

#### UI Components

```
RegisterPage:
├── Logo
├── RoleSelector (two cards: "I want to hire" / "I want to work")
├── Form
│   ├── NameInput
│   ├── EmailInput
│   ├── PasswordInput (with strength indicator)
│   ├── ConfirmPasswordInput
│   └── TermsCheckbox
├── SubmitButton ("Create Account")
├── ErrorDisplay
└── LoginLink ("Already have an account?")
```

---

### AUTH-2: User Login

**As a** registered user
**I want to** login with my email and password
**So that** I can access my account

**Priority:** P0
**Points:** 1

#### Acceptance Criteria

- [ ] User enters email and password
- [ ] On success: Returns JWT token, redirects to role-specific dashboard
- [ ] On error: Shows "Invalid email or password" (generic for security)
- [ ] JWT token stored in localStorage or httpOnly cookie
- [ ] Token expires after 7 days

#### API Endpoint

```
POST /api/auth/login

Request:
{
  "email": "string",
  "password": "string"
}

Response (200):
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "Sarah Chen",
    "email": "sarah@example.com",
    "role": "employer",
    "pfi_score": 100.0,
    "created_at": "2026-03-15T10:00:00Z"
  }
}

Response (401):
{
  "detail": "Invalid email or password"
}
```

#### Business Logic

```python
def login_user(data: LoginRequest) -> dict:
    # 1. Find user by email
    user = get_user_by_email(data.email)
    if not user:
        raise HTTPException(401, "Invalid email or password")

    # 2. Verify password
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")

    # 3. Generate JWT
    token = create_jwt_token(user.id, expires_days=7)

    return {"token": token, "user": user}
```

#### UI Components

```
LoginPage:
├── Logo
├── Form
│   ├── EmailInput
│   ├── PasswordInput (with show/hide toggle)
│   └── RememberMeCheckbox
├── SubmitButton ("Log In")
├── ErrorDisplay
├── ForgotPasswordLink (disabled for hackathon)
└── RegisterLink ("Don't have an account?")
```

---

### AUTH-3: Get Current User

**As a** logged-in user
**I want to** see my profile information
**So that** I can verify my account details and PFI score

**Priority:** P1
**Points:** 1

#### Acceptance Criteria

- [ ] Authenticated users can fetch their profile
- [ ] Returns user data including PFI score
- [ ] 401 if not authenticated

#### API Endpoint

```
GET /api/users/me

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "id": 1,
  "name": "Sarah Chen",
  "email": "sarah@example.com",
  "role": "employer",
  "pfi_score": 100.0,
  "created_at": "2026-03-15T10:00:00Z",
  "stats": {
    "jobs_posted": 5,        // for employers
    "jobs_completed": 3,
    "jobs_assigned": 0,      // for freelancers
    "bids_placed": 0
  }
}

Response (401):
{
  "detail": "Not authenticated"
}
```

#### Business Logic

```python
def get_current_user(token: str) -> User:
    # 1. Decode JWT
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(401, "Not authenticated")

    # 2. Get user
    user = get_user_by_id(payload["user_id"])
    if not user:
        raise HTTPException(401, "User not found")

    # 3. Add stats
    if user.role == "employer":
        user.stats = get_employer_stats(user.id)
    else:
        user.stats = get_freelancer_stats(user.id)

    return user
```

---

### AUTH-4: Logout

**As a** logged-in user
**I want to** logout
**So that** my session is ended securely

**Priority:** P0
**Points:** 0.5

#### Acceptance Criteria

- [ ] User clicks logout
- [ ] JWT token removed from client storage
- [ ] Redirected to login page
- [ ] (Server-side token invalidation skipped for hackathon)

#### API Endpoint

```
POST /api/auth/logout

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### UI Logic

```javascript
function logout() {
  // 1. Call logout API (optional for hackathon)
  await api.post('/auth/logout');

  // 2. Clear local storage
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // 3. Redirect to login
  router.push('/login');
}
```

---

### AUTH-5: Role-Based Dashboard

**As a** logged-in user
**I want to** see a dashboard specific to my role
**So that** I can access relevant features

**Priority:** P0
**Points:** 2

#### Acceptance Criteria

**Employer Dashboard:**
- [ ] Shows "My Jobs" summary (draft, active, completed counts)
- [ ] Shows "Pending Bids" count (across all jobs)
- [ ] Quick action: "Post New Job" button
- [ ] List of recent/active jobs
- [ ] List of submissions awaiting review

**Freelancer Dashboard:**
- [ ] Shows "My Bids" summary (pending, accepted, rejected counts)
- [ ] Shows "Active Jobs" (assigned to me)
- [ ] Quick action: "Browse Jobs" button
- [ ] List of active assignments with next milestone due
- [ ] Recent submission statuses

#### UI Components

**Employer Dashboard:**
```
EmployerDashboard:
├── Header ("Welcome back, Sarah")
├── StatsCards
│   ├── Card (Jobs Posted: 5)
│   ├── Card (Active Jobs: 2)
│   ├── Card (Pending Bids: 8)
│   └── Card (Completed: 3)
├── QuickActions
│   ├── Button ("Post New Job")
│   └── Button ("View All Jobs")
├── ActiveJobsList
│   └── JobCard[] (title, status, freelancer, deadline)
├── PendingReviewsList
│   └── SubmissionCard[] (job, milestone, freelancer, date)
└── RecentActivityFeed
```

**Freelancer Dashboard:**
```
FreelancerDashboard:
├── Header ("Welcome back, Marcus")
├── StatsCards
│   ├── Card (Active Jobs: 2)
│   ├── Card (Pending Bids: 3)
│   ├── Card (Completed: 15)
│   └── Card (Earnings: $2,450)
├── QuickActions
│   ├── Button ("Browse Jobs")
│   └── Button ("My Bids")
├── ActiveJobsList
│   └── JobCard[] (title, client, next milestone, deadline)
├── UpcomingDeadlines
│   └── DeadlineCard[] (milestone, due date, days remaining)
└── RecentSubmissions
    └── SubmissionCard[] (job, status, score)
```

#### API Endpoints

```
GET /api/dashboard/employer

Response:
{
  "stats": {
    "jobs_posted": 5,
    "active_jobs": 2,
    "pending_bids": 8,
    "completed_jobs": 3
  },
  "active_jobs": [
    {
      "id": 1,
      "title": "Blog Posts",
      "status": "IN_PROGRESS",
      "freelancer": {"id": 2, "name": "Marcus"},
      "deadline": "2026-03-31",
      "milestones_complete": 2,
      "milestones_total": 5
    }
  ],
  "pending_reviews": [
    {
      "submission_id": 5,
      "job_id": 1,
      "job_title": "Blog Posts",
      "milestone": "Blog Post 3",
      "freelancer": "Marcus",
      "submitted_at": "2026-03-20T14:00:00Z"
    }
  ]
}
```

```
GET /api/dashboard/freelancer

Response:
{
  "stats": {
    "active_jobs": 2,
    "pending_bids": 3,
    "completed_jobs": 15,
    "total_earnings": 2450.00
  },
  "active_jobs": [
    {
      "id": 1,
      "title": "Blog Posts",
      "client": {"id": 1, "name": "Sarah"},
      "next_milestone": "Blog Post 3",
      "deadline": "2026-03-25",
      "days_remaining": 5
    }
  ],
  "upcoming_deadlines": [
    {
      "job_id": 1,
      "milestone": "Blog Post 3",
      "deadline": "2026-03-25",
      "days_remaining": 5
    }
  ],
  "recent_submissions": [
    {
      "id": 3,
      "job_title": "Blog Posts",
      "milestone": "Blog Post 2",
      "status": "VERIFIED",
      "score": 94
    }
  ]
}
```

---

## Database Schema

```sql
-- Users table (already exists, verify structure)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('employer', 'freelancer')),
    pfi_score FLOAT DEFAULT 90.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for email lookup
CREATE INDEX idx_users_email ON users(email);
```

---

## JWT Token Structure

```python
# Token payload
{
    "user_id": 1,
    "role": "employer",
    "exp": 1710000000,  # Expiry timestamp
    "iat": 1709395200   # Issued at timestamp
}

# Token generation
def create_jwt_token(user_id: int, role: str, expires_days: int = 7) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=expires_days),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# Token verification
def decode_jwt(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
```

---

## Auth Middleware

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    token = credentials.credentials
    payload = decode_jwt(token)

    if not payload:
        raise HTTPException(401, "Invalid or expired token")

    user = get_user_by_id(payload["user_id"])
    if not user:
        raise HTTPException(401, "User not found")

    return user

async def require_employer(user: User = Depends(get_current_user)) -> User:
    if user.role != "employer":
        raise HTTPException(403, "Employer access required")
    return user

async def require_freelancer(user: User = Depends(get_current_user)) -> User:
    if user.role != "freelancer":
        raise HTTPException(403, "Freelancer access required")
    return user
```

---

## Frontend Auth Context

```typescript
// AuthContext.tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isEmployer: boolean;
  isFreelancer: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  };

  const register = async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      isEmployer: user?.role === 'employer',
      isFreelancer: user?.role === 'freelancer',
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## Protected Routes

```typescript
// ProtectedRoute.tsx
function ProtectedRoute({
  children,
  requiredRole
}: {
  children: React.ReactNode;
  requiredRole?: 'employer' | 'freelancer';
}) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, requiredRole]);

  if (!isAuthenticated) return null;
  if (requiredRole && user?.role !== requiredRole) return null;

  return <>{children}</>;
}

// Usage
<ProtectedRoute requiredRole="employer">
  <CreateJobPage />
</ProtectedRoute>
```

---

## Testing Checklist

- [ ] Register with valid data → success
- [ ] Register with existing email → error
- [ ] Register with weak password → error
- [ ] Register as employer → PFI = 100
- [ ] Register as freelancer → PFI = 90
- [ ] Login with valid credentials → success
- [ ] Login with wrong password → error
- [ ] Login with non-existent email → error
- [ ] Access protected route without token → redirect to login
- [ ] Access employer route as freelancer → forbidden
- [ ] Token expires → redirect to login
- [ ] Logout clears session

---

## Files to Create/Modify

### Backend
- [ ] `backend/src/routes/auth.py` - Auth routes
- [ ] `backend/src/schemas.py` - Add RegisterRequest, LoginRequest
- [ ] `backend/src/utils/auth.py` - JWT helpers, password hashing
- [ ] `backend/src/middleware/auth.py` - Auth dependencies
- [ ] `backend/src/routes/dashboard.py` - Dashboard data endpoints

### Frontend
- [ ] `frontend/src/contexts/AuthContext.tsx`
- [ ] `frontend/src/pages/login.tsx`
- [ ] `frontend/src/pages/register.tsx`
- [ ] `frontend/src/pages/dashboard/index.tsx`
- [ ] `frontend/src/components/ProtectedRoute.tsx`
- [ ] `frontend/src/components/dashboard/EmployerDashboard.tsx`
- [ ] `frontend/src/components/dashboard/FreelancerDashboard.tsx`
