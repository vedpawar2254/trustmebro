'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, selectUser, selectUserRole } from '@/store/auth'
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
  const role = useAuthStore(selectUserRole)
  const [filters, setFilters] = useState<Filters>({ keyword: '', gig_type: '', min_budget: '', max_budget: '' })

  useEffect(() => {
    if (!user || role !== 'freelancer') router.push('/login')
  }, [user, role, router])

  const filteredJobs = useMemo(() => {
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

  if (!user || role !== 'freelancer') return null

  return (
    <div className="dash-page">
      <header className="dash-topbar">
        <div>
          <p className="dash-greeting">Opportunity Hub</p>
          <h1 className="dash-title">Browse Jobs</h1>
        </div>
        <div className="dash-topbar-right">
          <div className="dash-notif-btn" title="Filter Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
          </div>
        </div>
      </header>

      <div className="bg-[#1d1233] border border-[#2d1f45] rounded-xl p-4">
        <JobFilters onChange={setFilters} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-[#e2d9f3] font-semibold flex items-center gap-2">
          Available Gigs
          <span className="dash-card-count">{filteredJobs.length}</span>
        </h2>
        <p className="text-[11px] text-[#4a3866] font-bold uppercase tracking-widest">
          Sorted by Newest
        </p>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="dash-card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-[#251840] border border-[#3d2a5c] rounded-2xl flex items-center justify-center text-3xl mb-4">
            🔍
          </div>
          <h3 className="text-[#e2d9f3] font-bold text-lg mb-2">No jobs match your search</h3>
          <p className="text-[#7b6a96] text-sm max-w-xs mx-auto">
            Try adjusting your filters or search keywords to find more opportunities.
          </p>
          <button 
            onClick={() => setFilters({ keyword: '', gig_type: '', min_budget: '', max_budget: '' })}
            className="mt-6 px-6 py-2 bg-[#7c3aed] text-white rounded-lg font-bold text-sm hover:bg-[#8b5cf6] transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map(job => (
            <JobCard key={job.job_id} job={job} linkPrefix="/freelancer/jobs" />
          ))}
        </div>
      )}
    </div>
  )
}
