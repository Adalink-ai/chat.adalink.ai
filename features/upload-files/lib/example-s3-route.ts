/**
 * Example API Route using S3
 * 
 * This is an example showing how to use S3 functions in an API route.
 * Place this in: app/(chat)/api/files/upload/route.ts
 * 
 * Don't forget to install AWS SDK:
 * npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { uploadToS3, generateFileKey } from '../lib/s3-upload';
import { MAX_FILE_SIZE } from '../config/constants';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate unique key for S3
    const key = generateFileKey(file.name, session.user.id);

    // Upload to S3
    const result = await uploadToS3(file, key, file.type);

    return NextResponse.json({
      url: result.url,
      key: result.key,
      size: result.size,
      contentType: result.contentType,
    });
  } catch (error) {
    console.error('S3 upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

