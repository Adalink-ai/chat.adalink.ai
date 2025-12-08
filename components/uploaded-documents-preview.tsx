'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { uploadFileJobResultAtom, removeJobAtom } from '@/features/upload-files/model/atoms';
import { Button } from './ui/button';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) {
    return '🖼️';
  }
  if (fileType === 'application/pdf') {
    return '📄';
  }
  if (fileType.includes('text') || fileType.includes('document')) {
    return '📝';
  }
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
    return '📊';
  }
  return '📎';
}

export function UploadedDocumentsPreview() {
  const uploadFileJobResult = useAtomValue(uploadFileJobResultAtom);
  const removeJob = useSetAtom(removeJobAtom);

  const completedJobs = uploadFileJobResult.filter(
    (job) =>
      job.status === 'complete' &&
      (job.result?.fileUrl || job.result?.url) &&
      typeof (job.result?.fileUrl || job.result?.url) === 'string'
  );

  if (completedJobs.length === 0) {
    return null;
  }

  const handleRemove = (jobId: string, fileName: string) => {
    removeJob(jobId);
  };

  return (
    <AnimatePresence mode="popLayout">
      <div className="flex flex-row gap-2 justify-center flex-wrap px-4">
        {completedJobs.map((job) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.2 }}
            className="group relative bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 max-w-[240px] min-w-[200px]"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-2xl">
                {getFileIcon(job.fileType)}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate"
                  title={job.fileName}
                >
                  {job.fileName}
                </p>
                {job.fileSize > 0 && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {formatFileSize(job.fileSize)}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(job.id, job.fileName);
                }}
                title="Remover arquivo"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}