'use client';

import { motion } from 'framer-motion';
import type { FileUIPart } from 'ai';
import { cn } from '@/lib/utils';

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
  if (mediaType.startsWith('video/')) {
    return '🎥';
  }
  if (mediaType.startsWith('audio/')) {
    return '🎵';
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
  if (mediaType.startsWith('video/')) {
    return 'Vídeo';
  }
  if (mediaType.startsWith('audio/')) {
    return 'Áudio';
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
  isUserMessage?: boolean;
}

export function MessageFilePreview({ fileParts, isUserMessage = false }: MessageFilePreviewProps) {
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
    <div className={cn("flex flex-row gap-2 flex-wrap", {
      "justify-end": isUserMessage,
      "justify-start": !isUserMessage,
    })}>
      {fileParts.map((filePart, index) => {
        const filename = filePart.filename || (filePart as any).name || 'arquivo';
        const mediaType = filePart.mediaType || 'application/octet-stream';
        const url = filePart.url;
        const isImage = mediaType.startsWith('image/');
        const isVideo = mediaType.startsWith('video/');
        const isAudio = mediaType.startsWith('audio/');
        const isPDF = mediaType === 'application/pdf';

        const key = `file-${url}-${index}`;

        return (
          <motion.a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="group relative bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all duration-200 max-w-[200px] min-w-[160px] flex flex-col"
          >
            <div className="flex items-start gap-2.5">
              <div className="shrink-0 text-xl">
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
            
            {/* Preview de imagem */}
            {isImage && url && (
              <div className="mt-2 rounded overflow-hidden border border-zinc-200 dark:border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={filename}
                  className="w-full h-auto max-h-32 object-cover"
                  onError={(e) => {
                    // Fallback se a imagem não carregar
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Preview de vídeo */}
            {isVideo && url && (
              <div className="mt-2 rounded overflow-hidden border border-zinc-200 dark:border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <video
                  src={url}
                  className="w-full h-auto max-h-32 object-cover"
                  controls={false}
                  preload="metadata"
                >
                  Seu navegador não suporta vídeo.
                </video>
              </div>
            )}

            {/* Preview de áudio */}
            {isAudio && url && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <audio
                  src={url}
                  controls
                  className="w-full"
                  preload="metadata"
                >
                  Seu navegador não suporta áudio.
                </audio>
              </div>
            )}

            {/* Indicador para PDF */}
            {isPDF && (
              <div className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
                Clique para abrir PDF
              </div>
            )}
          </motion.a>
        );
      })}
    </div>
  );
}

