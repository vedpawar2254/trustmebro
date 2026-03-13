# trustmebro — User Stories (Phases 1-3, 5-6)

## Overview
This document contains detailed user stories with acceptance criteria, edge cases, and dummy data for implementation phases.

---

## PHASE 1: FOUNDATION STORIES

### Story 1.1: Schema Agreement
**Priority:** BLOCKER
**Story Points:** 2

**As a:** Development Team
**I want to:** Agree on and document all API schemas
**So that:** Frontend and backend can work independently with confidence

**Acceptance Criteria:**
- [ ] VerificationReport JSON schema documented and committed
- [ ] ChatMessage JSON schema documented and committed
- [ ] All API endpoints documented in CONTRACTS.md
- [ ] TypeScript types file created in `/shared/types/`
- [ ] All team members have reviewed and approved schemas

**Edge Cases:**
- Schema changes during development → Document version number and migration path
- Missing fields in implementation → Return specific error: "INVALID_SCHEMA_MISSING_FIELD"

**Technical Details:**

```typescript
// File: shared/types/verification.ts
export interface VerificationReport {
  milestone_id: string;
  gig_type: GigType;
  gig_subtype: GigSubtype;
  overall_score: number;
  payment_decision: 'AUTO_RELEASE' | 'HOLD' | 'DISPUTE';
  criteria: Criterion[];
  pfi_signals: PFISignal[];
  resubmissions_remaining: number;
  feedback_for_freelancer: string;
  created_at: string;
}

export type GigType = 'SOFTWARE' | 'COPYWRITING' | 'DATA_ENTRY' | 'TRANSLATION';

export type GigSubtype =
  | 'WEB_DEVELOPMENT'
  | 'MOBILE_DEVELOPMENT'
  | 'DESKTOP_APPLICATIONS'
  | 'APIS_INTEGRATIONS'
  | 'DATABASE_DESIGN'
  | 'DEVOPS_INFRASTRUCTURE'
  | 'BLOG_POSTS'
  | 'WEBSITE_COPY'
  | 'EMAIL_MARKETING'
  | 'SOCIAL_MEDIA'
  | 'PRODUCT_DESCRIPTIONS'
  | 'SALES_MARKETING'
  | 'FORM_DIGITIZATION'
  | 'DATABASE_POPULATION'
  | 'DATA_CLEANING'
  | 'SPREADSHEET_CREATION'
  | 'DOCUMENT_TRANSCRIPTION'
  | 'DATA_EXTRACTION'
  | 'WEBSITE_LOCALIZATION'
  | 'DOCUMENT_TRANSLATION'
  | 'SUBTITLE_TRANSLATION'
  | 'MARKETING_TRANSLATION'
  | 'SOFTWARE_UI_TRANSLATION'
  | 'AUDIO_VIDEO_TRANSLATION';

export interface Criterion {
  name: string;
  type: 'PRIMARY' | 'SECONDARY';
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  detail: string;
  weight: number; // 0-1, sum should be 1.0
}

export interface PFISignal {
  name: string;
  status: 'WARNING' | 'INFO';
  detail: string;
}
```

```typescript
// File: shared/types/chat.ts
export interface ChatMessage {
  message_id: string;
  channel_id: string;
  sender: 'employer' | 'freelancer' | 'ai_mediator';
  content: string;
  timestamp: string;
  type: 'normal' | 'question' | 'scope_creep' | 'complaint' | 'contradiction';
  ai_action?: AIAction;
  attachments?: string[];
}

export interface AIAction {
  action_type: 'spec_gap_intercept' | 'scope_creep_detect' | 'conflict_deescalate' | 'contradiction_warn';
  ai_response: string;
  requires_response: boolean;
  response_type: 'spec_clarification' | 'change_request' | 'none';
}

export interface ChatChannel {
  channel_id: string;
  job_id: string;
  participants: {
    employer_id: string;
    freelancer_id: string;
  };
  created_at: string;
  is_active: boolean;
}
```

```typescript
// File: shared/types/job.ts
export interface Job {
  job_id: string;
  employer_id: string;
  title: string;
  description: string;
  gig_type: GigType;
  gig_subtype: GigSubtype;
  budget_range: {
    min: number;
    max: number;
    currency: string;
  };
  deadline: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ASSIGNED' | 'ESCROW_FUNDED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED';
  spec?: JobSpec;
  created_at: string;
  published_at?: string;
}

export interface JobSpec {
  spec_id: string;
  job_id: string;
  milestones: Milestone[];
  required_assets: RequiredAsset[];
  version: number;
  is_locked: boolean;
  locked_at?: string;
  clarifications: SpecClarification[];
}

export interface Milestone {
  milestone_id: string;
  order: number;
  title: string;
  deadline: string;
  criteria: MilestoneCriterion[];
  submission_requirements: SubmissionRequirement[];
}

export interface MilestoneCriterion {
  criterion_id: string;
  name: string;
  description: string;
  is_verifiable: boolean;
  status: 'pending' | 'pass' | 'fail' | 'partial';
  is_vague: boolean;
  vague_resolved: boolean;
}

export interface RequiredAsset {
  asset_id: string;
  name: string;
  description: string;
  is_delivered: boolean;
  delivered_at?: string;
}

export interface SubmissionRequirement {
  type: 'github_link' | 'file_upload' | 'text_paste' | 'document_pair';
  description: string;
  file_types?: string[];
  max_size_mb?: number;
}
```

---

### Story 1.2: Project Setup
**Priority:** HIGH
**Story Points:** 5

**As a:** Developer
**I want to:** Initialize all project environments with proper configuration
**So that:** I can start building features immediately

**Acceptance Criteria:**

**Frontend (Next.js):**
- [ ] Next.js 14+ project initialized with TypeScript
- [ ] Tailwind CSS configured with custom colors from UI_DESIGN.md
- [ ] shadcn/ui or Radix UI components installed
- [ ] App router configured with `/employer` and `/freelancer` routes
- [ ] Zustand state management configured
- [ ] Axios instance created with base URL and interceptors
- [ ] Base layout component created (header, footer, navigation)
- [ ] TypeScript config strict mode enabled

