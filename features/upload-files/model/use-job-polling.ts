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

      console.log('🔍 Iniciando polling para jobId:', jobId);

      const poll = async () => {
        if (attempts >= config.maxAttempts) {
          const errorMessage = 'Tempo limite de processamento excedido';

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
          const response = await fetch(`/api/files/job-status/${jobId}`);

          if (!response.ok) {
            throw new Error('Falha ao verificar status');
          }

          const job: Job = await response.json();

          console.log(`📊 Poll attempt ${attempts + 1}: status=${job.status}`);

          if (job.status === 'complete') {
            console.log('✅ Upload completo! Arquivo:', fileName);

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
            const errorMessage = job.error || 'Erro ao processar arquivo';

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

          attempts++;
        } catch (error) {
          attempts++;

          if (attempts >= config.maxAttempts) {
            const errorMessage = 'Falha na comunicação com o servidor';
            toast.dismiss('upload-progress');
            toast.error('Erro de comunicação', {
              description: errorMessage,
            });

            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        }
      };

      // First poll immediately
      poll();
      // Then poll at intervals
      pollIntervalRef.current = setInterval(poll, config.pollInterval);
    },
    []
  );

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  return {
    pollForResult,
    stopPolling,
  };
}

