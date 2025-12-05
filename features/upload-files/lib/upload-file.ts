'use client';

import { toast } from 'sonner';
import type { PresignedUploadResponse } from '../model/types';


interface UploadFileParams {
  file: File;
  pollForResult: (jobId: string, fileName: string) => void;
  selectedChatModel?: string;
}

export async function uploadFileToS3({
  file,
  pollForResult,
  selectedChatModel,
}: UploadFileParams): Promise<boolean> {
  const startTime = Date.now();
  
  console.log('[UPLOAD CLIENT] 🚀 Starting upload:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    llm: selectedChatModel,
    hasPollForResult: typeof pollForResult === 'function',
    timestamp: new Date().toISOString(),
  });

  try {
    // Step 1: Get presigned URL from API
    const requestPayload = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    };
    
    console.log('[UPLOAD CLIENT] 📡 Step 1: Requesting presigned URL...', {
      endpoint: '/api/files/upload',
      payload: requestPayload,
      payloadSize: JSON.stringify(requestPayload).length,
    });
    
    const initRequestStartTime = Date.now();
    const initResponse = await fetch('/api/files/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });
    const initRequestDuration = Date.now() - initRequestStartTime;
    
    console.log('[UPLOAD CLIENT] 📥 Step 1: Response received:', {
      status: initResponse.status,
      statusText: initResponse.statusText,
      ok: initResponse.ok,
      duration: `${initRequestDuration}ms`,
      headers: Object.fromEntries(initResponse.headers.entries()),
    });

    if (!initResponse.ok) {
      let errorData: any = {};
      try {
        errorData = await initResponse.json();
      } catch (e) {
        const errorText = await initResponse.text().catch(() => 'Unable to read error response');
        errorData = { error: errorText || `HTTP ${initResponse.status}: ${initResponse.statusText}` };
      }
      console.error('[UPLOAD CLIENT] ❌ Failed to get presigned URL:', {
        status: initResponse.status,
        statusText: initResponse.statusText,
        error: errorData,
      });
      throw new Error(errorData?.error || `Falha ao inicializar upload de ${file.name}`);
    }

    let responseData: PresignedUploadResponse;
    try {
      console.log('[UPLOAD CLIENT] 🔄 Parsing response JSON...');
      const jsonParseStartTime = Date.now();
      responseData = await initResponse.json();
      const jsonParseDuration = Date.now() - jsonParseStartTime;
      console.log('[UPLOAD CLIENT] ✅ JSON parsed successfully:', {
        duration: `${jsonParseDuration}ms`,
        keys: Object.keys(responseData),
      });
    } catch (e) {
      console.error('[UPLOAD CLIENT] ❌ Failed to parse response JSON:', {
        error: e instanceof Error ? e.message : String(e),
        errorType: e instanceof Error ? e.constructor.name : typeof e,
        responseStatus: initResponse.status,
        responseStatusText: initResponse.statusText,
      });
      throw new Error(`Resposta inválida do servidor ao inicializar upload de ${file.name}`);
    }

    const { uploadUrl, workerUrl, jobId, key, publicUrl } = responseData;

    console.log('[UPLOAD CLIENT] 📋 Response data received:', {
      hasUploadUrl: !!uploadUrl,
      hasWorkerUrl: !!workerUrl,
      hasJobId: !!jobId,
      hasKey: !!key,
      hasPublicUrl: !!publicUrl,
      workerUrl,
      workerUrlType: typeof workerUrl,
      responseDataKeys: Object.keys(responseData),
    });

    if (!uploadUrl || !jobId || !key) {
      console.error('[UPLOAD CLIENT] ❌ Missing required fields in response:', {
        hasUploadUrl: !!uploadUrl,
        hasJobId: !!jobId,
        hasKey: !!key,
        responseData,
      });
      throw new Error(`Resposta incompleta do servidor ao inicializar upload de ${file.name}`);
    }

    console.log('[UPLOAD CLIENT] ✅ Step 1 complete - Presigned URL received:', {
      jobId,
      key,
      uploadUrlLength: uploadUrl.length,
      workerUrl,
      hasWorkerUrl: !!workerUrl,
      workerUrlType: typeof workerUrl,
    });

    // Step 2: Upload directly to S3 using presigned URL
    // Note: We don't include Content-Type header to avoid CORS preflight request.
    // The ContentType is already included in the presigned URL signature.
    console.log('[UPLOAD CLIENT] 📤 Step 2: Uploading to S3...', {
      uploadUrl: uploadUrl.substring(0, 100) + '...', // Log partial URL for security
      fileSize: file.size,
      fileType: file.type,
      fileName: file.name,
    });
    
    const s3UploadStartTime = Date.now();
    let uploadResponse: Response;
    try {
      uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        // Don't include Content-Type header - it's already in the presigned URL signature
        // Including it triggers CORS preflight which S3 may not be configured for
      });
    } catch (s3Error) {
      // Provide more detailed error message
      const errorMessage = s3Error instanceof Error 
        ? s3Error.message 
        : 'Erro desconhecido ao fazer upload para S3';
      
      // Check if it's a network/CORS error
      const isNetworkError = errorMessage.includes('Failed to fetch') || 
                            errorMessage.includes('NetworkError') ||
                            errorMessage.includes('CORS');
      
      const detailedError = isNetworkError
        ? new Error(`Falha na conexão com S3. Isso pode ser causado por problemas de CORS ou conectividade. Detalhes: ${errorMessage}`)
        : new Error(`Falha ao enviar ${file.name} para S3: ${errorMessage}`);
      
      throw detailedError;
    }
    
    console.log('[UPLOAD CLIENT] 📥 Step 2: S3 response received:', {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      ok: uploadResponse.ok,
      headers: Object.fromEntries(uploadResponse.headers.entries()),
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
    console.log('[UPLOAD CLIENT] 🔍 Checking worker URL before Step 3:', {
      workerUrl,
      hasWorkerUrl: !!workerUrl,
      workerUrlType: typeof workerUrl,
      workerUrlLength: workerUrl?.length,
    });

    if (workerUrl) {
      try {
        console.log('[UPLOAD CLIENT] 👷 Step 3: Notifying worker...', {
          workerUrl,
          jobId,
          fileName: file.name,
        });
        
        const provider = selectedChatModel?.split('/')[0];
        console.log('[UPLOAD CLIENT] 🔧 Building worker payload...', {
          selectedChatModel,
          provider,
          hasProvider: !!provider,
        });
        
        const workerPayload = {
          s3Key: key,
          jobId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          provider,
        };

        console.log('[UPLOAD CLIENT] 📦 Worker payload built:', {
          ...workerPayload,
          payloadSize: JSON.stringify(workerPayload).length,
        });

        const workerStartTime = Date.now();
        console.log('[UPLOAD CLIENT] 🌐 Sending request to worker:', {
          url: workerUrl,
          method: 'POST',
          payload: workerPayload,
        });

        console.log('[UPLOAD CLIENT] 🌐 Fetching worker URL...', {
          url: workerUrl,
          method: 'POST',
        });
        
        const workerResponse = await fetch(workerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workerPayload),
        });

        let workerResponseBody: any = null;
        try {
          const contentType = workerResponse.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            workerResponseBody = await workerResponse.clone().json();
          } else {
            workerResponseBody = await workerResponse.clone().text();
          }
        } catch (e) {
          console.warn('[UPLOAD CLIENT] ⚠️ Could not parse worker response body:', {
            error: e instanceof Error ? e.message : String(e),
          });
        }

        console.log('[UPLOAD CLIENT] 📤 Worker response received:', {
          status: workerResponse.status,
          statusText: workerResponse.statusText,
          ok: workerResponse.ok,
          headers: Object.fromEntries(workerResponse.headers.entries()),
          body: workerResponseBody,
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
          console.log('[UPLOAD CLIENT] 🔄 Step 4: Starting job polling...', {
            jobId,
            fileName: file.name,
            pollForResultType: typeof pollForResult,
          });
          
          try {
            pollForResult(jobId, file.name);
            console.log('[UPLOAD CLIENT] ✅ Polling started successfully');
          } catch (pollError) {
            console.error('[UPLOAD CLIENT] ❌ Failed to start polling:', {
              error: pollError instanceof Error ? pollError.message : String(pollError),
              jobId,
              fileName: file.name,
            });
          }
          
          toast.loading('Processando arquivo...', {
            id: 'upload-progress',
            description: 'Aguarde enquanto o arquivo é processado',
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : typeof error === 'string'
          ? error
          : 'Unknown error';
        
        const errorDetails = error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : {
              type: typeof error,
              value: error,
            };

        console.error('[UPLOAD CLIENT] ❌ Error notifying worker:', {
          fileName: file.name,
          workerUrl,
          error: errorMessage,
          errorDetails,
        });
        // Don't throw - upload succeeded, worker notification is optional
      }
    } else {
      console.warn('[UPLOAD CLIENT] ⚠️ No worker URL provided, skipping worker notification', {
        workerUrl,
        responseData,
      });
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
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string'
      ? error
      : error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : 'Unknown error';
    
    const errorDetails = error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause,
        }
      : {
          type: typeof error,
          value: error,
          stringified: String(error),
        };

    // Log error with proper serialization to avoid empty object display
    const errorLogData = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      selectedChatModel,
      error: errorMessage,
      errorName: error instanceof Error ? error.name : typeof error,
      errorStack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
      totalDuration: `${totalDuration}ms`,
      timestamp: new Date().toISOString(),
    };
    
    console.error('[UPLOAD CLIENT] ❌ Upload failed:', errorLogData);
    
    toast.error(errorMessage || `Falha ao enviar ${file.name}`);
    return false;
  }
}

