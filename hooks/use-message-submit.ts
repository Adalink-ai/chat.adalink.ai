'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useWindowSize } from 'usehooks-ts';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';

interface UseMessageSubmitParams {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  fileUIParts: Array<any>;
  uploadFileJobResult: Array<any>;
  pendingFilePartsRef: React.MutableRefObject<Map<string, Array<any>>>;
  normalizeFilePart: (part: any) => any;
  removeJob: (jobId: string) => void;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  setLocalStorageInput: (value: string) => void;
  resetHeight: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export function useMessageSubmit({
  chatId,
  input,
  setInput,
  fileUIParts,
  uploadFileJobResult,
  pendingFilePartsRef,
  normalizeFilePart,
  removeJob,
  sendMessage,
  setLocalStorageInput,
  resetHeight,
  textareaRef,
}: UseMessageSubmitParams) {
  const { width } = useWindowSize();

  return useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    const fileParts = fileUIParts
      .map(normalizeFilePart)
      .filter((part): part is NonNullable<typeof part> => part !== null);

    if (fileParts.length === 0 && !input.trim()) {
      toast.error('Por favor, digite uma mensagem ou anexe um arquivo');
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[MULTIMODAL-INPUT] Sending message:', {
        filePartsCount: fileParts.length,
        fileParts: fileParts.map((p) => ({
          url: p.url,
          filename: p.filename,
          mediaType: p.mediaType,
        })),
        hasText: !!input.trim(),
      });
    }

    const messageToSend = {
      role: 'user' as const,
      parts: [
        ...fileParts,
        ...(input.trim()
          ? [
              {
                type: 'text' as const,
                text: input.trim(),
              },
            ]
          : []),
      ],
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('[MULTIMODAL-INPUT] Sending message with parts:', {
        partsCount: messageToSend.parts.length,
        filePartsCount: fileParts.length,
        hasText: !!input.trim(),
        fileParts: fileParts.map((p) => ({ url: p.url, filename: p.filename })),
      });
    }

    sendMessage(messageToSend);

    if (fileParts.length > 0) {
      const tempId = `temp-${Date.now()}`;
      pendingFilePartsRef.current.set(tempId, fileParts);

      setTimeout(() => {
        pendingFilePartsRef.current.delete(tempId);
      }, 5000);
    }

    if (fileParts.length > 0 && fileUIParts.length > 0) {
      const sentUrls = new Set(fileParts.map((part) => part.url));
      const jobIdsToRemove = uploadFileJobResult
        .filter((job) => {
          const fileUrl = job.result?.fileUrl || job.result?.url;
          return (
            job.status === 'complete' &&
            fileUrl &&
            sentUrls.has(fileUrl)
          );
        })
        .map((job) => job.id);

      jobIdsToRemove.forEach((jobId) => {
        removeJob(jobId);
      });
    }

    setLocalStorageInput('');
    resetHeight();
    setInput('');

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    chatId,
    input,
    setInput,
    fileUIParts,
    uploadFileJobResult,
    pendingFilePartsRef,
    normalizeFilePart,
    removeJob,
    sendMessage,
    setLocalStorageInput,
    resetHeight,
    textareaRef,
    width,
  ]);
}

