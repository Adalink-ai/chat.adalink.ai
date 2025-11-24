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
  const startTime = Date.now();
  console.log('[UPLOAD CLIENT] 🚀 Starting upload:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });

  try {
    // Step 1: Get presigned URL from API
    console.log('[UPLOAD CLIENT] 📡 Step 1: Requesting presigned URL...');
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
      const error = await initResponse.json().catch(() => ({}));
      console.error('[UPLOAD CLIENT] ❌ Failed to get presigned URL:', {
        status: initResponse.status,
        statusText: initResponse.statusText,
        error,
      });
      throw new Error(error?.error || `Falha ao inicializar upload de ${file.name}`);
    }

    const { uploadUrl, workerUrl, jobId, key, publicUrl }: PresignedUploadResponse =
      await initResponse.json();

    console.log('[UPLOAD CLIENT] ✅ Step 1 complete - Presigned URL received:', {
      jobId,
      key,
      uploadUrlLength: uploadUrl.length,
      workerUrl,
    });

    // Step 2: Upload directly to S3 using presigned URL
    console.log('[UPLOAD CLIENT] 📤 Step 2: Uploading to S3...');
    const s3UploadStartTime = Date.now();
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    const s3UploadDuration = Date.now() - s3UploadStartTime;

    if (!uploadResponse.ok) {
      console.error('[UPLOAD CLIENT] ❌ S3 upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        duration: `${s3UploadDuration}ms`,
      });
      throw new Error(`Falha ao enviar ${file.name} para S3`);
    }

    console.log('[UPLOAD CLIENT] ✅ Step 2 complete - File uploaded to S3:', {
      key,
      duration: `${s3UploadDuration}ms`,
      size: file.size,
    });

    // Step 3: Notify worker to process the file (if workerUrl is provided)
    if (workerUrl) {
      try {
        console.log('[UPLOAD CLIENT] 👷 Step 3: Notifying worker...');
        const workerPayload = {
          s3Key: key,
          jobId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
        };

        const workerStartTime = Date.now();
        const workerResponse = await fetch(workerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workerPayload),
        });

        const workerDuration = Date.now() - workerStartTime;

        if (!workerResponse.ok) {
          console.warn('[UPLOAD CLIENT] ⚠️ Worker notification failed:', {
            status: workerResponse.status,
            statusText: workerResponse.statusText,
            duration: `${workerDuration}ms`,
            fileName: file.name,
          });
          // Don't throw - upload succeeded, worker notification is optional
        } else {
          console.log('[UPLOAD CLIENT] ✅ Step 3 complete - Worker notified:', {
            jobId,
            duration: `${workerDuration}ms`,
          });

          // Step 4: Start polling for job status after worker notification
          console.log('[UPLOAD CLIENT] 🔄 Step 4: Starting job polling...');
          toast.loading('Processando arquivo...', {
            id: 'upload-progress',
            description: 'Aguarde enquanto o arquivo é processado',
          });
          pollForResult(jobId, file.name);
        }
      } catch (error) {
        console.warn('[UPLOAD CLIENT] ⚠️ Error notifying worker:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          fileName: file.name,
        });
        // Don't throw - upload succeeded, worker notification is optional
      }
    } else {
      console.log('[UPLOAD CLIENT] ⚠️ No worker URL provided, skipping worker notification');
    }

    const totalDuration = Date.now() - startTime;
    console.log('[UPLOAD CLIENT] ✅ Upload complete:', {
      fileName: file.name,
      key,
      publicUrl,
      jobId,
      totalDuration: `${totalDuration}ms`,
    });

    return true;
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error('[UPLOAD CLIENT] ❌ Upload failed:', {
      fileName: file.name,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      totalDuration: `${totalDuration}ms`,
    });
    toast.error(error instanceof Error ? error.message : `Falha ao enviar ${file.name}`);
    return false;
  }
}

