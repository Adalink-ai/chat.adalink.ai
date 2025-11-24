export interface FileUploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
  filename: string;
}

export interface UploadProgress {
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface PresignedUploadResponse {
  uploadUrl: string; // Presigned URL for direct S3 upload
  workerUrl: string; // Worker URL for processing notification
  jobId: string; // Job identifier for tracking
  key: string; // S3 key where file will be stored
  publicUrl: string; // Public URL after upload
  expiresIn: number; // URL expiration time in seconds
}

export type JobStatus = 'pending' | 'processing' | 'complete' | 'error';

export interface Job {
  id: string;
  status: JobStatus;
  fileName: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string; // Timestamp when job completed (status === 'complete' or 'error')
  result?: {
    fileId?: string;
    url?: string;
    [key: string]: any;
  };
  error?: string;
  metadata?: {
    ip?: string;
    userAgent?: string;
    originalFileName?: string;
    s3Key?: string;
    userId?: string;
    [key: string]: any;
  };
}
