'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, selectUser } from '@/store/auth'
import { getJobById } from '@/data/dummy_jobs'
import { SpecViewer } from '@/components/jobs/SpecViewer'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'

export default function LockedSpecPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const job = getJobById(jobId)

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  if (!job?.spec) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <EmptyState icon="🔒" title="Spec not found" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="success">🔒 Locked Spec</Badge>
          <Badge variant="muted">Read-only</Badge>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          This spec is locked and cannot be changed. Any modifications require a formal Change Request.
        </p>
      </div>

      <div className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 text-sm text-warning font-medium mb-6">
        ⚠️ This spec is the binding agreement between employer and freelancer. Chat cannot override it.
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <SpecViewer spec={job.spec} gigType={job.gig_type} gigSubtype={job.gig_subtype} />
      </div>
    </div>
  )
}
