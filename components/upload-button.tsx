'use client';

import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';
import { UploadModal } from '@/features/upload-files';

interface UploadButtonProps {
  disabled?: boolean;
}

export function UploadButton({  disabled = false }: UploadButtonProps) {

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
    />
    </>
  );
}

