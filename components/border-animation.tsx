'use client';

import { motion } from 'framer-motion';

interface BorderAnimationProps {
  showAnimation: boolean;
}

export function BorderAnimation({ showAnimation }: BorderAnimationProps) {
  if (!showAnimation) {
    return (
      <div className="absolute inset-0 rounded-lg border border-gray-200 pointer-events-none" />
    );
  }

  const SEGMENT = 0.03; // Segmento maior
  const SPEED = 6; // Mais rápido

  return (
    <div className="absolute inset-0 rounded-lg pointer-events-none z-10">
      <svg
        className="absolute inset-0 size-full"
        style={{ borderRadius: 'inherit' }}
      >
        <defs>
          {/* Glow mais forte */}
          <filter id="glow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="2.5" result="blur1" />
            <feGaussianBlur stdDeviation="5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Removida a borda base para não aparecer rastro */}

        {/* Borda animada mais forte e maior */}
        <motion.rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx="7"
          ry="7"
          fill="none"
          stroke="#B800C9"
          strokeWidth="2"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${SEGMENT} ${1 - SEGMENT}`}
          strokeOpacity="0.2"
          animate={{ strokeDashoffset: [1, 0] }}
          transition={{
            duration: SPEED,
            ease: 'linear',
            repeat: Number.POSITIVE_INFINITY,
          }}
          filter="url(#glow)"
        />
      </svg>
    </div>
  );
}