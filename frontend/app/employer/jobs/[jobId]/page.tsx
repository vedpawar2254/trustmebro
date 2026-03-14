'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, selectUser, selectUserRole } from '@/store/auth'
import { getJobById } from '@/data/dummy_jobs'
import { getBidsForJob } from '@/data/dummy_bids'
import { BidCard } from '@/components/bids/BidCard'
import { SpecViewer } from '@/components/jobs/SpecViewer'
import type { Bid } from '@/types'

export default function EmployerJobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const role = useAuthStore(selectUserRole)
  const job = getJobById(jobId)
  const bids = getBidsForJob(jobId)
  const [acceptedBid, setAcceptedBid] = useState<Bid | null>(null)

  useEffect(() => {
    if (!user || role !== 'employer') router.push('/login')
  }, [user, role, router])

  if (!job) {
    return (
      <div className="dash-page items-center justify-center min-h-[50vh] text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-[#e2d9f3]">Protocol Not Found</h1>
        <p className="text-[#6b5a8a] text-sm mt-2">The requested job ID does not exist in the decentralized network.</p>
      </div>
    )
  }

  const handleAccept = (bid: Bid) => {
    setAcceptedBid(bid)
  }

  return (
    <div className="dash-page">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#4a3866] mb-2">
        <Link href="/employer/jobs" className="hover:text-[#7b6a96]">Protocol Registry</Link>
        <span>/</span>
        <span className="text-[#7c3aed]">{job.job_id}</span>
      </nav>

      <header className="dash-topbar">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="dash-badge info">Active Listing</span>
            <span className="dash-badge purple">{job.gig_type}</span>
          </div>
          <h1 className="dash-title">{job.title}</h1>
        </div>
        <div className="dash-topbar-right">
          <Link
            href={`/projects/${jobId}/chat`}
            className="flex items-center gap-2 px-5 py-2 bg-[#1d1233] border border-[#2d1f45] text-[#a78bfa] rounded-xl text-sm font-bold hover:bg-[#251840] transition-all"
          >
            💬 Open Secure Signal
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Status Message */}
          {acceptedBid ? (
            <div className="bg-[#16a34a10] border border-[#16a34a33] rounded-2xl p-6 animate-dashFadeIn relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#16a34a]"></div>
              <div className="font-bold text-[#4ade80] mb-1">✓ Assignment Ready</div>
              <div className="text-xs text-[#e2d9f3] mb-4">
                You've selected <span className="text-[#4ade80]">{acceptedBid.freelancer_name}</span>. Fund the escrow to lock specifications and begin execution.
              </div>
              <button className="px-6 py-2.5 bg-[#16a34a] text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-[#15803d] transition-all shadow-lg shadow-[#16a34a22]">
                Fund Escrow Layer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[#e2d9f3] font-bold flex items-center gap-2">
                  Bid Stream
                  <span className="dash-card-count">{bids.length}</span>
                </h2>
              </div>
              
              {bids.length === 0 ? (
                <div className="dash-card py-12 text-center text-[#6b5a8a] text-sm italic">
                  Waiting for network nodes to submit proposals...
                </div>
              ) : (
                <div className="space-y-3">
                  {bids.map(bid => (
                    <BidCard key={bid.bid_id} bid={bid} showAccept onAccept={handleAccept} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Specification */}
          <section className="space-y-4">
             <h2 className="text-[#e2d9f3] font-bold">Project Specification</h2>
             <div className="dash-card overflow-hidden">
                <div className="p-1">
                   {job.spec && <SpecViewer spec={job.spec} gigType={job.gig_type} gigSubtype={job.gig_subtype} />}
                </div>
             </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="dash-card p-6 space-y-6 bg-gradient-to-br from-[#1d1233] to-[#130d22]">
            <div>
              <div className="text-[10px] font-bold text-[#4a3866] uppercase tracking-widest mb-1">Capital Required</div>
              <div className="text-2xl font-black text-[#c4b5fd]">
                ${job.budget_range.max.toLocaleString()}
              </div>
            </div>

            <div className="h-px bg-[#2d1f45]" />

            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#6b5a8a]">Target Deadline</span>
                  <span className="text-xs font-bold text-[#e2d9f3]">{new Date(job.deadline).toLocaleDateString()}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#6b5a8a]">Milestones Injected</span>
                  <span className="text-xs font-bold text-[#e2d9f3]">{job.spec?.milestones.length ?? '—'}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#6b5a8a]">Signal Requests</span>
                  <span className="text-xs font-bold text-[#e2d9f3]">{bids.length} Proposals</span>
               </div>
            </div>

            <div className="pt-4">
               <div className="bg-[#7c3aed10] border border-[#7c3aed33] p-3 rounded-lg text-center">
                  <div className="text-[9px] font-black text-[#a78bfa] uppercase tracking-[0.2em] mb-1">AI Agent Active</div>
                  <div className="text-[10px] text-[#6b5a8a]">Mediation layer is monitoring all inputs</div>
               </div>
            </div>
          </div>

          <Link
            href="/employer/jobs"
            className="flex items-center justify-center gap-2 p-4 text-[10px] font-bold text-[#4a3866] uppercase tracking-widest hover:text-[#7b6a96] transition-colors"
          >
            ← Disconnect From Loop
          </Link>
        </div>
      </div>
    </div>
  )
}
