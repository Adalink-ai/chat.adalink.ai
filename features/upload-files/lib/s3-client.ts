import 'server-only';

import { S3Client } from '@aws-sdk/client-s3';
import { s3Config, validateS3Config } from '../config/s3';

let s3ClientInstance: S3Client | null = null;

/**
 * Get or create S3 client instance (singleton pattern)
 * Only works on server-side
 */
export function getS3Client(): S3Client {
  if (s3ClientInstance) {
    return s3ClientInstance;
  }

  validateS3Config();

  s3ClientInstance = new S3Client({
    region: s3Config.region,
    credentials: {
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
    },
  });

  return s3ClientInstance;
}

