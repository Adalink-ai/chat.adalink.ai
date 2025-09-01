'use client';

import { motion } from 'framer-motion';
import { BotIcon } from './icons';

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
      {/* Avatar */}
      <div
        className="size-8 rounded-full flex items-center justify-center shrink-0 text-white"
        style={{ backgroundColor: '#B800C9' }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
        >
          <BotIcon size={16} />
        </motion.div>
      </div>

      {/* Typing Animation */}
      <div className="flex flex-col gap-2 max-w-xs md:max-w-md lg:max-w-lg">
        <div className="bg-white text-gray-900 rounded-2xl rounded-bl-sm shadow-sm border border-gray-200 px-4 py-3">
          <div className="flex items-center gap-1">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
              className="size-2 bg-gray-400 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
              className="size-2 bg-gray-400 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
              className="size-2 bg-gray-400 rounded-full"
            />
          </div>
        </div>

        <div className="text-xs opacity-70 px-2 text-left">Digitando...</div>
      </div>
    </motion.div>
  );
}
