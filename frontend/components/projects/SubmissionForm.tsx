'use client'

import { useState } from 'react'
import type { GigType, Milestone } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface SubmissionFormProps {
  gigType: GigType
  milestones: Milestone[]
  onSubmit?: (data: Record<string, unknown>) => void
}

export function SubmissionForm({ gigType, milestones, onSubmit }: SubmissionFormProps) {
  const [milestoneId, setMilestoneId] = useState(milestones[0]?.milestone_id ?? '')
  const [githubUrl, setGithubUrl] = useState('')
  const [textContent, setTextContent] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.({ milestone_id: milestoneId, github_url: githubUrl, text_content: textContent })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-lg p-6 text-center space-y-2">
        <div className="text-3xl">🚀</div>
        <div className="font-semibold text-foreground">Work Submitted!</div>
        <div className="text-sm text-muted-foreground">AI verification is running. You'll be notified when the report is ready.</div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="milestone">Milestone</Label>
        <select
          id="milestone"
          value={milestoneId}
          onChange={e => setMilestoneId(e.target.value)}
          className="mt-1 w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        >
          {milestones.map(m => (
            <option key={m.milestone_id} value={m.milestone_id}>{m.title}</option>
          ))}
        </select>
      </div>

      {gigType === 'SOFTWARE' && (
        <div>
          <Label htmlFor="github">GitHub Repository URL</Label>
          <Input
            id="github"
            type="url"
            value={githubUrl}
            onChange={e => setGithubUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            className="mt-1"
            required
          />
        </div>
      )}

      {gigType === 'COPYWRITING' && (
        <div>
          <Label htmlFor="content">Paste Your Content</Label>
          <Textarea
            id="content"
            value={textContent}
            onChange={e => setTextContent(e.target.value)}
            placeholder="Paste your written content here..."
            rows={8}
            className="mt-1"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">{textContent.split(/\s+/).filter(Boolean).length} words</p>
        </div>
      )}

      {gigType === 'DATA_ENTRY' && (
        <div>
          <Label>Upload CSV / XLSX File</Label>
          <div className="mt-1 border-2 border-dashed border-border rounded-lg p-8 text-center">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-sm text-muted-foreground">Drag & drop your file here, or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">CSV, XLSX up to 10MB</p>
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" />
          </div>
        </div>
      )}

      {gigType === 'TRANSLATION' && (
        <div className="space-y-3">
          <div>
            <Label>Source Document</Label>
            <div className="mt-1 border-2 border-dashed border-border rounded-lg p-5 text-center">
              <p className="text-sm text-muted-foreground">Upload original document</p>
              <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" />
            </div>
          </div>
          <div>
            <Label>Translated Document</Label>
            <div className="mt-1 border-2 border-dashed border-border rounded-lg p-5 text-center">
              <p className="text-sm text-muted-foreground">Upload translated document</p>
              <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" />
            </div>
          </div>
        </div>
      )}

      <Button type="submit" variant="primary" className="w-full">
        Submit for Verification
      </Button>
    </form>
  )
}
