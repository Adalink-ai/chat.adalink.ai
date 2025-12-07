'use client';

import { MultimodalInput } from './multimodal-input';
import { ArtifactMessages } from './artifact-messages';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { Attachment, ChatMessage } from '@/lib/types';
import type { Vote } from '@/lib/db/schema';
import type { Dispatch, SetStateAction } from 'react';
import type { UIArtifact } from './artifact';

interface ArtifactSidebarProps {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>['status'];
  stop: UseChatHelpers<ChatMessage>['stop'];
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  votes: Array<Vote> | undefined;
  isReadonly: boolean;
  artifactStatus: UIArtifact['status'];
}

export function ArtifactSidebar({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  sendMessage,
  regenerate,
  votes,
  isReadonly,
  artifactStatus,
}: ArtifactSidebarProps) {
  return (
    <div className="flex flex-col h-full justify-between items-center">
      <ArtifactMessages
        chatId={chatId}
        status={status}
        votes={votes}
        messages={messages}
        setMessages={setMessages}
        regenerate={regenerate}
        isReadonly={isReadonly}
        artifactStatus={artifactStatus}
      />

      <form className="flex flex-row gap-2 relative items-end w-full px-4 pb-4">
        <MultimodalInput
          chatId={chatId}
          input={input}
          setInput={setInput}
          status={status}
          stop={stop}
          attachments={attachments}
          setAttachments={setAttachments}
          messages={messages}
          sendMessage={sendMessage}
          setMessages={setMessages}
        />
      </form>
    </div>
  );
}

