'use client';

import React, { useEffect, useState } from 'react';

interface MeterRingProps {
  label: string;
  value: string | number;
  description: string;
  progress: number; // 0 to 100
}

export function MeterRing({ label, value, description, progress }: MeterRingProps) {
  const [mounted, setMounted] = useState(false);
  
  // SVG Ring settings
  const radius = 50;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = mounted ? circumference - (progress / 100) * circumference : circumference;

  useEffect(() => {
    // Small delay to ensure the animation triggers on mount
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-[rgb(44,38,56)] border border-white/10 rounded-xl p-6 shadow-sm hover:scale-[1.02] transition-all duration-200 flex flex-col items-center justify-center text-center">
      <div className="text-sm font-semibold text-white/80 tracking-wide uppercase mb-6">
        {label}
      </div>
      
      <div className="relative flex items-center justify-center mb-6">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background track */}
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-white/10"
          />
          {/* Progress ring using primary login button color: rgb(109,84,181) */}
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-[rgb(109,84,181)] transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex items-center justify-center text-3xl font-bold text-white">
          {value}
        </div>
      </div>

      <div className="text-sm text-white/60">
        {description}
      </div>
    </div>
  );
}
