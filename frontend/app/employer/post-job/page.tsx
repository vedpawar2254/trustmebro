'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, selectUser } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MilestoneCard } from '@/components/jobs/MilestoneCard'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { DUMMY_SPEC_SOFTWARE } from '@/data/dummy_spec'
import type { JobSpec } from '@/types'

type Step = 'describe' | 'review' | 'published'

export default function PostJobPage() {
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const [step, setStep] = useState<Step>('describe')
  const [isGenerating, setIsGenerating] = useState(false)
  const [spec, setSpec] = useState<JobSpec | null>(null)
  const [form, setForm] = useState({ title: '', description: '', budget_min: '', budget_max: '', deadline: '' })

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

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
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Job Published!</h1>
        <p className="text-muted-foreground mb-6">Your job is now live. Freelancers can see the structured spec and place bids.</p>
        <div className="flex gap-3 justify-center">
          <Button variant="primary" onClick={() => router.push('/employer/jobs')}>View My Jobs</Button>
          <Button variant="secondary" onClick={() => { setStep('describe'); setSpec(null); setForm({ title: '', description: '', budget_min: '', budget_max: '', deadline: '' }) }}>
            Post Another
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        <div className={`flex items-center gap-2 text-sm font-medium ${step === 'describe' ? 'text-primary' : 'text-success'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'describe' ? 'bg-primary text-white' : 'bg-success text-white'}`}>
            {step === 'describe' ? '1' : '✓'}
          </div>
          Describe Job
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className={`flex items-center gap-2 text-sm font-medium ${step === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'review' ? 'bg-primary text-white' : 'bg-border text-muted-foreground'}`}>
            2
          </div>
          Review AI Spec
        </div>
      </div>

      {step === 'describe' && (
        <form onSubmit={handleGenerate} className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Post a Job</h1>
            <p className="text-muted-foreground text-sm">Describe your project and AI will generate a structured, verifiable spec.</p>
          </div>

          <div>
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Build a React E-commerce Platform"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what you need in detail. Include tech stack, features, deliverables, and any specific requirements. The more detail you provide, the better the AI-generated spec will be."
              rows={8}
              className="mt-1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Budget Range ($)</Label>
              <div className="flex gap-2 mt-1">
                <Input type="number" value={form.budget_min} onChange={e => setForm({ ...form, budget_min: e.target.value })} placeholder="Min" required />
                <Input type="number" value={form.budget_max} onChange={e => setForm({ ...form, budget_max: e.target.value })} placeholder="Max" required />
              </div>
            </div>
            <div>
              <Label htmlFor="deadline">Project Deadline</Label>
              <Input id="deadline" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="mt-1" required />
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={isGenerating}>
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" /> Generating AI Spec...
              </span>
            ) : (
              '✨ Generate AI Spec'
            )}
          </Button>
        </form>
      )}

      {step === 'review' && spec && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Review AI-Generated Spec</h1>
            <p className="text-muted-foreground text-sm">Review and edit the spec before publishing. Resolve all flagged items first.</p>
          </div>

          {/* Gig type */}
          <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Detected Gig Type</div>
              <div className="flex items-center gap-2">
                <Badge variant="software">💻 Software</Badge>
                <Badge variant="muted">Web Development</Badge>
              </div>
            </div>
            <div className="ml-auto text-xs text-muted-foreground">AI confidence: high</div>
          </div>

          {/* Vague flag warning */}
          {vagueCount > 0 && (
            <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <span className="text-warning text-lg">⚠️</span>
              <div>
                <div className="font-semibold text-foreground text-sm">{vagueCount} item{vagueCount > 1 ? 's' : ''} flagged as too vague to verify</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  You must either define them specifically or accept they'll be PFI-only signals before publishing.
                </div>
              </div>
            </div>
          )}

          {/* Milestones */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Milestones ({spec.milestones.length})</h2>
            <div className="space-y-3">
              {spec.milestones.map((m, i) => (
                <MilestoneCard key={m.milestone_id} milestone={m} index={i} editable />
              ))}
            </div>
          </div>

          {/* Required assets */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Required Assets ({spec.required_assets.length})</h2>
            <div className="space-y-2">
              {spec.required_assets.map(a => (
                <div key={a.asset_id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg text-sm">
                  <span>📎</span>
                  <div>
                    <div className="font-medium text-foreground">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setStep('describe')}>← Back</Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handlePublish}
              disabled={vagueCount > 0}
            >
              {vagueCount > 0 ? `Resolve ${vagueCount} flag${vagueCount > 1 ? 's' : ''} to publish` : 'Publish Job →'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
