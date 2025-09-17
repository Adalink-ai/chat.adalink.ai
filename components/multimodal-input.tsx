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

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
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

      <div className="flex items-center gap-4">
        <ActionButtons
          onFileSelect={(files) => {
            if (fileInputRef.current) {
              fileInputRef.current.files = files;
              handleFileChange({
                target: { files },
              } as ChangeEvent<HTMLInputElement>);
            }
          }}
          onMicrophoneClick={toggleListening}
          isVoiceSupported={isVoiceSupported}
          isListening={isListening}
          disabled={status !== 'ready'}
        />

        <div className="flex-1 relative">
          <Textarea
            data-testid="multimodal-input"
            ref={textareaRef}
            placeholder="Digite sua mensagem ou use o microfone..."
            value={displayValue}
            onChange={handleInput}
            className={`pr-16 py-4 px-6 text-base border border-gray-200 dark:border-purple-custom-500 rounded-lg shadow-sm transition-all duration-200 resize-none min-h-[60px] bg-background text-foreground focus:border-gray-300 dark:focus:border-purple-custom-500 focus:ring-0 focus:outline-none ${
              interimTranscript && isListening ? 'text-gray-600' : ''
            }`}
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

          {isListening && (
            <div className="absolute right-16 top-1/2 -translate-y-1/2 flex items-center gap-2 text-red-500 text-sm">
              <div className="size-2 bg-red-500 rounded-full animate-pulse" />
              <span>Ouvindo...</span>
            </div>
          )}

          {status === 'submitted' ? (
            <Button
              data-testid="stop-button"
              className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-red-500 hover:bg-red-600 text-white p-0"
              onClick={(event) => {
                event.preventDefault();
                stop();
                setMessages((messages) => messages);
              }}
              title="Parar"
            >
              <StopIcon size={16} />
            </Button>
          ) : (
            <Button
              data-testid="send-button"
              onClick={(event) => {
                event.preventDefault();
                submitForm();
              }}
              disabled={input.length === 0 || uploadQueue.length > 0}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-lg disabled:bg-muted disabled:cursor-not-allowed p-0 transition-colors duration-200 bg-purple-custom-500 hover:bg-purple-custom-600 enabled:hover:bg-purple-custom-600 text-white"
              title="Enviar mensagem"
            >
              <SendIcon size={16} />
            </Button>
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
