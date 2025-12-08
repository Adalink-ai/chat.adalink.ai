import { type Dispatch, memo, type SetStateAction, useEffect, useState } from 'react';
import { useWindowSize } from 'usehooks-ts';
import type { Vote } from '@/lib/db/schema';
import { useArtifact } from '@/hooks/use-artifact';
import { imageArtifact } from '@/artifacts/image/client';
import { codeArtifact } from '@/artifacts/code/client';
import { sheetArtifact } from '@/artifacts/sheet/client';
import { textArtifact } from '@/artifacts/text/client';
import { ArtifactSidebar } from './artifact-sidebar';
import { ArtifactHeader } from './artifact-header';
import { ArtifactContent } from './artifact-content';
import { ArtifactLayout } from './artifact-layout';
import { useArtifactDocuments } from '@/hooks/use-artifact-documents';
import { useArtifactVersions } from '@/hooks/use-artifact-versions';
import { useArtifactContent } from '@/hooks/use-artifact-content';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { Attachment, ChatMessage } from '@/lib/types';

export const artifactDefinitions = [
  textArtifact,
  codeArtifact,
  imageArtifact,
  sheetArtifact,
];
export type ArtifactKind = (typeof artifactDefinitions)[number]['kind'];

export interface UIArtifact {
  title: string;
  documentId: string;
  kind: ArtifactKind;
  content: string;
  isVisible: boolean;
  status: 'streaming' | 'idle';
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

function PureArtifact({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  sendMessage,
  messages,
  setMessages,
  regenerate,
  votes,
  isReadonly,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>['status'];
  stop: UseChatHelpers<ChatMessage>['stop'];
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  votes: Array<Vote> | undefined;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
}) {
  const { artifact, setArtifact, metadata, setMetadata } = useArtifact();
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  const {
    documents,
    document,
    currentVersionIndex,
    setCurrentVersionIndex,
    isDocumentsFetching,
  } = useArtifactDocuments(artifact, setArtifact);

  const {
    mode,
    setMode,
    isCurrentVersion,
    handleVersionChange,
    getDocumentContentById,
  } = useArtifactVersions(documents);

  const { isContentDirty, saveContent } = useArtifactContent(artifact, document);

  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind,
  );

  if (!artifactDefinition) {
    throw new Error('Artifact definition not found!');
  }

  useEffect(() => {
    if (artifact.documentId !== 'init') {
      if (artifactDefinition.initialize) {
        artifactDefinition.initialize({
          documentId: artifact.documentId,
          setMetadata,
        });
      }
    }
  }, [artifact.documentId, artifactDefinition, setMetadata]);

  return (
    <ArtifactLayout
      artifact={artifact}
      isCurrentVersion={isCurrentVersion}
      isMobile={isMobile}
      sidebar={
        <ArtifactSidebar
          chatId={chatId}
          input={input}
          setInput={setInput}
          status={status}
          stop={stop}
          attachments={attachments}
          setAttachments={setAttachments}
          messages={messages}
          setMessages={setMessages}
          sendMessage={sendMessage}
          regenerate={regenerate}
          votes={votes}
          isReadonly={isReadonly}
          artifactStatus={artifact.status}
        />
      }
      content={
        <>
          <ArtifactHeader
            artifact={artifact}
            document={document}
            isContentDirty={isContentDirty}
            currentVersionIndex={currentVersionIndex}
            isCurrentVersion={isCurrentVersion}
            mode={mode}
            metadata={metadata}
            setMetadata={setMetadata}
            handleVersionChange={handleVersionChange}
          />
          <ArtifactContent
            artifact={artifact}
            document={document}
            isCurrentVersion={isCurrentVersion}
            currentVersionIndex={currentVersionIndex}
            mode={mode}
            metadata={metadata}
            setMetadata={setMetadata}
            saveContent={saveContent}
            getDocumentContentById={getDocumentContentById}
            isDocumentsFetching={isDocumentsFetching}
            documents={documents}
            handleVersionChange={handleVersionChange}
            isToolbarVisible={isToolbarVisible}
            setIsToolbarVisible={setIsToolbarVisible}
            sendMessage={sendMessage}
            status={status}
            stop={stop}
            setMessages={setMessages}
          />
        </>
      }
    />
  );
}

export const Artifact = memo(PureArtifact, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (prevProps.input !== nextProps.input) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;

  return true;
});
