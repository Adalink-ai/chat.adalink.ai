import { z } from 'zod';

const textPartSchema = z.object({
  type: z.enum(['text']),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.enum(['file']),
  url: z.string().url(),
  // Aceita filename (AI SDK) ou name (compatibilidade)
  filename: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(100).optional(),
  // Aceita qualquer mediaType (não apenas imagens)
  mediaType: z.string().min(1),
  // providerMetadata opcional (metadados do provedor)
  providerMetadata: z.object({
    provider: z.string().optional(),
    fileId: z.string().optional(),
  }).optional(),
}).refine(
  (data) => data.filename || data.name,
  {
    message: 'Either filename or name must be provided',
    path: ['filename'],
  }
);

const partSchema = z.union([textPartSchema, filePartSchema]);

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string().uuid(),
    role: z.enum(['user']),
    parts: z.array(partSchema),
  }),
  selectedChatModel: z.string(),
  selectedVisibilityType: z.enum(['public', 'private']).optional().default('private'),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
