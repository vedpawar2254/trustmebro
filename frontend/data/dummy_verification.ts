import type { VerificationReport } from '@/types'

export const DUMMY_REPORT_PASS: VerificationReport = {
  milestone_id: 'm1',
  gig_type: 'SOFTWARE',
  gig_subtype: 'WEB_DEVELOPMENT',
  overall_score: 94,
  payment_decision: 'AUTO_RELEASE',
  criteria: [
    { name: 'Repository Structure', type: 'PRIMARY', status: 'PASS', detail: 'Standard Next.js structure with components, pages, lib, and public folders present.', weight: 0.2 },
    { name: 'README Present', type: 'PRIMARY', status: 'PASS', detail: 'README covers setup, environment variables, and run instructions clearly.', weight: 0.15 },
    { name: 'Tech Stack Match', type: 'PRIMARY', status: 'PASS', detail: 'package.json includes Next.js 14, TypeScript, Tailwind CSS, and Prisma as specified.', weight: 0.2 },
    { name: 'Commit History', type: 'PRIMARY', status: 'PASS', detail: '23 commits spread across 8 days. No last-minute dump detected.', weight: 0.1 },
  ],
  pfi_signals: [
    { name: 'Code Comments', status: 'INFO', detail: 'Good inline documentation throughout the codebase.' },
  ],
  resubmissions_remaining: 2,
  feedback_for_freelancer: 'Excellent work on milestone 1. Repository is well-structured and all criteria met. Payment has been automatically released.',
  created_at: '2024-03-20T15:30:00Z',
}

export const DUMMY_REPORT_HOLD: VerificationReport = {
  milestone_id: 'm2',
  gig_type: 'SOFTWARE',
  gig_subtype: 'WEB_DEVELOPMENT',
  overall_score: 72,
  payment_decision: 'HOLD',
  criteria: [
    { name: 'User Authentication', type: 'PRIMARY', status: 'PARTIAL', detail: 'Login and registration work, but password reset flow is missing. Spec required all three.', weight: 0.25 },
    { name: 'Product Catalog', type: 'PRIMARY', status: 'PASS', detail: 'Product list, detail page, and category filter all implemented correctly.', weight: 0.25 },
    { name: 'Shopping Cart', type: 'PRIMARY', status: 'PASS', detail: 'Add/remove items and quantity update work. Cart persists via localStorage.', weight: 0.2 },
    { name: 'Commit History', type: 'PRIMARY', status: 'FAIL', detail: '18 of 22 commits were made in the last 24 hours before submission. Spec required work spread across the milestone period.', weight: 0.1 },
  ],
  pfi_signals: [
    { name: 'TODO Comments', status: 'WARNING', detail: '7 TODO comments found in production code. Consider resolving before final submission.' },
    { name: 'Console Logs', status: 'WARNING', detail: 'console.log statements found in auth module. Remove before production.' },
  ],
  resubmissions_remaining: 2,
  feedback_for_freelancer: 'Two issues to fix: (1) Implement the password reset flow — this was explicitly required in the spec. (2) The commit history shows most work was done last-minute. For the resubmission, please ensure commits are spread out. You have 2 resubmission attempts remaining.',
  created_at: '2024-04-05T14:00:00Z',
}

export const DUMMY_REPORT_FAIL: VerificationReport = {
  milestone_id: 'm2',
  gig_type: 'COPYWRITING',
  gig_subtype: 'BLOG_POSTS',
  overall_score: 38,
  payment_decision: 'DISPUTE',
  criteria: [
    { name: 'Word Count', type: 'PRIMARY', status: 'FAIL', detail: 'Submitted 3 posts averaging 820 words. Spec required 1500-2000 words each.', weight: 0.2 },
    { name: 'Keyword Coverage', type: 'PRIMARY', status: 'FAIL', detail: 'Required keywords "project management software" and "team collaboration" appear 0 times across all posts.', weight: 0.25 },
    { name: 'Originality', type: 'PRIMARY', status: 'PASS', detail: 'Plagiarism check passed. 97% original content.', weight: 0.2 },
    { name: 'Required Sections', type: 'PRIMARY', status: 'FAIL', detail: 'Posts are missing the required "Key Takeaways" section specified in the brief.', weight: 0.15 },
    { name: 'Topic Coverage', type: 'PRIMARY', status: 'PARTIAL', detail: 'Posts cover the general topic but miss 3 of 5 required subtopics listed in the spec.', weight: 0.2 },
  ],
  pfi_signals: [],
  resubmissions_remaining: 0,
  feedback_for_freelancer: 'This submission does not meet the spec requirements. Word count is significantly below the minimum, required keywords are absent, and required sections are missing. All resubmission attempts have been used. This milestone has been flagged for dispute.',
  created_at: '2024-03-28T11:00:00Z',
}