**Backend (Node/Express:**
- [ ] Express project initialized
- [ ] PostgreSQL(neon) database connected via Prisma
- [ ] JWT authentication configured (access tokens)
- [ ] CORS configured for frontend origin
- [ ] Helmet.js for security headers
- [ ] Winston or similar logging configured
- [ ] Multer (Node) or python-multipart for file uploads
- [ ] Environment variables configured (.env.example provided)

**AI Engine (Python):**
- [ ] Python 3.11+ project with Poetry or pip
- [ ] OpenAI API client configured
- [ ] GitHub API client configured
- [ ] Plagiarism API client configured (placeholder for now)
- [ ] Modular verification lane structure created
- [ ] Error handling and logging configured

**Shared:**
- [ ] TypeScript types shared via npm package or monorepo
- [ ] Docker configuration for each service
- [ ] Git hooks configured (pre-commit, pre-push)

**Edge Cases:**
- Environment variables missing → Fail startup with clear error message
- Database connection failed → Retry 3 times, then fail with error
- API rate limits → Implement exponential backoff

**Technical Details:**

```bash
# Frontend initialization
npx create-next-app@latest trustmebro-frontend --typescript --tailwind --app
cd trustmebro-frontend
npx shadcn-ui@latest init
npm install zustand axios

# Backend initialization (Node)
npm init -y
npm install express prisma @prisma/client jsonwebtoken bcrypt helmet cors winston multer

# AI Engine initialization
poetry init
poetry add openai python-dotenv pygithub
```

```javascript
// Frontend: lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

```javascript
// Backend: src/config/database.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

module.exports = prisma;
```

---

## PHASE 2: AUTHENTICATION STORIES

### Story 2.1: User Registration
**Priority:** HIGH
**Story Points:** 5

**As a:** New User (Employer or Freelancer)
**I want to:** Create an account with my email and password
**So that:** I can access the platform

**Acceptance Criteria:**
- [ ] Registration form accepts email, password, name, role (employer/freelancer)
- [ ] Password must be at least 8 characters with 1 letter and 1 number
- [ ] Email must be valid format and unique in system
- [ ] Password is hashed with bcrypt (cost factor 12)
- [ ] User is stored in database with role field
- [ ] On successful registration, user is logged in automatically
- [ ] JWT token is generated and stored in httpOnly cookie
- [ ] User is redirected to their role's dashboard
- [ ] Registration page shows clear error messages (email taken, weak password, etc.)

**Edge Cases:**
- Email already exists → "Email already registered. Please login."
- Weak password → "Password must be at least 8 characters with 1 letter and 1 number."
- Invalid email format → "Please enter a valid email address."
- Database error → "Something went wrong. Please try again later."
- Network timeout → "Request timed out. Please check your connection and try again."

**Technical Details:**

```typescript
// Frontend: components/auth/RegisterForm.tsx
interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  role: 'employer' | 'freelancer';
}

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    role: 'employer',
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Partial<RegisterFormData> = {};

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!formData.password || !passwordRegex.test(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with 1 letter and 1 number';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', formData);
      // Auto-login after registration
      localStorage.setItem('access_token', response.data.token);
      window.location.href = formData.role === 'employer' ? '/employer/dashboard' : '/freelancer/dashboard';
    } catch (error: any) {
      if (error.response?.data?.error) {
        setErrors({ email: error.response.data.error });
      } else {
        alert('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            className={`flex-1 p-4 border-2 rounded-lg ${
              formData.role === 'employer'
                ? 'border-primary bg-primary/10'
                : 'border-gray-300'
            }`}
            onClick={() => setFormData({ ...formData, role: 'employer' })}
          >
            <div className="text-2xl mb-1">🏢</div>
            <div className="font-semibold">Employer</div>
            <div className="text-sm text-gray-600">Post jobs, hire freelancers</div>
          </button>
          <button
            type="button"
            className={`flex-1 p-4 border-2 rounded-lg ${
              formData.role === 'freelancer'
                ? 'border-primary bg-primary/10'
                : 'border-gray-300'
            }`}
            onClick={() => setFormData({ ...formData, role: 'freelancer' })}
          >
            <div className="text-2xl mb-1">👤</div>
            <div className="font-semibold">Freelancer</div>
            <div className="text-sm text-gray-600">Find jobs, deliver work</div>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="John Doe"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="john@example.com"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Min 8 characters, 1 letter, 1 number"
        />
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>

      <div className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a href="/login" className="text-primary font-semibold">
          Login
        </a>
      </div>
    </form>
  );
};
```

```javascript
// Backend: routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['employer', 'freelancer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered. Please login.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
```

**Dummy Data for Testing:**

```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "SecurePass123",
  "role": "employer"
}
```

```json
{
  "name": "Bob Smith",
  "email": "bob@example.com",
  "password": "SecurePass123",
  "role": "freelancer"
}
```

---

### Story 2.2: User Login
**Priority:** HIGH
**Story Points:** 3

**As a:** Returning User
**I want to:** Login with my email and password
**So that:** I can access my dashboard

**Acceptance Criteria:**
- [ ] Login form accepts email and password
- [ ] Password is compared against hashed version in database
- [ ] On successful login, JWT token is generated
- [ ] Token is stored in httpOnly cookie
- [ ] User is redirected to their role's dashboard
- [ ] Invalid credentials show clear error message
- [ ] Account not found shows clear error message

**Edge Cases:**
- Wrong password → "Invalid email or password."
- Email not found → "Invalid email or password." (don't reveal if email exists)
- Account locked (too many failed attempts) → "Account locked. Please contact support."
- Network error → "Connection failed. Please check your internet."

**Technical Details:**

```typescript
// Frontend: components/auth/LoginForm.tsx
const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('access_token', response.data.token);
      const redirectUrl = response.data.user.role === 'employer'
        ? '/employer/dashboard'
        : '/freelancer/dashboard';
      window.location.href = redirectUrl;
    } catch (error: any) {
      setError(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="john@example.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="••••••••"
          required
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>

      <div className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <a href="/register" className="text-primary font-semibold">
          Sign up
        </a>
      </div>
    </form>
  );
};
```

```javascript
// Backend: routes/auth.js (continued)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // TODO: Track failed attempts, lock account after 5 attempts
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});
```

---

### Story 2.3: Role-Based Views
**Priority:** HIGH
**Story Points:** 4

**As a:** User
**I want to:** See the appropriate dashboard based on my role
**So that:** I can access role-specific features

**Acceptance Criteria:**
- [ ] Employers see employer dashboard with job posting, bidding, project management
- [ ] Freelancers see freelancer dashboard with job browsing, submissions, earnings
- [ ] Navbar shows role-specific navigation items
- [ ] Accessing opposite role's routes redirects to their own dashboard
- [ ] Role middleware protects all protected routes
- [ ] Freelancers see their PFI score on dashboard header

**Edge Cases:**
- User tries to access /employer/dashboard as freelancer → Redirect to /freelancer/dashboard
- User manually navigates to opposite role page → Redirect with error message
- Token expired → Redirect to /login with "Session expired. Please login again."

**Technical Details:**

```typescript
// Frontend: components/layout/Navbar.tsx
const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const isEmployerView = pathname?.startsWith('/employer');
  const isFreelancerView = pathname?.startsWith('/freelancer');

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href={user?.role === 'employer' ? '/employer/dashboard' : '/freelancer/dashboard'}>
            <h1 className="text-2xl font-bold text-primary">trustmebro</h1>
          </a>

          {isEmployerView && (
            <div className="flex gap-4">
              <a href="/employer/dashboard" className="text-gray-700 hover:text-primary">
                Dashboard
              </a>
              <a href="/employer/jobs" className="text-gray-700 hover:text-primary">
                My Jobs
              </a>
              <a href="/employer/post-job" className="text-gray-700 hover:text-primary">
                Post Job
              </a>
            </div>
          )}

          {isFreelancerView && (
            <div className="flex gap-4">
              <a href="/freelancer/dashboard" className="text-gray-700 hover:text-primary">
                Dashboard
              </a>
              <a href="/freelancer/jobs" className="text-gray-700 hover:text-primary">
                Browse Jobs
              </a>
              <a href="/freelancer/my-projects" className="text-gray-700 hover:text-primary">
                My Projects
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user?.role === 'freelancer' && (
            <div className="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-full">
              <span className="text-sm font-semibold">PFI: {user.pfi_score || '--'}</span>
              <span>🏆</span>
            </div>
          )}

          <div className="relative group">
            <button className="flex items-center gap-2 text-gray-700 hover:text-primary">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                {user?.name?.[0] || 'U'}
              </div>
              <span className="hidden md:block">{user?.name}</span>
            </button>

            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <div className="px-4 py-2 border-b border-gray-200">
                <div className="font-semibold">{user?.name}</div>
                <div className="text-sm text-gray-600">{user?.email}</div>
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
```

```typescript
// Frontend: app/employer/dashboard/page.tsx
'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EmployerDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'employer') {
      router.push('/login');
    }
  }, [user, router]);

  if (!user || user.role !== 'employer') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-charcoal mb-8">
        Welcome back, {user.name}!
      </h1>

      {/* Dashboard content */}
    </div>
  );
}
```

```typescript
// Frontend: app/freelancer/dashboard/page.tsx
'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function FreelancerDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'freelancer') {
      router.push('/login');
    }
  }, [user, router]);

  if (!user || user.role !== 'freelancer') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-charcoal mb-8">
        Welcome back, {user.name}!
      </h1>

      {/* Dashboard content */}
    </div>
  );
}
```

---

## PHASE 3: GIG TYPE SYSTEM STORIES

### Story 3.1: Gig Type Classification
**Priority:** HIGH
**Story Points:** 5

**As a:** User
**I want to:** See jobs classified by gig type and subtype
**So that:** I can find relevant work opportunities

**Acceptance Criteria:**
- [ ] Gig types: SOFTWARE, COPYWRITING, DATA_ENTRY, TRANSLATION
- [ ] Each gig type has 6 subtypes (24 total)
- [ ] AI classifies job descriptions into correct gig type
- [ ] AI classifies job descriptions into correct subtype
- [ ] Gig type icons display on job cards
- [ ] Gig type filter dropdown on job browse page
- [ ] Gig type badge on job detail page

**Edge Cases:**
- Job description is too vague → "Gig type could not be determined. Please provide more details."
- Job spans multiple types → Select primary type, note in description
- AI confidence low → Ask employer to manually select

**Technical Details:**

```typescript
// Frontend: components/jobs/GigTypeBadge.tsx
interface GigTypeBadgeProps {
  gigType: GigType;
  gigSubtype?: GigSubtype;
  size?: 'small' | 'medium' | 'large';
}

const gigTypeIcons: Record<GigType, string> = {
  SOFTWARE: '💻',
  COPYWRITING: '✍️',
  DATA_ENTRY: '📊',
  TRANSLATION: '🌐',
};

const gigTypeColors: Record<GigType, string> = {
  SOFTWARE: 'bg-blue-100 text-blue-800',
  COPYWRITING: 'bg-purple-100 text-purple-800',
  DATA_ENTRY: 'bg-green-100 text-green-800',
  TRANSLATION: 'bg-orange-100 text-orange-800',
};

export const GigTypeBadge: React.FC<GigTypeBadgeProps> = ({
  gigType,
  gigSubtype,
  size = 'medium',
}) => {
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-4 py-2 text-base',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`${gigTypeColors[gigType]} ${sizeClasses[size]} rounded-full font-medium`}>
        {gigTypeIcons[gigType]} {gigType.replace('_', ' ')}
      </span>
      {gigSubtype && (
        <span className="text-sm text-gray-600">
          • {gigSubtype.replace('_', ' ')}
        </span>
      )}
    </div>
  );
};
```

```python
# AI Engine: src/classifiers/gig_type_classifier.py
from openai import OpenAI
import re

class GigTypeClassifier:
    GIG_TYPES = {
        'SOFTWARE': [
            'WEB_DEVELOPMENT',
            'MOBILE_DEVELOPMENT',
            'DESKTOP_APPLICATIONS',
            'APIS_INTEGRATIONS',
            'DATABASE_DESIGN',
            'DEVOPS_INFRASTRUCTURE'
        ],
        'COPYWRITING': [
            'BLOG_POSTS',
            'WEBSITE_COPY',
            'EMAIL_MARKETING',
            'SOCIAL_MEDIA',
            'PRODUCT_DESCRIPTIONS',
            'SALES_MARKETING'
        ],
        'DATA_ENTRY': [
            'FORM_DIGITIZATION',
            'DATABASE_POPULATION',
            'DATA_CLEANING',
            'SPREADSHEET_CREATION',
            'DOCUMENT_TRANSCRIPTION',
            'DATA_EXTRACTION'
        ],
        'TRANSLATION': [
            'WEBSITE_LOCALIZATION',
            'DOCUMENT_TRANSLATION',
            'SUBTITLE_TRANSLATION',
            'MARKETING_TRANSLATION',
            'SOFTWARE_UI_TRANSLATION',
            'AUDIO_VIDEO_TRANSLATION'
        ]
    }

    def __init__(self, openai_api_key: str):
        self.client = OpenAI(api_key=openai_api_key)

    def classify(self, job_description: str) -> tuple[str, str, float]:
        """
        Classify job description into gig type and subtype.
        Returns: (gig_type, gig_subtype, confidence)
        """

        prompt = f"""
        Classify the following job description into a gig type and subtype.

        GIG TYPES:
        - SOFTWARE: Web Development, Mobile Development, Desktop Applications, APIs & Integrations, Database Design, DevOps
        - COPYWRITING: Blog Posts, Website Copy, Email Marketing, Social Media, Product Descriptions, Sales & Marketing
        - DATA_ENTRY: Form Digitization, Database Population, Data Cleaning, Spreadsheet Creation, Document Transcription, Data Extraction
        - TRANSLATION: Website & App Localization, Document Translation, Subtitle Translation, Marketing Translation, Software/UI Translation, Audio/Video Translation

        Job Description:
        {job_description}

        Respond in JSON format:
        {{
            "gig_type": "SOFTWARE|COPYWRITING|DATA_ENTRY|TRANSLATION",
            "gig_subtype": "SPECIFIC_SUBTYPE_FROM_ABOVE",
            "confidence": 0.0-1.0,
            "reasoning": "Brief explanation"
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a job classification expert. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)

            # Validate result
            if result['gig_type'] not in self.GIG_TYPES:
                raise ValueError(f"Invalid gig type: {result['gig_type']}")

            if result['gig_subtype'] not in self.GIG_TYPES[result['gig_type']]:
                raise ValueError(f"Invalid subtype for {result['gig_type']}: {result['gig_subtype']}")

            return (
                result['gig_type'],
                result['gig_subtype'],
                result['confidence']
            )

        except Exception as e:
            print(f"Classification error: {e}")
            # Fallback to keyword matching
            return self._fallback_classify(job_description)

    def _fallback_classify(self, description: str) -> tuple[str, str, float]:
        """Fallback to keyword-based classification"""
        description_lower = description.lower()

        # Software keywords
        software_keywords = [
            'code', 'app', 'website', 'api', 'database', 'react', 'node',
            'python', 'javascript', 'development', 'programming'
        ]
        # Copywriting keywords
        copywriting_keywords = [
            'write', 'blog', 'copy', 'content', 'article', 'marketing',
            'email', 'social media', 'description'
        ]
        # Data entry keywords
        data_keywords = [
            'data', 'entry', 'excel', 'csv', 'database', 'spreadsheet',
            'digitization', 'transcription'
        ]
        # Translation keywords
        translation_keywords = [
            'translate', 'translation', 'localization', 'subtitle',
            'language', 'multilingual'
        ]

        scores = {
            'SOFTWARE': sum(1 for kw in software_keywords if kw in description_lower),
            'COPYWRITING': sum(1 for kw in copywriting_keywords if kw in description_lower),
            'DATA_ENTRY': sum(1 for kw in data_keywords if kw in description_lower),
            'TRANSLATION': sum(1 for kw in translation_keywords if kw in description_lower),
        }

        gig_type = max(scores, key=scores.get)
        confidence = min(scores[gig_type] / 3.0, 1.0)  # Cap at 1.0

        # Default subtype
        subtype = self.GIG_TYPES[gig_type][0]

        return gig_type, subtype, confidence
```

---

### Story 3.2: Verification Criteria Templates
**Priority:** HIGH
**Story Points:** 6

**As a:** System
**I want to:** Have pre-defined verification criteria for each gig type
**So that:** AI can generate accurate verification reports

**Acceptance Criteria:**
- [ ] 24 subtype-specific criteria templates created
- [ ] Each template has 5-10 verifiable criteria
- [ ] Criteria are specific and measurable
- [ ] Criteria are editable by employer during spec review
- [ ] Criteria display in spec preview

**Edge Cases:**
- Employer adds criteria that are too vague → Flag as "too subjective to verify"
- Employer removes all criteria → Show error: "At least one criterion required per milestone"

**Technical Details:**

```python
# AI Engine: src/templates/verification_criteria.py

VERIFICATION_CRITERIA_TEMPLATES = {
    'SOFTWARE': {
        'WEB_DEVELOPMENT': [
            {
                'name': 'Repository Structure',
                'description': 'Standard project structure with proper folder organization (src, components, pages, tests, etc.)',
                'type': 'PRIMARY',
                'weight': 0.1,
                'verifiable': True,
                'check_type': 'code_structure'
            },
            {
                'name': 'Dependencies',
                'description': 'All dependencies listed in package.json/requirements.txt and match specified tech stack',
                'type': 'PRIMARY',
                'weight': 0.1,
                'verifiable': True,
                'check_type': 'dependency_check'
            },
            {
                'name': 'README Documentation',
                'description': 'Comprehensive README with project description, setup instructions, and usage guide',
                'type': 'PRIMARY',
                'weight': 0.1,
                'verifiable': True,
                'check_type': 'readme_check'
            },
            {
                'name': 'Feature Implementation',
                'description': 'All specified features implemented and working as per requirements',
                'type': 'PRIMARY',
                'weight': 0.4,
                'verifiable': True,
                'check_type': 'llm_evaluation'
            },
            {
                'name': 'Code Quality',
                'description': 'Code follows best practices, is well-commented, and maintainable',
                'type': 'SECONDARY',
                'weight': 0.1,
                'verifiable': True,
                'check_type': 'pfi_signal'
            },
            {
                'name': 'Testing',
                'description': 'Unit tests or integration tests included and passing',
                'type': 'SECONDARY',
                'weight': 0.1,
                'verifiable': True,
                'check_type': 'test_check'
            },
            {
                'name': 'Deployed Application',
                'description': 'Application is deployed and accessible via provided URL (if applicable)',
                'type': 'PRIMARY',
                'weight': 0.1,
                'verifiable': True,
                'check_type': 'deployment_check'
            }
        ],
        'MOBILE_DEVELOPMENT': [
            {
                'name': 'Project Structure',
                'description': 'Standard mobile app structure with proper organization',
                'type': 'PRIMARY',
                'weight': 0.15,
                'verifiable': True
            },
            {
                'name': 'Platform Requirements',
                'description': 'App follows platform-specific guidelines (iOS/Android)',
                'type': 'PRIMARY',
                'weight': 0.15,
                'verifiable': True
            },
            {
                'name': 'UI/UX Implementation',
                'description': 'User interface matches design specifications and provides good user experience',
                'type': 'PRIMARY',
                'weight': 0.3,
                'verifiable': True,
                'check_type': 'llm_evaluation'
            },
            {
                'name': 'Feature Implementation',
                'description': 'All specified features implemented and functional',
                'type': 'PRIMARY',
                'weight': 0.25,
                'verifiable': True,
                'check_type': 'llm_evaluation'
            },
            {
                'name': 'Performance',
                'description': 'App performs well with acceptable load times and smooth animations',
                'type': 'SECONDARY',
                'weight': 0.15,
                'verifiable': True,
                'check_type': 'pfi_signal'
            }
        ],
        # ... other software subtypes
    },
    'COPYWRITING': {
        'BLOG_POSTS': [
            {
                'name': 'Word Count',
                'description': 'Content meets specified word count range (±10% tolerance)',
                'type': 'PRIMARY',
                'weight': 0.15,
                'verifiable': True,
                'check_type': 'word_count'
            },
            {
                'name': 'Keyword Inclusion',
                'description': 'Required keywords present at specified frequency',
                'type': 'PRIMARY',
                'weight': 0.2,
                'verifiable': True,
                'check_type': 'keyword_check'
            },
            {
                'name': 'Originality',
                'description': 'Content is original and passes plagiarism check (>90% original)',
                'type': 'PRIMARY',
                'weight': 0.25,
                'verifiable': True,
                'check_type': 'plagiarism_check'
            },
            {
                'name': 'Structure',
                'description': 'Content follows required structure (introduction, body, conclusion, etc.)',
                'type': 'PRIMARY',
                'weight': 0.15,
                'verifiable': True,
                'check_type': 'structure_check'
            },
            {
                'name': 'Topic Coverage',
                'description': 'Content covers all specified topics thoroughly',
                'type': 'PRIMARY',
                'weight': 0.15,
                'verifiable': True,
                'check_type': 'llm_evaluation'
            },
            {
                'name': 'Tone Adherence',
                'description': 'Writing style matches specified tone (if provided)',
                'type': 'SECONDARY',
                'weight': 0.1,
                'verifiable': True,
                'check_type': 'tone_check'
            }
        ],
        'WEBSITE_COPY': [
            {
                'name': 'Word Count',
                'description': 'Content meets specified word count',
                'type': 'PRIMARY',
                'weight': 0.1,
                'verifiable': True
            },
            {
                'name': 'Clarity',
                'description': 'Copy is clear, concise, and easy to understand',
                'type': 'PRIMARY',
                'weight': 0.25,
                'verifiable': True,
                'check_type': 'llm_evaluation'
            },
            {
                'name': 'Persuasive Elements',
                'description': 'Copy includes persuasive language and compelling calls-to-action',
                'type': 'PRIMARY',
                'weight': 0.2,
                'verifiable': True,
                'check_type': 'llm_evaluation'
            },
            {
                'name': 'SEO Keywords',
                'description': 'SEO keywords incorporated naturally',
                'type': 'PRIMARY',
                'weight': 0.2,
                'verifiable': True
            },
            {
                'name': 'Brand Voice',
                'description': 'Copy aligns with brand guidelines and tone',
                'type': 'PRIMARY',
                'weight': 0.15,
                'verifiable': True,
                'check_type': 'llm_evaluation'
            },
            {
                'name': 'Grammar and Spelling',
                'description': 'No grammar or spelling errors',
                'type': 'PRIMARY',
                'weight': 0.1,
                'verifiable': True
            }
        ],
        # ... other copywriting subtypes
    },
    'DATA_ENTRY': {
        'FORM_DIGITIZATION': [
            {
                'name': 'Data Completeness',
                'description': 'All form fields digitized accurately',
                'type': 'PRIMARY',
                'weight': 0.3,
                'verifiable': True,
                'check_type': 'completeness_check'
            },
            {
                'name': 'Accuracy',
                'description': 'Data accuracy ≥ 98% (sample check)',
                'type': 'PRIMARY',
                'weight': 0.3,
                'verifiable': True,
                'check_type': 'accuracy_sampling'
            },
            {
                'name': 'Format Compliance',
                'description': 'Data follows specified format (CSV/XLSX)',
                'type': 'PRIMARY',
                'weight': 0.2,
                'verifiable': True,
                'check_type': 'format_check'
            },
            {
                'name': 'Schema Compliance',
                'description': 'All required columns present with correct names and types',
                'type': 'PRIMARY',
                'weight': 0.15,
                'verifiable': True,
                'check_type': 'schema_check'
            },
            {
                'name': 'No Duplicates',
                'description': 'No duplicate entries (if specified)',
                'type': 'PRIMARY',
                'weight': 0.05,
                'verifiable': True,
                'check_type': 'duplicate_check'
            }
        ],
        'DATABASE_POPULATION': [
            {
                'name': 'Record Count',
                'description': 'Specified number of records populated',
                'type': 'PRIMARY',
                'weight': 0.2,
                'verifiable': True
            },
            {
                'name': 'Data Accuracy',
                'description': 'Data accuracy ≥ 95%',
                'type': 'PRIMARY',
                'weight': 0.3,
                'verifiable': True
            },
            {
                'name': 'Data Types',
                'description': 'All data in correct types (dates, numbers, strings)',
                'type': 'PRIMARY',
                'weight': 0.15,
                'verifiable': True
            },
            {
                'name': 'Relationships',
                'description': 'Foreign key relationships valid',
                'type': 'PRIMARY',
                'weight': 0.15,
                'verifiable': True
            },
            {
                'name': 'No Nulls in Required Fields',
                'description': 'No null values in required fields',
                'type': 'PRIMARY',
                'weight': 0.1,
                'verifiable': True
            },
            {
                'name': 'Consistent Formatting',
                'description': 'Consistent date, phone, email formats',
                'type': 'PRIMARY',
                'weight': 0.1,
                'verifiable': True
            }
        ],
        # ... other data entry subtypes
    },
    'TRANSLATION': {
        'WEBSITE_LOCALIZATION': [
            {
                'name': 'Word Count Match',
                'description': 'Target word count within ±10% of source',
                'type': 'PRIMARY',
                'weight': 0.15,
                'verifiable': True,
                'check_type': 'word_count_match'
            },
            {
                'name': 'Content Completeness',
                'description': 'All source content translated',
                'type': 'PRIMARY',
                'weight': 0.25,
                'verifiable': True,
                'check_type': 'completeness_check'
            },
            {
                'name': 'Meaning Preservation',
                'description': 'Original meaning accurately conveyed',
                'type': 'PRIMARY',
                'weight': 0.25,
                'verifiable': True,
                'check_type': 'llm_evaluation'
            },
            {
                'name': 'Cultural Appropriateness',
                'description': 'Content culturally appropriate for target audience',
                'type': 'PRIMARY',
                'weight': 0.15,
                'verifiable': True,
                'check_type': 'llm_evaluation'
            },
            {
                'name': 'Terminology Consistency',
                'description': 'Technical terms used consistently (if glossary provided)',
                'type': 'PRIMARY',
                'weight': 0.1,
                'verifiable': True,
                'check_type': 'terminology_check'
            },
            {
                'name': 'No Machine Translation',
                'description': 'Translation is human-generated, not machine-translated',
                'type': 'PRIMARY',
                'weight': 0.1,
                'verifiable': True,
                'check_type': 'machine_detection'
            }
        ],
        'DOCUMENT_TRANSLATION': [
            {
                'name': 'Word Count Match',
                'description': 'Target word count within ±15% of source (allow for language differences)',
                'type': 'PRIMARY',
                'weight': 0.1,
                'verifiable': True
            },
            {
                'name': 'Accuracy',
                'description': 'Accurate translation of all content',
                'type': 'PRIMARY',
                'weight': 0.3,
                'verifiable': True,
                'check_type': 'llm_evaluation'
            },
            {
                'name': 'Formatting',
                'description': 'Original formatting preserved (headings, bullets, tables)',
                'type': 'PRIMARY',
                'weight': 0.2,
                'verifiable': True
            },
            {
                'name': 'Tone Consistency',
                'description': 'Tone matches original document',
                'type': 'PRIMARY',
                'weight': 0.15,
                'verifiable': True,
                'check_type': 'llm_evaluation'
            },
            {
                'name': 'No Omissions',
                'description': 'No content omitted or added',
                'type': 'PRIMARY',
                'weight': 0.15,
                'verifiable': True
            },
            {
                'name': 'Technical Accuracy',
                'description': 'Technical terms translated correctly',
                'type': 'PRIMARY',
                'weight': 0.1,
                'verifiable': True,
                'check_type': 'llm_evaluation'
            }
        ],
        # ... other translation subtypes
    }
}


class CriteriaTemplateManager:
    def __init__(self):
        self.templates = VERIFICATION_CRITERIA_TEMPLATES

    def get_template(self, gig_type: str, gig_subtype: str) -> list[dict]:
        """
        Get verification criteria template for specific gig type and subtype.
        """
        if gig_type not in self.templates:
            raise ValueError(f"Unknown gig type: {gig_type}")

        if gig_subtype not in self.templates[gig_type]:
            raise ValueError(f"Unknown subtype for {gig_type}: {gig_subtype}")

        # Return deep copy to prevent modification
        return [criterion.copy() for criterion in self.templates[gig_type][gig_subtype]]

    def get_all_templates(self) -> dict:
        """Get all templates."""
        return self.templates

    def validate_criteria(self, criteria: list[dict]) -> list[str]:
        """
        Validate criteria list and return any errors.
        """
        errors = []

        if not criteria:
            errors.append("At least one criterion required")
            return errors

        total_weight = 0
        for i, criterion in enumerate(criteria):
            if 'name' not in criterion:
                errors.append(f"Criterion {i+1}: Missing 'name' field")

            if 'description' not in criterion:
                errors.append(f"Criterion {i+1}: Missing 'description' field")

            if 'type' not in criterion or criterion['type'] not in ['PRIMARY', 'SECONDARY']:
                errors.append(f"Criterion {i+1}: Invalid 'type' (must be PRIMARY or SECONDARY)")

            if 'weight' not in criterion:
                errors.append(f"Criterion {i+1}: Missing 'weight' field")
            else:
                try:
                    weight = float(criterion['weight'])
                    if weight < 0 or weight > 1:
                        errors.append(f"Criterion {i+1}: Weight must be between 0 and 1")
                    total_weight += weight
                except (ValueError, TypeError):
                    errors.append(f"Criterion {i+1}: Weight must be a number")

        # Weights don't need to sum to 1.0 (we'll normalize), but warn if far off
        if abs(total_weight - 1.0) > 0.3:
            errors.append(f"Criterion weights sum to {total_weight:.2f} (expected ~1.0)")

        return errors
```

---

## PHASE 5: FREELANCER JOB BROWSING STORIES

### Story 5.1: Job Feed with Dummy Data
**Priority:** HIGH
**Story Points:** 5

**As a:** Freelancer
**I want to:** Browse available jobs with filtering
**So that:** I can find relevant work opportunities

**Acceptance Criteria:**
- [ ] Display list of published jobs
- [ ] Each job card shows: title, gig type, budget, deadline, employer PFI
- [ ] Filter by gig type dropdown
- [ ] Filter by budget range
- [ ] Filter by deadline
- [ ] Search by keyword
- [ ] Pagination (12 jobs per page)
- [ ] "View Spec" button on each card

**Edge Cases:**
- No jobs match filters → Show "No jobs match your criteria" empty state
- Network error → Show "Failed to load jobs. Please try again."

**Dummy Data (from Phase 4 job postings):**

```typescript
// File: data/dummy_jobs.ts
export const DUMMY_JOBS: Job[] = [
  {
    job_id: 'job_001',
    employer_id: 'emp_001',
    title: 'Build a React E-commerce Platform',
    description: 'Looking for a full-stack developer to build a modern e-commerce platform using React, Next.js, and PostgreSQL. The platform should include user authentication, product catalog, shopping cart, and checkout flow with Stripe integration.',
    gig_type: 'SOFTWARE',
    gig_subtype: 'WEB_DEVELOPMENT',
    budget_range: {
      min: 3000,
      max: 5000,
      currency: 'USD'
    },
    deadline: '2024-04-15T23:59:59Z',
    status: 'PUBLISHED',
    employer_pfi: 92,
    employer_name: 'Alice Johnson',
    created_at: '2024-03-10T10:00:00Z',
    published_at: '2024-03-10T10:30:00Z'
  },
  {
    job_id: 'job_002',
    employer_id: 'emp_002',
    title: 'Write 10 SEO Blog Posts',
    description: 'Need 10 SEO-optimized blog posts about sustainable living. Each post should be 800-1000 words. Include keywords: sustainable living, eco-friendly, green lifestyle, zero waste. Tone should be informative but engaging.',
    gig_type: 'COPYWRITING',
    gig_subtype: 'BLOG_POSTS',
    budget_range: {
      min: 800,
      max: 1200,
      currency: 'USD'
    },
    deadline: '2024-04-01T23:59:59Z',
    status: 'PUBLISHED',
    employer_pfi: 88,
    employer_name: 'Bob Smith',
    created_at: '2024-03-12T14:00:00Z',
    published_at: '2024-03-12T14:15:00Z'
  },
  {
    job_id: 'job_003',
    employer_id: 'emp_001',
    title: 'Convert PDF Forms to Digital Database',
    description: 'We have 500 customer forms in PDF that need to be digitized and entered into our database. Forms contain name, email, phone, address, and purchase history. Accuracy must be 98%+. Must be completed by March 30.',
    gig_type: 'DATA_ENTRY',
    gig_subtype: 'FORM_DIGITIZATION',
    budget_range: {
      min: 500,
      max: 700,
      currency: 'USD'
    },
    deadline: '2024-03-30T23:59:59Z',
    status: 'PUBLISHED',
    employer_pfi: 92,
    employer_name: 'Alice Johnson',
    created_at: '2024-03-13T09:00:00Z',
    published_at: '2024-03-13T09:30:00Z'
  },
  {
    job_id: 'job_004',
    employer_id: 'emp_003',
    title: 'Translate Website to Spanish',
    description: 'Translate our entire website from English to Spanish. Approximately 50 pages / 25,000 words. Website is for a travel agency. Must maintain professional yet inviting tone. Some industry-specific terminology will need consistent translation.',
    gig_type: 'TRANSLATION',
    gig_subtype: 'WEBSITE_LOCALIZATION',
    budget_range: {
      min: 2500,
      max: 3500,
      currency: 'USD'
    },
    deadline: '2024-04-20T23:59:59Z',
    status: 'PUBLISHED',
    employer_pfi: 95,
    employer_name: 'Carol Davis',
    created_at: '2024-03-14T11:00:00Z',
    published_at: '2024-03-14T11:30:00Z'
  },
  {
    job_id: 'job_005',
    employer_id: 'emp_002',
    title: 'Mobile App UI Design',
    description: 'Design a modern, clean UI for a fitness tracking mobile app. Need screens for: dashboard, workout tracking, progress charts, social feed, and settings. Should follow modern design principles with smooth animations.',
    gig_type: 'SOFTWARE',
    gig_subtype: 'MOBILE_DEVELOPMENT',
    budget_range: {
      min: 2000,
      max: 3000,
      currency: 'USD'
    },
    deadline: '2024-04-10T23:59:59Z',
    status: 'PUBLISHED',
    employer_pfi: 88,
    employer_name: 'Bob Smith',
    created_at: '2024-03-15T08:00:00Z',
    published_at: '2024-03-15T08:30:00Z'
  },
  {
    job_id: 'job_006',
    employer_id: 'emp_003',
    title: 'Product Description Writing',
    description: 'Write compelling product descriptions for 50 new skincare products. Each description should be 150-200 words, highlight key benefits, include relevant keywords for SEO, and match our brand voice (clean, minimalist, scientific yet approachable).',
    gig_type: 'COPYWRITING',
    gig_subtype: 'PRODUCT_DESCRIPTIONS',
    budget_range: {
      min: 600,
      max: 800,
      currency: 'USD'
    },
    deadline: '2024-03-28T23:59:59Z',
    status: 'PUBLISHED',
    employer_pfi: 95,
    employer_name: 'Carol Davis',
    created_at: '2024-03-16T13:00:00Z',
    published_at: '2024-03-16T13:30:00Z'
  },
  {
    job_id: 'job_007',
    employer_id: 'emp_004',
    title: 'Database Population for CRM',
    description: 'Populate our new CRM database with 1,000 existing customer records from various sources (Excel sheets, CSV files, and PDF documents). Data includes contact info, purchase history, and preferences. Must maintain data integrity and relationships.',
    gig_type: 'DATA_ENTRY',
    gig_subtype: 'DATABASE_POPULATION',
    budget_range: {
      min: 400,
      max: 600,
      currency: 'USD'
    },
    deadline: '2024-04-05T23:59:59Z',
    status: 'PUBLISHED',
    employer_pfi: 85,
    employer_name: 'David Lee',
    created_at: '2024-03-17T10:00:00Z',
    published_at: '2024-03-17T10:30:00Z'
  },
  {
    job_id: 'job_008',
    employer_id: 'emp_004',
    title: 'API Integration for Payment Gateway',
    description: 'Integrate Stripe payment gateway into our existing Node.js backend. Need to handle: one-time payments, subscriptions, refunds, and webhooks. Must be secure, well-documented, and include error handling.',
    gig_type: 'SOFTWARE',
    gig_subtype: 'APIS_INTEGRATIONS',
    budget_range: {
      min: 800,
      max: 1200,
      currency: 'USD'
    },
    deadline: '2024-04-01T23:59:59Z',
    status: 'PUBLISHED',
    employer_pfi: 85,
    employer_name: 'David Lee',
    created_at: '2024-03-18T12:00:00Z',
    published_at: '2024-03-18T12:30:00Z'
  },
  {
    job_id: 'job_009',
    employer_id: 'emp_001',
    title: 'Email Marketing Copy',
    description: 'Write a 6-email nurture sequence for new subscribers. Sequence should welcome, educate about our eco-friendly products, include success stories, and lead to first purchase. Must include strong calls-to-action and be optimized for mobile.',
    gig_type: 'COPYWRITING',
    gig_subtype: 'EMAIL_MARKETING',
    budget_range: {
      min: 300,
      max: 450,
      currency: 'USD'
    },
    deadline: '2024-03-25T23:59:59Z',
    status: 'PUBLISHED',
    employer_pfi: 92,
    employer_name: 'Alice Johnson',
    created_at: '2024-03-19T09:00:00Z',
    published_at: '2024-03-19T09:30:00Z'
  },
  {
    job_id: 'job_010',
    employer_id: 'emp_003',
    title: 'Technical Document Translation',
    description: 'Translate a 50-page technical user manual from English to German. Manual is for industrial machinery. Includes technical diagrams, specifications, and safety instructions. Must maintain accuracy and technical precision.',
    gig_type: 'TRANSLATION',
    gig_subtype: 'DOCUMENT_TRANSLATION',
    budget_range: {
      min: 1500,
      max: 2000,
      currency: 'USD'
    },
    deadline: '2024-04-15T23:59:59Z',
    status: 'PUBLISHED',
    employer_pfi: 95,
    employer_name: 'Carol Davis',
    created_at: '2024-03-20T14:00:00Z',
    published_at: '2024-03-20T14:30:00Z'
  },
  {
    job_id: 'job_011',
    employer_id: 'emp_002',
    title: 'Spreadsheet Creation & Data Analysis',
    description: 'Create a comprehensive Excel spreadsheet for tracking monthly sales data. Need pivot tables, charts, conditional formatting, and automated calculations. Raw data will be provided as CSV. Must include instructions for monthly updates.',
    gig_type: 'DATA_ENTRY',
    gig_subtype: 'SPREADSHEET_CREATION',
    budget_range: {
      min: 200,
      max: 350,
      currency: 'USD'
    },
    deadline: '2024-03-22T23:59:59Z',
    status: 'PUBLISHED',
    employer_pfi: 88,
    employer_name: 'Bob Smith',
    created_at: '2024-03-21T11:00:00Z',
    published_at: '2024-03-21T11:30:00Z'
  },
  {
    job_id: 'job_012',
    employer_id: 'emp_005',
    title: 'Social Media Content Package',
    description: 'Create a month of social media content (30 posts) for a restaurant. Mix of promotional posts, food photography captions, behind-the-scenes content, and customer testimonials. Include hashtags and posting schedule.',
    gig_type: 'COPYWRITING',
    gig_subtype: 'SOCIAL_MEDIA',
    budget_range: {
      min: 500,
      max: 700,
      currency: 'USD'
    },
    deadline: '2024-03-27T23:59:59Z',
    status: 'PUBLISHED',
    employer_pfi: 90,
    employer_name: 'Eva Martinez',
    created_at: '2024-03-22T10:00:00Z',
    published_at: '2024-03-22T10:30:00Z'
  }
];
```

**Technical Implementation:**

```typescript
// Frontend: app/freelancer/jobs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { DUMMY_JOBS } from '@/data/dummy_jobs';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilters } from '@/components/jobs/JobFilters';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState({
    gigType: '',
    minBudget: 0,
    maxBudget: 10000,
    deadline: '',
    keyword: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // In production, fetch from API
    setJobs(DUMMY_JOBS);
    setFilteredJobs(DUMMY_JOBS);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = [...jobs];

    // Filter by gig type
    if (filters.gigType) {
      filtered = filtered.filter(job => job.gig_type === filters.gigType);
    }

    // Filter by budget range
    filtered = filtered.filter(job =>
      job.budget_range.min >= filters.minBudget &&
      job.budget_range.max <= filters.maxBudget
    );

    // Filter by deadline
    if (filters.deadline) {
      filtered = filtered.filter(job =>
        new Date(job.deadline) <= new Date(filters.deadline)
      );
    }

    // Filter by keyword
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(keyword) ||
        job.description.toLowerCase().includes(keyword)
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, filters]);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-charcoal mb-8">
        Available Jobs
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <JobFilters
            filters={filters}
            onChange={handleFilterChange}
            onReset={() => setFilters({
              gigType: '',
              minBudget: 0,
              maxBudget: 10000,
              deadline: '',
              keyword: ''
            })}
          />
        </div>

        {/* Job List */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading jobs...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-charcoal mb-2">
                No jobs match your criteria
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters to see more opportunities.
              </p>
              <button
                onClick={() => handleFilterChange({
                  gigType: '',
                  minBudget: 0,
                  maxBudget: 10000,
                  deadline: '',
                  keyword: ''
                })}
                className="text-primary font-semibold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredJobs.map(job => (
                <JobCard key={job.job_id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

```typescript
// Frontend: components/jobs/JobCard.tsx
import { Job } from '@/types/job';
import { GigTypeBadge } from './GigTypeBadge';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: Job;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-charcoal mb-2">
            {job.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span>By {job.employer_name}</span>
            <span>•</span>
            <span>PFI: {job.employer_pfi} 🏆</span>
          </div>
        </div>
        <GigTypeBadge gigType={job.gig_type} gigSubtype={job.gig_subtype} />
      </div>

      <p className="text-gray-700 mb-4 line-clamp-2">
        {job.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="text-charcoal font-semibold">
            ${job.budget_range.min} - ${job.budget_range.max}
          </div>
          <div className="text-gray-600">
            Due {formatDistanceToNow(new Date(job.deadline), { addSuffix: true })}
          </div>
        </div>

        <a
          href={`/freelancer/jobs/${job.job_id}`}
          className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 text-sm"
        >
          View Spec
        </a>
      </div>
    </div>
  );
};
```

```typescript
// Frontend: components/jobs/JobFilters.tsx
interface JobFiltersProps {
  filters: {
    gigType: string;
    minBudget: number;
    maxBudget: number;
    deadline: string;
    keyword: string;
  };
  onChange: (filters: Partial<typeof filters>) => void;
  onReset: () => void;
}

export const JobFilters: React.FC<JobFiltersProps> = ({ filters, onChange, onReset }) => {
  const GIG_TYPES = [
    { value: 'SOFTWARE', label: 'Software' },
    { value: 'COPYWRITING', label: 'Copywriting' },
    { value: 'DATA_ENTRY', label: 'Data Entry' },
    { value: 'TRANSLATION', label: 'Translation' }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
      <h2 className="text-lg font-semibold text-charcoal mb-4">Filters</h2>

      <div className="space-y-4">
        {/* Keyword Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => onChange({ keyword: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Job title or description..."
          />
        </div>

        {/* Gig Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gig Type
          </label>
          <select
            value={filters.gigType}
            onChange={(e) => onChange({ gigType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Types</option>
            {GIG_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Budget Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Budget Range
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={filters.minBudget}
              onChange={(e) => onChange({ minBudget: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Min"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              value={filters.maxBudget}
              onChange={(e) => onChange({ maxBudget: parseInt(e.target.value) || 10000 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Max"
            />
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deadline Before
          </label>
          <input
            type="date"
            value={filters.deadline}
            onChange={(e) => onChange({ deadline: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};
```

---

## PHASE 6: FREELANCER SELECTION STORIES

### Story 6.1: Bidding System with Dummy Data
**Priority:** HIGH
**Story Points:** 5

**As a:** Freelancer
**I want to:** Place a bid on a job with my proposal
**So that:** I can express interest and provide context

**Acceptance Criteria:**
- [ ] Bid form accepts cover letter and proposed timeline
- [ ] Freelancer PFI score displayed to employer
- [ ] Bid is saved and visible on job page
- [ ] Employer sees all bids with freelancer info
- [ ] Employer can select one freelancer

**Edge Cases:**
- Cover letter too short (<50 characters) → Show error
- Cover letter too long (>5000 characters) → Show error
- Freelancer already bid on this job → Update existing bid

**Dummy Bids Data:**

```typescript
// File: data/dummy_bids.ts
export const DUMMY_BIDS: Bid[] = [
  {
    bid_id: 'bid_001',
    job_id: 'job_001',
    freelancer_id: 'freelancer_001',
    freelancer_name: 'Alice Wilson',
    freelancer_pfi: 87,
    cover_letter: 'I have 5 years of experience building React e-commerce platforms with Next.js and PostgreSQL. I recently completed a similar project for a fashion retailer that included all the features you mentioned: authentication, product catalog, shopping cart, and Stripe checkout. I can deliver this in 4-5 weeks with a focus on clean code and scalability. I have experience with payment webhooks and can ensure secure transactions.',
    proposed_deadline: '2024-04-20T23:59:59Z',
    proposed_budget: 4500,
    status: 'PENDING',
    created_at: '2024-03-10T14:00:00Z'
  },
  {
    bid_id: 'bid_002',
    job_id: 'job_001',
    freelancer_id: 'freelancer_002',
    freelancer_name: 'Bob Martinez',
    freelancer_pfi: 92,
    cover_letter: 'I specialize in full-stack e-commerce development. Over the past 7 years, I\'ve built 15+ e-commerce platforms using React and Node.js. Your project aligns perfectly with my expertise. I can deliver a production-ready platform with SEO optimization, responsive design, and payment integration. I\'m available to start immediately and can complete within your timeline.',
    proposed_deadline: '2024-04-15T23:59:59Z',
    proposed_budget: 4200,
    status: 'PENDING',
    created_at: '2024-03-10T15:30:00Z'
  },
  {
    bid_id: 'bid_003',
    job_id: 'job_001',
    freelancer_id: 'freelancer_003',
    freelancer_name: 'Carol Chen',
    freelancer_pfi: 79,
    cover_letter: 'Hi! I\'m a React developer with 3 years of experience. I\'ve built a couple of small e-commerce sites before using Stripe. Your project sounds exciting and I think I can help. I might need some guidance on the complex parts but I\'m a quick learner. Let me know if you\'d like to work together!',
    proposed_deadline: '2024-04-25T23:59:59Z',
    proposed_budget: 3800,
    status: 'PENDING',
    created_at: '2024-03-10T16:45:00Z'
  },
  {
    bid_id: 'bid_004',
    job_id: 'job_002',
    freelancer_id: 'freelancer_004',
    freelancer_name: 'David Kim',
    freelancer_pfi: 95,
    cover_letter: 'I\'m a professional copywriter specializing in sustainability content. I\'ve written extensively on eco-friendly living, zero waste lifestyles, and green products for publications like Green Living Magazine and EcoDaily. My SEO blog posts consistently rank on Page 1. I can deliver engaging, well-researched content that educates and converts readers.',
    proposed_deadline: '2024-04-01T23:59:59Z',
    proposed_budget: 1000,
    status: 'PENDING',
    created_at: '2024-03-12T16:00:00Z'
  },
  {
    bid_id: 'bid_005',
    job_id: 'job_002',
    freelancer_id: 'freelancer_005',
    freelancer_name: 'Emma Johnson',
    freelancer_pfi: 88,
    cover_letter: 'I\'m a freelance writer with experience in lifestyle and wellness content. While I haven\'t written specifically about sustainable living, I\'m passionate about eco-friendly practices and would love to research this topic. I can adapt my writing style to match your tone and ensure SEO optimization. Let\'s discuss!',
    proposed_deadline: '2024-04-05T23:59:59Z',
    proposed_budget: 950,
    status: 'PENDING',
    created_at: '2024-03-12T17:30:00Z'
  }
];
```

**Technical Implementation:**

```typescript
// Frontend: app/freelancer/jobs/[jobId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DUMMY_JOBS } from '@/data/dummy_jobs';
import { DUMMY_BIDS } from '@/data/dummy_bids';
import { BidForm } from '@/components/bids/BidForm';
import { BidList } from '@/components/bids/BidList';
import { JobSpec } from '@/components/jobs/JobSpec';

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const [job, setJob] = useState<Job | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const foundJob = DUMMY_JOBS.find(j => j.job_id === jobId);
    const jobBids = DUMMY_BIDS.filter(b => b.job_id === jobId);
    setJob(foundJob || null);
    setBids(jobBids);
    setLoading(false);
  }, [jobId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!job) {
    return <div>Job not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Job Spec */}
        <div className="lg:col-span-2">
          <JobSpec job={job} />
        </div>

        {/* Right: Bidding */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <BidForm jobId={jobId} />
            {bids.length > 0 && <BidList bids={bids} />}
          </div>
        </div>
      </div>
    </div>
  );
}
```

```typescript
// Frontend: components/bids/BidForm.tsx
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';

interface BidFormProps {
  jobId: string;
}

export const BidForm: React.FC<BidFormProps> = ({ jobId }) => {
  const { user } = useAuthStore();
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedTimeline, setProposedTimeline] = useState('');
  const [proposedBudget, setProposedBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validation
      if (coverLetter.length < 50) {
        throw new Error('Cover letter must be at least 50 characters');
      }
      if (coverLetter.length > 5000) {
        throw new Error('Cover letter must be less than 5000 characters');
      }

      // Submit bid
      await api.post(`/jobs/${jobId}/bids`, {
        cover_letter: coverLetter,
        proposed_timeline: proposedTimeline,
        proposed_budget: parseInt(proposedBudget)
      });

      // Show success
      alert('Bid placed successfully!');
      setCoverLetter('');
      setProposedTimeline('');
      setProposedBudget('');
    } catch (err: any) {
      setError(err.message || 'Failed to place bid. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-charcoal mb-4">
        Place Your Bid
      </h2>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <span>🏆</span>
          <span className="font-semibold">Your PFI: {user?.pfi_score || '--'}</span>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          Employers see your PFI score when reviewing bids
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cover Letter *
          </label>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Tell the employer why you're the best fit for this project..."
            required
          />
          <div className="text-xs text-gray-500 mt-1">
            {coverLetter.length} / 5000 characters (min: 50)
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proposed Deadline
          </label>
          <input
            type="date"
            value={proposedTimeline}
            onChange={(e) => setProposedTimeline(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional: Propose a different deadline if needed
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proposed Budget (USD)
          </label>
          <input
            type="number"
            value={proposedBudget}
            onChange={(e) => setProposedBudget(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="e.g., 4500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional: Propose within job's budget range
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? 'Placing Bid...' : 'Place Bid'}
        </button>
      </form>
    </div>
  );
};
```

```typescript
// Frontend: components/bids/BidList.tsx
import { Bid } from '@/types/bid';

interface BidListProps {
  bids: Bid[];
}

export const BidList: React.FC<BidListProps> = ({ bids }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-charcoal mb-4">
        Active Bids ({bids.length})
      </h2>

      <div className="space-y-4">
        {bids.map(bid => (
          <div
            key={bid.bid_id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-charcoal">
                  {bid.freelancer_name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>PFI: {bid.freelancer_pfi}</span>
                  <span>🏆</span>
                </div>
              </div>
              {bid.proposed_budget && (
                <div className="text-right">
                  <div className="text-lg font-semibold text-primary">
                    ${bid.proposed_budget.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">Proposed</div>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-700 line-clamp-3 mb-2">
              {bid.cover_letter}
            </p>

            {bid.proposed_deadline && (
              <div className="text-xs text-gray-600">
                Deadline: {new Date(bid.proposed_deadline).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## SUMMARY

This document contains detailed user stories with:

**Phase 1 (Foundation):**
- Story 1.1: Schema Agreement with TypeScript type definitions
- Story 1.2: Project Setup for Frontend, Backend, and AI Engine

**Phase 2 (Authentication):**
- Story 2.1: User Registration with forms and validation
- Story 2.2: User Login with JWT authentication
- Story 2.3: Role-Based Views with protected routes

**Phase 3 (Gig Type System):**
- Story 3.1: Gig Type Classification with AI classifier
- Story 3.2: Verification Criteria Templates with 24 subtype templates

**Phase 5 (Freelancer Job Browsing):**
- Story 5.1: Job Feed with 12 dummy jobs and filtering

**Phase 6 (Freelancer Selection):**
- Story 6.1: Bidding System with 5 dummy bids

Each story includes:
- Clear acceptance criteria
- Edge cases and error handling
- Technical implementation details (code snippets)
- Dummy data for testing
- TypeScript interfaces
