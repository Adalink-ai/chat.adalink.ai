import 'server-only';

import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client } from './s3-client';
import { s3Config } from '../config/s3';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

/**
 * Upload file to S3
 */
export async function uploadToS3(
  file: File | Buffer,
  key: string,
  contentType?: string,
): Promise<UploadResult> {
  const client = getS3Client();
  const fileBuffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

  const command = new PutObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType || 'application/octet-stream',
  });

  await client.send(command);

  // Generate public URL or presigned URL
  const url = `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;

  return {
    key,
    url,
    size: fileBuffer.length,
    contentType: contentType || 'application/octet-stream',
  };
}

/**
 * Generate presigned URL for file upload (PUT operation)
 * Client uses this to upload directly to S3
 */
export async function getPresignedUrlToUpload(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Generate presigned URL for file access (GET operation, expires in 1 hour by default)
 */
export async function getPresignedUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  const client = getS3Client();

  const command = new DeleteObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
  });

  await client.send(command);
}

/**
 * Generate unique key for file upload
 */
export function generateFileKey(filename: string, userId?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  if (userId) {
    return `uploads/${userId}/${timestamp}-${random}-${sanitizedFilename}`;
  }
  
  return `uploads/${timestamp}-${random}-${sanitizedFilename}`;
}

/**
 * Generate public URL for uploaded file
 */
export function getPublicUrl(key: string): string {
  return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
}

