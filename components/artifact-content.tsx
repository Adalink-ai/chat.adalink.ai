'use client';

import { AnimatePresence } from 'framer-motion';
import { Toolbar } from './toolbar';
import { VersionFooter } from './version-footer';
import { artifactDefinitions } from './artifact';
import type { Document } from '@/lib/db/schema';
import type { UIArtifact } from './artifact';

interface ArtifactContentProps {
  artifact: UIArtifact;
  document: Document | null;
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  mode: 'edit' | 'diff';
  metadata: any;
  setMetadata: (metadata: any) => void;
  saveContent: (content: string, debounce: boolean) => void;
  getDocumentContentById: (index: number) => string;
  isDocumentsFetching: boolean;
  documents: Array<Document> | undefined;
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
  isToolbarVisible: boolean;
  setIsToolbarVisible: (visible: boolean) => void;
  sendMessage: any;
  status: any;
  stop: any;
  setMessages: any;
}

export function ArtifactContent({
  artifact,
  document,
  isCurrentVersion,
  currentVersionIndex,
  mode,
  metadata,
  setMetadata,
  saveContent,
  getDocumentContentById,
  isDocumentsFetching,
  documents,
  handleVersionChange,
  isToolbarVisible,
  setIsToolbarVisible,
  sendMessage,
  status,
  stop,
  setMessages,
}: ArtifactContentProps) {
  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind,
  );

  if (!artifactDefinition) {
    throw new Error('Artifact definition not found!');
  }

  return (
    <>
      <div className="dark:bg-muted bg-background h-full overflow-y-scroll !max-w-full items-center">
        <artifactDefinition.content
          title={artifact.title}
          content={
            isCurrentVersion
              ? artifact.content
              : getDocumentContentById(currentVersionIndex)
          }
          mode={mode}
          status={artifact.status}
          currentVersionIndex={currentVersionIndex}
          suggestions={[]}
          onSaveContent={saveContent}
          isInline={false}
          isCurrentVersion={isCurrentVersion}
          getDocumentContentById={getDocumentContentById}
          isLoading={isDocumentsFetching && !artifact.content}
          metadata={metadata}
          setMetadata={setMetadata}
        />

        <AnimatePresence>
          {isCurrentVersion && (
            <Toolbar
              isToolbarVisible={isToolbarVisible}
              setIsToolbarVisible={setIsToolbarVisible}
              sendMessage={sendMessage}
              status={status}
              stop={stop}
              setMessages={setMessages}
              artifactKind={artifact.kind}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {!isCurrentVersion && (
          <VersionFooter
            currentVersionIndex={currentVersionIndex}
            documents={documents}
            handleVersionChange={handleVersionChange}
          />
        )}
      </AnimatePresence>
    </>
  );
}

