'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
  updateChatTitle,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
  modelId,
}: {
  message: UIMessage;
  modelId: string;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel('title-model'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function generateAndUpdateChatTitle({
  chatId,
  message,
  modelId,
}: {
  chatId: string;
  message: UIMessage;
  modelId: string;
}) {
  try {
    console.log('[PERF] Starting async title generation for chat:', chatId);
    const titleStartTime = Date.now();

    const title = await generateTitleFromUserMessage({
      message,
      modelId,
    });

    console.log('[PERF] Async title generation took:', Date.now() - titleStartTime, 'ms');

    const updateStartTime = Date.now();
    await updateChatTitle({ id: chatId, title });
    console.log('[PERF] Async title update took:', Date.now() - updateStartTime, 'ms');

    console.log('[PERF] Async title generation completed for chat:', chatId);
  } catch (error) {
    console.error('[ERROR] Failed to generate/update chat title:', error);
    // Don't throw error to avoid affecting the main chat flow
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}
