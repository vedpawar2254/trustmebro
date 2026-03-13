import type { JobSpec } from '@/shared/types'

export const DUMMY_SPEC_SOFTWARE: JobSpec = {
  spec_id: 'spec_001',
  job_id: 'job_001',
  version: 1,
  is_locked: false,
  clarifications: [],
  required_assets: [
    { asset_id: 'a1', name: 'Brand Guidelines', description: 'Logo, colors, fonts in PDF or Figma', is_delivered: false },
    { asset_id: 'a2', name: 'API Credentials', description: 'Stripe test keys and any third-party API keys', is_delivered: true, delivered_at: '2024-03-15T10:00:00Z' },
  ],
  milestones: [
    {
      milestone_id: 'm1',
      order: 1,
      title: 'Project Setup & Architecture',
      deadline: '2024-03-25T23:59:59Z',
      submission_requirements: [{ type: 'github_link', description: 'GitHub repository link' }],
      criteria: [
        { criterion_id: 'c1', name: 'Repository Structure', description: 'Standard Next.js structure with components, pages, lib folders', is_verifiable: true, status: 'PENDING', is_vague: false, vague_resolved: false, weight: 0.2 },
        { criterion_id: 'c2', name: 'README Present', description: 'README covers setup, environment variables, and run instructions', is_verifiable: true, status: 'PENDING', is_vague: false, vague_resolved: false, weight: 0.15 },
        { criterion_id: 'c3', name: 'Tech Stack Match', description: 'package.json includes Next.js, TypeScript, Tailwind, Prisma', is_verifiable: true, status: 'PENDING', is_vague: false, vague_resolved: false, weight: 0.2 },
        { criterion_id: 'c4', name: 'Good Code Quality', description: 'Code should look professional', is_verifiable: false, status: 'PENDING', is_vague: true, vague_resolved: false, weight: 0.1 },
      ],
    },
    {
      milestone_id: 'm2',
      order: 2,
      title: 'Core Features Implementation',
      deadline: '2024-04-05T23:59:59Z',
      submission_requirements: [{ type: 'github_link', description: 'GitHub repository link' }],
      criteria: [
        { criterion_id: 'c5', name: 'User Authentication', description: 'Registration, login, JWT tokens, password reset flow all implemented', is_verifiable: true, status: 'PENDING', is_vague: false, vague_resolved: false, weight: 0.25 },
        { criterion_id: 'c6', name: 'Product Catalog', description: 'Products list, detail page, search and filter by category', is_verifiable: true, status: 'PENDING', is_vague: false, vague_resolved: false, weight: 0.25 },
        { criterion_id: 'c7', name: 'Shopping Cart', description: 'Add/remove items, quantity update, cart persists on refresh', is_verifiable: true, status: 'PENDING', is_vague: false, vague_resolved: false, weight: 0.2 },
        { criterion_id: 'c8', name: 'Commit History', description: 'Commits spread across the milestone period, not dumped last minute', is_verifiable: true, status: 'PENDING', is_vague: false, vague_resolved: false, weight: 0.1 },
      ],
    },
    {
      milestone_id: 'm3',
      order: 3,
      title: 'Checkout & Payment',
      deadline: '2024-04-15T23:59:59Z',
      submission_requirements: [
        { type: 'github_link', description: 'GitHub repository link' },
        { type: 'text_paste', description: 'Deployed URL (optional)' },
      ],
      criteria: [
        { criterion_id: 'c9', name: 'Stripe Integration', description: 'Stripe test mode checkout working end-to-end', is_verifiable: true, status: 'PENDING', is_vague: false, vague_resolved: false, weight: 0.35 },
        { criterion_id: 'c10', name: 'Order Confirmation', description: 'Order confirmation email sent via SendGrid or similar', is_verifiable: true, status: 'PENDING', is_vague: false, vague_resolved: false, weight: 0.2 },
        { criterion_id: 'c11', name: 'Order History', description: 'User can view past orders in their account', is_verifiable: true, status: 'PENDING', is_vague: false, vague_resolved: false, weight: 0.15 },
      ],
    },
  ],
}

export const DUMMY_SPEC_LOCKED: JobSpec = {
  ...DUMMY_SPEC_SOFTWARE,
  spec_id: 'spec_002',
  job_id: 'job_002',
  is_locked: true,
  clarifications: [
    {
      clarification_id: 'cl1',
      spec_id: 'spec_002',
      question: 'For milestone 2, should the export be in CSV or PDF format?',
      answer: 'CSV format is required for all data exports.',
      asked_by: 'freelancer',
      answered_by: 'user_emp_1',
      created_at: '2024-03-16T09:00:00Z',
      answered_at: '2024-03-16T10:30:00Z',
    },
  ],
}
