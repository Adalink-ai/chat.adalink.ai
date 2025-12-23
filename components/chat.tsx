'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ChatHeader } from '@/components/chat-header';
import { BorderAnimation } from '@/components/border-animation';
import type { Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { useArtifactSelector } from '@/hooks/use-artifact';
import type { Session } from 'next-auth';
import { useAutoResume } from '@/hooks/use-auto-resume';
import type { ChatMessage } from '@/lib/types';
import { useChatConfig } from '@/hooks/use-chat-config';
import { useChatAnimation } from '@/hooks/use-chat-animation';
import { useChatQuery } from '@/hooks/use-chat-query';
import { ChatLayout } from './chat-layout';

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
  const [input, setInput] = useState<string>('');
  const [selectedChatModel, setSelectedChatModel] =
    useState<string>(initialChatModel);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChatConfig({
    id,
    initialMessages,
    initialChatModel,
  });

  useChatQuery({ chatId: id, sendMessage });

  const showAnimation = useChatAnimation({ status, input });

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  const conversationTitle =
    messages.length > 0 &&
    messages[0]?.parts?.[0] &&
    'text' in messages[0].parts[0]
      ? messages[0].parts[0].text.slice(0, 50) +
        (messages[0].parts[0].text.length > 50 ? '...' : '')
      : undefined;

  return (
    <ChatLayout>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col md:rounded-lg overflow-hidden bg-background border-0 md:border md:border-zinc-200/50 md:dark:border-zinc-800/30">
          <BorderAnimation showAnimation={showAnimation} />
          <ChatHeader
            selectedModelId={initialChatModel}
            isReadonly={isReadonly}
            conversationTitle={conversationTitle}
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
                  messages={messages}
                  setMessages={setMessages}
                  sendMessage={sendMessage}
                  selectedChatModel={selectedChatModel}
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
        attachments={[]}
        setAttachments={() => {}}
        sendMessage={sendMessage}
        messages={messages}
        setMessages={setMessages}
        regenerate={regenerate}
        votes={votes}
        isReadonly={isReadonly}
      />
    </ChatLayout>
  );
}
