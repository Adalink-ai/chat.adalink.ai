import { generateUUID } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';
import type { FileUIPart } from 'ai';

/**
 * Cria um FileUIPart mock para testes
 */
export function createMockFilePart(options: {
  url?: string;
  filename?: string;
  mediaType?: string;
  providerMetadata?: {
    provider?: string;
    fileId?: string;
  };
}): FileUIPart {
  return {
    type: 'file',
    url: options.url || `https://example.com/files/${generateUUID()}.pdf`,
    filename: options.filename || 'test-file.pdf',
    mediaType: options.mediaType || 'application/pdf',
    ...(options.providerMetadata && { providerMetadata: options.providerMetadata }),
  };
}

/**
 * Cria uma mensagem de chat com arquivo(s) para testes
 */
export function createMessageWithFiles(options: {
  text?: string;
  files?: Array<{
    url?: string;
    filename?: string;
    mediaType?: string;
    providerMetadata?: {
      provider?: string;
      fileId?: string;
    };
  }>;
}): ChatMessage {
  const fileParts = (options.files || []).map(createMockFilePart);
  const textPart = options.text
    ? [{ type: 'text' as const, text: options.text }]
    : [];

  return {
    id: generateUUID(),
    role: 'user',
    parts: [...fileParts, ...textPart],
    metadata: {
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * Cria uma mensagem de teste com arquivo de imagem
 */
export function createMessageWithImage(text?: string): ChatMessage {
  return createMessageWithFiles({
    text: text || 'Analise esta imagem',
    files: [
      {
        filename: 'test-image.jpg',
        mediaType: 'image/jpeg',
        url: 'https://example.com/images/test.jpg',
      },
    ],
  });
}

/**
 * Cria uma mensagem de teste com arquivo PDF
 */
export function createMessageWithPDF(text?: string): ChatMessage {
  return createMessageWithFiles({
    text: text || 'Analise este documento',
    files: [
      {
        filename: 'document.pdf',
        mediaType: 'application/pdf',
        url: 'https://example.com/documents/test.pdf',
      },
    ],
  });
}

/**
 * Cria uma mensagem de teste com múltiplos arquivos
 */
export function createMessageWithMultipleFiles(text?: string): ChatMessage {
  return createMessageWithFiles({
    text: text || 'Analise estes arquivos',
    files: [
      {
        filename: 'image.jpg',
        mediaType: 'image/jpeg',
        url: 'https://example.com/files/image.jpg',
      },
      {
        filename: 'document.pdf',
        mediaType: 'application/pdf',
        url: 'https://example.com/files/document.pdf',
      },
      {
        filename: 'spreadsheet.xlsx',
        mediaType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        url: 'https://example.com/files/spreadsheet.xlsx',
      },
    ],
  });
}

/**
 * Valida estrutura de uma mensagem com arquivos
 */
export function validateMessageStructure(message: ChatMessage): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!message.id) {
    errors.push('Message id is required');
  }

  if (!message.role) {
    errors.push('Message role is required');
  }

  if (!message.parts || message.parts.length === 0) {
    errors.push('Message must have at least one part');
  }

  message.parts.forEach((part, index) => {
    if (part.type === 'file') {
      if (!part.url) {
        errors.push(`File part ${index}: url is required`);
      }
      if (!part.filename && !(part as any).name) {
        errors.push(`File part ${index}: filename or name is required`);
      }
      if (!part.mediaType) {
        errors.push(`File part ${index}: mediaType is required`);
      }
    } else if (part.type === 'text') {
      if (!part.text || part.text.trim().length === 0) {
        errors.push(`Text part ${index}: text cannot be empty`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

