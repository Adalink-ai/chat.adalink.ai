import { Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { RefObject, ChangeEvent, DragEvent } from 'react';

interface DropZoneProps {
  isDragging: boolean;
  isUploading: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}

export function DropZone({
  isDragging,
  isUploading,
  fileInputRef,
  onFileSelect,
  onDragOver,
  onDragLeave,
  onDrop,
}: DropZoneProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }}
      className={`
        relative border-2 border-dashed rounded-lg p-8 transition-colors
        ${isDragging 
          ? 'border-[#8F5BFF] bg-[#8F5BFF]/10' 
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }
        ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
      `}
      onClick={() => !isUploading && fileInputRef.current?.click()}
    >
      <Input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={onFileSelect}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json"
      />
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <div className={`
          p-4 rounded-full transition-colors
          ${isDragging ? 'bg-[#8F5BFF]/20' : 'bg-muted'}
        `}>
          <Upload className={`h-6 w-6 ${isDragging ? 'text-[#8F5BFF]' : 'text-muted-foreground'}`} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos aqui ou clique para selecionar'}
          </p>
          <p className="text-xs text-muted-foreground">
            Suporta imagens, vídeos, áudios, PDFs e documentos (máx. 10 arquivos, 20MB cada)
          </p>
        </div>
      </div>
    </div>
  );
}

