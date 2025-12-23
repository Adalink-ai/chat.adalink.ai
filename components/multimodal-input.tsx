'use client';

import { useEffect, useState, memo } from 'react';
import type { UIMessage } from 'ai';
import type { Dispatch, SetStateAction } from 'react';
import { SuggestedActions } from './suggested-actions';
import { UploadButton } from './upload-button';
import { UploadedDocumentsPreview } from './uploaded-documents-preview';
import { ScrollToBottomButton } from './scroll-to-bottom-button';
import { ChatTextarea } from './chat-textarea';
import { InputActions } from './input-actions';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import type { ChatMessage } from '@/lib/types';
import { useTextareaAutoResize } from '@/hooks/use-textarea-auto-resize';
import { useFileHandling } from '@/hooks/use-file-handling';
import { useMessageSubmit } from '@/hooks/use-message-submit';
import { ConnectorsModal } from './connectors-modal';
import { UploadModal } from '@/features/upload-files';

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
  const [isMobile, setIsMobile] = useState(false);
  const [showConnectorsModal, setShowConnectorsModal] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  
  const {
    textareaRef,
    adjustHeight,
    resetHeight,
    setLocalStorageInput,
  } = useTextareaAutoResize(input, setInput);

  const {
    fileUIParts,
    uploadFileJobResult,
    uploadQueue,
    pendingFilePartsRef,
    normalizeFilePart,
    handleFileChange,
    removeJob,
  } = useFileHandling({ messages, setMessages });

  const submitForm = useMessageSubmit({
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
  });

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adjustHeight]);

  const { scrollToBottom } = useScrollToBottom();

  useEffect(() => {
    if (status === 'submitted') {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  return (
    <div className="relative w-full flex flex-col gap-4">
      <ScrollToBottomButton />

      {messages.length === 0 &&
        fileUIParts.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions sendMessage={sendMessage} chatId={chatId} />
        )}

      <UploadedDocumentsPreview />

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      <div className="flex flex-col gap-2 max-w-3xl mx-auto w-full px-4 md:px-0">
        <div className="flex-1 relative">
          <UploadButton
            disabled={status !== 'ready'}
            selectedChatModel={selectedChatModel}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onOpenConnectors={() => setShowConnectorsModal(true)}
          />
          <ChatTextarea
            textareaRef={textareaRef}
            value={input}
            onChange={setInput}
            adjustHeight={adjustHeight}
            status={status}
            onSubmit={submitForm}
            isMobile={isMobile}
          />
          <InputActions
            input={input}
            setInput={setInput}
            status={status}
            stop={stop}
            setMessages={setMessages}
            onSubmit={submitForm}
            uploadQueueLength={uploadQueue.length}
            adjustHeight={adjustHeight}
          />
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        selectedChatModel={selectedChatModel}
      />

      {/* Connectors Modal */}
      <ConnectorsModal
        open={showConnectorsModal}
        onOpenChange={setShowConnectorsModal}
      />
    </div>
  );
}

export const MultimodalInput = memo(PureMultimodalInput);
