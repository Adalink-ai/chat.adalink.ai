'use client';

/**
 * Extract provider and model name from a model ID
 * 
 * Examples:
 * - "xai/grok-4" -> { provider: "xai", model: "grok-4" }
 * - "openai/gpt-4" -> { provider: "openai", model: "gpt-4" }
 * - "chat-model" -> { provider: "internal", model: "chat-model" }
 */
export function extractModelInfo(modelId: string): {
  provider: string;
  model: string;
  isInternal: boolean;
} {
  // Internal models (chat-model, chat-model-reasoning, etc.)
  const internalModels = [
    'chat-model',
    'chat-model-reasoning',
    'title-model',
    'artifact-model',
  ];

  if (internalModels.includes(modelId)) {
    // For internal models, determine provider based on actual implementation
    // In production, internal models use xai via gateway
    return {
      provider: 'xai', // Default provider for internal models
      model: modelId,
      isInternal: true,
    };
  }

  // Gateway models (format: "provider/model-name")
  if (modelId.includes('/')) {
    const [provider, ...modelParts] = modelId.split('/');
    return {
      provider: provider.toLowerCase(),
      model: modelParts.join('/'),
      isInternal: false,
    };
  }

  // Fallback: treat as provider-model format
  const parts = modelId.split('-');
  return {
    provider: parts[0]?.toLowerCase() || 'unknown',
    model: modelId,
    isInternal: false,
  };
}

