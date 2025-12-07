'use client';

import { motion } from 'framer-motion';
import type { FileUIPart } from 'ai';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function getFileIcon(mediaType: string): string {
  if (mediaType.startsWith('image/')) {
    return '🖼️';
  }
  if (mediaType === 'application/pdf') {
    return '📄';
  }
  if (mediaType.includes('text') || mediaType.includes('document')) {
    return '📝';
  }
  if (mediaType.includes('spreadsheet') || mediaType.includes('excel')) {
    return '📊';
  }
  return '📎';
}

function getFileTypeLabel(mediaType: string): string {
  if (mediaType.startsWith('image/')) {
    return 'Imagem';
  }
  if (mediaType === 'application/pdf') {
    return 'PDF';
  }
  if (mediaType.includes('text')) {
    return 'Texto';
  }
  if (mediaType.includes('spreadsheet') || mediaType.includes('excel')) {
    return 'Planilha';
  }
  if (mediaType.includes('document')) {
    return 'Documento';
  }
  return 'Arquivo';
}

interface MessageFilePreviewProps {
  fileParts: FileUIPart[];
}

export function MessageFilePreview({ fileParts }: MessageFilePreviewProps) {
  // Debug: Verificar file parts recebidos
  if (process.env.NODE_ENV === 'development' && fileParts.length > 0) {
    console.log('[DEBUG] MessageFilePreview - Received file parts:', {
      count: fileParts.length,
      fileParts: fileParts.map((part) => ({
        type: part.type,
        url: part.url,
        filename: part.filename || (part as any).name,
        mediaType: part.mediaType,
      })),
    });
  }

  if (fileParts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-row gap-2 flex-wrap">
      {fileParts.map((filePart, index) => {
        const filename = filePart.filename || (filePart as any).name || 'arquivo';
        const mediaType = filePart.mediaType || 'application/octet-stream';
        const url = filePart.url;

        return (
          <motion.div
            key={`${url}-${index}`}
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="group relative bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all duration-200 max-w-[200px] min-w-[160px]"
          >
            <div className="flex items-start gap-2.5">
              <div className="flex-shrink-0 text-xl">
                {getFileIcon(mediaType)}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate"
                  title={filename}
                >
                  {filename}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {getFileTypeLabel(mediaType)}
                </p>
              </div>
            </div>
            {mediaType.startsWith('image/') && url && (
              <div className="mt-2 rounded overflow-hidden border border-zinc-200 dark:border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={filename}
                  className="w-full h-auto max-h-32 object-cover"
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

