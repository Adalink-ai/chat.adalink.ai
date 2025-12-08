'use client';

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr/infinite';
import { fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { getChatHistoryPaginationKey } from '@/components/sidebar-history';
import { toast } from '@/components/toast';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from '@/components/data-stream-provider';

export function useChatConfig({
  id,
  initialMessages,
  initialChatModel,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
}) {
  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  return useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            message: messages.at(-1),
            selectedChatModel: initialChatModel,
            ...body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast({
          type: 'error',
          description: error.message,
        });
      }
    },
  });
}

