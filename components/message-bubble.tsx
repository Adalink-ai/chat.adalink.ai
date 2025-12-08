'use client';

import { BotIcon } from './icons';
import { Markdown } from './markdown';
import { sanitizeText, cn, generateUUID } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';
import type { Session } from 'next-auth';
import { MessageFilePreview } from './message-file-preview';

interface MessageBubbleProps {
  message: ChatMessage;
  session?: Session | null;
}

export function MessageBubble({ message, session }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const textContent =
    message.parts?.find((part) => part.type === 'text')?.text || '';

  return (
    <div
      className={cn(
        'flex gap-3 w-full max-w-4xl mx-auto mb-6',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar */}
      <div className="size-8 flex items-center rounded-full justify-center shrink-0 bg-gray-100">
        {isUser ? (
          session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="size-6 rounded-full object-cover"
            />
          ) : (
            <div className="size-6 rounded-full bg-card border border-border" />
          )
        ) : (
          <div className="size-8 rounded-full flex items-center justify-center text-white bg-purple-custom-500">
            <BotIcon size={16} />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex flex-col gap-2 max-w-xs md:max-w-md lg:max-w-lg">
        {message.parts?.map((part, index) => {
          const key = generateUUID();
          if (part.type === 'text') {
            return (
              <div
                key={message.id + key}
                className={cn(
                  'px-4 py-3 rounded-2xl',
                  isUser
                    ? 'bg-purple-custom-500 text-white rounded-br-sm'
                    : 'bg-card text-card-foreground rounded-bl-sm shadow-sm border border-border',
                )}
              >
                <Markdown>{sanitizeText(part.text)}</Markdown>
              </div>
            );
          }
          if (part.type === 'file') {
            return (
              <div key={message.id + key}>
                <MessageFilePreview fileParts={[part]} isUserMessage={isUser} />
              </div>
            );
          }
          return null;
        })}

        {/* Timestamp */}
        <div
          className={cn(
            'text-xs opacity-70 px-2',
            isUser ? 'text-right' : 'text-left',
          )}
        >
          {new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
