'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, selectUser } from '@/store/auth'
import { getJobById } from '@/data/dummy_jobs'
import { MilestoneStepper } from '@/components/projects/MilestoneStepper'
import { EscrowWidget } from '@/components/projects/EscrowWidget'
import { SubmissionForm } from '@/components/projects/SubmissionForm'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import type { Escrow } from '@/types'

const MOCK_ESCROW: Escrow = {
  escrow_id: 'escrow_001',
  job_id: 'job_002',
  amount: 500,
  currency: 'USD',
  status: 'FUNDED',
  funded_at: '2024-03-16T09:00:00Z',
}

export default function FreelancerProjectDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const job = getJobById(jobId)
  const [showSubmit, setShowSubmit] = useState(false)

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  if (!job || !job.spec) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <EmptyState icon="📁" title="Project not found" />
      </div>
    )
  }

  const currentMilestone = job.spec.milestones[1] // milestone 2 is "current" for demo

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="info">In Progress</Badge>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: milestones + submission */}
        <div className="lg:col-span-2 space-y-5">
          {/* Current milestone */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Current Milestone</h2>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="font-semibold text-foreground">{currentMilestone.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{currentMilestone.criteria.length} criteria to meet</div>
              <div className="mt-3 space-y-1">
                {currentMilestone.criteria.slice(0, 3).map(c => (
                  <div key={c.criterion_id} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="text-primary">•</span> {c.name}
                  </div>
                ))}
                {currentMilestone.criteria.length > 3 && (
                  <div className="text-xs text-muted-foreground">+{currentMilestone.criteria.length - 3} more</div>
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
                <SubmissionForm gigType={job.gig_type} milestones={job.spec!.milestones} />
              </div>
            )}
          </div>

          {/* Spec clarifications */}
          {job.spec.clarifications.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Spec Clarifications</h2>
              {job.spec.clarifications.map(cl => (
                <div key={cl.clarification_id} className="p-3 bg-info/5 border border-info/20 rounded-lg">
                  <div className="text-xs text-muted-foreground">Q: {cl.question}</div>
                  <div className="text-sm font-medium text-foreground mt-1">A: {cl.answer}</div>
                  <div className="text-xs text-muted-foreground mt-1">Binding · {new Date(cl.answered_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <EscrowWidget escrow={MOCK_ESCROW} />

          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Milestone Progress</h2>
            <MilestoneStepper
              milestones={job.spec.milestones}
              currentMilestoneId={currentMilestone.milestone_id}
              completedMilestoneIds={[job.spec.milestones[0].milestone_id]}
            />
          </div>

          <Link
            href={`/projects/${jobId}/spec`}
            className="block text-center text-sm text-primary border border-primary rounded-lg py-2 hover:bg-primary hover:text-white transition-colors"
          >
            View Locked Spec
          </Link>
        </div>
      </div>
    </div>
  )
}
