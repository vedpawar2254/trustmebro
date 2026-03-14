'use client'

import { useState, useRef } from 'react'
import type { GigType, Milestone } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { uploadService } from '@/lib/api/services'

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
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [uploadedSourceFile, setUploadedSourceFile] = useState<string | null>(null)
  const [uploadedTranslatedFile, setUploadedTranslatedFile] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const sourceFileInputRef = useRef<HTMLInputElement>(null)
  const translatedFileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File, type: 'main' | 'source' | 'translated') => {
    setIsUploading(true)
    setError(null)

    try {
      const response = await uploadService.uploadFile(file, 'submission')

      if (response.success && response.data?.file_url) {
        if (type === 'main') {
          setUploadedFile(response.data.file_url)
        } else if (type === 'source') {
          setUploadedSourceFile(response.data.file_url)
        } else {
          setUploadedTranslatedFile(response.data.file_url)
        }
      } else {
        throw new Error('Upload failed')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate based on gig type
    if (gigType === 'SOFTWARE' && !githubUrl) {
      setError('Please provide a GitHub repository URL')
      return
    }

    if (gigType === 'COPYWRITING' && !textContent) {
      setError('Please paste your content')
      return
    }

    if (gigType === 'DATA_ENTRY' && !uploadedFile) {
      setError('Please upload your data file')
      return
    }

    if (gigType === 'TRANSLATION' && (!uploadedSourceFile || !uploadedTranslatedFile)) {
      setError('Please upload both source and translated documents')
      return
    }

    onSubmit?.({
      milestone_id: milestoneId,
      github_url: githubUrl,
      text_content: textContent,
      file_url: uploadedFile,
      source_document_url: uploadedSourceFile,
      translated_document_url: uploadedTranslatedFile,
    })
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
      {error && (
        <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
          {error}
        </div>
      )}

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
          <div
            className={`mt-1 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              uploadedFile ? 'border-success bg-success/5' : 'border-border hover:border-primary'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadedFile ? (
              <>
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm text-success font-medium">File uploaded successfully</p>
                <p className="text-xs text-muted-foreground mt-1">Click to replace</p>
              </>
            ) : isUploading ? (
              <>
                <div className="text-3xl mb-2">⏳</div>
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2">📊</div>
                <p className="text-sm text-muted-foreground">Drag & drop your file here, or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">CSV, XLSX up to 10MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, 'main')
              }}
            />
          </div>
        </div>
      )}

      {gigType === 'TRANSLATION' && (
        <div className="space-y-3">
          <div>
            <Label>Source Document</Label>
            <div
              className={`mt-1 border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                uploadedSourceFile ? 'border-success bg-success/5' : 'border-border hover:border-primary'
              }`}
              onClick={() => sourceFileInputRef.current?.click()}
            >
              {uploadedSourceFile ? (
                <p className="text-sm text-success font-medium">✅ Source document uploaded</p>
              ) : (
                <p className="text-sm text-muted-foreground">Upload original document</p>
              )}
              <input
                ref={sourceFileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, 'source')
                }}
              />
            </div>
          </div>
          <div>
            <Label>Translated Document</Label>
            <div
              className={`mt-1 border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                uploadedTranslatedFile ? 'border-success bg-success/5' : 'border-border hover:border-primary'
              }`}
              onClick={() => translatedFileInputRef.current?.click()}
            >
              {uploadedTranslatedFile ? (
                <p className="text-sm text-success font-medium">✅ Translated document uploaded</p>
              ) : (
                <p className="text-sm text-muted-foreground">Upload translated document</p>
              )}
              <input
                ref={translatedFileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, 'translated')
                }}
              />
            </div>
          </div>
        </div>
      )}

      <Button type="submit" variant="primary" className="w-full" disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Submit for Verification'}
      </Button>
    </form>
  )
}
