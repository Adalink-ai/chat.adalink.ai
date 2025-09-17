'use client';

import { useRef } from 'react';
import { Button } from './ui/button';
import { PaperclipIcon, MicrophoneIcon } from './icons';

interface ActionButtonsProps {
  onFileSelect?: (files: FileList) => void;
  onMicrophoneClick?: () => void;
  disabled?: boolean;
  isVoiceSupported?: boolean;
  isListening?: boolean;
}

export function ActionButtons({
  onFileSelect,
  onMicrophoneClick,
  disabled = false,
  isVoiceSupported = false,
  isListening = false,
}: ActionButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && onFileSelect) {
      onFileSelect(files);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  return (
    <div className="flex gap-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        onClick={handleFileClick}
        disabled={disabled}
        title="Anexar arquivo"
      >
        <PaperclipIcon size={18} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`size-10 transition-all duration-200 ${
          isListening
            ? 'text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 animate-pulse'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
        onClick={onMicrophoneClick}
        disabled={disabled || !isVoiceSupported}
        title={
          !isVoiceSupported
            ? 'Gravação de voz não suportada neste navegador'
            : isListening
              ? 'Parar gravação'
              : 'Iniciar gravação de voz'
        }
      >
        <MicrophoneIcon size={18} />
        {isListening && (
          <div className="absolute -top-1 -right-1 size-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </Button>
    </div>
  );
}
