import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/app/(auth)/auth';
import {
  getPresignedUrlToUpload,
  getPublicUrl,
  validateFileType,
  validateFileSize,
  sanitizeFileName,
  FileTypeError,
  FileSizeError,
} from '@/features/upload-files/server';
import { setJob } from '@/features/upload-files/lib/job-store';
import type { Job } from '@/features/upload-files/model/types';

interface UploadRequest {
  fileName: string;
  fileSize: number;
  fileType: string;
}

export async function POST(request: Request) {
  console.log('[UPLOAD API] 📥 Request received');
  const startTime = Date.now();
  
  const session = await auth();

  if (!session?.user?.id) {
    console.error('[UPLOAD API] ❌ Unauthorized - no user session');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[UPLOAD API] ✅ User authenticated:', { userId: session.user.id });

  if (request.body === null) {
    console.error('[UPLOAD API] ❌ Request body is empty');
    return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
  }

  try {
    const body: UploadRequest = await request.json();
    console.log('[UPLOAD API] 📋 Request body:', {
      fileName: body.fileName,
      fileSize: body.fileSize,
      fileType: body.fileType,
    });

    if (!body.fileName || !body.fileSize || !body.fileType) {
      console.error('[UPLOAD API] ❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: fileName, fileSize, fileType' },
        { status: 400 }
      );
    }

    // Validate file size
    console.log('[UPLOAD API] 🔍 Validating file size...');
    validateFileSize(body.fileSize);
    console.log('[UPLOAD API] ✅ File size valid:', body.fileSize);

    // Validate file type
    console.log('[UPLOAD API] 🔍 Validating file type...');
    validateFileType(body.fileName, body.fileType);
    console.log('[UPLOAD API] ✅ File type valid:', body.fileType);

    // Sanitize filename
    const sanitizedFileName = sanitizeFileName(body.fileName);
    console.log('[UPLOAD API] 🧹 Filename sanitized:', {
      original: body.fileName,
      sanitized: sanitizedFileName,
    });

    // Generate job ID for tracking
    const jobId = randomUUID();
    console.log('[UPLOAD API] 🆔 Job ID generated:', jobId);

    // Generate S3 key using format: uploads/temp-uploads/${jobId}/${sanitizedFileName}
    const key = `uploads/temp-uploads/${jobId}/${sanitizedFileName}`;
    console.log('[UPLOAD API] 🔑 S3 key generated:', key);

    // Generate presigned URL for direct upload (expires in 1 hour)
    console.log('[UPLOAD API] 🔗 Generating presigned URL...');
    const uploadUrl = await getPresignedUrlToUpload(key, body.fileType, 3600);
    console.log('[UPLOAD API] ✅ Presigned URL generated (expires in 1 hour)');

    // Generate public URL for the file
    const publicUrl = getPublicUrl(key);
    console.log('[UPLOAD API] 🌐 Public URL:', publicUrl);

    // Get worker URL from environment or use default
    const workerUrl =
      process.env.CLOUDFLARE_WORKER_URL ||
      'https://adalink-upload-worker.adalink.workers.dev';
    console.log('[UPLOAD API] 👷 Worker URL:', `${workerUrl}/upload`);

    // Create initial job in store
    const initialJob: Job = {
      id: jobId,
      status: 'pending',
      fileName: sanitizedFileName,
      fileSize: body.fileSize,
      fileType: body.fileType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        originalFileName: body.fileName,
        s3Key: key,
        userId: session.user.id,
      },
    };

    setJob(initialJob);
    console.log('[UPLOAD API] 📝 Job created in store:', {
      jobId,
      status: initialJob.status,
    });

    const response = {
      uploadUrl, // Presigned URL for direct S3 upload
      workerUrl: `${workerUrl}/upload`, // Worker URL for processing notification
      jobId, // Job identifier for tracking
      key, // S3 key where file will be stored
      publicUrl, // Public URL after upload
      expiresIn: 3600, // URL expiration time in seconds
    };

    const duration = Date.now() - startTime;
    console.log('[UPLOAD API] ✅ Upload initialized successfully:', {
      jobId,
      key,
      duration: `${duration}ms`,
    });

    return NextResponse.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[UPLOAD API] ❌ Upload initialization error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
    });

    if (error instanceof FileTypeError) {
      console.error('[UPLOAD API] ❌ FileTypeError:', {
        allowedTypes: error.allowedTypes,
        receivedType: error.receivedType,
      });
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof FileSizeError) {
      console.error('[UPLOAD API] ❌ FileSizeError:', {
        maxSize: error.maxSize,
        receivedSize: error.receivedSize,
      });
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initialize upload' },
      { status: 500 }
    );
  }
}
