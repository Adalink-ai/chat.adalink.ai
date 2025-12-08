import 'server-only';

import { extractModelInfo } from './model-info-server';
import type { ChatMessage } from '@/lib/types';

/**
 * Process file parts in messages to always use original URL (CloudFront).
 * 
 * Always uses the original URL to avoid issues with unsupported file types
 * when using fileId directly with the AI SDK.
 * 
 * @param messages - Array of chat messages to process
 * @param selectedChatModel - The currently selected chat model ID
 * @returns Processed messages with file parts using original URLs
 */
export function processFilePartsForProvider(
  messages: ChatMessage[],
  selectedChatModel: string,
): ChatMessage[] {
  const modelInfo = extractModelInfo(selectedChatModel);
  const { provider } = modelInfo;

  const processedMessages = messages.map((message) => {
    if (!message.parts) {
      return message;
    }

    const parts = message.parts.map((part) => {
      if (part.type === 'file') {
        // Type assertion to access providerMetadata which is not in the standard FileUIPart type
        const filePart = part as typeof part & {
          providerMetadata?: {
            provider?: string;
            fileId?: string;
            originalFileUrl?: string;
          };
        };

        // check file provider. if it's the same as the model provider, use the fileId. otherwise, use the original URL.
        if (filePart.providerMetadata?.provider === provider) {
          return {
            ...part,
            ...(filePart.providerMetadata?.fileId && {
              fileId: filePart.providerMetadata.fileId,
            }),
          };
        }
        return {
          ...part,
          url:
            filePart.providerMetadata?.originalFileUrl || part.url,
        };
      }
      return part;
    });

    return {
      ...message,
      parts: parts,
    };
  });

  return processedMessages;
}

