import type { User } from '@/shared/types'

export const DUMMY_EMPLOYER: User = {
  id: 'user_emp_1',
  name: 'Alice Johnson',
  email: 'alice@example.com',
  role: 'employer',
  pfi_score: 92,
  created_at: '2024-01-15T10:00:00Z',
}

export const DUMMY_FREELANCER: User = {
  id: 'user_frl_1',
  name: 'Bob Smith',
  email: 'bob@example.com',
  role: 'freelancer',
  pfi_score: 87,
  created_at: '2024-02-01T10:00:00Z',
}

export const DUMMY_FREELANCERS: User[] = [
  DUMMY_FREELANCER,
  { id: 'user_frl_2', name: 'Sarah Chen', email: 'sarah@example.com', role: 'freelancer', pfi_score: 94, created_at: '2024-01-20T10:00:00Z' },
  { id: 'user_frl_3', name: 'Marcus Lee', email: 'marcus@example.com', role: 'freelancer', pfi_score: 78, created_at: '2024-03-01T10:00:00Z' },
]
