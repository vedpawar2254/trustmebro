'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, selectUser, selectUserRole } from '@/store/auth'
import { getJobById } from '@/data/dummy_jobs'
import { DUMMY_REPORT_HOLD, DUMMY_REPORT_PASS, DUMMY_REPORT_FAIL } from '@/data/dummy_verification'
import { VerificationReport } from '@/components/verification/VerificationReport'
import { EmptyState } from '@/components/ui/empty-state'

// Pick report based on submissionId for demo variety
const REPORTS: Record<string, typeof DUMMY_REPORT_PASS> = {
  'sub_pass': DUMMY_REPORT_PASS,
  'sub_hold': DUMMY_REPORT_HOLD,
  'sub_fail': DUMMY_REPORT_FAIL,
}

export default function VerificationReportPage({ params }: { params: Promise<{ jobId: string; submissionId: string }> }) {
  const { jobId, submissionId } = use(params)
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const role = useAuthStore(selectUserRole)
  const job = getJobById(jobId)

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  // Default to HOLD report for demo
  const report = REPORTS[submissionId] ?? DUMMY_REPORT_HOLD

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <EmptyState icon="🔍" title="Report not found" />
      </div>
    )
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

      {/* Demo links */}
      <div className="mt-8 p-4 bg-secondary border border-border rounded-lg">
        <p className="text-xs text-muted-foreground mb-2 font-medium">Demo: View different report outcomes</p>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/projects/${jobId}/verification/sub_pass`} className="text-xs text-success hover:underline">✅ Pass (94%)</Link>
          <Link href={`/projects/${jobId}/verification/sub_hold`} className="text-xs text-warning hover:underline">⏸️ Hold (72%)</Link>
          <Link href={`/projects/${jobId}/verification/sub_fail`} className="text-xs text-error hover:underline">❌ Fail (38%)</Link>
        </div>
      </div>
    </div>
  )
}
