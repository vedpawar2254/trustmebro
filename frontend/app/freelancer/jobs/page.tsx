'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, selectUser } from '@/store/auth'
import { useEffect } from 'react'
import { DUMMY_JOBS } from '@/data/dummy_jobs'
import { JobCard } from '@/components/jobs/JobCard'
import { JobFilters } from '@/components/jobs/JobFilters'
import { EmptyState } from '@/components/ui/empty-state'
import type { GigType } from '@/types'

interface Filters {
  keyword: string
  gig_type: GigType | ''
  min_budget: string
  max_budget: string
}

export default function FreelancerJobsPage() {
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const [filters, setFilters] = useState<Filters>({ keyword: '', gig_type: '', min_budget: '', max_budget: '' })

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  const jobs = useMemo(() => {
    return DUMMY_JOBS.filter(j => {
      if (j.status !== 'PUBLISHED') return false
      if (filters.gig_type && j.gig_type !== filters.gig_type) return false
      if (filters.keyword && !j.title.toLowerCase().includes(filters.keyword.toLowerCase()) &&
          !j.description.toLowerCase().includes(filters.keyword.toLowerCase())) return false
      if (filters.min_budget && j.budget_range.max < Number(filters.min_budget)) return false
      if (filters.max_budget && j.budget_range.min > Number(filters.max_budget)) return false
      return true
    })
  }, [filters])

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Browse Jobs</h1>
        <p className="text-muted-foreground mt-1">Find your next project — all specs are AI-structured and verifiable</p>
      </div>

      <div className="mb-6">
        <JobFilters onChange={setFilters} />
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No jobs match your filters"
          description="Try adjusting your search or clearing filters to see more results."
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">{jobs.length} job{jobs.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map(job => (
              <JobCard key={job.job_id} job={job} linkPrefix="/freelancer/jobs" />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
