/**
 * AWS S3 Configuration
 * 
 * Environment variables required:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION
 * - AWS_S3_BUCKET_NAME
 */

export const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  bucket: process.env.AWS_S3_BUCKET_NAME || '',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
} as const;

export function validateS3Config(): void {
  if (!s3Config.bucket) {
    throw new Error('AWS_S3_BUCKET_NAME is required');
  }
  if (!s3Config.accessKeyId) {
    throw new Error('AWS_ACCESS_KEY_ID is required');
  }
  if (!s3Config.secretAccessKey) {
    throw new Error('AWS_SECRET_ACCESS_KEY is required');
  }
}

