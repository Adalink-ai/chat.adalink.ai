'use client';

import { Plus, Paperclip, Plug } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { extractModelInfo } from '@/features/upload-files/lib/model-info';

interface UploadButtonProps {
  disabled?: boolean;
  selectedChatModel?: string;
  onOpenUpload?: () => void;
  onOpenConnectors?: () => void;
}

export function UploadButton({
  disabled = false,
  selectedChatModel,
  onOpenUpload,
  onOpenConnectors,
}: UploadButtonProps) {
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="absolute left-3 top-1/2 -translate-y-1/2 size-8 text-zinc-500 dark:text-white/50 hover:text-[#8F5BFF] hover:bg-transparent p-0"
          title="Abrir opções"
        >
          <Plus size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px]">
        {(() => {
          // Ocultar botão para providers que não suportam upload de arquivos (XAI e ZAI)
          if (selectedChatModel) {
            const { provider } = extractModelInfo(selectedChatModel);
            if (provider === 'xai' || provider === 'zai') {
              return null;
            }
          }
          return (
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                onOpenUpload?.();
              }}
              className="gap-2 cursor-pointer"
            >
              <Paperclip size={16} />
              Enviar Arquivos
            </DropdownMenuItem>
          );
        })()}
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            onOpenConnectors?.();
          }}
          className="gap-2 cursor-pointer"
        >
          <Plug size={16} />
          Conectores
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

