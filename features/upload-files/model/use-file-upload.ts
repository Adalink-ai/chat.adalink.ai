'use client';

import { useState, useRef, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { toast } from 'sonner';
import { MAX_FILE_SIZE, MAX_FILES } from '../config/constants';
import { useJobPolling } from './use-job-polling';
import { uploadFileToS3 } from '../lib/upload-file';

export function useFileUpload(selectedChatModel?: string) {
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
        console.warn('[UPLOAD HOOK] ⚠️ No files selected');
        toast.error('Por favor, selecione pelo menos um arquivo');
      }
      return;
    }

    const uploadStartTime = Date.now();
    console.log('[UPLOAD HOOK] 🚀 Starting upload process:', {
      fileCount: selectedFiles.length,
      files: selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
    });

    setIsUploading(true);

    try {
      const filesToUpload = [...selectedFiles];
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        console.log('[UPLOAD HOOK] 📤 Uploading file:', {
          index: i + 1,
          total: filesToUpload.length,
          fileName: file.name,
        });

        const success = await uploadFileToS3({
          file,
          pollForResult,
          selectedChatModel,
        });

        if (success) {
          successCount++;
          console.log('[UPLOAD HOOK] ✅ File upload succeeded:', {
            fileName: file.name,
            index: i + 1,
            total: filesToUpload.length,
          });
        } else {
          failureCount++;
          console.error('[UPLOAD HOOK] ❌ File upload failed:', {
            fileName: file.name,
            index: i + 1,
            total: filesToUpload.length,
          });
        }
      }

      const totalDuration = Date.now() - uploadStartTime;
      console.log('[UPLOAD HOOK] 📊 Upload process complete:', {
        totalFiles: filesToUpload.length,
        successCount,
        failureCount,
        totalDuration: `${totalDuration}ms`,
      });

      if (successCount > 0) {
        toast.success(`${successCount} arquivo(s) enviado(s) com sucesso!`);
      }

      setSelectedFiles([]);
      onClose();
    } catch (error) {
      const totalDuration = Date.now() - uploadStartTime;
      console.error('[UPLOAD HOOK] ❌ Upload process error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        totalDuration: `${totalDuration}ms`,
      });
    } finally {
      setIsUploading(false);
      console.log('[UPLOAD HOOK] 🏁 Upload process finished');
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

