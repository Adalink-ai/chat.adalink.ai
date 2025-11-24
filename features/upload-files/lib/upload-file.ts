'use client';

import { toast } from 'sonner';
import type { PresignedUploadResponse } from '../model/types';

interface UploadFileParams {
  file: File;
  pollForResult: (jobId: string, fileName: string) => void;
}

export async function uploadFileToS3({
  file,
  pollForResult,
}: UploadFileParams): Promise<boolean> {
  try {
    // Step 1: Get presigned URL from API
    const initResponse = await fetch('/api/files/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      }),
    });

    if (!initResponse.ok) {
      const { error } = await initResponse.json().catch(() => ({}));
      throw new Error(error || `Falha ao inicializar upload de ${file.name}`);
    }

    const { uploadUrl, workerUrl, jobId, key, publicUrl }: PresignedUploadResponse =
      await initResponse.json();

    // Step 2: Upload directly to S3 using presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Falha ao enviar ${file.name} para S3`);
    }

    // Step 3: Notify worker to process the file (if workerUrl is provided)
    if (workerUrl) {
      try {
        const workerPayload = {
          s3Key: key,
          jobId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
        };

        const workerResponse = await fetch(workerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workerPayload),
        });

        if (!workerResponse.ok) {
          console.warn(`Worker notification failed for ${file.name}, but upload succeeded`);
          // Don't throw - upload succeeded, worker notification is optional
        } else {
          // Step 4: Start polling for job status after worker notification
          toast.loading('Processando arquivo...', {
            id: 'upload-progress',
            description: 'Aguarde enquanto o arquivo é processado',
          });
          pollForResult(jobId, file.name);
        }
      } catch (error) {
        console.warn(`Error notifying worker for ${file.name}:`, error);
        // Don't throw - upload succeeded, worker notification is optional
      }
    }

    console.log('File uploaded successfully:', { key, publicUrl, jobId });
    return true;
  } catch (error) {
    console.error(`Error uploading ${file.name}:`, error);
    toast.error(error instanceof Error ? error.message : `Falha ao enviar ${file.name}`);
    return false;
  }
}

