'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, selectUser, selectUserRole } from '@/store/auth'
import { getJobById } from '@/data/dummy_jobs'
import { DUMMY_CHAT_MESSAGES } from '@/data/dummy_chat'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { AIInterceptBanner } from '@/components/chat/AIInterceptBanner'
import { EmptyState } from '@/components/ui/empty-state'
import type { ChatMessage } from '@/types'

export default function ChatPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const router = useRouter()
  const user = useAuthStore(selectUser)
  const role = useAuthStore(selectUserRole)
  const job = getJobById(jobId)
  const [messages, setMessages] = useState<ChatMessage[]>(DUMMY_CHAT_MESSAGES)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    const msg: ChatMessage = {
      message_id: `msg_${Date.now()}`,
      channel_id: 'channel_001',
      sender: role === 'employer' ? 'employer' : 'freelancer',
      content: input.trim(),
      timestamp: new Date().toISOString(),
      type: 'normal',
    }
    setMessages(prev => [...prev, msg])
    setInput('')
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <EmptyState icon="💬" title="Chat not found" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-3 flex items-center gap-4 shrink-0">
        <Link href={role === 'freelancer' ? `/freelancer/projects/${jobId}` : `/employer/jobs/${jobId}`}
          className="text-muted-foreground hover:text-foreground text-sm">←</Link>
        <div className="flex-1">
          <div className="font-semibold text-foreground text-sm">{job.title}</div>
          <div className="text-xs text-muted-foreground">Employer · Freelancer · AI Mediator</div>
        </div>
        <Link href={`/projects/${jobId}/spec`}
          className="text-xs text-primary hover:underline">View Locked Spec</Link>
      </div>

      {/* Spec override warning */}
      <div className="bg-warning/10 border-b border-warning/20 px-6 py-2 text-xs text-warning font-medium shrink-0">
        ⚠️ This chat cannot override the agreed spec. Any changes require a formal Change Request.
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
        {messages.map(msg => (
          <div key={msg.message_id}>
            <ChatBubble message={msg} />
            {msg.ai_action && msg.ai_action.requires_response && (
              <div className="mt-2 mb-3">
                <AIInterceptBanner action={msg.ai_action} />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="bg-card border-t border-border px-6 py-4 flex gap-3 shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  )
}
