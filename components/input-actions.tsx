'use client';

import { Button } from './ui/button';
import { SendIcon, StopIcon } from './icons';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import { VoiceInputButton } from './voice-input-button';

import type { Dispatch, SetStateAction } from 'react';

interface InputActionsProps {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>['status'];
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  onSubmit: () => void;
  uploadQueueLength: number;
  adjustHeight: () => void;
}

export function InputActions({
  input,
  setInput,
  status,
  stop,
  setMessages,
  onSubmit,
  uploadQueueLength,
  adjustHeight,
}: InputActionsProps) {
  if (status === 'submitted') {
    return (
      <Button
        data-testid="stop-button"
        className="absolute right-3 top-1/2 -translate-y-1/2 size-8 rounded-full bg-red-500 hover:bg-red-600 text-white p-0"
        onClick={(event) => {
          event.preventDefault();
          stop();
          setMessages((messages) => messages);
        }}
        title="Parar"
      >
        <StopIcon size={14} />
      </Button>
    );
  }

  if (input.length > 0) {
    return (
      <Button
        data-testid="send-button"
        onClick={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        disabled={uploadQueueLength > 0}
        className="absolute right-3 top-1/2 -translate-y-1/2 size-8 rounded-full disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed p-0 transition-all duration-200 bg-[#8F5BFF] hover:bg-[#A970FF] enabled:hover:shadow-lg enabled:hover:shadow-[#8F5BFF]/40 text-white"
        title="Enviar mensagem"
      >
        <SendIcon size={14} />
      </Button>
    );
  }

  return (
    <VoiceInputButton
      input={input}
      setInput={setInput}
      status={status}
      adjustHeight={adjustHeight}
    />
  );
}

