/**
 * Server-only exports for S3 functions
 * Import these only in API routes and Server Components
 */
export { uploadToS3, getPresignedUrl, getPresignedUrlToUpload, deleteFromS3, generateFileKey, getPublicUrl } from './lib/s3-upload';
export { getS3Client } from './lib/s3-client';
export { s3Config, validateS3Config } from './config/s3';
export { validateFileType, validateFileSize, sanitizeFileName, FileTypeError, FileSizeError } from './lib/validation';
export type { FileUploadResult, UploadProgress, PresignedUploadResponse } from './model/types';

