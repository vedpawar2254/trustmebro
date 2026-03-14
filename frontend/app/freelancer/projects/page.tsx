'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, selectUser, selectUserRole } from '@/store/auth'
import { dashboardService, type Job } from '@/lib/api/services'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { DashboardLayout } from '../dashboard/DashboardLayout'
import { formatDistanceToNow } from 'date-fns'

const STATUS_META: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'error' | 'muted' }> = {
  IN_PROGRESS:   { label: 'In Progress',   variant: 'info' },
  ESCROW_FUNDED: { label: 'Starting Soon', variant: 'warning' },
  COMPLETED:     { label: 'Completed',     variant: 'success' },
  DISPUTED:      { label: 'Disputed',      variant: 'error' },
  ASSIGNED:      { label: 'Assigned',      variant: 'warning' },
}

export default function FreelancerProjectsPage() {
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const role = useAuthStore(selectUserRole)

  const [projects, setProjects] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || role !== 'freelancer') {
      router.push('/login')
      return
    }

    const fetchProjects = async () => {
      try {
        setLoading(true)
        const response = await dashboardService.getFreelancerDashboard()

        if (response.success && response.data) {
          setProjects(response.data.active_projects || [])
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [user, role, router])

  if (!user || role !== 'freelancer') return null

  return (
    <DashboardLayout>
      <div className="px-8 py-6 border-b border-border bg-background">
        <h1 className="text-3xl font-bold text-foreground">My Projects</h1>
        <p className="text-muted-foreground mt-1">Track your active and completed work</p>
      </div>

      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-4xl mx-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              icon="📁"
              title="No active projects"
              description="Once an employer accepts your bid and funds escrow, your project will appear here."
              action={<Link href="/freelancer/jobs" className="text-primary text-sm font-medium hover:underline">Browse available jobs →</Link>}
            />
          ) : (
            <div className="space-y-3">
              {projects.map(job => {
                const meta = STATUS_META[job.status] ?? { label: job.status, variant: 'muted' as const }
                return (
                  <Link
                    key={job.id}
                    href={`/freelancer/projects/${job.id}`}
                    className="block bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-foreground">{job.title}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          Due {formatDistanceToNow(new Date(job.deadline), { addSuffix: true })}
                        </div>
                      </div>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      ${job.budget_min?.toLocaleString()} – ${job.budget_max?.toLocaleString()} · {job.gig_type}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  )
}
