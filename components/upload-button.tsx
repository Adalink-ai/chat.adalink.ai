'use client';

import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';
import { UploadModal } from '@/features/upload-files';
import { extractModelInfo } from '@/features/upload-files/lib/model-info';

interface UploadButtonProps {
  disabled?: boolean;
  selectedChatModel?: string;
}

export function UploadButton({  disabled = false, selectedChatModel }: UploadButtonProps) {
  // Ocultar botão para providers que não suportam upload de arquivos (XAI e ZAI)
  if (selectedChatModel) {
    const { provider } = extractModelInfo(selectedChatModel);
    if (provider === 'xai' || provider === 'zai') {
      return null;
    }
  }

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleClick = useCallback(() => {
    setIsUploadModalOpen(true);
  }, []);


  return (
    <>
    <Button
      variant="ghost"
      size="icon"
      onClick={(event) => {
        event.preventDefault();
        handleClick();
      }}
      disabled={disabled}
      className="absolute left-3 top-1/2 -translate-y-1/2 size-8 text-zinc-500 dark:text-white/50 hover:text-[#8F5BFF] hover:bg-transparent p-0"
      title="Abrir modal de upload"
    >
      <Plus size={18} />
    </Button>

    <UploadModal
      open={isUploadModalOpen}
      onClose={() => setIsUploadModalOpen(false)}
      selectedChatModel={selectedChatModel}
    />
    </>
  );
}

