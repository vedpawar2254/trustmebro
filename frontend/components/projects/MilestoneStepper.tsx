import type { Milestone } from '@/types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface MilestoneStepperProps {
  milestones: Milestone[]
  currentMilestoneId?: string
  completedMilestoneIds?: string[]
}

export function MilestoneStepper({ milestones, currentMilestoneId, completedMilestoneIds = [] }: MilestoneStepperProps) {
  return (
    <div className="space-y-0">
      {milestones.map((m, i) => {
        const isCompleted = completedMilestoneIds.includes(m.milestone_id)
        const isCurrent = m.milestone_id === currentMilestoneId
        const isUpcoming = !isCompleted && !isCurrent

        return (
          <div key={m.milestone_id} className="flex gap-4">
            {/* Connector */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 z-10',
                isCompleted ? 'bg-success text-white' :
                isCurrent   ? 'bg-primary text-white ring-4 ring-primary/20' :
                              'bg-border text-muted-foreground'
              )}>
                {isCompleted ? '✓' : i + 1}
              </div>
              {i < milestones.length - 1 && (
                <div className={cn('w-0.5 flex-1 my-1', isCompleted ? 'bg-success' : 'bg-border')} />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-6 flex-1', i === milestones.length - 1 && 'pb-0')}>
              <div className={cn(
                'font-semibold text-sm',
                isCurrent ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
              )}>
                {m.title}
                {isCurrent && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Current</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Due {formatDistanceToNow(new Date(m.deadline), { addSuffix: true })} · {m.criteria.length} criteria
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
