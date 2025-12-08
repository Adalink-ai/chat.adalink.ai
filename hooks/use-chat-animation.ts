'use client';

import { useEffect, useState } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';

export function useChatAnimation({
  status,
  input,
}: {
  status: UseChatHelpers<ChatMessage>['status'];
  input: string;
}) {
  const [showAnimation, setShowAnimation] = useState(false);

  // BorderAnimation effect based on status
  useEffect(() => {
    if (status === 'streaming' || status === 'submitted') {
      setShowAnimation(true);
    } else if (showAnimation && status === 'ready') {
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [status, showAnimation]);

  // Force animation for testing (remove in production)
  useEffect(() => {
    if (input.length > 0) {
      setShowAnimation(true);
    } else if (input.length === 0 && showAnimation) {
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [input, showAnimation]);

  return showAnimation;
}

