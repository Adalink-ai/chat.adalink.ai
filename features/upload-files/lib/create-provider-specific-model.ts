import 'server-only';

import { xai } from '@ai-sdk/xai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { getApiKeyForProvider } from './api-keys';
import { extractModelInfo } from './model-info-server';
import type { LanguageModel } from 'ai';

/**
 * Check if messages contain any file parts
 */
export function hasFileParts(messages: Array<{ parts?: Array<{ type: string }> }>): boolean {
  return messages.some((msg) =>
    msg.parts?.some((part) => part.type === 'file'),
  );
}

/**
 * Create provider-specific model with API key when files are present
 * Returns null if should use gateway (no files or provider not supported)
 */
export function createProviderSpecificModel(
  modelId: string,
  hasFiles: boolean,
): LanguageModel | null {
  // Only use provider-specific when files are present
  if (!hasFiles) {
    return null; // Use gateway
  }

  const modelInfo = extractModelInfo(modelId);
  const { provider, model: modelName } = modelInfo;

  // Get API key for provider
  const apiKey = getApiKeyForProvider(provider);

  if (!apiKey) {
    console.warn('[PROVIDER] API key not found, falling back to gateway:', {
      provider,
      modelId,
    });
    return null; // Fall back to gateway
  }

  // Create provider-specific model based on provider type
  switch (provider.toLowerCase()) {

    case 'google': {
      const googleProvider = google(modelName);
      return googleProvider;
    }
    
    case 'zai': {
      // ZAI uses OpenAI-compatible API
      // Model name should be just the model part (e.g., "glm-4.5" not "zai/glm-4.5")
      const zaiProvider = createOpenAICompatible({
        name: 'zai',
        apiKey,
        baseURL: 'https://api.z.ai/api/paas/v4/',
      })

      console.log('[PROVIDER] Using ZAI provider-specific model:', {
        modelId,
        modelName,
        provider: 'zai',
        apiKeyType: 'ZAI_API_KEY',
        baseURL: 'https://api.z.ai/api/paas/v4/chat/completions',
      });

      return zaiProvider(modelName);
    }

    case 'openai': {
      const openaiProvider = openai(modelName);

      return openaiProvider;
    }

    case 'xai': {
      const xaiProvider = xai(modelName);

      console.log('[PROVIDER] Using XAI provider-specific model:', {
        modelId,
        modelName,
        provider: 'xai',
        apiKeyType: 'XAI_API_KEY',
      });

      return xaiProvider
    }

    default: {
      console.warn('[PROVIDER] Provider not supported for direct API, using gateway:', {
        provider,
        modelId,
      });
      return null; // Fall back to gateway
    }
  }
}

