'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, selectUser, selectUserRole } from '@/store/auth'
import { jobService, type Job, type JobSpec as APIJobSpec } from '@/lib/api/services'
import { SpecViewer } from '@/components/jobs/SpecViewer'
import type { JobSpec } from '@/types'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Badge } from '@/components/ui/badge'

export default function LockedSpecPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const role = useAuthStore(selectUserRole)

  const [job, setJob] = useState<Job | null>(null)
  const [spec, setSpec] = useState<JobSpec | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const [jobRes, specRes] = await Promise.all([
          jobService.getById(Number(jobId)),
          jobService.getSpec(Number(jobId)).catch(() => ({ success: false, data: null })),
        ])

        if (jobRes.success && jobRes.data) {
          setJob(jobRes.data)
        }

        if (specRes.success && specRes.data) {
          const apiSpec = specRes.data
          // Transform API spec to shared JobSpec type
          const transformedSpec: JobSpec = {
            spec_id: `spec_${apiSpec.id}`,
            job_id: `job_${apiSpec.job_id}`,
            version: 1,
            is_locked: apiSpec.is_locked || false,
            milestones: (apiSpec.milestones_json || []).map((m: any, idx: number) => ({
              milestone_id: m.id || m.milestone_id || `m_${idx}`,
              title: m.title,
              order: idx + 1,
              deadline: m.deadline || new Date().toISOString(),
              criteria: (m.deliverables || []).map((d: string, i: number) => ({
                criterion_id: `c_${idx}_${i}`,
                name: d,
                description: d,
                is_verifiable: true,
                status: 'PENDING' as const,
                is_vague: false,
                vague_resolved: true,
              })),
              submission_requirements: [{
                type: 'github_link' as const,
                description: 'Submit your code repository link',
              }],
            })),
            required_assets: [],
            clarifications: [],
          }
          setSpec(transformedSpec)
        }
      } catch (err) {
        console.error('Failed to fetch spec:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, router, jobId])

  if (!user) return null

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!job || !spec) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <EmptyState icon="🔒" title="Spec not found" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-4">
        <Link
          href={role === 'freelancer' ? `/freelancer/projects/${jobId}` : `/employer/jobs/${jobId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Project
        </Link>
      </div>

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
        This spec is the binding agreement between employer and freelancer. Chat cannot override it.
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <SpecViewer spec={spec} gigType={job.gig_type} gigSubtype={job.gig_subtype} />
      </div>
    </div>
  )
}
