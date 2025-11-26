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
import { ActionButtons } from './action-buttons';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import { useVoiceRecognition } from '@/hooks/use-voice-recognition';
import type { Attachment, ChatMessage } from '@/lib/types';

function PureMultimodalInput({
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
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isMobile, setIsMobile] = useState(false);

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

  // Scroll automático quando o input recebe foco no mobile
  useEffect(() => {
    if (!isMobile || !textareaRef.current) return;

    const textarea = textareaRef.current;
    
    const scrollInputIntoView = () => {
      // Usar scrollIntoView com opções que funcionam melhor no mobile
      textarea.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Scroll adicional do window para garantir visibilidade
      setTimeout(() => {
        const inputRect = textarea.getBoundingClientRect();
        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const inputBottom = inputRect.bottom;
        
        // Se o input está abaixo da área visível (considerando teclado)
        if (inputBottom > viewportHeight - 20) {
          const scrollAmount = inputBottom - viewportHeight + 50;
          window.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
          });
        }
      }, 150);
    };
    
    const handleFocus = () => {
      // Aguardar um pouco para o teclado começar a abrir
      setTimeout(scrollInputIntoView, 100);
      setTimeout(scrollInputIntoView, 300);
    };

    // Usar Visual Viewport API se disponível (melhor para detectar teclado)
    const handleViewportResize = () => {
      if (textarea === document.activeElement) {
        scrollInputIntoView();
      }
    };

    // Fallback para resize normal
    const handleResize = () => {
      if (textarea === document.activeElement) {
        setTimeout(scrollInputIntoView, 100);
      }
    };

    textarea.addEventListener('focus', handleFocus);
    
    // Visual Viewport API (mais preciso para teclado mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
    }
    
    // Fallback para navegadores sem suporte
    window.addEventListener('resize', handleResize);

    return () => {
      textarea.removeEventListener('focus', handleFocus);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile]);

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

    sendMessage({
      role: 'user',
      parts: [
        ...attachments.map((attachment) => ({
          type: 'file' as const,
          url: attachment.url,
          name: attachment.name,
          mediaType: attachment.contentType,
        })),
        {
          type: 'text',
          text: input,
        },
      ],
    });

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();
    setInput('');

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    setInput,
    attachments,
    sendMessage,
    setAttachments,
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
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
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
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions sendMessage={sendMessage} chatId={chatId} />
        )}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          className="flex flex-row gap-2 overflow-x-scroll items-end"
        >
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 max-w-3xl mx-auto w-full px-4 md:px-0">
        <div className="flex-1 relative">
          <Textarea
            data-testid="multimodal-input"
            ref={textareaRef}
            placeholder={isMobile ? "Como posso ajudar?" : "Como posso ajudar?"}
            value={displayValue}
            onChange={handleInput}
className={`pr-12 py-3 px-4 text-base border rounded-2xl transition-all duration-200 resize-none min-h-[52px] max-h-[52px] font-light
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
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;

    return true;
  },
);
