'use client';

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import { BorderAnimation } from '@/components/border-animation';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import type { Attachment, ChatMessage } from '@/lib/types';
import { useSidebarContext } from './sidebar-context';
import { useDataStream } from './data-stream-provider';

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();
  const { isCollapsed, activePanel } = useSidebarContext();

  const [input, setInput] = useState<string>('');
  const [showAnimation, setShowAnimation] = useState(false);
  const [selectedChatModel, setSelectedChatModel] =
    useState<string>(initialChatModel);

  // Calcular padding-left baseado no estado da sidebar
  const sidebarWidth = isCollapsed ? 0 : (activePanel ? 360 : 80);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
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
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  // BorderAnimation effect
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

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <div 
      className="flex h-screen pt-16 md:p-4 bg-muted/30 transition-all duration-300"
      style={{ paddingLeft: `max(16px, ${sidebarWidth}px)` }}
    >
      <div className="flex-1 relative">
        <div className="relative flex flex-col h-full md:rounded-lg overflow-hidden bg-background border-0 md:border md:border-zinc-200/50 md:dark:border-zinc-800/30">
          <BorderAnimation showAnimation={true} />
          <ChatHeader
            selectedModelId={initialChatModel}
            isReadonly={isReadonly}
            conversationTitle={
              messages.length > 0 &&
              messages[0]?.parts?.[0] &&
              'text' in messages[0].parts[0]
                ? messages[0].parts[0].text.slice(0, 50) +
                  (messages[0].parts[0].text.length > 50 ? '...' : '')
                : undefined
            }
          />

          <Messages
            chatId={id}
            status={status}
            votes={votes}
            messages={messages}
            setMessages={setMessages}
            regenerate={regenerate}
            isReadonly={isReadonly}
            isArtifactVisible={isArtifactVisible}
            session={session}
          />

          {!isReadonly && (
            <div className="border-t border-zinc-200/50 dark:border-zinc-800/30 px-4 md:px-6 py-2 md:py-4 bg-background" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
              <div className="max-w-4xl mx-auto">
                <MultimodalInput
                  chatId={id}
                  input={input}
                  setInput={setInput}
                  status={status}
                  stop={stop}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  messages={messages}
                  setMessages={setMessages}
                  sendMessage={sendMessage}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        sendMessage={sendMessage}
        messages={messages}
        setMessages={setMessages}
        regenerate={regenerate}
        votes={votes}
        isReadonly={isReadonly}
      />
    </div>
  );
}
