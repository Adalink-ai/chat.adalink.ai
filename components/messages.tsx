import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';
import { Greeting } from './greeting';
import { memo } from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers<ChatMessage>['status'];
  votes: Array<Vote> | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  session?: any;
}

function PureMessages({ chatId, status, messages, session }: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
  } = useMessages({
    chatId,
    status,
  });

  useDataStream();

  return (
    <div className="flex-1 relative min-h-0">
      {messages.length === 0 && <Greeting session={session} />}
      
      <div
        ref={messagesContainerRef}
        className="absolute inset-0 overflow-y-auto p-4 md:p-6"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              session={session}
            />
          ))}

          <TypingIndicator
            isVisible={
              status === 'submitted' &&
              messages.length > 0 &&
              messages[messages.length - 1].role === 'user'
            }
          />

          <motion.div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
            onViewportLeave={onViewportLeave}
            onViewportEnter={onViewportEnter}
          />
        </div>
      </div>
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return false;
});
