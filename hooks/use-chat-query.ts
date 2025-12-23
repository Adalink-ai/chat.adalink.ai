'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';

export function useChatQuery({
  chatId,
  sendMessage,
}: {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
}) {
  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: 'user' as const,
        parts: [{ type: 'text', text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${chatId}`);
    }
  }, [query, sendMessage, hasAppendedQuery, chatId]);
}

