'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { LoaderIcon, FileIcon } from './icons';
import { cn } from '@/lib/utils';

interface MessageToolCallProps {
  toolName: string;
  toolCallId: string;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  input?: any;
  output?: any;
  errorText?: string;
}

function PureMessageToolCall({
  toolName,
  toolCallId,
  state,
  input,
  output,
  errorText,
}: MessageToolCallProps) {
  const formatJson = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const getStateLabel = (): string => {
    switch (state) {
      case 'input-streaming':
        return 'Preparando...';
      case 'input-available':
        return 'Executando...';
      case 'output-available':
        return 'Concluído';
      case 'output-error':
        return 'Erro';
      default:
        return '';
    }
  };

  const isLoading = state === 'input-streaming' || state === 'input-available';
  const hasError = state === 'output-error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'border rounded-xl p-3 w-fit flex flex-row gap-3 items-start',
        {
          'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700': !hasError,
          'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800': hasError,
        }
      )}
    >
      <div className="flex-shrink-0 mt-0.5 text-zinc-500 dark:text-zinc-400">
        {isLoading ? (
          <div className="animate-spin">
            <LoaderIcon />
          </div>
        ) : (
          <FileIcon className={cn({
            'text-zinc-500 dark:text-zinc-400': !hasError,
            'text-red-500 dark:text-red-400': hasError,
          })} />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex flex-row items-center gap-2">
          <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
            {toolName}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {getStateLabel()}
          </span>
        </div>

        {input && (state === 'input-available' || state === 'input-streaming' || state === 'output-available' || state === 'output-error') && (
          <div className="text-xs">
            <div className="text-zinc-600 dark:text-zinc-400 mb-1">Input:</div>
            <pre className="bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded text-[10px] overflow-x-auto max-w-md">
              {formatJson(input)}
            </pre>
          </div>
        )}

        {state === 'output-available' && output !== undefined && (
          <div className="text-xs">
            <div className="text-zinc-600 dark:text-zinc-400 mb-1">Output:</div>
            <pre className="bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded text-[10px] overflow-x-auto max-w-md">
              {formatJson(output)}
            </pre>
          </div>
        )}

        {hasError && errorText && (
          <div className="text-xs text-red-600 dark:text-red-400">
            <div className="font-medium mb-1">Erro:</div>
            <div>{errorText}</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export const MessageToolCall = memo(PureMessageToolCall);
