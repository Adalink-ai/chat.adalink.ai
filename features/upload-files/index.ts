export { UploadModal } from './ui/UploadModal';
export { useFileUpload } from './model/use-file-upload';
export { MAX_FILE_SIZE, MAX_FILES, ACCEPTED_FILE_TYPES } from './config/constants';

// S3 exports (server-only)
export { uploadToS3, getPresignedUrl, deleteFromS3, generateFileKey } from './lib/s3-upload';
export { getS3Client } from './lib/s3-client';
export { s3Config, validateS3Config } from './config/s3';
export type { FileUploadResult, UploadProgress } from './model/types';

