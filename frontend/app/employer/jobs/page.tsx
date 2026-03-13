'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, selectUser } from '@/store/auth'
import { DUMMY_JOBS } from '@/data/dummy_jobs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDistanceToNow } from 'date-fns'

const STATUS_META: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'error' | 'muted' | 'default' }> = {
  DRAFT:         { label: 'Draft',        variant: 'muted' },
  PUBLISHED:     { label: 'Published',    variant: 'default' },
  ASSIGNED:      { label: 'Assigned',     variant: 'info' },
  ESCROW_FUNDED: { label: 'Escrow Funded',variant: 'warning' },
  IN_PROGRESS:   { label: 'In Progress',  variant: 'info' },
  COMPLETED:     { label: 'Completed',    variant: 'success' },
  DISPUTED:      { label: 'Disputed',     variant: 'error' },
}

export default function EmployerJobsPage() {
  const router = useRouter()
  const user = useAuthStore(selectUser)

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  // Show all jobs for demo
  const jobs = DUMMY_JOBS.filter(j => j.employer_id === 'user_emp_1')

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Jobs</h1>
          <p className="text-muted-foreground mt-1 text-sm">{jobs.length} job{jobs.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link href="/employer/post-job">
          <Button variant="primary">+ Post New Job</Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No jobs yet"
          description="Post your first job and let AI generate a structured spec."
          action={<Link href="/employer/post-job"><Button variant="primary">Post a Job</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const meta = STATUS_META[job.status] ?? { label: job.status, variant: 'muted' as const }
            return (
              <Link
                key={job.job_id}
                href={`/employer/jobs/${job.job_id}`}
                className="block bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      <Badge variant="muted">{job.gig_type}</Badge>
                    </div>
                    <div className="font-semibold text-foreground">{job.title}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      ${job.budget_range.min.toLocaleString()} – ${job.budget_range.max.toLocaleString()} · Due {formatDistanceToNow(new Date(job.deadline), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {job.spec?.milestones.length ?? 0} milestones
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
