'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import type { Document } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import type { UIArtifact } from '@/components/artifact';

export function useArtifactDocuments(
  artifact: UIArtifact,
  setArtifact: (updater: (current: UIArtifact) => UIArtifact) => void,
) {
  const {
    data: documents,
    isLoading: isDocumentsFetching,
    mutate: mutateDocuments,
  } = useSWR<Array<Document>>(
    artifact.documentId !== 'init' && artifact.status !== 'streaming'
      ? `/api/document?id=${artifact.documentId}`
      : null,
    fetcher,
  );

  const [document, setDocument] = useState<Document | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  useEffect(() => {
    if (documents && documents.length > 0) {
      const mostRecentDocument = documents.at(-1);

      if (mostRecentDocument) {
        setDocument(mostRecentDocument);
        setCurrentVersionIndex(documents.length - 1);
        setArtifact((currentArtifact) => ({
          ...currentArtifact,
          content: mostRecentDocument.content ?? '',
        }));
      }
    }
  }, [documents, setArtifact]);

  useEffect(() => {
    mutateDocuments();
  }, [artifact.status, mutateDocuments]);

  return {
    documents,
    document,
    currentVersionIndex,
    setDocument,
    setCurrentVersionIndex,
    isDocumentsFetching,
    mutateDocuments,
  };
}

