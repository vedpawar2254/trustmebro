'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, selectUser, selectUserRole } from '@/store/auth'
import { jobService, escrowService, submissionService, type Job, type Escrow, type Submission } from '@/lib/api/services'
import { MilestoneStepper } from '@/components/projects/MilestoneStepper'
import { EscrowWidget } from '@/components/projects/EscrowWidget'
import { SubmissionForm } from '@/components/projects/SubmissionForm'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function FreelancerProjectDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const role = useAuthStore(selectUserRole)

  const [job, setJob] = useState<Job | null>(null)
  const [spec, setSpec] = useState<any>(null)
  const [escrow, setEscrow] = useState<Escrow | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [showSubmit, setShowSubmit] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const [jobRes, specRes, escrowRes, submissionsRes] = await Promise.all([
          jobService.getById(Number(jobId)),
          jobService.getSpec(Number(jobId)).catch(() => ({ success: false, data: null })),
          escrowService.getStatus(Number(jobId)).catch(() => ({ success: false, data: null })),
          submissionService.getSubmissions(Number(jobId)).catch(() => ({ success: false, data: [] })),
        ])

        if (jobRes.success && jobRes.data) {
          setJob(jobRes.data)
        }

        if (specRes.success && specRes.data) {
          setSpec(specRes.data)
        }

        if (escrowRes.success && escrowRes.data) {
          setEscrow(escrowRes.data)
        }

        if (submissionsRes.success && submissionsRes.data) {
          setSubmissions(submissionsRes.data)
        }
      } catch (err) {
        console.error('Failed to fetch project:', err)
        setError('Failed to load project details')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, router, jobId])

  const handleSubmission = async (data: Record<string, unknown>) => {
    try {
      const response = await submissionService.submit(Number(jobId), {
        milestone_id: data.milestone_id as string,
        file_url: data.github_url as string || data.file_url as string,
        notes: data.text_content as string || data.notes as string,
      })

      if (response.success) {
        // Refresh submissions
        const submissionsRes = await submissionService.getSubmissions(Number(jobId))
        if (submissionsRes.success && submissionsRes.data) {
          setSubmissions(submissionsRes.data)
        }
        setShowSubmit(false)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit work')
    }
  }

  if (!user) return null

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
        <EmptyState icon="📁" title="Project not found" />
      </div>
    )
  }

  // Transform milestones from spec
  const milestones = spec?.milestones_json || []
  const completedMilestoneIds = submissions
    .filter(s => s.status === 'VERIFIED' || s.status === 'verified')
    .map(s => s.milestone_id)

  // Find current milestone (first non-completed one)
  const currentMilestoneIndex = milestones.findIndex((m: any) =>
    !completedMilestoneIds.includes(m.id || m.milestone_id)
  )
  const currentMilestone = milestones[currentMilestoneIndex >= 0 ? currentMilestoneIndex : 0]

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="info">{job.status.replace(/_/g, ' ')}</Badge>
            <Badge variant="muted">{job.gig_type}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">with {job.employer_name}</p>
        </div>
        <Link
          href={`/projects/${jobId}/chat`}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          💬 Open Chat
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: milestones + submission */}
        <div className="lg:col-span-2 space-y-5">
          {/* Current milestone */}
          {currentMilestone && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Current Milestone</h2>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="font-semibold text-foreground">{currentMilestone.title}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {currentMilestone.deliverables?.length || 0} deliverables to complete
                </div>
                <div className="mt-3 space-y-1">
                  {(currentMilestone.deliverables || []).slice(0, 3).map((d: string, i: number) => (
                    <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="text-primary">•</span> {d}
                    </div>
                  ))}
                  {(currentMilestone.deliverables?.length || 0) > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{currentMilestone.deliverables.length - 3} more
                    </div>
                  )}
                </div>
              </div>

              {!showSubmit ? (
                <button
                  onClick={() => setShowSubmit(true)}
                  className="mt-4 w-full bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors"
                >
                  Submit Work for This Milestone
                </button>
              ) : (
                <div className="mt-4">
                  <SubmissionForm
                    gigType={job.gig_type as any}
                    milestones={milestones.map((m: any) => ({
                      milestone_id: m.id || m.milestone_id || `m_${milestones.indexOf(m)}`,
                      title: m.title,
                      order: m.order || milestones.indexOf(m) + 1,
                      description: m.description || '',
                      criteria: (m.deliverables || []).map((d: string, i: number) => ({
                        criterion_id: `c_${i}`,
                        name: d,
                        description: d,
                        verification_method: 'ai',
                        is_vague: false,
                        vague_resolved: true,
                      })),
                    }))}
                    onSubmit={handleSubmission}
                  />
                </div>
              )}
            </div>
          )}

          {/* Recent Submissions */}
          {submissions.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Recent Submissions</h2>
              <div className="space-y-3">
                {submissions.slice(0, 3).map((sub) => (
                  <div key={sub.id} className="p-3 bg-background border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-foreground text-sm">
                        Milestone: {sub.milestone_id}
                      </div>
                      <Badge
                        variant={
                          sub.status === 'VERIFIED' || sub.status === 'verified'
                            ? 'success'
                            : sub.status === 'PENDING' || sub.status === 'pending'
                            ? 'warning'
                            : 'error'
                        }
                      >
                        {sub.status}
                      </Badge>
                    </div>
                    {sub.ai_score !== undefined && (
                      <div className="text-xs text-muted-foreground mt-1">
                        AI Score: {sub.ai_score}/100
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Submitted {new Date(sub.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {escrow && (
            <EscrowWidget
              escrow={{
                escrow_id: String(escrow.id),
                job_id: String(escrow.job_id),
                amount: escrow.amount,
                currency: 'USD',
                status: escrow.status as 'FUNDED' | 'HELD' | 'RELEASED' | 'REFUNDED',
                funded_at: escrow.funded_at,
              }}
            />
          )}

          {milestones.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Milestone Progress</h2>
              <MilestoneStepper
                milestones={milestones.map((m: any, i: number) => ({
                  milestone_id: m.id || m.milestone_id || `m_${i}`,
                  title: m.title,
                  order: m.order || i + 1,
                  description: m.description || '',
                  criteria: [],
                }))}
                currentMilestoneId={currentMilestone?.id || currentMilestone?.milestone_id}
                completedMilestoneIds={completedMilestoneIds}
              />
            </div>
          )}

          <Link
            href={`/projects/${jobId}/spec`}
            className="block text-center text-sm text-primary border border-primary rounded-lg py-2 hover:bg-primary hover:text-white transition-colors"
          >
            View Locked Spec
          </Link>

          <Link
            href="/freelancer/projects"
            className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to My Projects
          </Link>
        </div>
      </div>
    </div>
  )
}
