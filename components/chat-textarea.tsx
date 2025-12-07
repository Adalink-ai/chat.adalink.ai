'use client';

import { useState, useEffect } from 'react';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import type { ChangeEvent } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';

interface ChatTextareaProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
  adjustHeight: () => void;
  status: UseChatHelpers<ChatMessage>['status'];
  onSubmit: () => void;
  isMobile: boolean;
}

export function ChatTextarea({
  textareaRef,
  value,
  onChange,
  adjustHeight,
  status,
  onSubmit,
  isMobile,
}: ChatTextareaProps) {
  const handleInput = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
    adjustHeight();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();

      if (status !== 'ready') {
        toast.error('Please wait for the model to finish its response!');
      } else {
        onSubmit();
      }
    }
  };

  return (
    <Textarea
      data-testid="multimodal-input"
      ref={textareaRef}
      placeholder={isMobile ? 'Como posso ajudar?' : 'Como posso ajudar?'}
      value={value}
      onChange={handleInput}
      className="pl-12 pr-12 py-3 text-base border rounded-2xl transition-all duration-200 resize-none min-h-[52px] max-h-[52px] font-light border-zinc-200 dark:border-white/10 bg-white dark:bg-[#111315] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/40 hover:border-zinc-300 dark:hover:border-white/20 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-zinc-300 dark:focus:border-white/10 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-sm"
      rows={1}
      autoFocus
      onKeyDown={handleKeyDown}
    />
  );
}

