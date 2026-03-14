'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, selectUser, selectUserRole } from '@/store/auth'
import { jobService, submissionService, type Job, type Submission } from '@/lib/api/services'
import { VerificationReport } from '@/components/verification/VerificationReport'
import type { VerificationReport as VReport, GigType, GigSubtype } from '@/types'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function VerificationReportPage({ params }: { params: Promise<{ jobId: string; submissionId: string }> }) {
  const { jobId, submissionId } = use(params)
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const role = useAuthStore(selectUserRole)

  const [job, setJob] = useState<Job | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const [jobRes, submissionRes] = await Promise.all([
          jobService.getById(Number(jobId)),
          submissionService.getSubmission(Number(jobId), Number(submissionId)).catch(() => ({ success: false, data: null })),
        ])

        if (jobRes.success && jobRes.data) {
          setJob(jobRes.data)
        }

        if (submissionRes.success && submissionRes.data) {
          setSubmission(submissionRes.data)
        }
      } catch (err) {
        console.error('Failed to fetch verification data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, router, jobId, submissionId])

  if (!user) return null

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!job || !submission) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <EmptyState icon="🔍" title="Report not found" />
      </div>
    )
  }

  // Transform submission verification data to report format
  const verificationReport = submission.verification_report_json || {}
  const report: VReport = {
    milestone_id: submission.milestone_id,
    gig_type: (job.gig_type?.toUpperCase() || 'SOFTWARE') as GigType,
    gig_subtype: (job.gig_subtype?.toUpperCase() || 'WEB_DEVELOPMENT') as GigSubtype,
    overall_score: submission.ai_score || 0,
    payment_decision: submission.status === 'VERIFIED' || submission.status === 'verified'
      ? 'AUTO_RELEASE'
      : submission.status === 'PENDING' || submission.status === 'pending'
      ? 'HOLD'
      : 'DISPUTE',
    criteria: (verificationReport.criteria_results || []).map((c: any, i: number) => ({
      name: c.name || `Criterion ${i + 1}`,
      type: 'PRIMARY' as const,
      status: c.passed ? 'PASS' as const : 'FAIL' as const,
      detail: c.feedback || c.detail || '',
      weight: c.weight || 1 / (verificationReport.criteria_results?.length || 1),
    })),
    pfi_signals: verificationReport.pfi_signals || [],
    resubmissions_remaining: verificationReport.resubmissions_remaining ?? 2,
    feedback_for_freelancer: verificationReport.summary || verificationReport.feedback || 'Verification complete.',
    created_at: submission.reviewed_at || submission.submitted_at,
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link
          href={role === 'freelancer' ? `/freelancer/projects/${jobId}` : `/employer/jobs/${jobId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Project
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-3">Verification Report</h1>
        <p className="text-sm text-muted-foreground mt-1">{job.title}</p>
      </div>

      <VerificationReport
        report={report}
        isFreelancer={role === 'freelancer'}
        onResubmit={() => router.push(`/freelancer/projects/${jobId}`)}
      />
    </div>
  )
}
