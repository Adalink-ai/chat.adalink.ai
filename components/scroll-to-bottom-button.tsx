'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './ui/button';
import { ChevronDownIcon } from './icons';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';

export function ScrollToBottomButton() {
  const { isAtBottom, scrollToBottom } = useScrollToBottom();

  if (isAtBottom) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="absolute left-1/2 bottom-28 -translate-x-1/2 z-50"
      >
        <Button
          data-testid="scroll-to-bottom-button"
          className="rounded-full"
          size="icon"
          variant="outline"
          onClick={(event) => {
            event.preventDefault();
            scrollToBottom();
          }}
        >
          <ChevronDownIcon />
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}

