'use client';

import type { UIMessage } from 'ai';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { SendIcon, StopIcon, ChevronDownIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { SuggestedActions } from './suggested-actions';
import { UploadButton } from './upload-button';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import { useVoiceRecognition } from '@/hooks/use-voice-recognition';
import type { ChatMessage } from '@/lib/types';
import { generateUUID } from '@/lib/utils';
import { UploadedDocumentsPreview } from './uploaded-documents-preview';
import { useAtomValue, useSetAtom } from 'jotai';
import { 
  uploadFileJobResultAtom, 
  uploadFileJobResultAsFileUIPartsAtom,
  removeJobAtom 
} from '@/features/upload-files/model/atoms';

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  messages,
  setMessages,
  sendMessage,
  selectedChatModel,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>['status'];
  stop: () => void;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  selectedChatModel?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const pendingFilePartsRef = useRef<Map<string, Array<any>>>(new Map());
  
  // Atoms para gerenciar jobs de upload
  const uploadFileJobResult = useAtomValue(uploadFileJobResultAtom);
  const fileUIParts = useAtomValue(uploadFileJobResultAsFileUIPartsAtom);
  const removeJob = useSetAtom(removeJobAtom);

  // Garantir que file parts sejam preservados quando useChat adiciona mensagem
  useEffect(() => {
    // Encontrar a mensagem mais recente do usuário que não tem file parts
    const userMessages = messages.filter((msg) => msg.role === 'user');
    if (userMessages.length === 0) return;

    const mostRecentUserMessage = userMessages[userMessages.length - 1];
    const hasFileParts = mostRecentUserMessage.parts?.some((part) => part.type === 'file');
    
    // Se a mensagem mais recente não tem file parts, verificar se temos file parts pendentes
    if (!hasFileParts && pendingFilePartsRef.current.size > 0) {
      // Pegar os file parts mais recentes (último valor no map)
      const pendingEntries = Array.from(pendingFilePartsRef.current.entries());
      if (pendingEntries.length > 0) {
        const [tempId, pendingFileParts] = pendingEntries[pendingEntries.length - 1];
        
        // Verificar se a mensagem foi criada recentemente (últimos 3 segundos)
        const metadata = mostRecentUserMessage.metadata as { createdAt?: string } | undefined;
        const messageCreatedAt = metadata?.createdAt 
          ? new Date(metadata.createdAt).getTime() 
          : 0;
        const messageAge = Date.now() - messageCreatedAt;
        if (messageAge < 3000) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[MULTIMODAL-INPUT] Restoring file parts to most recent message:', {
              messageId: mostRecentUserMessage.id,
              filePartsCount: pendingFileParts.length,
            });
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

          // Limpar após usar
          pendingFilePartsRef.current.delete(tempId);
        }
      }
    }
  }, [messages, setMessages]);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
    // Detectar mobile
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  // Voice recognition setup
  const {
    isListening,
    isSupported: isVoiceSupported,
    toggleListening,
  } = useVoiceRecognition({
    onTranscriptChange: (transcript, isFinal) => {
      if (isFinal) {
        // When speech is final, append to existing input with a space
        setInput((prevInput) => {
          const newInput =
            prevInput.trim() +
            (prevInput.trim() ? ' ' : '') +
            transcript.trim();
          return newInput;
        });
        setInterimTranscript(''); // Clear interim results
        setTimeout(adjustHeight, 0); // Adjust height after adding text
      } else {
        // Show interim results in real-time
        setInterimTranscript(transcript);
      }
    },
    onError: (error) => {
      console.error('Voice recognition error:', error);
      toast.error(`Erro na gravação de voz: ${error}`);
      setInterimTranscript('');
    },
  });

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    // Normalizar fileUIParts para garantir formato correto
    const normalizeFilePart = (part: any) => {
      // Validar estrutura mínima
      if (!part.url || !part.mediaType) {
        console.error('Invalid file part:', part);
        toast.error('Arquivo inválido: faltam campos obrigatórios');
        return null;
      }

      // Garantir que tem filename ou name
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
    };

    // Normalizar fileUIParts do atom
    const fileParts = fileUIParts
      .map(normalizeFilePart)
      .filter((part): part is NonNullable<typeof part> => part !== null);

    // Validar que temos pelo menos texto ou arquivos
    if (fileParts.length === 0 && !input.trim()) {
      toast.error('Por favor, digite uma mensagem ou anexe um arquivo');
      return;
    }

    // Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('[MULTIMODAL-INPUT] Sending message:', {
        filePartsCount: fileParts.length,
        fileParts: fileParts.map(p => ({ url: p.url, filename: p.filename, mediaType: p.mediaType })),
        hasText: !!input.trim(),
      });
    }

    // Criar mensagem completa com file parts
    // O useChat vai gerar o ID automaticamente, então não precisamos especificar
    const messageToSend = {
      role: 'user' as const,
      parts: [
        ...fileParts,
        ...(input.trim() ? [{
          type: 'text' as const,
          text: input.trim(),
        }] : []),
      ],
    };

    // Log para debug
    if (process.env.NODE_ENV === 'development') {
      console.log('[MULTIMODAL-INPUT] Sending message with parts:', {
        partsCount: messageToSend.parts.length,
        filePartsCount: fileParts.length,
        hasText: !!input.trim(),
        fileParts: fileParts.map(p => ({ url: p.url, filename: p.filename })),
      });
    }

    // Enviar mensagem (useChat vai gerar o ID automaticamente)
    sendMessage(messageToSend);

    // Armazenar file parts temporariamente para restaurar depois
    // O useChat pode não preservar file parts, então vamos restaurá-los no useEffect
    if (fileParts.length > 0) {
      // Usar um ID temporário que será substituído pelo ID gerado pelo useChat
      // Vamos usar um timestamp para rastrear a mensagem mais recente
      const tempId = `temp-${Date.now()}`;
      pendingFilePartsRef.current.set(tempId, fileParts);
      
      // Limpar após 5 segundos (tempo suficiente para useChat processar)
      setTimeout(() => {
        pendingFilePartsRef.current.delete(tempId);
      }, 5000);
    }

    // Remover jobs do atom após envio (usar fileParts normalizados)
    if (fileParts.length > 0 && fileUIParts.length > 0) {
      // Mapear fileParts enviados para jobIds através da URL
      const sentUrls = new Set(fileParts.map(part => part.url));
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

      // Remover cada job do atom
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
    input,
    setInput,
    fileUIParts,
    uploadFileJobResult,
    removeJob,
    sendMessage,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

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
    [],
  );

  const { isAtBottom, scrollToBottom } = useScrollToBottom();

  useEffect(() => {
    if (status === 'submitted') {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  const displayValue =
    input + (interimTranscript && isListening ? ` ${interimTranscript}` : '');

  return (
    <div className="relative w-full flex flex-col gap-4">
      <AnimatePresence>
        {!isAtBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute left-1/2 bottom-28 -translate-x-1/2 z-50"
          >
            <Button
              data-testid="scroll-to-bottom-button"
              className="rounded-full"
              size="icon"
              variant="outline"
              onClick={(event) => {
                event.preventDefault();
                scrollToBottom();
              }}
            >
              <ChevronDownIcon />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {messages.length === 0 &&
        fileUIParts.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions sendMessage={sendMessage} chatId={chatId} />
        )}

      <UploadedDocumentsPreview />

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />



      <div className="flex flex-col gap-2 max-w-3xl mx-auto w-full px-4 md:px-0">
        
        <div className="flex-1 relative">
          <UploadButton
            disabled={status !== 'ready'}
            selectedChatModel={selectedChatModel}
          />
          <Textarea
            data-testid="multimodal-input"
            ref={textareaRef}
            placeholder={isMobile ? "Como posso ajudar?" : "Como posso ajudar?"}
            value={displayValue}
            onChange={handleInput}
className={`pl-12 pr-12 py-3 text-base border rounded-2xl transition-all duration-200 resize-none min-h-[52px] max-h-[52px] font-light
  border-zinc-200 dark:border-white/10
  bg-white dark:bg-[#111315]
  text-zinc-900 dark:text-white
  placeholder:text-zinc-400 dark:placeholder:text-white/40
  hover:border-zinc-300 dark:hover:border-white/20
  focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-zinc-300 dark:focus:border-white/10 focus-visible:ring-0 focus-visible:ring-offset-0
  shadow-sm
  ${interimTranscript && isListening ? 'text-zinc-500 dark:text-zinc-400' : ''}
`}
            rows={1}
            autoFocus
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();

                if (status !== 'ready') {
                  toast.error(
                    'Please wait for the model to finish its response!',
                  );
                } else {
                  submitForm();
                }
              }
            }}
          />

          {/* Indicador de gravação */}
          {isListening && (
            <div className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-2 text-red-500 text-xs">
              <div className="size-2 bg-red-500 rounded-full animate-pulse" />
            </div>
          )}

          {/* Botão de ação (Enviar ou Microfone) */}
          {status === 'submitted' ? (
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
          ) : input.length > 0 ? (
            <Button
              data-testid="send-button"
              onClick={(event) => {
                event.preventDefault();
                submitForm();
              }}
              disabled={uploadQueue.length > 0}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-8 rounded-full disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed p-0 transition-all duration-200 bg-[#8F5BFF] hover:bg-[#A970FF] enabled:hover:shadow-lg enabled:hover:shadow-[#8F5BFF]/40 text-white"
              title="Enviar mensagem"
            >
              <SendIcon size={14} />
            </Button>
          ) : (
            isVoiceSupported && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleListening}
                disabled={status !== 'ready'}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-8 text-zinc-500 dark:text-white/50 hover:text-[#8F5BFF] hover:bg-transparent p-0"
                title="Gravar áudio"
              >
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;

    return true;
  },
);
