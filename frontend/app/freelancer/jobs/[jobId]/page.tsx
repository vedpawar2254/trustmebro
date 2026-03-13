'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthStore, selectUser } from '@/store/auth'
import { getJobById } from '@/data/dummy_jobs'
import { SpecViewer } from '@/components/jobs/SpecViewer'
import { BidForm } from '@/components/bids/BidForm'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDistanceToNow } from 'date-fns'

const GIG_BADGE: Record<string, 'software' | 'copywriting' | 'data_entry' | 'translation'> = {
  SOFTWARE: 'software', COPYWRITING: 'copywriting', DATA_ENTRY: 'data_entry', TRANSLATION: 'translation',
}

export default function FreelancerJobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const job = getJobById(jobId)

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <EmptyState icon="🔍" title="Job not found" description="This job may have been removed or is no longer available." />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main spec */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={GIG_BADGE[job.gig_type] ?? 'default'}>{job.gig_type}</Badge>
              <Badge variant="muted">{job.gig_subtype?.replace(/_/g, ' ')}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>by {job.employer_name}</span>
              {job.employer_pfi != null && <span>PFI {job.employer_pfi} 🏆</span>}
              <span>Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-2">Job Description</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
          </div>

          {/* Spec */}
          {job.spec ? (
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Structured Spec</h2>
              <SpecViewer spec={job.spec} gigType={job.gig_type} gigSubtype={job.gig_subtype} />
            </div>
          ) : (
            <EmptyState icon="📋" title="Spec not yet generated" />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Budget & deadline */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Budget</div>
              <div className="text-2xl font-bold text-primary">
                ${job.budget_range.min.toLocaleString()} – ${job.budget_range.max.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Deadline</div>
              <div className="font-medium text-foreground">
                {new Date(job.deadline).toLocaleDateString()} ({formatDistanceToNow(new Date(job.deadline), { addSuffix: true })})
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Milestones</div>
              <div className="font-medium text-foreground">{job.spec?.milestones.length ?? '—'}</div>
            </div>
          </div>

          {/* Bid form */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Place Your Bid</h2>
            <BidForm jobId={job.job_id} />
          </div>
        </div>
      </div>
    </div>
  )
}
