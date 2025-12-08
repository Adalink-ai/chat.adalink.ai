'use client';

import { useState, useCallback } from 'react';
import type { Document } from '@/lib/db/schema';

export function useArtifactVersions(documents: Array<Document> | undefined) {
  const [mode, setMode] = useState<'edit' | 'diff'>('edit');
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  const isCurrentVersion =
    documents && documents.length > 0
      ? currentVersionIndex === documents.length - 1
      : true;

  const handleVersionChange = useCallback(
    (type: 'next' | 'prev' | 'toggle' | 'latest') => {
      if (!documents) return;

      if (type === 'latest') {
        setCurrentVersionIndex(documents.length - 1);
        setMode('edit');
      }

      if (type === 'toggle') {
        setMode((mode) => (mode === 'edit' ? 'diff' : 'edit'));
      }

      if (type === 'prev') {
        if (currentVersionIndex > 0) {
          setCurrentVersionIndex((index) => index - 1);
        }
      } else if (type === 'next') {
        if (currentVersionIndex < documents.length - 1) {
          setCurrentVersionIndex((index) => index + 1);
        }
      }
    },
    [documents, currentVersionIndex],
  );

  function getDocumentContentById(index: number) {
    if (!documents) return '';
    if (!documents[index]) return '';
    return documents[index].content ?? '';
  }

  return {
    mode,
    setMode,
    currentVersionIndex,
    setCurrentVersionIndex,
    isCurrentVersion,
    handleVersionChange,
    getDocumentContentById,
  };
}

