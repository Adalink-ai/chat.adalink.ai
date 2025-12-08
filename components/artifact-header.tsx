'use client';

import { formatDistance } from 'date-fns';
import { ArtifactActions } from './artifact-actions';
import { ArtifactCloseButton } from './artifact-close-button';
import type { Document } from '@/lib/db/schema';
import type { UIArtifact } from './artifact';

interface ArtifactHeaderProps {
  artifact: UIArtifact;
  document: Document | null;
  isContentDirty: boolean;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  mode: 'edit' | 'diff';
  metadata: any;
  setMetadata: (metadata: any) => void;
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
}

export function ArtifactHeader({
  artifact,
  document,
  isContentDirty,
  currentVersionIndex,
  isCurrentVersion,
  mode,
  metadata,
  setMetadata,
  handleVersionChange,
}: ArtifactHeaderProps) {
  return (
    <div className="p-2 flex flex-row justify-between items-start">
      <div className="flex flex-row gap-4 items-start">
        <ArtifactCloseButton />

        <div className="flex flex-col">
          <div className="font-medium">{artifact.title}</div>

          {isContentDirty ? (
            <div className="text-sm text-muted-foreground">Saving changes...</div>
          ) : document ? (
            <div className="text-sm text-muted-foreground">
              {`Updated ${formatDistance(new Date(document.createdAt), new Date(), {
                addSuffix: true,
              })}`}
            </div>
          ) : (
            <div className="w-32 h-3 mt-2 bg-muted-foreground/20 rounded-md animate-pulse" />
          )}
        </div>
      </div>

      <ArtifactActions
        artifact={artifact}
        currentVersionIndex={currentVersionIndex}
        handleVersionChange={handleVersionChange}
        isCurrentVersion={isCurrentVersion}
        mode={mode}
        metadata={metadata}
        setMetadata={setMetadata}
      />
    </div>
  );
}

