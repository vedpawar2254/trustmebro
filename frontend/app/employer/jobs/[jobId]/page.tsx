'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, selectUser } from '@/store/auth'
import { getJobById } from '@/data/dummy_jobs'
import { getBidsForJob } from '@/data/dummy_bids'
import { BidCard } from '@/components/bids/BidCard'
import { SpecViewer } from '@/components/jobs/SpecViewer'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import type { Bid } from '@/types'

export default function EmployerJobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const job = getJobById(jobId)
  const bids = getBidsForJob(jobId)
  const [acceptedBid, setAcceptedBid] = useState<Bid | null>(null)

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <EmptyState icon="🔍" title="Job not found" />
      </div>
    )
  }

  const handleAccept = (bid: Bid) => {
    setAcceptedBid(bid)
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default">{job.status}</Badge>
            <Badge variant="muted">{job.gig_type}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ${job.budget_range.min.toLocaleString()} – ${job.budget_range.max.toLocaleString()} · Due {new Date(job.deadline).toLocaleDateString()}
          </p>
        </div>
        {job.status === 'IN_PROGRESS' && (
          <Link
            href={`/projects/${jobId}/chat`}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            💬 Open Chat
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bids */}
        <div className="lg:col-span-2 space-y-5">
          {acceptedBid ? (
            <div className="bg-success/10 border border-success/30 rounded-lg p-5">
              <div className="font-semibold text-success mb-1">✅ Bid Accepted</div>
              <div className="text-sm text-foreground">
                You've selected <strong>{acceptedBid.freelancer_name}</strong>. Fund escrow to lock the spec and start the project.
              </div>
              <button className="mt-3 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">
                Fund Escrow → Lock Spec
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">
                Bids ({bids.length})
              </h2>
              {bids.length === 0 ? (
                <EmptyState icon="📬" title="No bids yet" description="Freelancers will start bidding once they discover your job." />
              ) : (
                <div className="space-y-3">
                  {bids.map(bid => (
                    <BidCard key={bid.bid_id} bid={bid} showAccept onAccept={handleAccept} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Spec */}
          {job.spec && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Job Spec</h2>
              <SpecViewer spec={job.spec} gigType={job.gig_type} gigSubtype={job.gig_subtype} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5 space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Budget</div>
              <div className="text-xl font-bold text-primary">
                ${job.budget_range.min.toLocaleString()} – ${job.budget_range.max.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Deadline</div>
              <div className="font-medium text-foreground">{new Date(job.deadline).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Milestones</div>
              <div className="font-medium text-foreground">{job.spec?.milestones.length ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Bids received</div>
              <div className="font-medium text-foreground">{bids.length}</div>
            </div>
          </div>

          <Link
            href="/employer/jobs"
            className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to My Jobs
          </Link>
        </div>
      </div>
    </div>
  )
}
