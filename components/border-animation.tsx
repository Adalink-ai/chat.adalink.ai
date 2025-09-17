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

  const SEGMENT = 0.02;
  const SPEED = 6;

  return (
    <div className="absolute inset-0 rounded-lg pointer-events-none z-10">
      <svg
        className="absolute inset-0 size-full"
        style={{ borderRadius: 'inherit' }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx="7"
          ry="7"
          fill="none"
          stroke="rgba(17, 24, 39, 0.12)"
          strokeWidth="1"
        />

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
