import type { Bid } from '@/shared/types'

export const DUMMY_BIDS: Bid[] = [
  {
    bid_id: 'bid_001',
    job_id: 'job_001',
    freelancer_id: 'user_frl_1',
    freelancer_name: 'Bob Smith',
    freelancer_pfi: 87,
    cover_letter: "I've built 3 e-commerce platforms with Next.js and Stripe. My last project hit $50k GMV in month one. I can deliver clean, tested code with full documentation. Happy to share GitHub repos.",
    proposed_deadline: '2024-04-12T23:59:59Z',
    proposed_budget: 4200,
    status: 'PENDING',
    created_at: '2024-03-14T12:00:00Z',
  },
  {
    bid_id: 'bid_002',
    job_id: 'job_001',
    freelancer_id: 'user_frl_2',
    freelancer_name: 'Sarah Chen',
    freelancer_pfi: 94,
    cover_letter: "Full-stack engineer with 5 years specializing in React/Next.js. I've integrated Stripe for 8+ clients. I write comprehensive tests and always deliver on time. My PFI score reflects my track record.",
    proposed_deadline: '2024-04-10T23:59:59Z',
    proposed_budget: 4800,
    status: 'PENDING',
    created_at: '2024-03-14T14:00:00Z',
  },
  {
    bid_id: 'bid_003',
    job_id: 'job_001',
    freelancer_id: 'user_frl_3',
    freelancer_name: 'Marcus Lee',
    freelancer_pfi: 78,
    cover_letter: "I can build this for you. I know Next.js and have done e-commerce before. Available to start immediately.",
    proposed_deadline: '2024-04-20T23:59:59Z',
    proposed_budget: 3200,
    status: 'PENDING',
    created_at: '2024-03-15T09:00:00Z',
  },
]

export const getBidsForJob = (jobId: string) => DUMMY_BIDS.filter(b => b.job_id === jobId)
