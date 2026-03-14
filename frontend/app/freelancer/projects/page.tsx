'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, selectUser, selectUserRole } from '@/store/auth'
import { DUMMY_JOBS } from '@/data/dummy_jobs'
import { formatDistanceToNow } from 'date-fns'

const STATUS_STYLING: Record<string, { label: string; class: string }> = {
  IN_PROGRESS:   { label: 'In Progress',   class: 'info' },
  ESCROW_FUNDED: { label: 'Deposit Paid', class: 'warn' },
  COMPLETED:     { label: 'Completed',     class: 'success' },
  DISPUTED:      { label: 'Disputed',      class: 'error' },
}

export default function FreelancerProjectsPage() {
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const role = useAuthStore(selectUserRole)

  useEffect(() => {
    if (!user || role !== 'freelancer') router.push('/login')
  }, [user, role, router])

  if (!user || role !== 'freelancer') return null

  // Show jobs that are active (not just published)
  const activeJobs = DUMMY_JOBS.filter(j => ['IN_PROGRESS', 'ESCROW_FUNDED', 'COMPLETED', 'DISPUTED'].includes(j.status))

  return (
    <div className="dash-page">
      <header className="dash-topbar">
        <div>
          <p className="dash-greeting">Your Deliverables</p>
          <h1 className="dash-title">My Projects</h1>
        </div>
        <div className="dash-topbar-right">
          <div className="dash-notif-btn" title="Archive">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
            </svg>
          </div>
        </div>
      </header>

      {activeJobs.length === 0 ? (
        <div className="dash-card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-[#251840] border border-[#3d2a5c] rounded-2xl flex items-center justify-center text-3xl mb-4">
            📁
          </div>
          <h3 className="text-[#e2d9f3] font-bold text-lg mb-2">No active projects</h3>
          <p className="text-[#7b6a96] text-sm max-w-xs mx-auto mb-6">
            Once an employer accepts your bid and funds escrow, your project will appear here.
          </p>
          <Link 
            href="/freelancer/jobs"
            className="px-6 py-2 bg-[#7c3aed] text-white rounded-lg font-bold text-sm hover:bg-[#8b5cf6] transition-colors"
          >
            Browse for Gigs
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[#e2d9f3] font-semibold flex items-center gap-2">
              Active Contracts
              <span className="dash-card-count">{activeJobs.length}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {activeJobs.map(job => {
              const style = STATUS_STYLING[job.status] ?? { label: job.status, class: 'info' }
              return (
                <Link
                  key={job.job_id}
                  href={`/freelancer/projects/${job.job_id}`}
                  className="dash-card flex items-center justify-between hover:border-[#7c3aed66] transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-[#e2d9f3] group-hover:text-[#c4b5fd] transition-colors truncate">
                        {job.title}
                      </h3>
                      <span className={`dash-badge ${style.class}`}>{style.label}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-[11px] text-[#6b5a8a]">
                      <div className="flex items-center gap-1.5">
                        <span className="opacity-50">📋</span>
                        {job.spec?.milestones.length ?? 0} Milestones
                      </div>
                      <span className="text-[#2d1f45]">•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="opacity-50">⏰</span>
                        Due {formatDistanceToNow(new Date(job.deadline), { addSuffix: true })}
                      </div>
                      <span className="text-[#2d1f45]">•</span>
                      <div className="font-bold text-[#4a3866] uppercase tracking-wider">
                        {job.gig_type}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] text-[#4a3866] font-bold uppercase tracking-widest leading-none mb-1">CONTRACT</div>
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
