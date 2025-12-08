import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
  type LanguageModel,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateAndUpdateChatTitle } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import type { ChatModel } from '@/lib/ai/models';
import type { VisibilityType } from '@/components/visibility-selector';
import { gateway } from '@ai-sdk/gateway';
import { myProvider } from '@/lib/ai/providers';
import { processFilePartsForProvider } from '@/features/upload-files/lib/process-file-parts';
import { extractModelInfo } from '@/features/upload-files/lib/model-info-server';
import {
  hasFileParts,
  createProviderSpecificModel,
} from '@/features/upload-files/lib/create-provider-specific-model';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  console.log('[PERF] POST Request started at:', new Date().toISOString());

  let requestBody: PostRequestBody;

  try {
    const jsonStartTime = Date.now();
    const json = await request.json();
    console.log('[PERF] JSON parsing took:', Date.now() - jsonStartTime, 'ms');
    console.log('[DEBUG] Request JSON:', json);

    const parseStartTime = Date.now();
    requestBody = postRequestBodySchema.parse(json);
    console.log('[PERF] Schema parsing took:', Date.now() - parseStartTime, 'ms');
    console.log('[DEBUG] Parsed request body:', requestBody);
  } catch (error) {
    console.error('[DEBUG] Request parsing error:', error);
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType = 'private',
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel['id'];
      selectedVisibilityType?: VisibilityType;
    } = requestBody;

    console.log('[DEBUG] Chat request params:', {
      id,
      selectedChatModel,
      selectedVisibilityType,
      messageId: message.id,
      hasXaiKey: !!process.env.XAI_API_KEY,
    });

    // Log model selection details
    const isInternalModel = [
      'chat-model',
      'chat-model-reasoning',
      'title-model',
      'artifact-model',
    ].includes(selectedChatModel);

    console.log('[MODEL] Model details:', {
      selectedChatModel,
      isInternalModel,
      willUseGateway: !isInternalModel,
      defaultModel: process.env.ALLOWED_MODELS?.split(',')[0] || 'not-configured',
      allowedModels: process.env.ALLOWED_MODELS || 'all-models',
    });

    const authStartTime = Date.now();
    const session = await auth();
    console.log('[PERF] Auth took:', Date.now() - authStartTime, 'ms');

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    // Execute parallel queries for better performance
    const parallelQueriesStartTime = Date.now();
    const [messageCount, chat] = await Promise.all([
      getMessageCountByUserId({
        id: session.user.id,
        differenceInHours: 24,
      }),
      getChatById({ id })
    ]);
    console.log('[PERF] Parallel queries (messageCount + getChat) took:', Date.now() - parallelQueriesStartTime, 'ms');

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    if (!chat) {
      // Create chat asynchronously (non-blocking) to eliminate 257ms delay
      const saveChatStartTime = Date.now();
      saveChat({
        id,
        userId: session.user.id,
        title: 'New Chat', // Temporary title
        visibility: selectedVisibilityType,
      }).then(() => {
        console.log('[PERF] Chat saved successfully in background after:', Date.now() - saveChatStartTime, 'ms');
      }).catch(error => {
        console.error('[ERROR] Failed to save chat in background:', error);
      });

      // Generate and update title asynchronously (non-blocking)
      generateAndUpdateChatTitle({
        chatId: id,
        message,
        modelId: selectedChatModel,
      }).catch(error => {
        console.error('[ERROR] Async title generation failed:', error);
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    // Start critical path: get messages and prepare for streaming ASAP
    const criticalPathStartTime = Date.now();
    const [messagesFromDb] = await Promise.all([
      getMessagesByChatId({ id, limit: 10, onlyRecent: true }),
      // Process geolocation in parallel (non-async)
    ]);

    // Process geolocation (non-async, no need to await)
    const geolocationStartTime = Date.now();
    const { longitude, latitude, city, country } = geolocation(request);
    console.log('[PERF] Geolocation processing took:', Date.now() - geolocationStartTime, 'ms');

    const convertMessagesStartTime = Date.now();
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];
    console.log('[PERF] Convert messages took:', Date.now() - convertMessagesStartTime, 'ms');

    console.log('[PERF] Critical path (messages + geolocation) took:', Date.now() - criticalPathStartTime, 'ms');

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    // Debug: Verificar file parts antes de salvar
    const fileParts = message.parts.filter((part) => part.type === 'file');
    console.log('[DEBUG] Message parts before save:', {
      totalParts: message.parts.length,
      filePartsCount: fileParts.length,
      fileParts: fileParts.map((part) => ({
        type: part.type,
        url: part.url,
        filename: part.filename || (part as any).name,
        mediaType: part.mediaType,
      })),
      allParts: message.parts.map((part) => ({
        type: part.type,
        ...(part.type === 'text' ? { text: (part as any).text?.substring(0, 50) } : {}),
        ...(part.type === 'file' ? { url: part.url, filename: part.filename || (part as any).name } : {}),
      })),
    });

    // Save user message and generate stream ID in parallel
    const streamId = generateUUID();
    const finalSetupStartTime = Date.now();
    
    const messageToSave = {
      chatId: id,
      id: message.id,
      role: 'user',
      parts: message.parts,
      attachments: [],
      createdAt: new Date(),
    };


    await Promise.all([
      saveMessages({
        messages: [messageToSave],
      }),
      createStreamId({ streamId, chatId: id })
    ]);
    console.log('[PERF] Final setup operations took:', Date.now() - finalSetupStartTime, 'ms');

    console.log('[PERF] Total setup time before streamText (ULTRA OPTIMIZED - saveChat non-blocking):', Date.now() - startTime, 'ms');
    console.log(
      '[DEBUG] About to call streamText with model:',
      selectedChatModel,
    );

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        const streamTextStartTime = Date.now();
        console.log('[DEBUG] Executing streamText...');

        // Add timeout for AI model requests (30 seconds)
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('[TIMEOUT] AI model request timed out after 30s');
          abortController.abort();
        }, 30000);

        // Check if messages contain file parts
        const hasFiles = hasFileParts(uiMessages);

        console.log('[DEBUG] Has files:', hasFiles);

        // Determine which model to use
        const useInternalModel = [
          'chat-model',
          'chat-model-reasoning',
          'title-model',
          'artifact-model',
        ].includes(selectedChatModel);

        // If files are present, try to use provider-specific model
        // Otherwise, use gateway (or internal model)
        let modelToUse: LanguageModel;
        let apiKeyType: string;

        if (hasFiles && !useInternalModel) {
          // Try to create provider-specific model when files are present
          const providerModel = createProviderSpecificModel(
            selectedChatModel,
            true,
          );

          if (providerModel) {
            modelToUse = providerModel;
            apiKeyType = 'provider-specific';
          } else {
            // Fall back to gateway if provider-specific not available
            modelToUse = gateway(selectedChatModel);
            apiKeyType = 'gateway';
          }
        } else if (useInternalModel) {
          modelToUse = myProvider.languageModel(selectedChatModel);
          apiKeyType = hasFiles ? 'internal-provider' : 'internal-provider';
        } else {
          // No files, use gateway
          modelToUse = gateway(selectedChatModel);
          apiKeyType = 'gateway';
        }

        // Extract provider info for logging
        const modelInfo = extractModelInfo(selectedChatModel);

        console.log('[MODEL] Using model:', {
          selectedChatModel,
          useInternalModel,
          hasFiles,
          actualModel: useInternalModel
            ? `internal:${selectedChatModel}`
            : apiKeyType === 'provider-specific'
              ? `provider-specific:${selectedChatModel}`
              : `gateway:${selectedChatModel}`,
          provider: modelInfo.provider,
          apiKeyType, // 'provider-specific', 'gateway', or 'internal-provider'
        });

        // Process file parts to use fileId when provider matches current model
        const processedMessages = processFilePartsForProvider(
          uiMessages,
          selectedChatModel,
        );

        const result = streamText({
          model: modelToUse,
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages: convertToModelMessages(processedMessages),
          stopWhen: stepCountIs(5),
          abortSignal: abortController.signal,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                ],
          experimental_transform: smoothStream({ chunking: 'word' , delayInMs: 100}),
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        console.log('[PERF] StreamText setup took:', Date.now() - streamTextStartTime, 'ms');

        // Monitor for successful stream start or errors
        try {
          result.consumeStream();
          console.log('[PERF] AI model response stream started successfully');
          clearTimeout(timeoutId);
        } catch (error) {
          clearTimeout(timeoutId);
          console.error('[ERROR] AI model stream failed:', error);
          throw error;
        }

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        // Calculate total AI response time
        const totalResponseTime = Date.now() - startTime;
        console.log('[PERF] Total request processing time:', totalResponseTime, 'ms');

        // Save only AI response messages (user message already saved)
        const saveStartTime = Date.now();

        const messagesToSave = messages.map((message) => ({
          id: message.id,
          role: message.role,
          parts: message.parts,
          createdAt: new Date(),
          attachments: [],
          chatId: id,
        }));


        try {
          await saveMessages({
            messages: messagesToSave,
          });
        } catch (error) {
          console.error('[ERROR] Failed to save messages in onFinish:', error);
          // Re-throw to let the error propagate
          throw error;
        }

        console.log('[PERF] AI response save took:', Date.now() - saveStartTime, 'ms');
        console.log('[PERF] Request completed in total:', Date.now() - startTime, 'ms');
      },
      onError: (error) => {
        console.error('[DEBUG] StreamText onError:', error);
        console.error('[DEBUG] StreamText error details:', {
          message: (error as any)?.message,
          stack: (error as any)?.stack,
          name: (error as any)?.name,
        });
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream()),
        ),
      );
    } else {
      return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
    }
  } catch (error) {
    console.error('[DEBUG] Chat API error:', error);
    console.error('[DEBUG] Error details:', {
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      name: (error as any)?.name,
      cause: (error as any)?.cause,
    });

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
