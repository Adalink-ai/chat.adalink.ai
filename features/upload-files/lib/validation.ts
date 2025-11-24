import 'server-only';
import { MAX_FILE_SIZE } from '../config/constants';

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'application/csv',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/json',
  'application/xml',
  'text/xml',
  'video/*',
  'audio/*',
] as const;

const EXPECTED_TYPES: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  txt: ['text/plain'],
  csv: ['text/csv', 'application/csv'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  gif: ['image/gif'],
  webp: ['image/webp'],
  json: ['application/json'],
  xml: ['application/xml', 'text/xml'],
};

export class FileTypeError extends Error {
  constructor(public allowedTypes: string[], public receivedType: string) {
    super(`File type "${receivedType}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    this.name = 'FileTypeError';
  }
}

export class FileSizeError extends Error {
  constructor(public maxSize: number, public receivedSize: number) {
    super(`File size ${(receivedSize / 1024 / 1024).toFixed(2)}MB exceeds maximum of ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
    this.name = 'FileSizeError';
  }
}

export function validateFileType(fileName: string, fileType: string): void {
  const extension = fileName.toLowerCase().split('.').pop();
  if (!extension) {
    throw new FileTypeError(ALLOWED_FILE_TYPES as unknown as string[], fileType);
  }

  const normalizedType = fileType.toLowerCase();
  
  // Check if it's a wildcard type (video/*, audio/*, image/*)
  if (normalizedType.includes('*')) {
    const baseType = normalizedType.split('/')[0];
    if (['video', 'audio', 'image'].includes(baseType)) {
      return; // Allow wildcard types
    }
  }

  // Check if type is in allowed list
  if (!ALLOWED_FILE_TYPES.includes(normalizedType as any)) {
    throw new FileTypeError(ALLOWED_FILE_TYPES as unknown as string[], fileType);
  }

  // Validate extension matches MIME type
  const validTypes = EXPECTED_TYPES[extension];
  if (validTypes && !validTypes.includes(normalizedType)) {
    throw new FileTypeError(validTypes, fileType);
  }
}

export function validateFileSize(fileSize: number): void {
  if (fileSize > MAX_FILE_SIZE) {
    throw new FileSizeError(MAX_FILE_SIZE, fileSize);
  }
  if (fileSize === 0) {
    throw new Error('File size cannot be zero');
  }
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\./, '')
    .slice(0, 255);
}

