'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, selectUser, selectUserRole } from '@/store/auth'
import { DUMMY_JOBS } from '@/data/dummy_jobs'
import { formatDistanceToNow } from 'date-fns'

const STATUS_META: Record<string, { label: string; class: string }> = {
  DRAFT:         { label: 'Draft',        class: 'info' },
  PUBLISHED:     { label: 'Published',    class: 'info' },
  ASSIGNED:      { label: 'Assigned',     class: 'cyan' },
  ESCROW_FUNDED: { label: 'Funded',       class: 'warn' },
  IN_PROGRESS:   { label: 'Active',       class: 'cyan' },
  COMPLETED:     { label: 'Closed',       class: 'success' },
  DISPUTED:      { label: 'Disputed',     class: 'error' },
}

export default function EmployerJobsPage() {
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const role = useAuthStore(selectUserRole)

  useEffect(() => {
    if (!user || role !== 'employer') router.push('/login')
  }, [user, role, router])

  if (!user || role !== 'employer') return null

  // Show all jobs for demo
  const jobs = DUMMY_JOBS.filter(j => j.employer_id === 'user_emp_1')

  return (
    <div className="dash-page">
      <header className="dash-topbar">
        <div>
          <p className="dash-greeting">Project Portfolio</p>
          <h1 className="dash-title">My Jobs</h1>
        </div>
        <div className="dash-topbar-right">
          <Link href="/employer/post-job" className="px-6 py-2.5 bg-[#7c3aed] text-white rounded-xl font-bold text-sm hover:bg-[#8b5cf6] transition-all">
            + New Listing
          </Link>
        </div>
      </header>

      {jobs.length === 0 ? (
        <div className="dash-card flex flex-col items-center justify-center py-20 text-center">
           <div className="text-4xl mb-4">📋</div>
           <h3 className="text-[#e2d9f3] font-bold text-lg mb-2">No jobs listed yet</h3>
           <p className="text-[#6b5a8a] text-sm max-w-sm mb-6">Initialize your first project specification and start receiving bids from verified freelancers.</p>
           <Link href="/employer/post-job" className="px-6 py-3 bg-[#1d1233] border border-[#2d1f45] text-[#a78bfa] rounded-xl font-bold hover:bg-[#251840] transition-all">
              Initiate Project Spec
           </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[#e2d9f3] font-semibold flex items-center gap-2">
              Active Listings
              <span className="dash-card-count">{jobs.length}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {jobs.map(job => {
              const meta = STATUS_META[job.status] ?? { label: job.status, class: 'info' }
              return (
                <Link
                  key={job.job_id}
                  href={`/employer/jobs/${job.job_id}`}
                  className="dash-card flex items-center justify-between hover:border-[#7c3aed66] transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-[#e2d9f3] group-hover:text-[#c4b5fd] transition-colors truncate">
                        {job.title}
                      </h3>
                      <span className={`dash-badge ${meta.class}`}>{meta.label}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-[11px] text-[#6b5a8a]">
                      <div className="flex items-center gap-1.5 uppercase tracking-wide font-bold text-[#4a3866]">
                        {job.gig_type}
                      </div>
                      <span className="text-[#2d1f45]">•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="opacity-50">📋</span>
                        {job.spec?.milestones.length ?? 0} Milestones
                      </div>
                      <span className="text-[#2d1f45]">•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="opacity-50">⏰</span>
                        Expired {formatDistanceToNow(new Date(job.deadline), { addSuffix: true })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] text-[#4a3866] font-bold uppercase tracking-widest leading-none mb-1">CAPITAL</div>
                      <div className="text-sm font-bold text-[#c4b5fd]">${job.budget_range.max.toLocaleString()}</div>
                    </div>
                    <div className="text-[#4a3866] group-hover:text-[#7c3aed] transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
