'use client';

import { useState, useRef, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { toast } from 'sonner';
import { MAX_FILE_SIZE, MAX_FILES } from '../config/constants';
import { useJobPolling } from './use-job-polling';
import { uploadFileToS3 } from '../lib/upload-file';

export function useFileUpload() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pollForResult, stopPolling } = useJobPolling();

  const addFiles = useCallback((newFiles: File[]) => {
    if (isUploading) return;

    setSelectedFiles((prev) => {
      const currentCount = prev.length;
      const validFiles: File[] = [];
      let oversizedCount = 0;
      let skippedCount = 0;

      for (const file of newFiles) {
        if (currentCount + validFiles.length >= MAX_FILES) {
          skippedCount++;
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          oversizedCount++;
          continue;
        }

        validFiles.push(file);
      }

      if (oversizedCount > 0) {
        toast.error(`${oversizedCount} arquivo(s) excedem o tamanho máximo de 20MB`);
      }
      if (skippedCount > 0) {
        toast.error(`Limite máximo de ${MAX_FILES} arquivos atingido. ${skippedCount} arquivo(s) não foram adicionados.`);
      }

      return [...prev, ...validFiles];
    });
  }, [isUploading]);

  const handleFileSelect = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      addFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addFiles]);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isUploading) {
      setIsDragging(true);
    }
  }, [isUploading]);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget === event.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (isUploading) return;

    const files = Array.from(event.dataTransfer.files || []);
    if (files.length > 0) {
      addFiles(files);
    }
  }, [isUploading, addFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    if (isUploading) return;
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, [isUploading]);

  const handleUpload = useCallback(async (onClose: () => void) => {
    if (isUploading || selectedFiles.length === 0) {
      if (selectedFiles.length === 0) {
        toast.error('Por favor, selecione pelo menos um arquivo');
      }
      return;
    }

    setIsUploading(true);

    try {
      const filesToUpload = [...selectedFiles];
      let successCount = 0;

      for (const file of filesToUpload) {
        const success = await uploadFileToS3({
          file,
          pollForResult,
        });
        if (success) {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} arquivo(s) enviado(s) com sucesso!`);
      }

      setSelectedFiles([]);
      onClose();
    } finally {
      setIsUploading(false);
    }
  }, [isUploading, selectedFiles, pollForResult]);

  const clearFiles = useCallback(() => {
    if (!isUploading) {
      setSelectedFiles([]);
    }
    // Clean up polling interval
    stopPolling();
  }, [isUploading, stopPolling]);

  return {
    selectedFiles,
    isUploading,
    isDragging,
    fileInputRef,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveFile,
    handleUpload,
    clearFiles,
  };
}

