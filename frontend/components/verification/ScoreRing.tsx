'use client'

import { useEffect, useState } from 'react'

interface ScoreRingProps {
  score: number
  size?: number
}

export function ScoreRing({ score, size = 120 }: ScoreRingProps) {
  const [animated, setAnimated] = useState(0)
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animated / 100) * circumference

  const color = score >= 90 ? '#16a34a' : score >= 50 ? '#f59e0b' : '#dc2626'
  const label = score >= 90 ? 'AUTO-RELEASED' : score >= 50 ? 'ON HOLD' : 'DISPUTE'

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 100)
    return () => clearTimeout(t)
  }, [score])

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#e2e8f0" strokeWidth={8}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="text-center -mt-[calc(var(--size)/2+8px)]" style={{ marginTop: -(size / 2 + 8) }}>
        <div className="text-4xl font-bold" style={{ color }}>{score}%</div>
      </div>
      <span
        className="text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ background: color + '20', color }}
      >
        {label}
      </span>
    </div>
  )
}
