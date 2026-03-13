'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, selectUser } from '@/store/auth'
import { DUMMY_JOBS } from '@/data/dummy_jobs'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDistanceToNow } from 'date-fns'

const STATUS_META: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'error' | 'muted' }> = {
  IN_PROGRESS:   { label: 'In Progress',   variant: 'info' },
  ESCROW_FUNDED: { label: 'Starting Soon', variant: 'warning' },
  COMPLETED:     { label: 'Completed',     variant: 'success' },
  DISPUTED:      { label: 'Disputed',      variant: 'error' },
}

export default function FreelancerProjectsPage() {
  const router = useRouter()
  const user = useAuthStore(selectUser)

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  // Show jobs that are active (not just published)
  const activeJobs = DUMMY_JOBS.filter(j => ['IN_PROGRESS', 'ESCROW_FUNDED', 'COMPLETED', 'DISPUTED'].includes(j.status))

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Projects</h1>
        <p className="text-muted-foreground mt-1">Track your active and completed work</p>
      </div>

      {activeJobs.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No active projects"
          description="Once an employer accepts your bid and funds escrow, your project will appear here."
          action={<Link href="/freelancer/jobs" className="text-primary text-sm font-medium hover:underline">Browse available jobs →</Link>}
        />
      ) : (
        <div className="space-y-3">
          {activeJobs.map(job => {
            const meta = STATUS_META[job.status] ?? { label: job.status, variant: 'muted' as const }
            return (
              <Link
                key={job.job_id}
                href={`/freelancer/projects/${job.job_id}`}
                className="block bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-foreground">{job.title}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {job.spec?.milestones.length ?? 0} milestones · Due {formatDistanceToNow(new Date(job.deadline), { addSuffix: true })}
                    </div>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  ${job.budget_range.min.toLocaleString()} – ${job.budget_range.max.toLocaleString()} · {job.gig_type}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
