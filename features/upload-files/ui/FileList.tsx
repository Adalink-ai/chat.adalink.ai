import { File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MAX_FILES } from '../config/constants';

interface FileListProps {
  files: File[];
  isUploading: boolean;
  onRemove: (index: number) => void;
}

export function FileList({ files, isUploading, onRemove }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Arquivos selecionados ({files.length}/{MAX_FILES}):</p>
      <div className="max-h-48 overflow-y-auto overflow-x-hidden space-y-2 border rounded-md p-3">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="flex items-center justify-between gap-2 p-2 bg-muted rounded-md w-full min-w-0"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
              <File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="text-sm truncate min-w-0" title={file.name}>
                {file.name}
              </span>
              <span className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={() => onRemove(index)}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

