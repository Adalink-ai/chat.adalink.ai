import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';
import { gateway } from '@ai-sdk/gateway';

// All available providers in the AI Gateway
export const AVAILABLE_PROVIDERS = [
  'alibaba',
  'amazon',
  'anthropic',
  'cohere',
  'deepseek',
  'google',
  'inception',
  'meta',
  'mistral',
  'moonshotai',
  'morph',
  'openai',
  'adaflow',
  'vercel',
  'xai',
  'zai',
] as const;

export type ProviderName = (typeof AVAILABLE_PROVIDERS)[number];

// All available models in the AI Gateway
export const AVAILABLE_MODELS = [
  'alibaba/qwen-3-14b',
  'alibaba/qwen-3-235b',
  'alibaba/qwen-3-30b',
  'alibaba/qwen-3-32b',
  'alibaba/qwen3-coder',
  'amazon/nova-lite',
  'amazon/nova-micro',
  'amazon/nova-pro',
  'amazon/titan-embed-text-v2',
  'anthropic/claude-3-haiku',
  'anthropic/claude-3-opus',
  'anthropic/claude-3.5-haiku',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3.7-sonnet',
  'anthropic/claude-opus-4',
  'anthropic/claude-opus-4.1',
  'anthropic/claude-sonnet-4',
  'cohere/command-a',
  'cohere/command-r',
  'cohere/command-r-plus',
  'cohere/embed-v4.0',
  'deepseek/deepseek-r1',
  'deepseek/deepseek-r1-distill-llama-70b',
  'deepseek/deepseek-v3',
  'deepseek/deepseek-v3.1',
  'deepseek/deepseek-v3.1-base',
  'deepseek/deepseek-v3.1-thinking',
  'google/gemini-2.0-flash',
  'google/gemini-2.0-flash-lite',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
  'google/gemini-2.5-pro',
  'google/gemini-embedding-001',
  'google/gemma-2-9b',
  'google/text-embedding-005',
  'google/text-multilingual-embedding-002',
  'inception/mercury-coder-small',
  'meta/llama-3-70b',
  'meta/llama-3-8b',
  'meta/llama-3.1-70b',
  'meta/llama-3.1-8b',
  'meta/llama-3.1-instruct',
  'meta/llama-3.2-1b',
  'meta/llama-3.2-3b',
  'meta/llama-3.2-90b-vision',
  'meta/llama-3.3-70b',
  'mistral/codestral',
  'mistral/large',
  'mistral/mistral-small',
  'mistral/pixtral',
  'moonshotai/kimi-k2',
  'morph/morph-v3-fast',
  'openai/gpt-5-mini',
  'openai/gpt-5',
  'openai/gpt-4.1',
  'openai/gpt-4',
  'openai/gpt-4-turbo',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'openai/o1',
  'openai/o1-mini',
  'openai/o1-preview',
  'openai/text-embedding-3-large',
  'openai/text-embedding-3-small',
  'openai/text-embedding-ada-002',
  'adaflow/sonar',
  'vercel/v0-1.0-md',
  'xai/grok-4',
  'xai/grok-3-mini-beta',
  'zai/glm-4.5',
  'zai/glm-4.5-air',
  'zai/glm-4.5v',
] as const;

export type ModelName = (typeof AVAILABLE_MODELS)[number];

// Get allowed providers from environment variable with validation
export const getAllowedProviders = (): string[] => {
  const allowedProvidersEnv = process.env.ALLOWED_PROVIDERS;
  if (!allowedProvidersEnv || allowedProvidersEnv.trim() === '') {
    return []; // Empty array means all providers are allowed
  }

  const configuredProviders = allowedProvidersEnv
    .split(',')
    .map((provider) => provider.trim().toLowerCase())
    .filter((provider) => provider !== '');

  // Validate that all configured providers are available
  const validProviders = configuredProviders.filter((provider) =>
    AVAILABLE_PROVIDERS.includes(provider as ProviderName),
  );

  // Log warning for invalid providers
  const invalidProviders = configuredProviders.filter(
    (provider) => !AVAILABLE_PROVIDERS.includes(provider as ProviderName),
  );

  if (invalidProviders.length > 0) {
    console.warn(
      `[AI Gateway] Invalid providers in ALLOWED_PROVIDERS: ${invalidProviders.join(', ')}`,
    );
    console.warn(
      `[AI Gateway] Available providers: ${AVAILABLE_PROVIDERS.join(', ')}`,
    );
  }

  return validProviders;
};

// Helper function to check if a provider is available
export const isProviderAvailable = (
  provider: string,
): provider is ProviderName => {
  return AVAILABLE_PROVIDERS.includes(provider.toLowerCase() as ProviderName);
};

// Get allowed models from environment variable with validation
export const getAllowedModels = (): string[] => {
  const allowedModelsEnv = process.env.ALLOWED_MODELS;
  if (!allowedModelsEnv || allowedModelsEnv.trim() === '') {
    return []; // Empty array means all models are allowed
  }

  const configuredModels = allowedModelsEnv
    .split(',')
    .map((model) => model.trim().toLowerCase())
    .filter((model) => model !== '');

  // Validate that all configured models are available
  const validModels = configuredModels.filter((model) =>
    AVAILABLE_MODELS.includes(model as ModelName),
  );

  // Log warning for invalid models
  const invalidModels = configuredModels.filter(
    (model) => !AVAILABLE_MODELS.includes(model as ModelName),
  );

  if (invalidModels.length > 0) {
    console.warn(
      `[AI Gateway] Invalid models in ALLOWED_MODELS: ${invalidModels.join(', ')}`,
    );
    console.warn(`[AI Gateway] See AVAILABLE_MODELS constant for valid models`);
  }

  return validModels;
};

// Helper function to check if a model is available
export const isModelAvailable = (model: string): model is ModelName => {
  return AVAILABLE_MODELS.includes(model.toLowerCase() as ModelName);
};

// Gateway configuration with optimized settings
const getOptimizedGateway = (modelId: string) => {
  // Return gateway with potential optimization (headers can be set at request level)
  return gateway(modelId);
};

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': getOptimizedGateway('xai/grok-4'),
        'chat-model-reasoning': wrapLanguageModel({
          model: getOptimizedGateway('xai/grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': getOptimizedGateway('xai/grok-4'),
        'artifact-model': getOptimizedGateway('xai/grok-4'),
      },
      imageModels: {
        'small-model': xai.imageModel('grok-2-image'),
      },
    });
