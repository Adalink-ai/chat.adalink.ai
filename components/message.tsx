'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { MessageFilePreview } from './message-file-preview';
import { MessageToolCall } from './message-tool-call';
import { MessageStepBoundary } from './message-step-boundary';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';

// Type narrowing is handled by TypeScript's control flow analysis
// The AI SDK provides proper discriminated unions for tool calls

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === 'file',
  );

  // Debug: Verificar file parts no componente
  if (process.env.NODE_ENV === 'development') {
    if (attachmentsFromMessage.length > 0) {
      console.log('[DEBUG] MessageFilePreview - Found file parts:', {
        messageId: message.id,
        role: message.role,
        totalParts: message.parts?.length || 0,
        filePartsCount: attachmentsFromMessage.length,
        fileParts: attachmentsFromMessage.map((part) => ({
          type: part.type,
          url: part.url,
          filename: part.filename || (part as any).name,
          mediaType: part.mediaType,
        })),
      });
    } else if (message.role === 'user') {
      // Log quando mensagem do usuário não tem file parts mas deveria ter
      console.log('[DEBUG] MessageFilePreview - User message without file parts:', {
        messageId: message.id,
        totalParts: message.parts?.length || 0,
        parts: message.parts?.map((part) => ({
          type: part.type,
          ...(part.type === 'text' ? { text: (part as any).text?.substring(0, 50) } : {}),
          ...(part.type === 'file' ? { url: part.url, filename: part.filename || (part as any).name } : {}),
        })) || [],
      });
    }
  }

  useDataStream();

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full px-6 py-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn('flex gap-3 w-full max-w-4xl mx-auto', {
            'flex-row-reverse': message.role === 'user',
            'w-full': mode === 'edit',
          })}
        >
          {/* Avatar */}
          <div className="size-8 flex items-center rounded-full justify-center shrink-0 bg-gray-100">
            {message.role === 'assistant' ? (
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            ) : (
              <div className="size-6 rounded-full bg-purple-custom-500 flex items-center justify-center">
                <span className="text-white text-xs font-medium">U</span>
              </div>
            )}
          </div>

          <div
            className={cn(
              'flex flex-col gap-2 max-w-xs md:max-w-md lg:max-w-lg',
              {
                'min-h-96':
                  message.role === 'assistant' && requiresScrollPadding,
              },
            )}
          >
            {attachmentsFromMessage.length > 0 && (
              <div
                data-testid={`message-attachments`}
                className={message.role === 'user' ? 'flex flex-row justify-end' : 'flex flex-row justify-start'}
              >
                <MessageFilePreview fileParts={attachmentsFromMessage} isUserMessage={message.role === 'user'} />
              </div>
            )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              // Step boundaries
              if (type === 'step-start') {
                return <MessageStepBoundary key={key} />;
              }

              // Reasoning
              if (type === 'reasoning' && part.text?.trim().length > 0) {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.text}
                  />
                );
              }

              // File parts are handled separately above, skip them here
              if (type === 'file') {
                return null;
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                              onClick={() => {
                                setMode('edit');
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                      )}

                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-2', {
                          'bg-purple-600 text-white px-4 py-3 rounded-2xl rounded-br-sm':
                            message.role === 'user',
                          'bg-white text-gray-900 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-gray-200':
                            message.role === 'assistant',
                        })}
                      >
                        <Markdown>{sanitizeText(part.text)}</Markdown>
                        <div className="text-xs opacity-70 mt-1">
                          {new Date().toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="size-8" />

                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        regenerate={regenerate}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-getWeather') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  return (
                    <div key={toolCallId} className="skeleton">
                      <Weather />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;
                  return (
                    <div key={toolCallId}>
                      <Weather weatherAtLocation={output} />
                    </div>
                  );
                }
              }

              if (type === 'tool-createDocument') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      <DocumentPreview isReadonly={isReadonly} args={input} />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentPreview
                        isReadonly={isReadonly}
                        result={output}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-updateDocument') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;

                  return (
                    <div key={toolCallId}>
                      <DocumentToolCall
                        type="update"
                        args={input}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentToolResult
                        type="update"
                        result={output}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-requestSuggestions') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      <DocumentToolCall
                        type="request-suggestions"
                        args={input}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentToolResult
                        type="request-suggestions"
                        result={output}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }
              }

              // Generic tool calls fallback
              if (type.startsWith('tool-')) {
                const toolName = type.replace('tool-', '');
                const knownTools = ['getWeather', 'createDocument', 'updateDocument', 'requestSuggestions'];
                
                // Only handle unknown tools with the generic component
                if (!knownTools.includes(toolName)) {
                  const toolCallId = (part as any).toolCallId || `tool-${index}`;
                  const state = (part as any).state || 'input-available';
                  const input = (part as any).input;
                  const output = (part as any).output;
                  const errorText = (part as any).errorText;

                  return (
                    <MessageToolCall
                      key={toolCallId}
                      toolName={toolName}
                      toolCallId={toolCallId}
                      state={state}
                      input={input}
                      output={output}
                      errorText={errorText}
                    />
                  );
                }
              }

              // Fallback for unhandled part types (debug in development)
              if (process.env.NODE_ENV === 'development') {
                console.warn('[DEBUG] Unhandled message part type:', type, part);
              }

              return null;
            })}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return false;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full px-6 py-4 group/message min-h-96"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div className="flex gap-3 w-full max-w-4xl mx-auto">
        <div className="size-8 flex items-center rounded-full justify-center shrink-0 bg-gray-100">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 max-w-xs md:max-w-md lg:max-w-lg">
          <div className="bg-white text-gray-900 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-gray-200">
            <div className="text-muted-foreground">Hmm...</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
