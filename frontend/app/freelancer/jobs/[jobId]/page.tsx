'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, selectUser, selectUserRole } from '@/store/auth'
import { getJobById } from '@/data/dummy_jobs'
import { SpecViewer } from '@/components/jobs/SpecViewer'
import { BidForm } from '@/components/bids/BidForm'
import { GigTypeBadge } from '@/components/jobs/GigTypeBadge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export default function FreelancerJobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const role = useAuthStore(selectUserRole)
  const job = getJobById(jobId)

  useEffect(() => {
    if (!user || role !== 'freelancer') router.push('/login')
  }, [user, role, router])

  if (!user || role !== 'freelancer') return null

  if (!job) {
    return (
      <div className="dash-page flex flex-col items-center justify-center py-20">
        <EmptyState icon="🔍" title="Job not found" description="This job may have been removed or is no longer available." />
        <Link href="/freelancer/jobs" className="mt-6 text-[#7c3aed] font-bold hover:underline">
          ← Back to browsing
        </Link>
      </div>
    )
  }

  return (
    <div className="dash-page">
      {/* Breadcrumbs / Back button */}
      <div className="flex items-center gap-2 mb-2">
        <Link href="/freelancer/jobs" className="text-xs text-[#6b5a8a] hover:text-[#a78bfa] flex items-center gap-1 transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Browse Jobs
        </Link>
        <span className="text-[#2d1f45] text-xs">/</span>
        <span className="text-xs text-[#4a3866] font-bold uppercase truncate max-w-[200px]">{job.title}</span>
      </div>

      <header className="dash-topbar">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="dash-title truncate">{job.title}</h1>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#6b5a8a]">by {job.employer_name}</span>
              <div className="flex items-center gap-1 bg-[#1d1233] border border-[#2d1f45] px-1.5 py-0.5 rounded text-[10px]">
                <span className="text-[#6b5a8a]">PFI</span>
                <span className="text-[#a78bfa] font-bold">{job.employer_pfi ?? '--'}</span>
              </div>
            </div>
            <span className="text-[#2d1f45]">•</span>
            <span className="text-[#6b5a8a]">Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
          </div>
        </div>
        <div className="flex shrink-0">
          <GigTypeBadge gigType={job.gig_type} gigSubtype={job.gig_subtype} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <section className="dash-card">
            <div className="dash-card-header">
              <span className="dash-card-title">Job Description</span>
              <span className="text-[10px] text-[#4a3866] font-bold uppercase tracking-widest">Client Brief</span>
            </div>
            <p className="text-sm text-[#7b6a96] leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </section>

          {/* Structured Spec */}
          <section className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-title-group">
                <span className="dash-card-title">Structured Specification</span>
                {job.spec?.is_locked && <span className="dash-card-count">🔒 LOCKED</span>}
              </div>
              <p className="text-[10px] text-[#4a3866] font-bold uppercase tracking-widest">
                v{job.spec?.version ?? '1.0'}
              </p>
            </div>
            
            {job.spec ? (
              <SpecViewer spec={job.spec} gigType={job.gig_type} gigSubtype={job.gig_subtype} />
            ) : (
              <div className="py-10 text-center">
                <div className="text-2xl mb-2">📋</div>
                <p className="text-xs text-[#6b5a8a]">Spec documentation is still being processed.</p>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Gig Stats */}
          <div className="dash-card space-y-5 bg-gradient-to-br from-[#1d1233] to-[#130d22]">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-[#4a3866] font-bold">BUDGET RANGE</span>
              <div className="text-2xl font-bold text-[#c4b5fd] tracking-tight">
                ${job.budget_range.min.toLocaleString()} – ${job.budget_range.max.toLocaleString()}
              </div>
              <p className="text-[10px] text-[#6b5a8a]">Escrow protection enabled</p>
            </div>
            
            <div className="h-px bg-[#2d1f45]" />

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6b5a8a]">Bid Deadline</span>
                <span className="text-[#e2d9f3] font-medium">{formatDistanceToNow(new Date(job.deadline), { addSuffix: true })}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6b5a8a]">Milestones</span>
                <span className="text-[#e2d9f3] font-medium">{job.spec?.milestones.length ?? '—'} stages</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6b5a8a]">Project Duration</span>
                <span className="text-[#e2d9f3] font-medium">Estimated 2 weeks</span>
              </div>
            </div>

            <button className="w-full py-3 bg-[#7c3aed] text-white rounded-xl font-bold text-sm hover:bg-[#8b5cf6] hover:shadow-[0_0_15px_#7c3aed44] transition-all">
              Submit Proposal
            </button>
          </div>

          {/* Quick Actions / Bid Form */}
          <div className="dash-card">
            <h3 className="dash-card-title mb-4">Interested?</h3>
            <BidForm jobId={job.job_id} />
          </div>

          {/* Verification info */}
          <div className="p-4 rounded-xl border border-[#2d1f45] bg-[#1a1030] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded bg-[#4ade8022] flex items-center justify-center text-[10px]">🤖</div>
              <span className="text-[10px] font-bold text-[#4ade80] uppercase tracking-wider">AI Guard Active</span>
            </div>
            <p className="text-[11px] text-[#6b5a8a] leading-tight">
              All milestones will be automatically verified against the structured spec using decentralized oracles.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
