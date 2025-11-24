import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/app/(auth)/auth';
import {
  generateFileKey,
  getPresignedUrlToUpload,
  getPublicUrl,
  validateFileType,
  validateFileSize,
  sanitizeFileName,
  FileTypeError,
  FileSizeError,
} from '@/features/upload-files/server';

interface UploadRequest {
  fileName: string;
  fileSize: number;
  fileType: string;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
  }

  try {
    const body: UploadRequest = await request.json();

    if (!body.fileName || !body.fileSize || !body.fileType) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, fileSize, fileType' },
        { status: 400 }
      );
    }

    // Validate file size
    validateFileSize(body.fileSize);

    // Validate file type
    validateFileType(body.fileName, body.fileType);

    // Sanitize filename
    const sanitizedFileName = sanitizeFileName(body.fileName);

    // Generate job ID for tracking
    const jobId = randomUUID();

    // Generate unique key for S3
    const key = generateFileKey(sanitizedFileName, session.user.id);

    // Generate presigned URL for direct upload (expires in 1 hour)
    const uploadUrl = await getPresignedUrlToUpload(key, body.fileType, 3600);

    // Generate public URL for the file
    const publicUrl = getPublicUrl(key);

    // Get worker URL from environment or use default
    const workerUrl =
      process.env.CLOUDFLARE_WORKER_URL ||
      'https://adalink-upload-worker.adalink.workers.dev';

    return NextResponse.json({
      uploadUrl, // Presigned URL for direct S3 upload
      workerUrl: `${workerUrl}/upload`, // Worker URL for processing notification
      jobId, // Job identifier for tracking
      key, // S3 key where file will be stored
      publicUrl, // Public URL after upload
      expiresIn: 3600, // URL expiration time in seconds
    });
  } catch (error) {
    console.error('Upload initialization error:', error);

    if (error instanceof FileTypeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof FileSizeError) {
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
