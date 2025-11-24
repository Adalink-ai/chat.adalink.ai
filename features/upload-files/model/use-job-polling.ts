'use client';

import { useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { POLL_INTERVAL, MAX_POLL_ATTEMPTS } from '../config/constants';
import type { Job } from './types';

export function useJobPolling() {
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const pollForResult = useCallback(
    async (jobId: string, fileName: string) => {
      const config = {
        maxAttempts: MAX_POLL_ATTEMPTS,
        pollInterval: POLL_INTERVAL,
      };

      let attempts = 0;
      const pollingStartTime = Date.now();

      console.log('[POLLING] 🔍 Starting polling:', {
        jobId,
        fileName,
        maxAttempts: config.maxAttempts,
        pollInterval: `${config.pollInterval}ms`,
      });

      const poll = async () => {
        const pollStartTime = Date.now();

        if (attempts >= config.maxAttempts) {
          const totalDuration = Date.now() - pollingStartTime;
          const errorMessage = 'Tempo limite de processamento excedido';

          console.error('[POLLING] ❌ Max attempts reached:', {
            jobId,
            fileName,
            attempts,
            totalDuration: `${totalDuration}ms`,
          });

          toast.dismiss('upload-progress');
          toast.error('Tempo limite excedido', {
            description: errorMessage,
          });

          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          return;
        }

        try {
          console.log('[POLLING] 📡 Polling job status:', {
            jobId,
            attempt: attempts + 1,
            maxAttempts: config.maxAttempts,
          });

          const response = await fetch(`/api/files/job-status/${jobId}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `Erro ${response.status}: ${response.statusText}`;
            
            console.error('[POLLING] ❌ Failed to fetch job status, stopping polling:', {
              jobId,
              fileName,
              status: response.status,
              statusText: response.statusText,
              error: errorData,
            });

            toast.dismiss('upload-progress');
            toast.error('Erro ao verificar status', {
              description: errorMessage,
            });

            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            return;
          }

          const job: Job = await response.json();
          const pollDuration = Date.now() - pollStartTime;

          console.log('[POLLING] 📊 Job status received:', {
            jobId,
            attempt: attempts + 1,
            status: job.status,
            duration: `${pollDuration}ms`,
            hasResult: !!job.result,
            hasError: !!job.error,
          });

          if (job.status === 'complete') {
            const totalDuration = Date.now() - pollingStartTime;
            console.log('[POLLING] ✅ Job completed:', {
              jobId,
              fileName,
              attempts: attempts + 1,
              totalDuration: `${totalDuration}ms`,
              result: job.result,
            });

            toast.dismiss('upload-progress');
            toast.success('Upload concluído!', {
              description: 'Arquivo processado com sucesso',
            });

            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            return;
          } else if (job.status === 'error') {
            const totalDuration = Date.now() - pollingStartTime;
            const errorMessage = job.error || 'Erro ao processar arquivo';

            console.error('[POLLING] ❌ Job failed:', {
              jobId,
              fileName,
              attempts: attempts + 1,
              totalDuration: `${totalDuration}ms`,
              error: errorMessage,
            });

            toast.dismiss('upload-progress');
            toast.error('Erro no processamento', {
              description: errorMessage,
            });

            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            return;
          }

          // Still pending or processing
          console.log('[POLLING] ⏳ Job still processing:', {
            jobId,
            status: job.status,
            attempt: attempts + 1,
          });

          attempts++;
        } catch (error) {
          const pollDuration = Date.now() - pollStartTime;
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

          console.error('[POLLING] ❌ Poll error, stopping polling immediately:', {
            jobId,
            fileName,
            attempt: attempts + 1,
            error: errorMessage,
            duration: `${pollDuration}ms`,
          });

          toast.dismiss('upload-progress');
          toast.error('Erro ao verificar status', {
            description: errorMessage,
          });

          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          return;
        }
      };

      // First poll immediately
      console.log('[POLLING] 🚀 Starting immediate poll...');
      poll();
      // Then poll at intervals
      pollIntervalRef.current = setInterval(poll, config.pollInterval);
      console.log('[POLLING] ⏰ Polling interval set:', {
        interval: `${config.pollInterval}ms`,
      });
    },
    []
  );

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      console.log('[POLLING] 🛑 Stopping polling interval');
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  return {
    pollForResult,
    stopPolling,
  };
}

