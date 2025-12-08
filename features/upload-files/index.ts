export { UploadModal } from './ui/UploadModal';
export { useFileUpload } from './model/use-file-upload';
export { MAX_FILE_SIZE, MAX_FILES, ACCEPTED_FILE_TYPES } from './config/constants';

// Note: S3 functions are server-only and exported from './server' instead
// Import them like: import { uploadToS3 } from '@/features/upload-files/server';

