'use client';

import { motion } from 'framer-motion';
import { AssistantLoadingCard } from './assistant-loading';

interface TypingIndicatorProps {
  isVisible: boolean;
}

export function TypingIndicator({ isVisible }: TypingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 w-full max-w-4xl mx-auto mb-6"
    >
      {/* Loading Card */}
      <div className="flex flex-col gap-2 max-w-xs md:max-w-md lg:max-w-lg">
        <div className="bg-white text-gray-900 rounded-2xl rounded-bl-sm shadow-sm border border-gray-200">
          <AssistantLoadingCard />
        </div>
      </div>
    </motion.div>
  );
}
