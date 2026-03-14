'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, selectUser, selectUserRole } from '@/store/auth'
import { jobService, escrowService, type Job, type Bid } from '@/lib/api/services'
import { BidCard } from '@/components/bids/BidCard'
import { SpecViewer } from '@/components/jobs/SpecViewer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function EmployerJobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const role = useAuthStore(selectUserRole)

  const [job, setJob] = useState<Job | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [spec, setSpec] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [acceptedBid, setAcceptedBid] = useState<Bid | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isFunding, setIsFunding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fundAmount, setFundAmount] = useState('')
  const [showFundModal, setShowFundModal] = useState(false)

  useEffect(() => {
    if (!user || role !== 'employer') {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const [jobRes, bidsRes, specRes] = await Promise.all([
          jobService.getById(Number(jobId)),
          jobService.getBids(Number(jobId)).catch(() => ({ success: false, data: [] })),
          jobService.getSpec(Number(jobId)).catch(() => ({ success: false, data: null })),
        ])

        if (jobRes.success && jobRes.data) {
          setJob(jobRes.data)
        }

        if (bidsRes.success && bidsRes.data) {
          setBids(bidsRes.data)
        }

        if (specRes.success && specRes.data) {
          setSpec(specRes.data)
        }
      } catch (err) {
        console.error('Failed to fetch job:', err)
        setError('Failed to load job details')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, role, router, jobId])

  const handleAccept = async (bid: Bid) => {
    setIsAccepting(true)
    setError(null)

    try {
      const response = await jobService.assignFreelancer(Number(jobId), bid.id)

      if (response.success) {
        setAcceptedBid(bid)
        // Refresh job data
        const jobRes = await jobService.getById(Number(jobId))
        if (jobRes.success && jobRes.data) {
          setJob(jobRes.data)
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to accept bid')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleFundEscrow = async () => {
    if (!fundAmount || !acceptedBid) return

    setIsFunding(true)
    setError(null)

    try {
      const amount = parseFloat(fundAmount)
      const response = await escrowService.fund(Number(jobId), { amount })

      if (response.success) {
        // Refresh job data and redirect to project
        router.push(`/projects/${jobId}/chat`)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fund escrow')
    } finally {
      setIsFunding(false)
    }
  }

  if (!user || role !== 'employer') return null

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <EmptyState icon="🔍" title="Job not found" />
      </div>
    )
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
            ${job.budget_min?.toLocaleString()} – ${job.budget_max?.toLocaleString()} · Due {new Date(job.deadline).toLocaleDateString()}
          </p>
        </div>
        {(job.status === 'IN_PROGRESS' || job.status === 'ESCROW_FUNDED') && (
          <Link
            href={`/projects/${jobId}/chat`}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            💬 Open Chat
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bids */}
        <div className="lg:col-span-2 space-y-5">
          {acceptedBid || job.assigned_freelancer_id ? (
            <div className="bg-success/10 border border-success/30 rounded-lg p-5">
              <div className="font-semibold text-success mb-1">✅ Freelancer Assigned</div>
              <div className="text-sm text-foreground">
                You've selected <strong>{acceptedBid?.freelancer_name || job.assigned_freelancer_name}</strong>.
                {job.status === 'ASSIGNED' && ' Fund escrow to lock the spec and start the project.'}
              </div>

              {job.status === 'ASSIGNED' && (
                <div className="mt-4">
                  {showFundModal ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Escrow Amount ($)
                        </label>
                        <input
                          type="number"
                          value={fundAmount}
                          onChange={(e) => setFundAmount(e.target.value)}
                          placeholder={`Suggested: ${acceptedBid?.amount || job.budget_min}`}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          onClick={handleFundEscrow}
                          disabled={isFunding || !fundAmount}
                        >
                          {isFunding ? 'Funding...' : 'Fund Escrow & Start'}
                        </Button>
                        <Button variant="secondary" onClick={() => setShowFundModal(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="primary" onClick={() => setShowFundModal(true)}>
                      Fund Escrow → Lock Spec
                    </Button>
                  )}
                </div>
              )}
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
                    <BidCard
                      key={bid.id}
                      bid={{
                        bid_id: String(bid.id),
                        job_id: String(bid.job_id),
                        freelancer_id: String(bid.freelancer_id),
                        freelancer_name: bid.freelancer_name || 'Unknown',
                        freelancer_pfi: bid.freelancer_pfi || 90,
                        cover_letter: bid.message,
                        proposed_budget: bid.amount,
                        proposed_deadline: bid.estimated_days ? `${bid.estimated_days} days` : undefined,
                        status: bid.status as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN',
                        created_at: bid.created_at,
                      }}
                      showAccept={!isAccepting}
                      onAccept={() => handleAccept(bid)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Spec */}
          {spec && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Job Spec</h2>
              <SpecViewer spec={spec} gigType={job.gig_type} gigSubtype={job.gig_subtype} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5 space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Budget</div>
              <div className="text-xl font-bold text-primary">
                ${job.budget_min?.toLocaleString()} – ${job.budget_max?.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Deadline</div>
              <div className="font-medium text-foreground">{new Date(job.deadline).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Milestones</div>
              <div className="font-medium text-foreground">{spec?.milestones_json?.length ?? '—'}</div>
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
