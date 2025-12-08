'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { toast } from 'sonner';
import type { ChangeEvent } from 'react';
import {
  uploadFileJobResultAtom,
  uploadFileJobResultAsFileUIPartsAtom,
  removeJobAtom,
} from '@/features/upload-files/model/atoms';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import type { UIMessage } from 'ai';

export function useFileHandling({
  messages,
  setMessages,
}: {
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
}) {
  const pendingFilePartsRef = useRef<Map<string, Array<any>>>(new Map());
  const uploadFileJobResult = useAtomValue(uploadFileJobResultAtom);
  const fileUIParts = useAtomValue(uploadFileJobResultAsFileUIPartsAtom);
  const removeJob = useSetAtom(removeJobAtom);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  // Garantir que file parts sejam preservados quando useChat adiciona mensagem
  useEffect(() => {
    const userMessages = messages.filter((msg) => msg.role === 'user');
    if (userMessages.length === 0) return;

    const mostRecentUserMessage = userMessages[userMessages.length - 1];
    const hasFileParts = mostRecentUserMessage.parts?.some(
      (part) => part.type === 'file',
    );

    if (!hasFileParts && pendingFilePartsRef.current.size > 0) {
      const pendingEntries = Array.from(pendingFilePartsRef.current.entries());
      if (pendingEntries.length > 0) {
        const [tempId, pendingFileParts] = pendingEntries[pendingEntries.length - 1];

        const metadata = mostRecentUserMessage.metadata as
          | { createdAt?: string }
          | undefined;
        const messageCreatedAt = metadata?.createdAt
          ? new Date(metadata.createdAt).getTime()
          : 0;
        const messageAge = Date.now() - messageCreatedAt;
        if (messageAge < 3000) {
          if (process.env.NODE_ENV === 'development') {
            console.log(
              '[MULTIMODAL-INPUT] Restoring file parts to most recent message:',
              {
                messageId: mostRecentUserMessage.id,
                filePartsCount: pendingFileParts.length,
              },
            );
          }

          setMessages((currentMessages) => {
            return currentMessages.map((msg) => {
              if (msg.id === mostRecentUserMessage.id && msg.role === 'user') {
                return {
                  ...msg,
                  parts: [
                    ...pendingFileParts,
                    ...(msg.parts?.filter((part) => part.type !== 'file') || []),
                  ],
                };
              }
              return msg;
            });
          });

          pendingFilePartsRef.current.delete(tempId);
        }
      }
    }
  }, [messages, setMessages]);

  const normalizeFilePart = useCallback((part: any) => {
    if (!part.url || !part.mediaType) {
      console.error('Invalid file part:', part);
      toast.error('Arquivo inválido: faltam campos obrigatórios');
      return null;
    }

    const filename = part.filename || part.name;
    if (!filename) {
      console.error('Invalid file part: missing filename/name', part);
      toast.error('Arquivo inválido: nome do arquivo não encontrado');
      return null;
    }

    return {
      type: 'file' as const,
      url: part.url,
      filename: filename,
      mediaType: part.mediaType,
      ...(part.providerMetadata && { providerMetadata: part.providerMetadata }),
    };
  }, []);

  const uploadFile = useCallback(async (file: File, selectedChatModel?: string) => {
    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          ...(selectedChatModel && { selectedChatModel }),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // The new API returns different structure with uploadUrl, jobId, etc.
        // For backward compatibility, return the expected format
        return {
          url: data.publicUrl || data.url,
          name: data.key || file.name,
          contentType: file.type,
        };
      }
      const errorData = await response.json();
      toast.error(errorData.error || 'Failed to upload file');
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        await Promise.all(uploadPromises);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [uploadFile],
  );

  return {
    fileUIParts,
    uploadFileJobResult,
    uploadQueue,
    pendingFilePartsRef,
    normalizeFilePart,
    handleFileChange,
    removeJob,
  };
}

