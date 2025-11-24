'use client';

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFileUpload } from '../model/use-file-upload';
import { DropZone } from './DropZone';
import { FileList } from './FileList';
import { MAX_FILES } from '../config/constants';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

export function UploadModal({ open, onClose }: UploadModalProps) {
  const {
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
  } = useFileUpload();

  const handleOpenChange = (newOpen: boolean) => {
    // Only handle close (when newOpen is false)
    if (!newOpen) {
      if (!isUploading) {
        clearFiles();
        onClose();
      }
      // If uploading, prevent close by not calling onClose
      // The Dialog will remain open because parent's open prop hasn't changed
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      clearFiles();
      onClose();
    }
  };

  const handleUploadClick = () => {
    handleUpload(onClose);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Arquivos</DialogTitle>
          <DialogDescription>
            Arraste e solte arquivos aqui ou clique para selecionar. Máximo de {MAX_FILES} arquivos e 20MB por arquivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <DropZone
            isDragging={isDragging}
            isUploading={isUploading}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
          <FileList
            files={selectedFiles}
            isUploading={isUploading}
            onRemove={handleRemoveFile}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleUploadClick}
            disabled={selectedFiles.length === 0 || isUploading}
            className="bg-[#8F5BFF] hover:bg-[#A970FF] text-white"
          >
            {isUploading ? 'Enviando...' : `Enviar ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

