'use client';

import { motion } from 'framer-motion';

export function MessageStepBoundary() {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full my-2 flex items-center gap-2"
    >
      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
      <div className="text-xs text-zinc-400 dark:text-zinc-500 px-2">
        Nova etapa
      </div>
      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
    </motion.div>
  );
}
