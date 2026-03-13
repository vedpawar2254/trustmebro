import type { ChatMessage } from '@/types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface ChatBubbleProps {
  message: ChatMessage
  currentUserId?: string
}

const AI_ACTION_LABELS: Record<string, string> = {
  spec_gap_intercept: '🔍 Spec Gap Detected',
  scope_creep_detect: '🚨 Scope Creep Detected',
  conflict_deescalate: '🤝 Conflict De-escalation',
  contradiction_warn: '⚠️ Spec Contradiction',
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isAI = message.sender === 'ai_mediator'
  const isEmployer = message.sender === 'employer'

  if (isAI) {
    return (
      <div className="flex flex-col items-center gap-1 my-2">
        {message.ai_action && (
          <div className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
            {AI_ACTION_LABELS[message.ai_action.action_type] ?? 'AI Mediator'}
          </div>
        )}
        <div className="max-w-[85%] bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm text-foreground text-center">
          {message.content}
        </div>
        <span className="text-xs text-muted-foreground">
          AI Mediator · {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-2 my-1', isEmployer ? 'flex-row-reverse' : 'flex-row')}>
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1',
        isEmployer ? 'bg-primary text-white' : 'bg-border text-foreground'
      )}>
        {isEmployer ? 'E' : 'F'}
      </div>
      <div className={cn('flex flex-col gap-1 max-w-[70%]', isEmployer ? 'items-end' : 'items-start')}>
        <div className={cn(
          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
          isEmployer
            ? 'bg-primary text-white rounded-tr-sm'
            : 'bg-card border border-border text-foreground rounded-tl-sm'
        )}>
          {message.content}
        </div>
        <span className="text-xs text-muted-foreground px-1">
          {message.sender === 'employer' ? 'Employer' : 'Freelancer'} · {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </span>
      </div>
    </div>
  )
}
