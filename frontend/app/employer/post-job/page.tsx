'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, selectUser, selectUserRole } from '@/store/auth'
import { MilestoneCard } from '@/components/jobs/MilestoneCard'
import { DUMMY_SPEC_SOFTWARE } from '@/data/dummy_spec'
import type { JobSpec } from '@/types'
import Link from 'next/link'

type Step = 'describe' | 'review' | 'published'

export default function PostJobPage() {
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const role = useAuthStore(selectUserRole)
  const [step, setStep] = useState<Step>('describe')
  const [isGenerating, setIsGenerating] = useState(false)
  const [spec, setSpec] = useState<JobSpec | null>(null)
  const [form, setForm] = useState({ title: '', description: '', budget_min: '', budget_max: '', deadline: '' })

  useEffect(() => {
    if (!user || role !== 'employer') router.push('/login')
  }, [user, role, router])

  if (!user || role !== 'employer') return null

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    // Simulate AI generation delay
    await new Promise(r => setTimeout(r, 2000))
    setSpec(DUMMY_SPEC_SOFTWARE)
    setIsGenerating(false)
    setStep('review')
  }

  const vagueCount = spec?.milestones.flatMap(m => m.criteria).filter(c => c.is_vague && !c.vague_resolved).length ?? 0

  const handlePublish = () => {
    setStep('published')
  }

  if (step === 'published') {
    return (
      <div className="dash-page items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-[#16a34a22] border border-[#16a34a44] rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-[0_0_30px_#16a34a22] animate-dashFadeIn">
          🚀
        </div>
        <h1 className="text-3xl font-black text-white mb-3">Protocol Initialized</h1>
        <p className="text-[#7b6a96] max-w-sm mx-auto mb-10 leading-relaxed">
          Your project specification is now live on the trustmebro network. AI mediators are ready to monitor incoming proposals.
        </p>
        <div className="flex gap-4">
          <Link href="/employer/jobs" className="px-8 py-3 bg-[#7c3aed] text-white rounded-xl font-bold text-sm hover:bg-[#8b5cf6] hover:shadow-[0_0_20px_#7c3aed44] transition-all">
            Monitor My Jobs
          </Link>
          <button 
            onClick={() => { setStep('describe'); setSpec(null); setForm({ title: '', description: '', budget_min: '', budget_max: '', deadline: '' }) }}
            className="px-8 py-3 bg-[#1d1233] border border-[#2d1f45] text-[#a78bfa] rounded-xl font-bold text-sm hover:bg-[#251840] transition-all"
          >
            Post Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dash-page">
      <header className="dash-topbar">
        <div>
          <p className="dash-greeting">New Specification</p>
          <h1 className="dash-title">Initiate Project</h1>
        </div>
      </header>

      {/* Step indicator */}
      <div className="flex items-center gap-6 px-4">
        <div className={`flex items-center gap-3 text-xs font-bold uppercase tracking-widest ${step === 'describe' ? 'text-[#a78bfa]' : 'text-[#4ade80]'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${step === 'describe' ? 'bg-[#7c3aed] text-white shadow-[0_0_15px_#7c3aed44]' : 'bg-[#16a34a22] text-[#4ade80] border border-[#16a34a33]'}`}>
            {step === 'describe' ? '01' : '✓'}
          </div>
          Description
        </div>
        <div className="flex-1 h-px bg-[#2d1f45]" />
        <div className={`flex items-center gap-3 text-xs font-bold uppercase tracking-widest ${step === 'review' ? 'text-[#a78bfa]' : 'text-[#4a3866]'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${step === 'review' ? 'bg-[#7c3aed] text-white' : 'bg-[#130d22] text-[#4a3866] border-[#2d1f45]'}`}>
            02
          </div>
          AI Analysis
        </div>
      </div>

      {step === 'describe' && (
        <form onSubmit={handleGenerate} className="dash-card p-8 space-y-8 animate-dashFadeIn">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#4a3866] uppercase tracking-[0.2em] ml-1">Core Objective</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Build a High-Performance NFT Marketplace"
              className="w-full bg-[#100820] border border-[#2d1f45] rounded-xl px-5 py-4 text-base text-white outline-none focus:border-[#7c3aed66] transition-all placeholder:text-[#2d1f45]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#4a3866] uppercase tracking-[0.2em] ml-1">Technical Requirements & Context</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Provide a detailed brief. Our AI will extract milestones, deliverables, and verifiable criteria automatically."
              rows={6}
              className="w-full bg-[#100820] border border-[#2d1f45] rounded-xl px-5 py-4 text-sm text-white outline-none focus:border-[#7c3aed66] transition-all placeholder:text-[#2d1f45] resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#4a3866] uppercase tracking-[0.2em] ml-1">Capital Allocation (USD)</label>
              <div className="flex gap-4 items-center">
                <input 
                  type="number" 
                  value={form.budget_min} 
                  onChange={e => setForm({ ...form, budget_min: e.target.value })} 
                  placeholder="Min" 
                  className="w-full bg-[#100820] border border-[#2d1f45] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#7c3aed66] transition-all"
                  required 
                />
                <span className="text-[#4a3866]">to</span>
                <input 
                  type="number" 
                  value={form.budget_max} 
                  onChange={e => setForm({ ...form, budget_max: e.target.value })} 
                  placeholder="Max" 
                  className="w-full bg-[#100820] border border-[#2d1f45] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#7c3aed66] transition-all"
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#4a3866] uppercase tracking-[0.2em] ml-1">Target Deadline</label>
              <input 
                type="date" 
                value={form.deadline} 
                onChange={e => setForm({ ...form, deadline: e.target.value })} 
                className="w-full bg-[#100820] border border-[#2d1f45] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#7c3aed66] transition-all"
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isGenerating}
            className="w-full py-5 bg-[#7c3aed] text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#8b5cf6] hover:shadow-[0_0_20px_#7c3aed44] transition-all disabled:opacity-50"
          >
            {isGenerating ? 'Synthesizing Contract Specs...' : 'Generate AI Specification'}
          </button>
        </form>
      )}

      {step === 'review' && spec && (
        <div className="space-y-8 animate-dashFadeIn">
          <div className="dash-card p-6 bg-gradient-to-r from-[#1d1233] to-[#130d22] border-[#7c3aed33]">
            <h2 className="text-[#e2d9f3] font-bold mb-1">Spec Analysis Complete</h2>
            <p className="text-xs text-[#6b5a8a]">Review the extracted milestones and resolve any vague flags before publishing.</p>
          </div>

          <div className="space-y-1.5 px-1">
             <label className="text-[10px] font-bold text-[#4a3866] uppercase tracking-[0.2em]">Live Milestones</label>
             <div className="space-y-4">
               {spec.milestones.map((m, i) => (
                 <MilestoneCard key={m.milestone_id} milestone={m} index={i} />
               ))}
             </div>
          </div>

          {vagueCount > 0 && (
            <div className="p-4 bg-[#f59e0b10] border border-[#f59e0b33] rounded-xl flex items-start gap-4">
              <span className="text-xl">⚠️</span>
              <div>
                <div className="text-xs font-bold text-[#fbbf24] uppercase tracking-widest mb-1">Indefinite Criteria Detected</div>
                <p className="text-[11px] text-[#7b6a96] leading-relaxed">
                  {vagueCount} items were flagged as too subjective for automated verification. Consider adding specific quantitative metrics to ensure 100% autonomous payment.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
             <button 
               onClick={() => setStep('describe')}
               className="px-8 py-4 bg-[#1d1233] border border-[#2d1f45] text-[#7b6a96] rounded-xl font-bold text-sm hover:text-[#e2d9f3] transition-all"
             >
               Discard & Rewrite
             </button>
             <button 
               onClick={handlePublish}
               className="flex-1 py-4 bg-[#16a34a] text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#15803d] hover:shadow-[0_0_20px_#16a34a44] transition-all"
             >
               Commit & Publish Protocol
             </button>
          </div>
        </div>
      )}
    </div>
  )
}
